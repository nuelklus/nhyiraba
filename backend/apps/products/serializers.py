from rest_framework import serializers
from .models import (
    Product, Category, Brand, Warehouse, ProductImage, 
    TechnicalSpecification, WarehouseStock, ProductReview
)

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'image', 'parent', 'is_active']
        extra_kwargs = {
            'slug': {'required': False}
        }
    
    def validate(self, attrs):
        from django.utils.text import slugify
        from .models import Category
        name = attrs.get('name')
        slug = attrs.get('slug')
        
        # Auto-generate slug from name if not provided
        if name and not slug:
            base_slug = slugify(name)
            slug = base_slug
            counter = 1
            
            # Ensure slug is unique
            while Category.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            
            attrs['slug'] = slug
        
        return attrs

class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ['id', 'name', 'slug', 'description', 'logo', 'website', 'is_active']
        extra_kwargs = {
            'slug': {'required': False}
        }
    
    def validate(self, attrs):
        from django.utils.text import slugify
        from .models import Brand
        name = attrs.get('name')
        slug = attrs.get('slug')
        
        # Auto-generate slug from name if not provided
        if name and not slug:
            base_slug = slugify(name)
            slug = base_slug
            counter = 1
            
            # Ensure slug is unique
            while Brand.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            
            attrs['slug'] = slug
        
        return attrs

class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = ['id', 'name', 'code', 'address', 'phone', 'email', 'is_active']

class TechnicalSpecificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = TechnicalSpecification
        fields = ['label', 'value', 'spec_type']

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'is_primary', 'sort_order']

class WarehouseStockSerializer(serializers.ModelSerializer):
    warehouse = WarehouseSerializer(read_only=True)
    
    class Meta:
        model = WarehouseStock
        fields = ['warehouse', 'quantity', 'last_updated']

class ProductReviewSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = ProductReview
        fields = ['id', 'user', 'rating', 'title', 'content', 'is_verified', 'created_at']

class ProductListSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    brand = BrandSerializer(read_only=True)
    primary_image = serializers.SerializerMethodField()
    stock_status = serializers.SerializerMethodField()
    discount_percentage = serializers.SerializerMethodField()
    expiry_status = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'sku', 'short_description',
            'price', 'compare_price', 'discount_percentage',
            'category', 'brand', 'primary_image', 'image_url', 'stock_status',
            'stock_quantity', 'is_active', 'is_featured', 'expiry_date', 'expiry_status',
            'created_at'
        ]

    def get_primary_image(self, obj):
        images = list(obj.images.all())
        if not images:
            return None

        primary = next((image for image in images if image.is_primary), None)
        chosen = primary or images[0]
        return ProductImageSerializer(chosen).data

    def get_stock_status(self, obj):
        if not obj.track_stock:
            return {'status': 'available', 'message': 'Available'}
        elif obj.stock_quantity > obj.low_stock_threshold:
            return {'status': 'in_stock', 'message': 'In Stock'}
        elif obj.stock_quantity > 0:
            return {'status': 'low_stock', 'message': 'Low Stock'}
        else:
            return {'status': 'out_of_stock', 'message': 'Out of Stock'}

    def get_discount_percentage(self, obj):
        return obj.discount_percentage

    def get_expiry_status(self, obj):
        from django.utils import timezone
        if not obj.expiry_date:
            return {'status': 'no_expiry', 'message': 'No expiry date set'}
        
        today = timezone.now().date()
        days_until_expiry = (obj.expiry_date - today).days
        
        if days_until_expiry < 0:
            return {'status': 'expired', 'message': 'Expired', 'days_overdue': abs(days_until_expiry)}
        elif days_until_expiry <= 30:
            return {'status': 'critical', 'message': 'Expiring soon', 'days_remaining': days_until_expiry}
        elif days_until_expiry <= 90:
            return {'status': 'warning', 'message': 'Expiring within 3 months', 'days_remaining': days_until_expiry}
        else:
            return {'status': 'ok', 'message': 'Good', 'days_remaining': days_until_expiry}

class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    brand = BrandSerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    specifications = TechnicalSpecificationSerializer(many=True, read_only=True)
    warehouse_stock = WarehouseStockSerializer(many=True, read_only=True)
    reviews = ProductReviewSerializer(many=True, read_only=True)
    stock_status = serializers.SerializerMethodField()
    discount_percentage = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    expiry_status = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'sku', 'barcode',
            'description', 'short_description',
            'price', 'compare_price', 'cost_price', 'discount_percentage',
            'category', 'brand', 'condition', 'weight', 'dimensions', 'image_url',
            'track_stock', 'stock_quantity', 'low_stock_threshold',
            'stock_status', 'is_active', 'is_featured', 'is_digital',
            'expiry_date', 'expiry_status',
            'images', 'specifications', 'warehouse_stock', 'reviews',
            'average_rating', 'meta_title', 'meta_description',
            'created_at', 'updated_at'
        ]

    def get_stock_status(self, obj):
        if not obj.track_stock:
            return {'status': 'available', 'message': 'Available'}
        elif obj.stock_quantity > obj.low_stock_threshold:
            return {'status': 'in_stock', 'message': 'In Stock'}
        elif obj.stock_quantity > 0:
            return {'status': 'low_stock', 'message': 'Low Stock'}
        else:
            return {'status': 'out_of_stock', 'message': 'Out of Stock'}

    def get_discount_percentage(self, obj):
        return obj.discount_percentage

    def get_average_rating(self, obj):
        reviews = obj.reviews.filter(is_approved=True)
        if reviews.exists():
            return round(sum(review.rating for review in reviews) / len(reviews), 1)
        return 0

    def get_expiry_status(self, obj):
        from django.utils import timezone
        if not obj.expiry_date:
            return {'status': 'no_expiry', 'message': 'No expiry date set'}
        
        today = timezone.now().date()
        days_until_expiry = (obj.expiry_date - today).days
        
        if days_until_expiry < 0:
            return {'status': 'expired', 'message': 'Expired', 'days_overdue': abs(days_until_expiry)}
        elif days_until_expiry <= 30:
            return {'status': 'critical', 'message': 'Expiring soon', 'days_remaining': days_until_expiry}
        elif days_until_expiry <= 90:
            return {'status': 'warning', 'message': 'Expiring within 3 months', 'days_remaining': days_until_expiry}
        else:
            return {'status': 'ok', 'message': 'Good', 'days_remaining': days_until_expiry}

class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    specifications = TechnicalSpecificationSerializer(many=True, required=False)
    image = serializers.ImageField(write_only=True, required=False, allow_null=True, use_url=False)
    
    class Meta:
        model = Product
        fields = [
            'name', 'slug', 'description', 'short_description',
            'sku', 'barcode', 'category', 'brand',
            'price', 'compare_price', 'cost_price',
            'condition', 'weight', 'dimensions', 'image_url', 'image',
            'track_stock', 'stock_quantity', 'low_stock_threshold',
            'expiry_date',
            'is_active', 'is_featured', 'is_digital',
            'meta_title', 'meta_description',
            'specifications'
        ]
        extra_kwargs = {
            'sku': {'required': False, 'read_only': True},
            'slug': {'required': False},
            'description': {'required': False, 'allow_blank': True},
            'short_description': {'required': False, 'allow_blank': True},
        }
    
    def validate(self, attrs):
        from django.utils.text import slugify
        name = attrs.get('name')
        slug = attrs.get('slug')
        description = attrs.get('description')
        
        # Auto-generate slug from name if not provided
        if name and not slug:
            base_slug = slugify(name)
            slug = base_slug
            counter = 1
            
            # Ensure slug is unique
            while Product.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            
            attrs['slug'] = slug
        
        # Set default description if not provided
        if not description:
            attrs['description'] = name or ''
        
        print(f"🔍 SERIALIZER VALIDATION")
        print(f"📋 Attributes received: {list(attrs.keys())}")
        
        # Debug each attribute
        for key, value in attrs.items():
            print(f"   {key}: {value} ({type(value).__name__})")
        
        # Check required fields
        required_fields = ['name', 'price', 'category', 'brand']
        for field in required_fields:
            if field not in attrs or not attrs[field]:
                print(f"❌ Missing or empty required field: {field}")
            else:
                print(f"✅ {field}: {attrs[field]}")
        
        return super().validate(attrs)
    
    def create(self, validated_data):
        print(f"🔍 SERIALIZER CREATE METHOD")
        print(f"✅ Validated data: {list(validated_data.keys())}")
        
        specs_data = validated_data.pop('specifications', [])
        image_file = validated_data.pop('image', None)
        
        print(f"📷 Image file: {image_file}")
        if image_file:
            print(f"   Name: {image_file.name}")
            print(f"   Size: {image_file.size}")
        
        # Generate SKU if not provided
        if 'sku' not in validated_data or not validated_data['sku']:
            validated_data['sku'] = self.generate_sku(validated_data)
        
        # Upload image to Supabase FIRST if provided
        if image_file:
            try:
                from apps.products.supabase_storage import supabase_storage
                success, url, error = supabase_storage.upload_image(image_file)
                if success and url:
                    validated_data['image_url'] = url
                    print(f"✅ Image uploaded to Supabase: {url}")
                else:
                    print(f"⚠️ Image upload failed: {error}")
            except Exception as e:
                print(f"❌ Supabase upload error: {e}")
                print(f"⚠️ Continuing without image upload")
                # Continue without image - product will still be created
        
        # Create product with Supabase URL
        product = Product.objects.create(**validated_data)
        
        # Create specifications
        for spec_data in specs_data:
            TechnicalSpecification.objects.create(product=product, **spec_data)
        
        return product
    
    def generate_sku(self, validated_data):
        """Generate unique SKU based on product name and category"""
        import uuid
        from django.db import transaction
        
        name = validated_data.get('name', '')
        category = validated_data.get('category')
        
        # Category prefix mapping
        category_prefixes = {
            7: 'PT',   # Power Tools
            8: 'HT',   # Hand Tools  
            9: 'EL',   # Electrical
            10: 'PL',  # Plumbing
            11: 'BM',  # Building Materials
            12: 'SE',  # Safety Equipment
            13: 'TL',  # Tools
            14: 'PA',  # Painting
        }
        
        # Get category prefix
        if category and hasattr(category, 'id'):
            category_id = category.id
        elif isinstance(category, int):
            category_id = category
        else:
            category_id = None
            
        prefix = category_prefixes.get(category_id, 'PRD')
        
        # Generate name part
        name_part = ''
        if name:
            name_part = ''.join(c for c in name.upper() if c.isalnum())[:6]
        
        # Generate unique SKU
        max_attempts = 10
        for attempt in range(max_attempts):
            random_num = str(uuid.uuid4().int)[:4]  # Get first 4 digits of UUID
            sku = f"{prefix}-{name_part}-{random_num}" if name_part else f"{prefix}-{random_num}"
            
            # Check if SKU already exists
            if not Product.objects.filter(sku=sku).exists():
                return sku
        
        # Fallback if all attempts fail (very unlikely)
        return f"{prefix}-{uuid.uuid4().hex[:8].upper()}"

    def update(self, instance, validated_data):
        specs_data = validated_data.pop('specifications', [])
        image_file = validated_data.pop('image', None)
        
        # Don't allow SKU to be changed during update
        if 'sku' in validated_data:
            validated_data.pop('sku')
        
        # Upload new image to Supabase if provided
        if image_file:
            from apps.products.supabase_storage import supabase_storage
            success, url, error = supabase_storage.upload_image(image_file)
            if success and url:
                validated_data['image_url'] = url
                print(f"✅ Image uploaded to Supabase: {url}")
            else:
                print(f"⚠️ Image upload failed: {error}")
        
        # Update product fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Handle specifications
        if specs_data is not None:
            instance.specifications.all().delete()
            for spec_data in specs_data:
                TechnicalSpecification.objects.create(product=instance, **spec_data)
        
        return instance
