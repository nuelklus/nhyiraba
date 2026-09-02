from rest_framework import serializers
from .models import Order, OrderItem, OrderStatusUpdate
from apps.products.models import Product
from .services import OrderService

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(read_only=True)
    product_sku = serializers.CharField(read_only=True)
    subtotal = serializers.ReadOnlyField()

    class Meta:
        model = OrderItem
        fields = [
            'id', 'product', 'product_name', 'product_sku', 
            'price', 'quantity', 'subtotal'
        ]

class OrderStatusUpdateSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = OrderStatusUpdate
        fields = ['status', 'notes', 'created_at', 'created_by']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_updates = OrderStatusUpdateSerializer(many=True, read_only=True)
    grand_total = serializers.ReadOnlyField()
    order_number = serializers.CharField(read_only=True)
    
    # Read-only fields
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'user', 'first_name', 'last_name', 
            'email', 'phone', 'shipping_address', 'city', 'region', 
            'postal_code', 'order_notes', 'total_amount', 'shipping_cost', 
            'tax_amount', 'grand_total', 'payment_method', 'payment_status', 
            'status', 'created_at', 'updated_at', 'tracking_number', 
            'estimated_delivery', 'release_code', 'items', 'status_updates'
        ]
        read_only_fields = [
            'id', 'order_number', 'user', 'grand_total', 'created_at', 
            'updated_at', 'tracking_number', 'estimated_delivery'
        ]

class CreateOrderSerializer(serializers.ModelSerializer):
    items = serializers.ListField(
        child=serializers.DictField(),
        write_only=True
    )

    class Meta:
        model = Order
        fields = [
            'user', 'first_name', 'last_name', 'email', 'phone', 
            'shipping_address', 'city', 'region', 'postal_code', 
            'order_notes', 'total_amount', 'payment_method', 'items'
        ]

    def create(self, validated_data):
        """
        Create order with automatic inventory reduction
        """
        print(f"🛒 Creating order with inventory management...")

        # Check inventory availability before creating order
        items_data = validated_data.get('items', [])
        try:
            OrderService.check_inventory_availability(items_data)
            print(f"✅ Inventory check passed for {len(items_data)} items")
        except serializers.ValidationError as e:
            print(f"❌ Inventory check failed: {e}")
            raise e
        except Exception as e:
            import traceback
            print(f"❌ Unexpected error during inventory check: {e}")
            print(f"❌ Traceback: {traceback.format_exc()}")
            # Pass the original error message directly without wrapping
            raise serializers.ValidationError(str(e))

        # Create order with inventory reduction
        try:
            order = OrderService.create_order_with_inventory_reduction(validated_data)
            print(f"✅ Order {order.order_number} created successfully with inventory reduction")
            return order
        except Exception as e:
            import traceback
            print(f"❌ Order creation failed: {e}")
            print(f"❌ Traceback: {traceback.format_exc()}")
            raise serializers.ValidationError(f"Order creation error: {str(e)}")
