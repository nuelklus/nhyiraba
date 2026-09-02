from django.http import Http404
from django.db.models import Count, Sum, Q, F
from django.db.models.functions import Coalesce
from decimal import Decimal
from django.core.paginator import Paginator
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from apps.orders.models import Order, OrderItem
from apps.products.models import Product, Category, Brand
from apps.accounts.models import User

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def dashboard_stats(request):
    """
    Get dashboard statistics for admin
    """
    try:
        # Real database queries for dashboard statistics
        
        # Total orders
        total_orders = Order.objects.count()
        
        # Total revenue (sum of all order totals)
        total_revenue = Order.objects.aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        
        # Total customers (users with CUSTOMER or PRO_CONTRACTOR role)
        total_customers = User.objects.filter(
            role__in=['CUSTOMER', 'PRO_CONTRACTOR']
        ).count()
        
        # Total products
        total_products = Product.objects.count()
        
        # Pending orders
        pending_orders = Order.objects.filter(status='pending').count()
        
        # Low stock items (products where stock_quantity <= low_stock_threshold)
        low_stock_items = Product.objects.filter(
            stock_quantity__lte=F('low_stock_threshold')
        ).count()
        
        # Recent orders (last 10 orders)
        recent_orders = Order.objects.select_related('user').order_by('-created_at')[:10]
        recent_orders_data = []
        for order in recent_orders:
            recent_orders_data.append({
                'id': str(order.id),
                'order_number': order.order_number or f"ORD-{order.id}",
                'customer': {
                    'id': order.user.id if order.user else None,
                    'username': order.user.get_full_name() or f"{order.first_name} {order.last_name}" if order.user else f"{order.first_name} {order.last_name}",
                    'email': order.user.email if order.user else order.email
                },
                'total_amount': float(order.total_amount),
                'status': order.status,
                'payment_method': order.payment_method,
                'created_at': order.created_at.isoformat(),
                'items_count': order.items.count() if hasattr(order, 'items') else 0
            })
        
        # Low stock products
        low_stock_products = Product.objects.filter(
            stock_quantity__lte=F('low_stock_threshold')
        ).select_related('category', 'brand')[:10]
        low_stock_products_data = []
        for product in low_stock_products:
            low_stock_products_data.append({
                'id': product.id,
                'name': product.name,
                'sku': product.sku,
                'price': str(product.price),
                'stock_quantity': product.stock_quantity,
                'low_stock_threshold': product.low_stock_threshold,
                'category': {
                    'name': product.category.name
                },
                'brand': {
                    'name': product.brand.name
                }
            })
        
        stats = {
            'total_orders': total_orders,
            'total_revenue': float(total_revenue),
            'total_customers': total_customers,
            'total_products': total_products,
            'pending_orders': pending_orders,
            'low_stock_items': low_stock_items,
            'recent_orders': recent_orders_data,
            'low_stock_products': low_stock_products_data
        }
        
        return Response(stats, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': f'Failed to fetch dashboard stats: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_orders(request):
    """
    Get all orders for admin management
    """
    try:
        # Get query parameters
        page = int(request.GET.get('page', 1))
        limit = int(request.GET.get('limit', 20))
        status_filter = request.GET.get('status', '')
        search = request.GET.get('search', '')
        
        # Build query
        orders_query = Order.objects.all()
        
        # Apply status filter
        if status_filter:
            orders_query = orders_query.filter(status=status_filter)
        
        # Apply search filter (search by order number, customer name, email)
        if search:
            orders_query = orders_query.filter(
                Q(order_number__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search)
            )
        
        # Order by creation date (newest first)
        orders_query = orders_query.order_by('-created_at')
        
        # Pagination
        paginator = Paginator(orders_query, limit)
        orders_page = paginator.get_page(page)
        
        # Format orders data
        orders_data = []
        for order in orders_page:
            try:
                items_count = order.items.count() if hasattr(order, 'items') else 0
                
                orders_data.append({
                    'id': str(order.id),
                    'order_number': order.order_number or f"ORD-{order.id}",
                    'customer': {
                        'id': order.user.id if order.user else None,
                        'username': order.user.get_full_name() or f"{order.first_name} {order.last_name}" if order.user else f"{order.first_name} {order.last_name}",
                        'email': order.user.email if order.user else order.email
                    },
                    'total_amount': float(order.total_amount),
                    'status': order.status,
                    'payment_method': order.payment_method,
                    'created_at': order.created_at.isoformat(),
                    'items_count': items_count
                })
            except Exception as e:
                print(f"Error processing order {order.order_number}: {e}")
                continue
        
        return Response({
            'results': orders_data,
            'count': paginator.count,
            'next': f"/admin/orders/?page={page + 1}" if orders_page.has_next() else None,
            'previous': f"/admin/orders/?page={page - 1}" if page > 1 and orders_page.has_previous() else None
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Error in admin_orders: {e}")
        return Response({
            'error': f'Failed to fetch orders: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_order_detail(request, order_id):
    """
    Get single order details for admin (GET) or update order status (PATCH)
    """
    try:
        order = Order.objects.get(id=order_id)
        
        if request.method == 'GET':
            # Return order details
            order_data = {
                'id': str(order.id),
                'order_number': order.order_number or f"ORD-{order.id}",
                'customer': {
                    'id': order.user.id if order.user else None,
                    'username': order.user.get_full_name() or f"{order.first_name} {order.last_name}" if order.user else f"{order.first_name} {order.last_name}",
                    'email': order.user.email if order.user else order.email
                },
                'total_amount': float(order.total_amount),
                'status': order.status,
                'payment_status': order.payment_status,
                'escrow_status': order.escrow_status,
                'payment_ref': order.payment_ref,
                'release_code': order.release_code,
                'payment_method': order.payment_method,
                'shipping_address': order.shipping_address,
                'city': order.city,
                'region': order.region,
                'postal_code': order.postal_code,
                'order_notes': order.order_notes,
                'created_at': order.created_at.isoformat(),
                'items_count': order.items.count() if hasattr(order, 'items') else 0
            }
            
            return Response(order_data, status=status.HTTP_200_OK)
        
        elif request.method == 'PATCH':
            # Update order status and/or escrow information
            new_status = request.data.get('status')
            escrow_status = request.data.get('escrow_status')
            payment_ref = request.data.get('payment_ref')
            release_code = request.data.get('release_code')
            
            # Validate status if provided
            if new_status and new_status not in dict(Order.ORDER_STATUS_CHOICES):
                return Response({
                    'error': 'Invalid status'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate escrow status if provided
            if escrow_status and escrow_status not in dict(Order.ESCROW_STATUS_CHOICES):
                return Response({
                    'error': 'Invalid escrow status'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Update fields
            if new_status:
                order.status = new_status
            if escrow_status:
                order.escrow_status = escrow_status
            if payment_ref:
                order.payment_ref = payment_ref
            if release_code:
                order.release_code = release_code
            
            order.save()
            
            return Response({
                'id': str(order.id),
                'order_number': order.order_number or f"ORD-{order.id}",
                'customer': {
                    'id': order.user.id if order.user else None,
                    'username': order.user.get_full_name() or f"{order.first_name} {order.last_name}" if order.user else f"{order.first_name} {order.last_name}",
                    'email': order.user.email if order.user else order.email
                },
                'total_amount': float(order.total_amount),
                'status': order.status,
                'escrow_status': order.escrow_status,
                'payment_ref': order.payment_ref,
                'release_code': order.release_code,
                'payment_method': order.payment_method,
                'created_at': order.created_at.isoformat(),
                'items_count': order.items.count() if hasattr(order, 'items') else 0
            }, status=status.HTTP_200_OK)
        
    except Order.DoesNotExist:
        return Response({
            'error': 'Order not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': f'Failed to process order: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_inventory(request):
    """
    Get all products for inventory management
    """
    try:
        # Get query parameters
        page = int(request.GET.get('page', 1))
        limit = int(request.GET.get('limit', 20))
        search = request.GET.get('search', '')
        stock_status = request.GET.get('stock_status', '')
        
        # Build query
        products_query = Product.objects.select_related('category', 'brand').all()
        
        # Apply search filter (search by name, SKU, barcode)
        if search:
            products_query = products_query.filter(
                Q(name__icontains=search) |
                Q(sku__icontains=search) |
                Q(barcode__icontains=search)
            )
        
        # Apply stock status filter
        if stock_status == 'low_stock':
            products_query = products_query.filter(
                stock_quantity__lte=F('low_stock_threshold')
            )
        elif stock_status == 'out_of_stock':
            products_query = products_query.filter(stock_quantity=0)
        elif stock_status == 'in_stock':
            products_query = products_query.filter(stock_quantity__gt=F('low_stock_threshold'))
        
        # Order by name
        products_query = products_query.order_by('name')
        
        # Pagination
        paginator = Paginator(products_query, limit)
        products_page = paginator.get_page(page)
        
        # Format products data
        products_data = []
        for product in products_page:
            products_data.append({
                'id': product.id,
                'name': product.name,
                'sku': product.sku,
                'description': product.description,
                'short_description': product.short_description,
                'price': str(product.price),
                'compare_price': str(product.compare_price) if product.compare_price else None,
                'cost_price': str(product.cost_price) if product.cost_price else None,
                'barcode': product.barcode,
                'stock_quantity': product.stock_quantity,
                'low_stock_threshold': product.low_stock_threshold,
                'weight': str(product.weight) if product.weight else None,
                'dimensions': product.dimensions,
                'category': {
                    'id': product.category.id if product.category else None,
                    'name': product.category.name if product.category else None,
                    'slug': product.category.slug if product.category else None
                } if product.category else None,
                'brand': {
                    'id': product.brand.id,
                    'name': product.brand.name,
                    'slug': product.brand.slug
                },
                'is_active': product.is_active,
                'created_at': product.created_at.isoformat()
            })
        
        return Response({
            'results': products_data,
            'count': paginator.count,
            'next': f"/admin/inventory/?page={page + 1}" if products_page.has_next() else None,
            'previous': f"/admin/inventory/?page={page - 1}" if page > 1 and products_page.has_previous() else None
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': f'Failed to fetch inventory: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_restock_product(request, product_id):
    """
    Restock product (add quantity to existing stock)
    """
    try:
        product = Product.objects.get(id=product_id)
        add_quantity = request.data.get('add_quantity')
        
        if add_quantity is None:
            return Response({
                'error': 'Add quantity is required'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            add_quantity = int(add_quantity)
            if add_quantity <= 0:
                return Response({
                    'error': 'Add quantity must be positive'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Add to existing stock
            new_stock = product.stock_quantity + add_quantity
            product.stock_quantity = new_stock
            product.save()
            
            return Response({
                'id': product.id,
                'name': product.name,
                'sku': product.sku,
                'description': product.description,
                'short_description': product.short_description,
                'price': str(product.price),
                'compare_price': str(product.compare_price) if product.compare_price else None,
                'cost_price': str(product.cost_price) if product.cost_price else None,
                'barcode': product.barcode,
                'stock_quantity': product.stock_quantity,
                'low_stock_threshold': product.low_stock_threshold,
                'weight': str(product.weight) if product.weight else None,
                'dimensions': product.dimensions,
                'condition': product.condition,
                'track_stock': product.track_stock,
                'is_active': product.is_active,
                'is_featured': product.is_featured,
                'is_digital': product.is_digital,
                'image_url': product.image_url,
                'category': {
                    'id': product.category.id if product.category else None,
                    'name': product.category.name if product.category else None,
                    'slug': product.category.slug if product.category else None
                } if product.category else None,
                'brand': {
                    'id': product.brand.id,
                    'name': product.brand.name,
                    'slug': product.brand.slug
                },
                'created_at': product.created_at.isoformat(),
                'message': f'Added {add_quantity} to stock. New stock: {new_stock}'
            }, status=status.HTTP_200_OK)
            
        except (ValueError, TypeError):
            return Response({
                'error': 'Invalid add quantity'
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Product.DoesNotExist:
        return Response({
            'error': 'Product not found'
        }, status=status.HTTP_404_NOT_FOUND)
        
    except Exception as e:
        print(f"ERROR: {str(e)}")
        return Response({
            'error': f'Failed to restock: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_update_stock(request, product_id):
    """
    Update product details (full editing functionality)
    """
    try:
        product = Product.objects.get(id=product_id)
        has_updates = False
        
        # Update stock quantity if provided
        if 'stock_quantity' in request.data:
            stock_quantity = request.data.get('stock_quantity')
            try:
                stock_quantity = int(stock_quantity)
                if stock_quantity < 0:
                    return Response({
                        'error': 'Stock quantity cannot be negative'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                product.stock_quantity = stock_quantity
                has_updates = True
            except (ValueError, TypeError):
                return Response({
                    'error': 'Invalid stock quantity'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update product name if provided
        if 'name' in request.data:
            name = request.data.get('name')
            if name and len(name.strip()) > 0:
                product.name = name.strip()
                has_updates = True
        
        # Update SKU if provided
        if 'sku' in request.data:
            sku = request.data.get('sku')
            if sku and len(sku.strip()) > 0:
                # Check if SKU already exists for another product
                if Product.objects.filter(sku=sku.strip()).exclude(id=product.id).exists():
                    return Response({
                        'error': 'SKU already exists'
                    }, status=status.HTTP_400_BAD_REQUEST)
                product.sku = sku.strip()
                has_updates = True
        
        # Update price if provided
        if 'price' in request.data:
            price = request.data.get('price')
            try:
                price = Decimal(str(price))
                if price < 0:
                    return Response({
                        'error': 'Price cannot be negative'
                    }, status=status.HTTP_400_BAD_REQUEST)
                product.price = price
                has_updates = True
            except (ValueError, TypeError, Decimal.InvalidOperation):
                return Response({
                    'error': 'Invalid price'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update low stock threshold if provided
        if 'low_stock_threshold' in request.data:
            threshold = request.data.get('low_stock_threshold')
            try:
                threshold = int(threshold)
                if threshold < 0:
                    return Response({
                        'error': 'Low stock threshold cannot be negative'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                product.low_stock_threshold = threshold
                has_updates = True
            except (ValueError, TypeError):
                return Response({
                    'error': 'Invalid low stock threshold'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update description if provided
        if 'description' in request.data:
            description = request.data.get('description')
            if description is not None:
                product.description = description.strip()
                has_updates = True
        
        # Save changes if any fields were updated
        if has_updates:
            product.save()
        else:
            return Response({
                'error': 'No valid fields provided for update'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'id': product.id,
            'name': product.name,
            'sku': product.sku,
            'description': product.description,
            'short_description': product.short_description,
            'price': str(product.price),
            'compare_price': str(product.compare_price) if product.compare_price else None,
            'cost_price': str(product.cost_price) if product.cost_price else None,
            'barcode': product.barcode,
            'stock_quantity': product.stock_quantity,
            'low_stock_threshold': product.low_stock_threshold,
            'weight': str(product.weight) if product.weight else None,
            'dimensions': product.dimensions,
            'condition': product.condition,
            'track_stock': product.track_stock,
            'is_active': product.is_active,
            'is_featured': product.is_featured,
            'is_digital': product.is_digital,
            'image_url': product.image_url,
            'category': {
                'id': product.category.id if product.category else None,
                'name': product.category.name if product.category else None,
                'slug': product.category.slug if product.category else None
            } if product.category else None,
            'brand': {
                'id': product.brand.id,
                'name': product.brand.name,
                'slug': product.brand.slug
            },
            'created_at': product.created_at.isoformat()
        }, status=status.HTTP_200_OK)
        
    except Product.DoesNotExist:
        return Response({
            'error': 'Product not found'
        }, status=status.HTTP_404_NOT_FOUND)
        
    except Exception as e:
        print(f"ERROR: {str(e)}")
        return Response({
            'error': f'Failed to update product: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
