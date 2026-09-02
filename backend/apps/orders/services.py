"""
Order service layer for handling business logic
"""
from django.db import transaction
from django.core.exceptions import ValidationError
from rest_framework import serializers
from .models import Order, OrderItem, OrderStatusUpdate
from apps.products.models import Product


class OrderService:
    """Service for handling order creation and inventory management"""
    
    @staticmethod
    @transaction.atomic
    def create_order_with_inventory_reduction(validated_data):
        """
        Create order and reduce inventory stock for each item
        
        Args:
            validated_data: Order data with items list
            
        Returns:
            Order: Created order instance
            
        Raises:
            ValidationError: If insufficient stock or product not found
        """
        items_data = validated_data.pop('items')
        order = Order.objects.create(**validated_data)
        
        # Process each item and reduce inventory
        for item_data in items_data:
            try:
                product_id = int(item_data['product_id'])
                product = Product.objects.get(id=product_id)
                
                # Check if product exists and has sufficient stock
                if product.track_stock and product.stock_quantity < item_data['quantity']:
                    raise ValidationError(
                        f"Insufficient stock for product '{product.name}'. "
                        f"Available: {product.stock_quantity}, Requested: {item_data['quantity']}"
                    )
                
                # Create order item
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    product_name=item_data['product_name'],
                    product_sku=item_data['product_sku'],
                    price=item_data['price'],
                    quantity=item_data['quantity']
                )
                
                # Reduce inventory if stock tracking is enabled
                if product.track_stock:
                    product.stock_quantity -= item_data['quantity']
                    product.save(update_fields=['stock_quantity', 'updated_at'])
                    
                    print(f"📦 Inventory reduced: {product.name} - {item_data['quantity']} units. "
                          f"New stock: {product.stock_quantity}")
                    
                    # Check if product is now low stock
                    if product.is_low_stock:
                        print(f"⚠️ LOW STOCK ALERT: {product.name} now has {product.stock_quantity} units "
                              f"(threshold: {product.low_stock_threshold})")
                
            except (ValueError, Product.DoesNotExist) as e:
                print(f"⚠️ Product not found or invalid ID: {item_data['product_id']}, error: {e}")
                # If product doesn't exist, create OrderItem without product reference
                OrderItem.objects.create(
                    order=order,
                    product=None,
                    product_name=item_data['product_name'],
                    product_sku=item_data['product_sku'],
                    price=item_data['price'],
                    quantity=item_data['quantity']
                )
        
        # Create initial status update
        OrderStatusUpdate.objects.create(
            order=order,
            status='pending',
            notes='Order placed successfully'
        )
        
        return order
    
    @staticmethod
    @transaction.atomic
    def restore_inventory_on_cancellation(order):
        """
        Restore inventory when order is cancelled
        
        Args:
            order: Order instance to cancel
        """
        if order.status == 'cancelled':
            return  # Already cancelled
        
        # Restore inventory for each item
        for item in order.items.all():
            if item.product and item.product.track_stock:
                item.product.stock_quantity += item.quantity
                item.product.save(update_fields=['stock_quantity', 'updated_at'])
                
                print(f"📦 Inventory restored: {item.product.name} +{item.quantity} units. "
                      f"New stock: {item.product.stock_quantity}")
        
        # Update order status
        order.status = 'cancelled'
        order.save(update_fields=['status', 'updated_at'])
        
        # Create status update
        OrderStatusUpdate.objects.create(
            order=order,
            status='cancelled',
            notes='Order cancelled - inventory restored'
        )
    
    @staticmethod
    def check_inventory_availability(items_data):
        """
        Check if all items have sufficient inventory before order creation
        
        Args:
            items_data: List of item data with product_id and quantity
            
        Returns:
            dict: Available items and insufficient items
            
        Raises:
            ValidationError: If any item has insufficient stock
        """
        insufficient_items = []
        available_items = []
        
        for item_data in items_data:
            try:
                product_id = int(item_data['product_id'])
                product = Product.objects.get(id=product_id)
                
                if product.track_stock and product.stock_quantity < item_data['quantity']:
                    insufficient_items.append({
                        'product_name': product.name,
                        'available': product.stock_quantity,
                        'requested': item_data['quantity']
                    })
                else:
                    available_items.append({
                        'product_name': product.name,
                        'available': product.stock_quantity if product.track_stock else 'Unlimited',
                        'requested': item_data['quantity']
                    })
                    
            except (ValueError, Product.DoesNotExist):
                insufficient_items.append({
                    'product_name': item_data.get('product_name', 'Unknown'),
                    'available': 0,
                    'requested': item_data['quantity'],
                    'error': 'Product not found'
                })
        
        if insufficient_items:
            error_message = "Insufficient inventory for the following items:\n"
            for item in insufficient_items:
                error_message += f"- {item['product_name']}: Available {item['available']}, Requested {item['requested']}\n"
            raise ValidationError(error_message)
        
        return {
            'available_items': available_items,
            'insufficient_items': insufficient_items
        }


class InventoryService:
    """Service for inventory management operations"""
    
    @staticmethod
    def get_low_stock_products(threshold=None):
        """
        Get products with low stock levels
        
        Args:
            threshold: Override default low stock threshold
            
        Returns:
            QuerySet: Products with low stock
        """
        if threshold:
            return Product.objects.filter(
                track_stock=True,
                stock_quantity__lte=threshold,
                is_active=True
            )
        return Product.objects.filter(
            track_stock=True,
            stock_quantity__lte=models.F('low_stock_threshold'),
            is_active=True
        )
    
    @staticmethod
    def update_stock(product_id, quantity_change, transaction_type='manual'):
        """
        Update product stock quantity and create transaction record
        
        Args:
            product_id: Product ID
            quantity_change: Positive for addition, negative for reduction
            transaction_type: Type of transaction
            
        Returns:
            Product: Updated product
        """
        try:
            product = Product.objects.get(id=product_id)
            
            if product.track_stock:
                new_quantity = product.stock_quantity + quantity_change
                
                if new_quantity < 0:
                    raise ValidationError(f"Cannot reduce stock below zero. Current: {product.stock_quantity}")
                
                product.stock_quantity = new_quantity
                product.save(update_fields=['stock_quantity', 'updated_at'])
                
                # Create stock transaction record if the model exists
                try:
                    from apps.products.models import StockTransaction
                    StockTransaction.objects.create(
                        product=product,
                        transaction_type=transaction_type,
                        quantity_change=quantity_change,
                        remaining_stock=new_quantity,
                        notes=f"Stock {transaction_type}: {quantity_change} units"
                    )
                except ImportError:
                    # StockTransaction model doesn't exist, skip transaction logging
                    pass
                
                return product
            
        except Product.DoesNotExist:
            raise ValidationError(f"Product with ID {product_id} not found")
        
        return product
