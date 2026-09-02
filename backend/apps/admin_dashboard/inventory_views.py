from django.db.models import Count, Sum, Q, F, Avg
from django.db.models.functions import Coalesce
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from apps.products.models import (
    Product, Category, Brand, Warehouse, WarehouseStock, 
    InventoryTransaction, StockAlert, WarehouseTransfer, ProductApproval
)
from apps.orders.models import Order, OrderItem
from apps.accounts.models import User

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def inventory_overview(request):
    """Get comprehensive inventory overview"""
    try:
        # Basic inventory stats
        total_products = Product.objects.count()
        active_products = Product.objects.filter(is_active=True).count()
        
        # Stock levels
        in_stock = Product.objects.filter(stock_quantity__gt=0).count()
        out_of_stock = Product.objects.filter(stock_quantity=0).count()
        low_stock = Product.objects.filter(
            stock_quantity__gt=0,
            stock_quantity__lte=F('low_stock_threshold')
        ).count()
        
        # Warehouse stats
        total_warehouses = Warehouse.objects.filter(is_active=True).count()
        warehouse_stock = WarehouseStock.objects.aggregate(
            total_stock=Sum('quantity'),
            total_value=Coalesce(Sum('quantity' * F('product__price')), 0)
        )
        
        # Recent transactions
        recent_transactions = InventoryTransaction.objects.select_related(
            'product', 'created_by'
        ).order_by('-created_at')[:10]
        
        # Active alerts
        active_alerts = StockAlert.objects.filter(is_resolved=False).count()
        
        # Pending approvals
        pending_approvals = ProductApproval.objects.filter(status='pending').count()
        
        # Top selling products (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        top_products = OrderItem.objects.filter(
            order__created_at__gte=thirty_days_ago
        ).values('product__name', 'product__sku').annotate(
            total_sold=Sum('quantity'),
            revenue=Sum('quantity' * F('price'))
        ).order_by('-total_sold')[:10]
        
        # Inventory value by category
        category_value = Product.objects.filter(is_active=True).values(
            'category__name'
        ).annotate(
            total_products=Count('id'),
            total_stock=Sum('stock_quantity'),
            total_value=Coalesce(Sum('stock_quantity' * F('price')), 0)
        ).order_by('-total_value')
        
        data = {
            'overview': {
                'total_products': total_products,
                'active_products': active_products,
                'in_stock': in_stock,
                'out_of_stock': out_of_stock,
                'low_stock': low_stock,
                'total_warehouses': total_warehouses,
                'active_alerts': active_alerts,
                'pending_approvals': pending_approvals,
            },
            'warehouse_stock': {
                'total_stock': warehouse_stock['total_stock'] or 0,
                'total_value': float(warehouse_stock['total_value'] or 0),
            },
            'recent_transactions': [
                {
                    'id': trans.id,
                    'product': {
                        'name': trans.product.name,
                        'sku': trans.product.sku
                    },
                    'transaction_type': trans.transaction_type,
                    'quantity_change': trans.quantity_change,
                    'quantity_before': trans.quantity_before,
                    'quantity_after': trans.quantity_after,
                    'reference': trans.reference,
                    'notes': trans.notes,
                    'created_by': trans.created_by.username if trans.created_by else 'System',
                    'created_at': trans.created_at.isoformat()
                }
                for trans in recent_transactions
            ],
            'top_products': list(top_products),
            'category_value': [
                {
                    'category': item['category__name'],
                    'total_products': item['total_products'],
                    'total_stock': item['total_stock'] or 0,
                    'total_value': float(item['total_value'] or 0)
                }
                for item in category_value
            ]
        }
        
        return Response(data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def inventory_transactions(request):
    """Get inventory transactions with filtering"""
    try:
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 20))
        product_id = request.GET.get('product_id')
        transaction_type = request.GET.get('transaction_type')
        date_from = request.GET.get('date_from')
        date_to = request.GET.get('date_to')
        
        transactions = InventoryTransaction.objects.select_related(
            'product', 'created_by'
        ).order_by('-created_at')
        
        # Apply filters
        if product_id:
            transactions = transactions.filter(product_id=product_id)
        if transaction_type:
            transactions = transactions.filter(transaction_type=transaction_type)
        if date_from:
            transactions = transactions.filter(created_at__gte=date_from)
        if date_to:
            transactions = transactions.filter(created_at__lte=date_to)
        
        # Pagination
        from django.core.paginator import Paginator
        paginator = Paginator(transactions, page_size)
        page_obj = paginator.get_page(page)
        
        data = {
            'results': [
                {
                    'id': trans.id,
                    'product': {
                        'id': trans.product.id,
                        'name': trans.product.name,
                        'sku': trans.product.sku,
                        'current_stock': trans.product.stock_quantity
                    },
                    'transaction_type': trans.transaction_type,
                    'quantity_change': trans.quantity_change,
                    'quantity_before': trans.quantity_before,
                    'quantity_after': trans.quantity_after,
                    'reference': trans.reference,
                    'notes': trans.notes,
                    'created_by': trans.created_by.username if trans.created_by else 'System',
                    'created_at': trans.created_at.isoformat()
                }
                for trans in page_obj
            ],
            'count': paginator.count,
            'num_pages': paginator.num_pages,
            'current_page': page,
            'has_next': page_obj.has_next(),
            'has_previous': page_obj.has_previous()
        }
        
        return Response(data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def create_inventory_transaction(request):
    """Create a new inventory transaction"""
    try:
        product_id = request.data.get('product_id')
        transaction_type = request.data.get('transaction_type')
        quantity_change = request.data.get('quantity_change')
        reference = request.data.get('reference', '')
        notes = request.data.get('notes', '')
        
        if not all([product_id, transaction_type, quantity_change is not None]):
            return Response(
                {'error': 'Missing required fields'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        product = Product.objects.get(id=product_id)
        quantity_before = product.stock_quantity
        
        # Calculate new stock level
        quantity_after = quantity_before + quantity_change
        
        # Validate stock level
        if quantity_after < 0:
            return Response(
                {'error': 'Insufficient stock for this transaction'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create transaction
        transaction = InventoryTransaction.objects.create(
            product=product,
            transaction_type=transaction_type,
            quantity_change=quantity_change,
            quantity_before=quantity_before,
            quantity_after=quantity_after,
            reference=reference,
            notes=notes,
            created_by=request.user
        )
        
        # Update product stock
        product.stock_quantity = quantity_after
        product.save()
        
        # Check for stock alerts
        if quantity_after == 0:
            StockAlert.objects.get_or_create(
                product=product,
                alert_type='out_of_stock',
                defaults={
                    'current_stock': quantity_after,
                    'threshold': 0,
                    'message': f'Product {product.name} is out of stock'
                }
            )
        elif quantity_after <= product.low_stock_threshold:
            StockAlert.objects.get_or_create(
                product=product,
                alert_type='low_stock',
                defaults={
                    'current_stock': quantity_after,
                    'threshold': product.low_stock_threshold,
                    'message': f'Product {product.name} has low stock ({quantity_after})'
                }
            )
        
        return Response({
            'id': transaction.id,
            'message': 'Inventory transaction created successfully'
        }, status=status.HTTP_201_CREATED)
        
    except Product.DoesNotExist:
        return Response(
            {'error': 'Product not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def stock_alerts(request):
    """Get stock alerts with filtering"""
    try:
        is_resolved = request.GET.get('is_resolved')
        alert_type = request.GET.get('alert_type')
        
        alerts = StockAlert.objects.select_related('product').order_by('-created_at')
        
        if is_resolved is not None:
            alerts = alerts.filter(is_resolved=is_resolved.lower() == 'true')
        if alert_type:
            alerts = alerts.filter(alert_type=alert_type)
        
        data = [
            {
                'id': alert.id,
                'product': {
                    'id': alert.product.id,
                    'name': alert.product.name,
                    'sku': alert.product.sku,
                    'current_stock': alert.product.stock_quantity
                },
                'alert_type': alert.alert_type,
                'current_stock': alert.current_stock,
                'threshold': alert.threshold,
                'message': alert.message,
                'is_resolved': alert.is_resolved,
                'resolved_at': alert.resolved_at.isoformat() if alert.resolved_at else None,
                'resolved_by': alert.resolved_by.username if alert.resolved_by else None,
                'created_at': alert.created_at.isoformat()
            }
            for alert in alerts
        ]
        
        return Response(data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def resolve_stock_alert(request, alert_id):
    """Resolve a stock alert"""
    try:
        alert = StockAlert.objects.get(id=alert_id)
        alert.is_resolved = True
        alert.resolved_at = timezone.now()
        alert.resolved_by = request.user
        alert.save()
        
        return Response({
            'message': 'Stock alert resolved successfully'
        }, status=status.HTTP_200_OK)
        
    except StockAlert.DoesNotExist:
        return Response(
            {'error': 'Alert not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def pending_approvals(request):
    """Get pending product approvals"""
    try:
        approvals = ProductApproval.objects.filter(
            status='pending'
        ).select_related('product', 'requested_by').order_by('-requested_at')
        
        data = [
            {
                'id': approval.id,
                'product': {
                    'id': approval.product.id if approval.product else None,
                    'name': approval.product.name if approval.product else 'Deleted Product',
                    'sku': approval.product.sku if approval.product else ''
                },
                'change_type': approval.change_type,
                'old_values': approval.old_values,
                'new_values': approval.new_values,
                'requested_by': approval.requested_by.username if approval.requested_by else 'System',
                'requested_at': approval.requested_at.isoformat()
            }
            for approval in approvals
        ]
        
        return Response(data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def process_approval(request, approval_id):
    """Approve or reject a product approval"""
    try:
        approval = ProductApproval.objects.get(id=approval_id)
        action = request.data.get('action')  # 'approve' or 'reject'
        notes = request.data.get('notes', '')
        
        if action not in ['approve', 'reject']:
            return Response(
                {'error': 'Invalid action'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        approval.status = 'approved' if action == 'approve' else 'rejected'
        approval.approved_by = request.user
        approval.approval_notes = notes
        approval.reviewed_at = timezone.now()
        approval.save()
        
        # If approved, apply the changes
        if action == 'approve' and approval.product:
            if approval.change_type == 'update':
                # Apply the new values to the product
                for field, value in approval.new_values.items():
                    setattr(approval.product, field, value)
                approval.product.save()
            elif approval.change_type == 'delete':
                approval.product.delete()
            elif approval.change_type == 'stock_adjustment':
                # Handle stock adjustment
                new_stock = approval.new_values.get('stock_quantity')
                if new_stock is not None:
                    old_stock = approval.product.stock_quantity
                    approval.product.stock_quantity = new_stock
                    approval.product.save()
                    
                    # Create inventory transaction
                    InventoryTransaction.objects.create(
                        product=approval.product,
                        transaction_type='adjustment',
                        quantity_change=new_stock - old_stock,
                        quantity_before=old_stock,
                        quantity_after=new_stock,
                        reference=f'Approval-{approval.id}',
                        notes=f'Stock adjustment approved: {notes}',
                        created_by=request.user
                    )
        
        return Response({
            'message': f'Approval {action}d successfully'
        }, status=status.HTTP_200_OK)
        
    except ProductApproval.DoesNotExist:
        return Response(
            {'error': 'Approval not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
