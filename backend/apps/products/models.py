import uuid
from django.db import models
from django.contrib.auth import get_user_model
from apps.accounts.models import UserRole

User = get_user_model()

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True)
    description = models.TextField(blank=True)
    image = models.URLField(blank=True, null=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['name']
        indexes = [
            models.Index(fields=['slug'], name='categories_slug_idx'),
            models.Index(fields=['is_active', 'name'], name='categories_active_name_idx'),
        ]

    def __str__(self):
        return self.name

class Brand(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True)
    description = models.TextField(blank=True)
    logo = models.URLField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['slug'], name='brands_slug_idx'),
            models.Index(fields=['is_active', 'name'], name='brands_active_name_idx'),
        ]

    def __str__(self):
        return self.name

class Warehouse(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=10, unique=True)  # e.g., TEMA, ACCRA
    address = models.TextField()
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"

class Product(models.Model):
    CONDITION_CHOICES = [
        ('new', 'New'),
        ('refurbished', 'Refurbished'),
        ('used', 'Used'),
    ]

    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True)
    description = models.TextField()
    short_description = models.CharField(max_length=500, blank=True)
    sku = models.CharField(max_length=50, unique=True)
    barcode = models.CharField(max_length=50, blank=True, null=True)
    
    # Relationships
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE, related_name='products')
    
    # Pricing
    price = models.DecimalField(max_digits=10, decimal_places=2)
    compare_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Product details
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, default='new')
    weight = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)  # kg
    dimensions = models.CharField(max_length=100, blank=True)  # LxWxH
    image_url = models.URLField(max_length=500, blank=True, null=True)  # Supabase image URL
    
    # Stock
    track_stock = models.BooleanField(default=True)
    stock_quantity = models.PositiveIntegerField(default=0)
    low_stock_threshold = models.PositiveIntegerField(default=5)
    
    # Product expiry
    expiry_date = models.DateField(null=True, blank=True, help_text="Optional expiry date for the product")
    
    # Status
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    is_digital = models.BooleanField(default=False)
    
    # SEO
    meta_title = models.CharField(max_length=200, blank=True)
    meta_description = models.CharField(max_length=300, blank=True)
    
    # NEW: POS-specific fields for stock synchronization
    pos_stock_quantity = models.IntegerField(default=0, help_text="Stock quantity from POS system")
    last_pos_sync = models.DateTimeField(null=True, blank=True, help_text="Last time POS synced stock")
    pos_store_id = models.CharField(max_length=50, default='main', help_text="POS store identifier")
    stock_sync_version = models.IntegerField(default=0, help_text="Version number for stock sync conflicts")
    
    # NEW: Real-time stock tracking
    stock_last_updated = models.DateTimeField(auto_now=True, help_text="Last time stock was updated")
    stock_updated_by = models.CharField(max_length=100, null=True, blank=True, help_text="User who last updated stock")
    stock_update_source = models.CharField(
        max_length=20,
        choices=[
            ('ecommerce', 'E-commerce'),
            ('pos', 'POS'),
            ('admin', 'Admin'),
        ],
        default='admin',
        help_text="Source of last stock update"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def upload_image_to_supabase(self, image_file):
        """
        Upload image to Supabase and update image_url
        
        Args:
            image_file: Django uploaded file
            
        Returns:
            tuple: (success: bool, url: str, error: str)
        """
        from .supabase_storage import supabase_storage
        
        success, url, error = supabase_storage.upload_image(image_file)
        
        if success and url:
            self.image_url = url
            self.save(update_fields=['image_url'])
            return True, url, None
        else:
            return False, None, error
    
    def get_supabase_url(self):
        """
        Get the Supabase URL for this product's image
        
        Returns:
            str: Supabase URL or empty string
        """
        return self.image_url or ''
    
    def has_image(self):
        """
        Check if product has a valid image URL
        
        Returns:
            bool: True if image_url exists and is not localhost
        """
        return bool(self.image_url and 'localhost' not in self.image_url)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['is_active', '-created_at'], name='products_active_created_idx'),
            models.Index(fields=['category', 'is_active'], name='products_category_active_idx'),
            models.Index(fields=['brand', 'is_active'], name='products_brand_active_idx'),
            models.Index(fields=['is_featured', 'is_active'], name='products_featured_active_idx'),
            models.Index(fields=['price'], name='products_price_idx'),
            models.Index(fields=['stock_quantity'], name='products_stock_idx'),
            models.Index(fields=['slug'], name='products_slug_idx'),
            models.Index(fields=['sku'], name='products_sku_idx'),
            models.Index(fields=['name'], name='products_name_idx'),
            # NEW: POS-specific indexes for performance
            models.Index(fields=['pos_stock_quantity', 'last_pos_sync'], name='products_pos_sync_idx'),
            models.Index(fields=['pos_store_id', 'stock_sync_version'], name='products_pos_store_version_idx'),
            models.Index(fields=['stock_update_source', 'stock_last_updated'], name='products_stock_source_time_idx'),
            models.Index(fields=['barcode', 'is_active'], name='products_barcode_active_idx'),
        ]

    def __str__(self):
        return f"{self.name} ({self.sku})"

    @property
    def is_in_stock(self):
        return not self.track_stock or self.stock_quantity > 0

    @property
    def is_low_stock(self):
        return self.track_stock and self.stock_quantity <= self.low_stock_threshold

    @property
    def discount_percentage(self):
        if self.compare_price and self.compare_price > self.price:
            return round(((self.compare_price - self.price) / self.compare_price) * 100, 1)
        return 0

class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.URLField()
    alt_text = models.CharField(max_length=200, blank=True)
    is_primary = models.BooleanField(default=False)
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['sort_order', 'created_at']

    def __str__(self):
        return f"Image for {self.product.name}"

class TechnicalSpecification(models.Model):
    SPEC_TYPES = [
        ('voltage', 'Voltage'),
        ('material', 'Material'),
        ('size', 'Size'),
        ('capacity', 'Capacity'),
        ('power', 'Power'),
        ('weight', 'Weight'),
        ('dimensions', 'Dimensions'),
        ('technical', 'Technical'),
        ('other', 'Other'),
    ]

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='specifications')
    label = models.CharField(max_length=100)
    value = models.CharField(max_length=200)
    spec_type = models.CharField(max_length=20, choices=SPEC_TYPES, default='other')
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['sort_order']

    def __str__(self):
        return f"{self.product.name} - {self.label}: {self.value}"

class WarehouseStock(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='warehouse_stock')
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=0)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['product', 'warehouse']
        ordering = ['warehouse__name']

    def __str__(self):
        return f"{self.product.name} - {self.warehouse.name}: {self.quantity}"

class ProductReview(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])  # 1-5 stars
    title = models.CharField(max_length=200)
    content = models.TextField()
    is_verified = models.BooleanField(default=False)  # Verified purchase
    is_approved = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['product', 'user']
        ordering = ['-created_at']

    def __str__(self):
        return f"Review for {self.product.name} by {self.user.username}"

class InventoryTransaction(models.Model):
    """Track all inventory movements for products"""
    TRANSACTION_TYPES = [
        ('purchase', 'Purchase'),
        ('sale', 'Sale'),
        ('adjustment', 'Adjustment'),
        ('return', 'Return'),
        ('transfer', 'Transfer'),
        ('damage', 'Damage/Loss'),
    ]
    
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='inventory_transactions')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    quantity_change = models.IntegerField(help_text="Positive for stock in, negative for stock out")
    quantity_before = models.PositiveIntegerField()
    quantity_after = models.PositiveIntegerField()
    reference = models.CharField(max_length=100, blank=True, help_text="Order number, invoice, etc.")
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['product', '-created_at'], name='inventory_product_created_idx'),
            models.Index(fields=['transaction_type', '-created_at'], name='inventory_type_created_idx'),
        ]
    
    def __str__(self):
        return f"{self.product.name} - {self.transaction_type}: {self.quantity_change}"

class ProductApproval(models.Model):
    """Track approval workflow for product changes"""
    STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    ]
    
    CHANGE_TYPES = [
        ('create', 'Create Product'),
        ('update', 'Update Product'),
        ('delete', 'Delete Product'),
        ('price_change', 'Price Change'),
        ('stock_adjustment', 'Stock Adjustment'),
    ]
    
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='approvals', null=True, blank=True)
    change_type = models.CharField(max_length=20, choices=CHANGE_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Store the changes as JSON
    old_values = models.JSONField(default=dict, blank=True)
    new_values = models.JSONField(default=dict, blank=True)
    
    # Approval workflow
    requested_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='approval_requests')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='approved_changes')
    approval_notes = models.TextField(blank=True)
    
    # Timestamps
    requested_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-requested_at']
        indexes = [
            models.Index(fields=['status', '-requested_at'], name='approvals_status_created_idx'),
            models.Index(fields=['change_type', '-requested_at'], name='approvals_type_created_idx'),
            models.Index(fields=['requested_by', '-requested_at'], name='approvals_requested_idx'),
        ]
    
    def __str__(self):
        return f"{self.change_type} for {self.product.name if self.product else 'Unknown'} - {self.status}"

class StockAlert(models.Model):
    """Alerts for low stock, out of stock, etc."""
    ALERT_TYPES = [
        ('low_stock', 'Low Stock'),
        ('out_of_stock', 'Out of Stock'),
        ('overstock', 'Overstock'),
        ('reorder_needed', 'Reorder Needed'),
    ]
    
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stock_alerts')
    alert_type = models.CharField(max_length=20, choices=ALERT_TYPES)
    current_stock = models.PositiveIntegerField()
    threshold = models.PositiveIntegerField()
    message = models.TextField()
    is_resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['product', 'is_resolved', '-created_at'], name='alerts_product_resolved_idx'),
            models.Index(fields=['alert_type', 'is_resolved', '-created_at'], name='alerts_type_resolved_idx'),
        ]
    
    def __str__(self):
        return f"{self.alert_type} alert for {self.product.name}"

class WarehouseTransfer(models.Model):
    """Track transfers between warehouses"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_transit', 'In Transit'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    from_warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name='outgoing_transfers')
    to_warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name='incoming_transfers')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='warehouse_transfers')
    quantity = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    tracking_number = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    
    # Workflow
    requested_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='transfer_requests')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='approved_transfers')
    
    # Timestamps
    requested_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-requested_at']
        indexes = [
            models.Index(fields=['status', '-requested_at'], name='transfers_status_created_idx'),
            models.Index(fields=['from_warehouse', '-requested_at'], name='transfers_from_created_idx'),
            models.Index(fields=['to_warehouse', '-requested_at'], name='transfers_to_created_idx'),
        ]
    
    def __str__(self):
        return f"Transfer {self.quantity}x {self.product.name} from {self.from_warehouse.name} to {self.to_warehouse.name}"

class BulkPricing(models.Model):
    """Bulk pricing tiers for Pro-Contractors"""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='bulk_pricing')
    min_quantity = models.PositiveIntegerField(help_text="Minimum quantity for this tier")
    max_quantity = models.PositiveIntegerField(null=True, blank=True, help_text="Maximum quantity for this tier (null for no limit)")
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, help_text="Discount percentage")
    price_per_unit = models.DecimalField(max_digits=10, decimal_places=2, help_text="Price per unit at this tier")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['min_quantity']
        unique_together = ['product', 'min_quantity']
        indexes = [
            models.Index(fields=['product', 'min_quantity'], name='bulk_pricing_min_qty_idx'),
            models.Index(fields=['is_active', 'product'], name='bulk_pricing_active_idx'),
        ]
    
    def __str__(self):
        if self.max_quantity:
            return f"{self.product.name} - {self.min_quantity}-{self.max_quantity} units: {self.discount_percentage}% off"
        return f"{self.product.name} - {self.min_quantity}+ units: {self.discount_percentage}% off"

class JobSite(models.Model):
    """Job sites for Pro-Contractors"""
    name = models.CharField(max_length=200)
    address = models.TextField()
    city = models.CharField(max_length=100)
    region = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20, blank=True)
    contact_person = models.CharField(max_length=100, blank=True)
    contact_phone = models.CharField(max_length=20, blank=True)
    coordinates_lat = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    coordinates_lng = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    
    # Relationships
    pro_contractor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='job_sites')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['pro_contractor', 'is_active'], name='jobsite_contractor_active_idx'),
            models.Index(fields=['city', 'region'], name='jobsite_location_idx'),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.pro_contractor.username}"

class SpecialOrder(models.Model):
    """Special orders for Pro-Contractors"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('quoted', 'Quoted'),
        ('approved', 'Approved'),
        ('processing', 'Processing'),
        ('ready', 'Ready for Pickup/Delivery'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('normal', 'Normal'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    special_instructions = models.TextField(blank=True)
    
    # Pricing
    estimated_budget = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    quoted_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    final_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    # Status and Priority
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='normal')
    
    # Delivery Information
    delivery_method = models.CharField(max_length=20, choices=[
        ('pickup', 'Pickup'),
        ('delivery', 'Delivery'),
        ('site_delivery', 'Site Delivery'),
    ], default='pickup')
    delivery_address = models.TextField(blank=True)
    preferred_delivery_date = models.DateField(null=True, blank=True)
    
    # Relationships
    pro_contractor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='special_orders')
    job_site = models.ForeignKey(JobSite, on_delete=models.SET_NULL, null=True, blank=True, related_name='special_orders')
    
    # Admin assignment
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_special_orders')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    quoted_at = models.DateTimeField(null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['pro_contractor', '-created_at'], name='special_orders_contractor_idx'),
            models.Index(fields=['status', '-created_at'], name='special_orders_status_idx'),
            models.Index(fields=['priority', 'status'], name='special_orders_priority_idx'),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.pro_contractor.username}"

class SpecialOrderItem(models.Model):
    """Items in a special order"""
    special_order = models.ForeignKey(SpecialOrder, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['id']
    
    def __str__(self):
        return f"{self.quantity}x {self.product.name} in {self.special_order.title}"
    
    @property
    def subtotal(self):
        return self.quantity * self.unit_price * (1 - self.discount_percentage / 100)

class ProContractorProfile(models.Model):
    """Extended profile for Pro-Contractors"""
    VERIFICATION_STATUS_CHOICES = [
        ('pending', 'Pending Verification'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
        ('suspended', 'Suspended'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='pro_contractor_profile')
    business_name = models.CharField(max_length=200)
    business_license = models.CharField(max_length=100, blank=True)
    tax_id = models.CharField(max_length=50, blank=True)
    
    # Verification
    verification_status = models.CharField(max_length=20, choices=VERIFICATION_STATUS_CHOICES, default='pending')
    verification_documents = models.JSONField(default=list, blank=True)  # Store document URLs
    verified_at = models.DateTimeField(null=True, blank=True)
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_pro_contractors')
    
    # Credit and Payment
    credit_limit = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    current_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    payment_terms = models.CharField(max_length=100, default='Net 30')
    
    # Preferences
    default_delivery_method = models.CharField(max_length=20, choices=[
        ('pickup', 'Pickup'),
        ('delivery', 'Delivery'),
    ], default='pickup')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['verification_status', '-created_at'], name='pro_profile_verification_idx'),
        ]
    
    def __str__(self):
        return f"{self.business_name} ({self.user.username})"


class StockSyncLog(models.Model):
    """Track stock synchronization between POS and e-commerce systems"""
    
    SYNC_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('conflict', 'Conflict'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stock_sync_logs')
    old_quantity = models.IntegerField(help_text="Previous stock quantity")
    new_quantity = models.IntegerField(help_text="New stock quantity")
    change_amount = models.IntegerField(help_text="Quantity change (+ or -)")
    
    # Source and destination tracking
    source = models.CharField(
        max_length=20,
        choices=[
            ('ecommerce', 'E-commerce'),
            ('pos', 'POS'),
            ('admin', 'Admin'),
        ],
        help_text="Source of stock change"
    )
    store_id = models.CharField(max_length=50, default='main', help_text="Store/terminal identifier")
    
    # User and system tracking
    operator = models.CharField(max_length=100, help_text="User who made the change")
    device_id = models.CharField(max_length=100, null=True, blank=True, help_text="POS device identifier")
    
    # Status and timing
    sync_status = models.CharField(
        max_length=20,
        choices=SYNC_STATUS_CHOICES,
        default='pending',
        help_text="Synchronization status"
    )
    timestamp = models.DateTimeField(auto_now_add=True, help_text="When the change occurred")
    completed_at = models.DateTimeField(null=True, blank=True, help_text="When sync completed")
    
    # Conflict resolution
    conflict_reason = models.TextField(null=True, blank=True, help_text="Reason for conflict if any")
    resolved_by = models.CharField(max_length=100, null=True, blank=True, help_text="Who resolved the conflict")
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['product', 'timestamp'], name='stock_sync_product_time_idx'),
            models.Index(fields=['source', 'timestamp'], name='stock_sync_source_time_idx'),
            models.Index(fields=['store_id', 'timestamp'], name='stock_sync_store_time_idx'),
            models.Index(fields=['sync_status', 'timestamp'], name='stock_sync_status_time_idx'),
            models.Index(fields=['timestamp'], name='stock_sync_timestamp_idx'),
        ]
    
    def __str__(self):
        return f"{self.product.name}: {self.old_quantity} → {self.new_quantity} ({self.source})"
    
    @property
    def is_verified(self):
        return self.verification_status == 'verified'
    
    @property
    def available_credit(self):
        return self.credit_limit - self.current_balance
