from rest_framework import serializers
from apps.products.models import Product, StockSyncLog
from apps.products.serializers import ProductListSerializer
from .models import Transaction, TransactionItem, Refund


class POSProductSerializer(ProductListSerializer):
    """Optimized serializer for POS operations"""
    
    # POS-specific fields
    pos_stock_quantity = serializers.IntegerField(read_only=True)
    last_pos_sync = serializers.DateTimeField(read_only=True)
    pos_store_id = serializers.CharField(read_only=True)
    stock_sync_version = serializers.IntegerField(read_only=True)
    stock_update_source = serializers.CharField(read_only=True)
    stock_updated_by = serializers.CharField(read_only=True)
    
    class Meta(ProductListSerializer.Meta):
        fields = ProductListSerializer.Meta.fields + [
            'pos_stock_quantity',
            'last_pos_sync', 
            'pos_store_id',
            'stock_sync_version',
            'stock_update_source',
            'stock_updated_by'
        ]


class StockUpdateSerializer(serializers.Serializer):
    """Serializer for stock update requests from POS"""
    product_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=0)
    change_amount = serializers.IntegerField(required=False, allow_null=True)
    store_id = serializers.CharField(default='main', max_length=50)
    device_id = serializers.CharField(required=False, allow_null=True, max_length=100)
    sync_version = serializers.IntegerField(required=False, allow_null=True)


class BulkStockUpdateSerializer(serializers.Serializer):
    """Serializer for bulk stock updates from POS"""
    updates = serializers.ListField(
        child=StockUpdateSerializer(),
        min_length=1,
        max_length=100  # Limit batch size
    )
    store_id = serializers.CharField(default='main', max_length=50)
    device_id = serializers.CharField(required=False, allow_null=True, max_length=100)


class StockSyncLogSerializer(serializers.ModelSerializer):
    """Serializer for stock sync logs"""
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    product_barcode = serializers.CharField(source='product.barcode', read_only=True)
    
    class Meta:
        model = StockSyncLog
        fields = [
            'id',
            'product',
            'product_name',
            'product_sku',
            'product_barcode',
            'old_quantity',
            'new_quantity',
            'change_amount',
            'source',
            'store_id',
            'operator',
            'device_id',
            'sync_status',
            'timestamp',
            'completed_at',
            'conflict_reason',
            'resolved_by'
        ]
        read_only_fields = ['id', 'timestamp', 'completed_at']


class LowStockAlertSerializer(serializers.ModelSerializer):
    """Serializer for low stock alerts"""
    product_name = serializers.CharField(source='product.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'sku',
            'barcode',
            'stock_quantity',
            'low_stock_threshold',
            'price',
            'category_name',
            'brand_name',
            'image_url'
        ]
        read_only_fields = ['id', 'name', 'sku', 'barcode', 'price']


class TransactionItemSerializer(serializers.ModelSerializer):
    """Serializer for transaction items"""
    product_name = serializers.CharField(read_only=True)
    product_sku = serializers.CharField(read_only=True)
    product_barcode = serializers.CharField(read_only=True)
    
    class Meta:
        model = TransactionItem
        fields = [
            'id',
            'transaction',
            'product',
            'quantity',
            'unit_price',
            'total_price',
            'product_name',
            'product_sku',
            'product_barcode',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class TransactionSerializer(serializers.ModelSerializer):
    """Serializer for transactions"""
    items = TransactionItemSerializer(many=True, read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Transaction
        fields = [
            'id',
            'transaction_id',
            'user',
            'user_name',
            'store_id',
            'device_id',
            'payment_method',
            'subtotal',
            'tax_amount',
            'total_amount',
            'amount_paid',
            'change_amount',
            'status',
            'created_at',
            'updated_at',
            'completed_at',
            'notes',
            'receipt_number',
            'items'
        ]
        read_only_fields = ['id', 'transaction_id', 'created_at', 'updated_at', 'completed_at', 'receipt_number']


class CreateTransactionSerializer(serializers.Serializer):
    """Serializer for creating transactions"""
    items = serializers.ListField(
        child=serializers.DictField(),
        min_length=1
    )
    payment_method = serializers.ChoiceField(choices=[('cash', 'Cash')], default='cash')
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2)
    tax_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    amount_paid = serializers.DecimalField(max_digits=10, decimal_places=2)
    notes = serializers.CharField(required=False, allow_blank=True)
    store_id = serializers.CharField(max_length=50)
    device_id = serializers.CharField(required=False, allow_blank=True, max_length=100)


class RefundSerializer(serializers.ModelSerializer):
    """Serializer for refunds"""
    transaction_id = serializers.CharField(source='transaction.transaction_id', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Refund
        fields = [
            'id',
            'transaction',
            'transaction_id',
            'user',
            'user_name',
            'store_id',
            'reason',
            'amount',
            'notes',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']
