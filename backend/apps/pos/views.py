from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.settings import api_settings as jwt_settings
from django.contrib.auth import authenticate
from django.utils import timezone
from django.db import transaction, models
from django.db.models import Subquery, OuterRef, F, Value
from django.db.models.functions import Coalesce
from decimal import Decimal, InvalidOperation
from django.core.exceptions import ValidationError
from apps.products.models import Product, StockSyncLog, InventoryTransaction, StoreProductStock
from apps.products.inventory_service import sell_product, get_store_stock
from apps.products.serializers import ProductListSerializer, ProductCreateUpdateSerializer
from apps.accounts.models import StaffRole
from apps.subscriptions.decorators import require_feature
from apps.subscriptions.permissions import HasValidSubscription
from .serializers import (
    POSProductSerializer, StockUpdateSerializer, BulkStockUpdateSerializer,
    StockSyncLogSerializer, LowStockAlertSerializer, TransactionSerializer,
    CreateTransactionSerializer, TransactionItemSerializer, RefundSerializer
)
from .models import Transaction, TransactionItem, Refund
from .permissions import CanUpdateStock, CanCreateProduct
import json

class POSProductViewSet(viewsets.ModelViewSet):
    """POS-specific product endpoints"""
    serializer_class = POSProductSerializer
    permission_classes = [IsAuthenticated, HasValidSubscription]
    
    def get_queryset(self):
        """Return active products with POS-specific fields"""
        return Product.objects.filter(is_active=True).select_related('category', 'brand')
    
    def list(self, request, *args, **kwargs):
        """Optimized list for POS - includes barcode and stock info"""
        queryset = self.get_queryset()
        
        # Filter by store if specified
        store_id = request.query_params.get('store_id') or getattr(request.user, 'store_id', None) or 'main'
        queryset = queryset.annotate(
            branch_stock_quantity=            Coalesce(
                Subquery(
                    StoreProductStock.objects.filter(
                        product=OuterRef('pk'), store_id=store_id
                    ).values('quantity')[:1]
                ),
                F('stock_quantity') if store_id == 'main' else Value(
                    0, output_field=Product._meta.get_field('stock_quantity')
                ),
            )
        )
        
        # Search by barcode if provided (requires barcode_support feature)
        barcode = request.query_params.get('barcode')
        if barcode:
            if hasattr(request.user, 'organization') and request.user.organization:
                if not request.user.organization.has_feature('barcode_scanning'):
                    return Response({
                        'error': 'Barcode scanning is not available in your current plan',
                        'current_plan': request.user.organization.current_plan.name
                    }, status=403)
            queryset = queryset.filter(barcode__icontains=barcode)
        
        # Search by name/SKU if provided
        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                models.Q(name__icontains=search) | 
                models.Q(sku__icontains=search) |
                models.Q(barcode__icontains=search)
            )
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'results': serializer.data,
            'count': queryset.count(),
            'store_id': store_id
        })
    
    @action(detail=False, methods=['post'], permission_classes=[CanUpdateStock])
    @require_feature('stock_adjustments')
    def update_stock(self, request):
        """Update stock from POS with conflict resolution"""
        product_id = request.data.get('product_id')
        new_quantity = request.data.get('quantity')
        change_amount = request.data.get('change_amount', 0)
        store_id = request.data.get('store_id') or getattr(request.user, 'store_id', None) or 'main'
        device_id = request.data.get('device_id', 'unknown')
        
        if not product_id or new_quantity is None:
            return Response({
                'error': 'product_id and quantity are required'
            }, status=400)
        
        try:
            try:
                new_quantity = Decimal(str(new_quantity))
                change_amount = Decimal(str(change_amount or 0))
            except (InvalidOperation, TypeError, ValueError):
                return Response({'error': 'quantity and change_amount must be valid numbers'}, status=400)

            with transaction.atomic():
                product = Product.objects.get(id=product_id)
                stock = get_store_stock(product, store_id, for_update=True)
                old_quantity = stock.quantity
                
                # Check for version conflicts
                current_version = stock.sync_version
                submitted_version = request.data.get('sync_version', 0)
                
                if submitted_version and current_version != submitted_version:
                    # Conflict detected
                    StockSyncLog.objects.create(
                        product=product,
                        old_quantity=old_quantity,
                        new_quantity=new_quantity,
                        change_amount=change_amount,
                        source='pos',
                        store_id=store_id,
                        operator=request.user.username,
                        device_id=device_id,
                        sync_status='conflict',
                        conflict_reason=f'Version mismatch: expected {current_version}, got {submitted_version}'
                    )
                    
                    return Response({
                        'error': 'Stock version conflict',
                        'current_version': current_version,
                        'submitted_version': submitted_version,
                        'current_quantity': old_quantity
                    }, status=409)
                
                # Update stock and record the adjustment in the authoritative inventory ledger.
                stock.quantity = new_quantity
                stock.sync_version += 1
                stock.save(update_fields=['quantity', 'sync_version', 'updated_at'])
                if store_id == 'main':
                    product.stock_quantity = new_quantity
                    product.pos_stock_quantity = new_quantity
                    product.last_pos_sync = timezone.now()
                    product.stock_updated_by = request.user.username
                    product.stock_update_source = 'pos'
                    product.stock_sync_version += 1
                    product.save()
                InventoryTransaction.objects.create(
                    product=product,
                    transaction_type='adjustment',
                    quantity_change=new_quantity - old_quantity,
                    quantity_before=old_quantity,
                    quantity_after=new_quantity,
                    reference=f'POS-STOCK-{product.id}-{stock.sync_version}',
                    notes='POS stock adjustment',
                    created_by=request.user,
                )
                
                # Log successful sync
                sync_log = StockSyncLog.objects.create(
                    product=product,
                    old_quantity=old_quantity,
                    new_quantity=new_quantity,
                    change_amount=change_amount,
                    source='pos',
                    store_id=store_id,
                    operator=request.user.username,
                    device_id=device_id,
                    sync_status='completed',
                    completed_at=timezone.now()
                )
                
                return Response({
                    'status': 'success',
                    'product_id': product_id,
                    'product_name': product.name,
                    'old_quantity': old_quantity,
                    'new_quantity': new_quantity,
                    'change_amount': change_amount,
                    'sync_version': stock.sync_version,
                    'sync_log_id': sync_log.id,
                    'timestamp': sync_log.timestamp.isoformat()
                })
                
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=404)
        except Exception as e:
            return Response({
                'error': 'Internal server error',
                'detail': str(e)
            }, status=500)
    
    @action(detail=False, methods=['post'], permission_classes=[CanUpdateStock])
    @require_feature('stock_adjustments')
    def bulk_stock_update(self, request):
        """Update multiple products stock at once"""
        updates = request.data.get('updates', [])
        store_id = request.data.get('store_id') or getattr(request.user, 'store_id', None) or 'main'
        device_id = request.data.get('device_id', 'unknown')
        
        if not updates:
            return Response({'error': 'No updates provided'}, status=400)
        
        results = []
        errors = []
        
        with transaction.atomic():
            for update_data in updates:
                try:
                    product_id = update_data.get('product_id')
                    new_quantity = update_data.get('quantity')
                    change_amount = update_data.get('change_amount', 0)
                    
                    if not product_id or new_quantity is None:
                        errors.append({
                            'product_id': product_id,
                            'error': 'Missing product_id or quantity'
                        })
                        continue
                    
                    product = Product.objects.get(id=product_id)
                    stock = get_store_stock(product, store_id, for_update=True)
                    old_quantity = stock.quantity
                    
                    # Version check
                    current_version = stock.sync_version
                    submitted_version = update_data.get('sync_version', 0)
                    
                    if submitted_version and current_version != submitted_version:
                        errors.append({
                            'product_id': product_id,
                            'error': 'Version conflict',
                            'current_version': current_version
                        })
                        continue
                    
                    # Update product
                    stock.quantity = new_quantity
                    stock.sync_version += 1
                    stock.save(update_fields=['quantity', 'sync_version', 'updated_at'])
                    if store_id == 'main':
                        product.stock_quantity = new_quantity
                        product.pos_stock_quantity = new_quantity
                        product.last_pos_sync = timezone.now()
                        product.stock_updated_by = request.user.username
                        product.stock_update_source = 'pos'
                        product.stock_sync_version += 1
                        product.save()
                    
                    # Log sync
                    StockSyncLog.objects.create(
                        product=product,
                        old_quantity=old_quantity,
                        new_quantity=new_quantity,
                        change_amount=change_amount,
                        source='pos',
                        store_id=store_id,
                        operator=request.user.username,
                        device_id=device_id,
                        sync_status='completed',
                        completed_at=timezone.now()
                    )
                    
                    results.append({
                        'product_id': product_id,
                        'status': 'success',
                        'new_quantity': new_quantity,
                        'sync_version': stock.sync_version
                    })
                    
                except Product.DoesNotExist:
                    errors.append({
                        'product_id': product_id,
                        'error': 'Product not found'
                    })
                except Exception as e:
                    errors.append({
                        'product_id': product_id,
                        'error': str(e)
                    })
        
        return Response({
            'results': results,
            'errors': errors,
            'processed': len(updates),
            'successful': len(results),
            'failed': len(errors)
        })
    
    @action(detail=False, methods=['get'])
    def sync_status(self, request):
        """Get synchronization status for products"""
        store_id = request.query_params.get('store_id') or getattr(request.user, 'store_id', None) or 'main'
        
        # Get recent sync logs
        recent_logs = StockSyncLog.objects.filter(
            store_id=store_id,
            timestamp__gte=timezone.now() - timezone.timedelta(hours=24)
        ).order_by('-timestamp')[:100]
        
        # Get pending syncs
        pending_syncs = StockSyncLog.objects.filter(
            store_id=store_id,
            sync_status='pending'
        ).count()
        
        # Get failed syncs
        failed_syncs = StockSyncLog.objects.filter(
            store_id=store_id,
            sync_status='failed',
            timestamp__gte=timezone.now() - timezone.timedelta(hours=24)
        ).count()
        
        return Response({
            'store_id': store_id,
            'pending_syncs': pending_syncs,
            'failed_syncs': failed_syncs,
            'recent_logs': [
                {
                    'id': str(log.id),
                    'product_id': log.product.id,
                    'product_name': log.product.name,
                    'old_quantity': log.old_quantity,
                    'new_quantity': log.new_quantity,
                    'change_amount': log.change_amount,
                    'source': log.source,
                    'operator': log.operator,
                    'sync_status': log.sync_status,
                    'timestamp': log.timestamp.isoformat()
                }
                for log in recent_logs
            ]
        })
    
    @action(detail=False, methods=['post'], permission_classes=[CanCreateProduct])
    def create_product(self, request):
        """Create a new product from POS (Admin, Manager, Inventory Staff only)"""
        serializer = ProductCreateUpdateSerializer(data=request.data)
        if serializer.is_valid():
            product = serializer.save()
            # Set POS-specific fields
            product.pos_store_id = request.data.get('store_id', 'main')
            product.pos_stock_quantity = product.stock_quantity
            product.last_pos_sync = timezone.now()
            product.save()
            return Response(ProductListSerializer(product).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated, HasValidSubscription])
def pos_health_check(request):
    """Health check endpoint for POS system"""
    return Response({
        'status': 'healthy',
        'timestamp': timezone.now().isoformat(),
        'user': request.user.username,
        'version': '1.0.0'
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def pos_login(request):
    """POS-specific login endpoint"""
    username = request.data.get('username')
    password = request.data.get('password')
    store_id = str(request.data.get('store_id') or '').strip()
    
    if not username or not password or not store_id:
        return Response({
            'error': 'Username, password, and branch are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Authenticate user
    user = authenticate(username=username, password=password)
    
    if not user:
        return Response({
            'error': 'Invalid credentials'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    if not user.is_active:
        return Response({
            'error': 'Account is disabled'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    # Check subscription status for users with organization
    from apps.accounts.models import User
    user = User.objects.select_related('organization', 'branch').get(pk=user.pk)
    if user.organization and not user.organization.is_subscription_active():
        return Response({
            'error': 'Organization subscription has expired',
            'subscription_status': user.organization.subscription_status,
            'expiry_date': str(user.organization.expiry_date)
        }, status=status.HTTP_403_FORBIDDEN)
    
    # ROLE CHECK
    if user.role != 'STAFF':
        return Response({
            'error': 'Only staff users can login to POS'
        }, status=status.HTTP_403_FORBIDDEN)

    if not user.branch or not user.branch.is_active:
        return Response({
            'error': 'Your account is not assigned to an active branch'
        }, status=status.HTTP_403_FORBIDDEN)

    if store_id != user.branch.store_id:
        return Response({
            'error': 'The selected branch does not match your assigned branch'
        }, status=status.HTTP_403_FORBIDDEN)
    # Generate tokens
    refresh = RefreshToken.for_user(user)
    
    # Calculate actual expiration time from JWT settings
    access_token_lifetime = jwt_settings.ACCESS_TOKEN_LIFETIME
    expires_in_seconds = int(access_token_lifetime.total_seconds())
    
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': getattr(user, 'role', 'STAFF'),
            'staff_role': getattr(user, 'staff_role', None),
            'organization_id':getattr(user.organization, "id", None)
            ,'branch_id': user.branch.id,
            'branch_name': user.branch.name,
        },
        'store_id': store_id,
        'expires_in': expires_in_seconds
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def pos_refresh(request):
    """Refresh POS token"""
    try:
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({
                'error': 'Refresh token is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        refresh = RefreshToken(refresh_token)
        return Response({
            'access': str(refresh.access_token),
            'expires_in': 3600
        })
    except Exception as e:
        return Response({
            'error': 'Invalid refresh token'
        }, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def pos_logout(request):
    """POS logout endpoint"""
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        return Response({'message': 'Successfully logged out'})
    except Exception:
        return Response({'message': 'Successfully logged out'})


@api_view(['GET'])
@permission_classes([IsAuthenticated, HasValidSubscription])
@require_feature('low_stock_alerts')
def low_stock_alerts(request):
    """Get products with low stock for POS"""
    store_id = request.query_params.get('store_id') or getattr(request.user, 'store_id', None) or 'main'
    threshold = int(request.query_params.get('threshold', 5))
    
    products = Product.objects.filter(is_active=True, track_stock=True).annotate(
        branch_stock_quantity=Coalesce(
            Subquery(StoreProductStock.objects.filter(
                product=OuterRef('pk'), store_id=store_id
            ).values('quantity')[:1]),
            F('stock_quantity') if store_id == 'main' else Value(
                0, output_field=Product._meta.get_field('stock_quantity')
            ),
        )
    ).filter(branch_stock_quantity__lte=threshold).select_related(
        'category', 'brand'
    ).order_by('branch_stock_quantity')
    
    serializer = POSProductSerializer(products, many=True)
    
    return Response({
        'store_id': store_id,
        'threshold': threshold,
        'count': products.count(),
        'products': serializer.data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, HasValidSubscription])
def expiry_alerts(request):
    """Get products expiring within 3 months"""
    from django.utils import timezone
    from datetime import timedelta
    
    store_id = request.query_params.get('store_id', 'main')
    months = int(request.query_params.get('months', 3))
    
    today = timezone.now().date()
    expiry_date_threshold = today + timedelta(days=months * 30)
    
    # Get products with expiry dates within the threshold
    products = Product.objects.filter(
        is_active=True,
        expiry_date__isnull=False,
        expiry_date__lte=expiry_date_threshold
    ).select_related('category', 'brand').order_by('expiry_date')
    
    serializer = ProductListSerializer(products, many=True)
    
    return Response({
        'store_id': store_id,
        'months': months,
        'threshold_date': expiry_date_threshold.isoformat(),
        'count': products.count(),
        'products': serializer.data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, HasValidSubscription])
def transaction_history(request):
    """Get transaction history for current store"""
    try:
        transactions = Transaction.objects.filter(
            store_id=request.user.userprofile.store_id,
            status='completed'
        ).select_related('user').prefetch_related('items').order_by('-created_at')[:50]
        
        serializer = TransactionSerializer(transactions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch transaction history: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated, HasValidSubscription])
@require_feature('profit_loss_reports')
def sales_summary(request):
    """Get sales summary statistics for current store"""
    try:
        # Get store_id from query params or fall back to user's store_id or 'main'
        store_id = request.query_params.get('store_id', request.user.store_id or 'main')
        
        # Get date range from query params (default to today)
        date_range = request.query_params.get('date_range', 'today')
        
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        
        if date_range == 'today':
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        elif date_range == 'week':
            start_date = now - timedelta(days=7)
        elif date_range == 'month':
            start_date = now - timedelta(days=30)
        else:
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Filter transactions by store, status, and date range
        transactions = Transaction.objects.filter(
            store_id=store_id,
            status='completed',
            completed_at__gte=start_date
        )
        
        # Calculate statistics
        total_sales = transactions.aggregate(
            total=models.Sum('total_amount')
        )['total'] or 0
        
        transaction_count = transactions.count()
        
        # Get average transaction value
        avg_transaction_value = total_sales / transaction_count if transaction_count > 0 else 0
        
        # Get sales by payment method
        payment_method_breakdown = transactions.values('payment_method').annotate(
            count=models.Count('id'),
            total=models.Sum('total_amount')
        )
        
        return Response({
            'store_id': store_id,
            'date_range': date_range,
            'start_date': start_date.isoformat(),
            'end_date': now.isoformat(),
            'total_sales': float(total_sales),
            'transaction_count': transaction_count,
            'average_transaction_value': float(avg_transaction_value),
            'payment_method_breakdown': list(payment_method_breakdown)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch sales summary: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated, HasValidSubscription])
def business_report(request):
    """Return organization-wide branch stock, valuation, and sales metrics."""
    user = request.user
    if not (
        user.is_superuser
        or user.is_staff
        or getattr(user, 'staff_role', None) in (StaffRole.ADMIN, StaffRole.MANAGER)
    ):
        return Response(
            {'error': 'Only administrators, owners, and managers can view business reports.'},
            status=status.HTTP_403_FORBIDDEN,
        )
    if not user.organization_id:
        return Response({'error': 'Your account is not assigned to an organization.'}, status=400)

    from datetime import timedelta
    from django.utils import timezone
    from apps.subscriptions.models import Branch

    organization_branches = Branch.objects.filter(
        organization_id=user.organization_id,
        is_active=True,
    ).order_by('name')
    branch_ids = list(organization_branches.values_list('store_id', flat=True))
    requested_branch = request.query_params.get('store_id')
    if requested_branch and requested_branch not in branch_ids:
        return Response({'error': 'The selected branch does not belong to your organization.'}, status=400)
    selected_branches = [requested_branch] if requested_branch else branch_ids

    products = Product.objects.filter(is_active=True).only(
        'id', 'name', 'sku', 'base_unit', 'stock_quantity', 'price', 'cost_price'
    )
    stock_rows = StoreProductStock.objects.filter(
        store_id__in=selected_branches,
        product__is_active=True,
    ).values(
        'store_id', 'product_id', 'product__name', 'product__sku',
        'product__base_unit', 'product__price', 'product__cost_price',
    ).annotate(quantity=models.Sum('quantity'))
    stock_by_branch = {store_id: [] for store_id in selected_branches}
    product_totals = {}
    for row in stock_rows:
        quantity = row['quantity'] or Decimal('0')
        retail_value = quantity * (row['product__price'] or Decimal('0'))
        cost_value = quantity * (row['product__cost_price'] or Decimal('0'))
        item = {
            'product_id': row['product_id'],
            'name': row['product__name'],
            'sku': row['product__sku'],
            'base_unit': row['product__base_unit'],
            'quantity': float(quantity),
            'retail_value': float(retail_value),
            'cost_value': float(cost_value),
        }
        stock_by_branch.setdefault(row['store_id'], []).append(item)
        total = product_totals.setdefault(row['product_id'], {
            'product_id': row['product_id'],
            'name': row['product__name'],
            'sku': row['product__sku'],
            'base_unit': row['product__base_unit'],
            'quantity': Decimal('0'),
            'retail_value': Decimal('0'),
            'cost_value': Decimal('0'),
        })
        total['quantity'] += quantity
        total['retail_value'] += retail_value
        total['cost_value'] += cost_value

    now = timezone.now()
    date_range = request.query_params.get('date_range', 'today')
    if date_range == 'week':
        start_date = now - timedelta(days=7)
    elif date_range == 'month':
        start_date = now - timedelta(days=30)
    elif date_range == 'year':
        start_date = now - timedelta(days=365)
    else:
        date_range = 'today'
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    sales = Transaction.objects.filter(
        user__organization_id=user.organization_id,
        store_id__in=selected_branches,
        status='completed',
        completed_at__gte=start_date,
    )
    sales_by_branch = sales.values('store_id').annotate(
        total_sales=models.Sum('total_amount'),
        transaction_count=models.Count('id'),
    )
    sales_totals = sales.aggregate(
        total_sales=models.Sum('total_amount'),
        transaction_count=models.Count('id'),
    )

    def serialize_total(item):
        return {
            **item,
            'quantity': float(item['quantity']),
            'retail_value': float(item['retail_value']),
            'cost_value': float(item['cost_value']),
        }

    branch_data = []
    sales_lookup = {row['store_id']: row for row in sales_by_branch}
    branch_names = dict(organization_branches.values_list('store_id', 'name'))
    for store_id in selected_branches:
        items = stock_by_branch.get(store_id, [])
        branch_data.append({
            'store_id': store_id,
            'name': branch_names.get(store_id, store_id),
            'product_count': len(items),
            'total_quantity': sum(item['quantity'] for item in items),
            'retail_value': sum(item['retail_value'] for item in items),
            'cost_value': sum(item['cost_value'] for item in items),
            'sales': {
                'total_sales': float(sales_lookup.get(store_id, {}).get('total_sales') or 0),
                'transaction_count': sales_lookup.get(store_id, {}).get('transaction_count', 0),
            },
            'products': items,
        })

    return Response({
        'date_range': date_range,
        'start_date': start_date.isoformat(),
        'end_date': now.isoformat(),
        'branches': branch_data,
        'grand_total': {
            'total_quantity': sum(item['quantity'] for item in product_totals.values()),
            'retail_value': sum(item['retail_value'] for item in product_totals.values()),
            'cost_value': sum(item['cost_value'] for item in product_totals.values()),
            'sales': {
                'total_sales': float(sales_totals['total_sales'] or 0),
                'transaction_count': sales_totals['transaction_count'] or 0,
            },
        },
        'product_totals': [serialize_total(item) for item in product_totals.values()],
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated, HasValidSubscription])
def create_transaction(request):
    """Create a new transaction (cash only)"""
    try:
        with transaction.atomic():
            # Validate request data
            serializer = CreateTransactionSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(
                    {'error': 'Invalid data', 'details': serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            data = serializer.validated_data
            
            # Create transaction
            transaction_obj = Transaction.objects.create(
                user=request.user,
                store_id=data.get('store_id') or getattr(request.user, 'store_id', None) or 'main',
                device_id=data.get('device_id'),
                payment_method='cash',  # Only cash enabled for now
                subtotal=data['subtotal'],
                tax_amount=data['tax_amount'],
                total_amount=data['total_amount'],
                amount_paid=data['amount_paid'],
                change_amount=data['amount_paid'] - data['total_amount'],
                status='completed',
                completed_at=timezone.now(),
                notes=data.get('notes', '')
            )
            
            # Create transaction items and update inventory
            for item_data in data['items']:
                product_id = item_data['product_id']
                unit_id = item_data.get('product_unit_id')
                product, unit, base_quantity = sell_product(
                    product_id, item_data['quantity'], unit_id,
                        user=request.user, reference=transaction_obj.transaction_id,
                        store_id=transaction_obj.store_id
                    )

                # Create transaction item
                TransactionItem.objects.create(
                    transaction=transaction_obj,
                    product=product,
                    quantity=item_data['quantity'],
                    unit_price=item_data['unit_price'],
                    total_price=item_data['total_price'],
                    product_unit=unit,
                    base_quantity=base_quantity,
                    unit_name=unit.name,
                    base_unit=product.base_unit,
                    product_name=product.name,
                    product_sku=product.sku,
                    product_barcode=product.barcode
                )
                
            
            # Return complete transaction data
            response_serializer = TransactionSerializer(transaction_obj)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            
    except Product.DoesNotExist:
        return Response(
            {'error': 'One or more products not found'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except ValidationError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response(
            {'error': f'Failed to create transaction: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated, HasValidSubscription])
def transaction_detail(request, transaction_id):
    """Get details of a specific transaction"""
    try:
        transaction_obj = Transaction.objects.filter(
            transaction_id=transaction_id,
            store_id=request.user.userprofile.store_id
        ).select_related('user').prefetch_related('items').first()
        
        if not transaction_obj:
            return Response(
                {'error': 'Transaction not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = TransactionSerializer(transaction_obj)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch transaction: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated, HasValidSubscription])
def create_refund(request):
    """Create a refund for a transaction"""
    try:
        with transaction.atomic():
            serializer = RefundSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(
                    {'error': 'Invalid data', 'details': serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            data = serializer.validated_data
            
            # Get transaction
            transaction_obj = Transaction.objects.filter(
                transaction_id=data['transaction_id'],
                store_id=request.user.userprofile.store_id,
                status='completed'
            ).first()
            
            if not transaction_obj:
                return Response(
                    {'error': 'Transaction not found or already refunded'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create refund
            refund_obj = Refund.objects.create(
                transaction=transaction_obj,
                user=request.user,
                store_id=request.user.userprofile.store_id,
                reason=data['reason'],
                amount=data['amount'],
                notes=data.get('notes', '')
            )
            
            # Restore inventory
            for item in transaction_obj.items.all():
                product = item.product
                stock = get_store_stock(product, transaction_obj.store_id, for_update=True)
                stock.quantity += item.base_quantity or item.quantity
                stock.sync_version += 1
                stock.save(update_fields=['quantity', 'sync_version', 'updated_at'])
                if transaction_obj.store_id == 'main':
                    product.stock_quantity = stock.quantity
                    product.stock_updated_by = request.user.username
                    product.stock_update_source = 'pos'
                    product.save(update_fields=['stock_quantity', 'stock_updated_by',
                                                'stock_update_source', 'stock_last_updated', 'updated_at'])
            
            # Return refund data
            response_serializer = RefundSerializer(refund_obj)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            
    except Exception as e:
        return Response(
            {'error': f'Failed to create refund: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
