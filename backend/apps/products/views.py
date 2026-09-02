from rest_framework import generics, status, filters, pagination
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import render, get_object_or_404
from django.db.models import Q, Avg, Count, F, Prefetch
from django.core.cache import cache
from django.core.files.storage import default_storage
from django.conf import settings
import os
import uuid
from apps.subscriptions.decorators import require_feature
from .models import Product, Category, Brand, Warehouse, ProductReview, ProductImage, TechnicalSpecification
from .serializers import (
    ProductListSerializer, ProductDetailSerializer, ProductCreateUpdateSerializer,
    CategorySerializer, BrandSerializer, WarehouseSerializer, ProductReviewSerializer
)
from .caching import cache_product_list, cache_product_detail, invalidate_product_cache

class ProductPagination(pagination.PageNumberPagination):
    """Custom pagination for products"""
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 100

class PublicProductListView(generics.ListAPIView):
    """List all active products for public browsing (no authentication required)"""
    queryset = Product.objects.filter(is_active=True)  # Only active products for public
    serializer_class = ProductListSerializer
    pagination_class = ProductPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'short_description', 'sku', 'brand__name']
    ordering_fields = ['price', 'created_at', 'name', 'stock_quantity']
    ordering = ['-created_at']
    permission_classes = []  # No authentication required

    def get_queryset(self):
        # Initialize fallback flags
        self._category_fallback = False
        self._requested_category = None

        queryset = super().get_queryset().select_related(
            'category',
            'brand'
        ).prefetch_related(
            Prefetch(
                'images',
                queryset=ProductImage.objects.order_by('-is_primary', 'sort_order', 'id')
            ),
            Prefetch(
                'specifications',
                queryset=TechnicalSpecification.objects.order_by('id')
            )
        )

        category = self.request.query_params.get('category')
        if category:
            from urllib.parse import unquote
            category_param = unquote(category)

            category_queryset = queryset.filter(
                Q(category__slug=category_param) |
                Q(category__slug__iexact=category_param)
            )

            if not category_queryset.exists():
                category_name = category_param.replace('-', ' ')
                category_queryset = Product.objects.filter(
                    Q(category__name__iexact=category_name) |
                    Q(category__name__icontains=category_name),
                    is_active=True
                ).select_related('category', 'brand').prefetch_related(
                    Prefetch('images', queryset=ProductImage.objects.order_by('-is_primary', 'sort_order', 'id')),
                    Prefetch('specifications', queryset=TechnicalSpecification.objects.order_by('id'))
                )

            if category_queryset.exists():
                queryset = category_queryset
                self._category_fallback = False
            else:
                self._category_fallback = True
                self._requested_category = category_param

        brand = self.request.query_params.get('brand')
        if brand:
            from urllib.parse import unquote
            brand_param = unquote(brand)

            brand_queryset = queryset.filter(
                Q(brand__slug=brand_param) |
                Q(brand__slug__iexact=brand_param)
            )

            if not brand_queryset.exists():
                brand_name = brand_param.replace('-', ' ')
                brand_queryset = Product.objects.filter(
                    Q(brand__name__iexact=brand_name) |
                    Q(brand__name__icontains=brand_name),
                    is_active=True
                ).select_related('category', 'brand').prefetch_related(
                    Prefetch('images', queryset=ProductImage.objects.order_by('-is_primary', 'sort_order', 'id')),
                    Prefetch('specifications', queryset=TechnicalSpecification.objects.order_by('id'))
                )

            if brand_queryset.exists():
                queryset = brand_queryset

        in_stock = self.request.query_params.get('in_stock')
        if in_stock == 'true':
            queryset = queryset.filter(Q(track_stock=False) | Q(stock_quantity__gt=0))

        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(short_description__icontains=search) |
                Q(sku__icontains=search) |
                Q(brand__name__icontains=search)
            )

        ordering = self.request.query_params.get('ordering')
        if ordering:
            queryset = queryset.order_by(ordering)
        else:
            queryset = queryset.order_by('-created_at')

        return queryset

    def list(self, request, *args, **kwargs):
        """Override list method to add category fallback information"""
        # Reset fallback flags at the start of each request
        self._category_fallback = False
        self._requested_category = None
        
        response = super().list(request, *args, **kwargs)
        
        # Add category fallback information if it was set in get_queryset
        if hasattr(self, '_category_fallback') and self._category_fallback:
            response.data['category_fallback'] = {
                'occurred': True,
                'requested_category': self._requested_category,
                'message': f"No products found in '{self._requested_category}'. Showing all products instead."
            }
        
        return response

class ProductListView(generics.ListAPIView):
    """List all products with filtering and search (admin only)"""
    queryset = Product.objects.all()  # Show all products for admin
    serializer_class = ProductListSerializer
    pagination_class = ProductPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    # filterset_fields = ['category', 'brand', 'condition', 'is_featured']  # Removed to avoid conflicts
    search_fields = ['name', 'description', 'short_description', 'sku', 'brand__name']
    ordering_fields = ['price', 'created_at', 'name', 'stock_quantity']
    ordering = ['-created_at']
    permission_classes = [IsAuthenticated]  # Require authentication for admin access

    def get_queryset(self):
        # For public users, only show active products
        if not self.request.user.is_authenticated or not self.request.user.is_staff:
            queryset = Product.objects.filter(is_active=True)
        else:
            # For admin users, show all products (including inactive)
            queryset = Product.objects.all()
        
        # Optimize queries with select_related and prefetch_related
        queryset = queryset.select_related(
            'category', 
            'brand'
        ).prefetch_related(
            'images',
            'specifications'
        )
        
        print(f"Request query_params: {self.request.query_params}")
        print(f"User authenticated: {self.request.user.is_authenticated}")
        print(f"User is staff: {self.request.user.is_staff}")
        print(f"Initial queryset count: {queryset.count()}")
        
        # Admin-specific filters
        is_active = self.request.query_params.get('is_active')
        if is_active == 'true':
            queryset = queryset.filter(is_active=True)
        elif is_active == 'false':
            queryset = queryset.filter(is_active=False)
        
        is_featured = self.request.query_params.get('is_featured')
        if is_featured == 'true':
            queryset = queryset.filter(is_featured=True)
        elif is_featured == 'false':
            queryset = queryset.filter(is_featured=False)
        
        # Category filtering by slug (preferred) with fallback to name
        category = self.request.query_params.get('category')
        if category:
            from urllib.parse import unquote
            # URL decode and normalize for comparison
            category_param = unquote(category)
            print(f"Category parameter: '{category_param}'")
            
            # Try exact slug match first (preferred)
            category_queryset = queryset.filter(
                Q(category__slug=category_param) |
                Q(category__slug__iexact=category_param)
            )
            print(f"Category queryset count (slug match): {category_queryset.count()}")
            
            # If no results with slug, try name matching as fallback
            if not category_queryset.exists():
                print("No slug match found, trying name matching...")
                # Replace hyphens with spaces for name matching
                category_name = category_param.replace('-', ' ')
                print(f"Category name for fallback: '{category_name}'")
                category_queryset = Product.objects.filter(
                    Q(category__name__iexact=category_name) |
                    Q(category__name__icontains=category_name)
                )
                print(f"Category queryset count (name match): {category_queryset.count()}")
            
            # Use the filtered category queryset if category filter exists
            if category_queryset.exists():
                queryset = category_queryset
                print(f"Applied category filter, new queryset count: {queryset.count()}")
            else:
                print("No category products found, keeping original queryset")
        
        # Brand filtering by slug (preferred) with fallback to name
        brand = self.request.query_params.get('brand')
        if brand:
            from urllib.parse import unquote
            # URL decode and normalize for comparison
            brand_param = unquote(brand)
            print(f"Brand parameter: '{brand_param}'")
            
            # Try exact slug match first (preferred)
            brand_queryset = queryset.filter(
                Q(brand__slug=brand_param) |
                Q(brand__slug__iexact=brand_param)
            )
            print(f"Brand queryset count (slug match): {brand_queryset.count()}")
            
            # If no results with slug, try name matching as fallback
            if not brand_queryset.exists():
                print("No slug match found, trying name matching...")
                # Replace hyphens with spaces for name matching
                brand_name = brand_param.replace('-', ' ')
                print(f"Brand name for fallback: '{brand_name}'")
                brand_queryset = Product.objects.filter(
                    Q(brand__name__iexact=brand_name) |
                    Q(brand__name__icontains=brand_name)
                )
                print(f"Brand queryset count (name match): {brand_queryset.count()}")
            
            # Use the filtered brand queryset if brand filter exists
            if brand_queryset.exists():
                queryset = brand_queryset
                print(f"Applied brand filter, new queryset count: {queryset.count()}")
            else:
                print("No brand products found, keeping original queryset")
        
        # Stock filtering
        in_stock = self.request.query_params.get('in_stock')
        if in_stock == 'true':
            queryset = queryset.filter(
                Q(track_stock=False) | Q(stock_quantity__gt=0)
            )
        
        # Price range filtering
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
        
        print(f"Final queryset count: {queryset.count()}")
        return queryset

class ProductDetailView(generics.RetrieveAPIView):
    """Get product details"""
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductDetailSerializer
    lookup_field = 'slug'

class ProductCreateView(generics.CreateAPIView):
    """Create new product (admin only)"""
    queryset = Product.objects.all()
    serializer_class = ProductCreateUpdateSerializer
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request, *args, **kwargs):
        print(f"🔍 DEBUG: Incoming request")
        print(f"   Content-Type: {request.content_type}")
        print(f"   Method: {request.method}")
        print(f"   User: {request.user.username} (staff: {request.user.is_staff})")
        print(f"   FILES: {list(request.FILES.keys())}")
        print(f"   POST data: {list(request.POST.keys())}")
        
        # Check if this is FormData
        if request.content_type and 'multipart/form-data' in request.content_type:
            print("✅ Request is multipart/form-data")
        else:
            print(f"❌ Request is NOT multipart/form-data: {request.content_type}")
        
        try:
            return super().post(request, *args, **kwargs)
        except AttributeError as e:
            print(f"❌ AttributeError caught: {e}")
            print(f"   Type: {type(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {"error": f"AttributeError: {str(e)}"}, 
                status=500
            )
        except Exception as e:
            print(f"❌ General Exception caught: {e}")
            import traceback
            traceback.print_exc()
            return Response(
                {"error": f"Server error: {str(e)}"}, 
                status=500
            )

class AdminProductUpdateView(generics.UpdateAPIView):
    """Update product by ID (admin only)"""
    queryset = Product.objects.all()
    serializer_class = ProductCreateUpdateSerializer
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]
    lookup_field = 'pk'  # Use primary key (ID)
    
    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        # Clear all product-related caches when product is updated
        invalidate_product_cache()
        return response

class AdminProductDeleteView(generics.DestroyAPIView):
    """Delete product by ID (admin only)"""
    queryset = Product.objects.all()
    permission_classes = [IsAdminUser]
    lookup_field = 'pk'  # Use primary key (ID)
    
    def destroy(self, request, *args, **kwargs):
        # Clear all product-related caches when product is deleted
        invalidate_product_cache()
        return super().destroy(request, *args, **kwargs)

class ProductUpdateView(generics.UpdateAPIView):
    """Update product (admin only)"""
    queryset = Product.objects.all()
    serializer_class = ProductCreateUpdateSerializer
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]
    lookup_field = 'slug'

class ProductDeleteView(generics.DestroyAPIView):
    """Delete product (admin only)"""
    queryset = Product.objects.all()
    permission_classes = [IsAdminUser]
    lookup_field = 'slug'

@api_view(['GET'])
def product_search_suggestions(request):
    """Get search suggestions for autocomplete"""
    query = request.GET.get('q', '').strip()
    if not query or len(query) < 2:
        return Response({'suggestions': []})
    
    # Search products
    products = Product.objects.filter(
        is_active=True,
        name__icontains=query
    ).values('id', 'name', 'slug', 'sku')[:10]
    
    # Search categories
    categories = Category.objects.filter(
        is_active=True,
        name__icontains=query
    ).values('id', 'name', 'slug')[:5]
    
    # Search brands
    brands = Brand.objects.filter(
        is_active=True,
        name__icontains=query
    ).values('id', 'name', 'slug')[:5]
    
    return Response({
        'products': list(products),
        'categories': list(categories),
        'brands': list(brands)
    })

@api_view(['GET'])
def featured_products(request):
    """Get featured products"""
    products = Product.objects.filter(is_active=True, is_featured=True).select_related(
        'category', 'brand'
    ).prefetch_related(
        Prefetch('images', queryset=ProductImage.objects.order_by('-is_primary', 'sort_order', 'id')),
        Prefetch('specifications', queryset=TechnicalSpecification.objects.order_by('id'))
    )[:12]
    serializer = ProductListSerializer(products, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def initial_data(request):
    """Get initial data for homepage - featured products, categories, and brands"""
    featured_products = Product.objects.filter(is_active=True, is_featured=True).select_related(
        'category', 'brand'
    ).prefetch_related(
        Prefetch('images', queryset=ProductImage.objects.order_by('-is_primary', 'sort_order', 'id')),
        Prefetch('specifications', queryset=TechnicalSpecification.objects.order_by('id'))
    )[:12]
    featured_serializer = ProductListSerializer(featured_products, many=True)

    categories = Category.objects.filter(is_active=True)
    category_serializer = CategorySerializer(categories, many=True)

    brands = Brand.objects.filter(is_active=True)
    brand_serializer = BrandSerializer(brands, many=True)

    return Response({
        'featured_products': featured_serializer.data,
        'categories': category_serializer.data,
        'brands': brand_serializer.data,
    })

@api_view(['GET', 'POST'])
def product_categories(request):
    """Get all categories with product counts, or create a new category"""
    if request.method == 'GET':
        categories = Category.objects.filter(is_active=True).annotate(
            product_count=Count('products', filter=Q(products__is_active=True))
        ).order_by('name')
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        serializer = CategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'POST'])
def product_brands(request):
    """Get all brands with product counts, or create a new brand"""
    if request.method == 'GET':
        brands = Brand.objects.filter(is_active=True).annotate(
            product_count=Count('products', filter=Q(products__is_active=True))
        ).order_by('name')
        serializer = BrandSerializer(brands, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        serializer = BrandSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
@require_feature('multi_branch')
def warehouses(request):
    """Get all warehouses"""
    warehouses = Warehouse.objects.filter(is_active=True)
    serializer = WarehouseSerializer(warehouses, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def category_products(request, slug):
    """Get products by category"""
    try:
        category = Category.objects.get(slug=slug, is_active=True)
        products = Product.objects.filter(is_active=True, category=category)
        
        # Apply same filtering as ProductListView
        filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
        for backend in filter_backends:
            products = backend().filter_queryset(request, products, self)
        
        serializer = ProductListSerializer(products, many=True)
        return Response({
            'category': CategorySerializer(category).data,
            'products': serializer.data
        })
    except Category.DoesNotExist:
        return Response({'error': 'Category not found'}, status=404)

@api_view(['GET'])
def brand_products(request, slug):
    """Get products by brand"""
    try:
        brand = Brand.objects.get(slug=slug, is_active=True)
        products = Product.objects.filter(is_active=True, brand=brand)
        
        # Apply same filtering as ProductListView
        filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
        for backend in filter_backends:
            products = backend().filter_queryset(request, products, self)
        
        serializer = ProductListSerializer(products, many=True)
        return Response({
            'brand': BrandSerializer(brand).data,
            'products': serializer.data
        })
    except Brand.DoesNotExist:
        return Response({'error': 'Brand not found'}, status=404)

class ProductReviewListCreateView(generics.ListCreateAPIView):
    """List and create product reviews"""
    serializer_class = ProductReviewSerializer
    
    def get_queryset(self):
        product_id = self.kwargs['product_id']
        return ProductReview.objects.filter(
            product_id=product_id, 
            is_approved=True
        ).order_by('-created_at')
    
    def perform_create(self, serializer):
        product_id = self.kwargs['product_id']
        serializer.save(
            user=self.request.user,
            product_id=product_id
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_product_review(request, product_id):
    """Add a review for a product"""
    try:
        product = Product.objects.get(id=product_id, is_active=True)
        
        # Check if user already reviewed
        if ProductReview.objects.filter(product=product, user=request.user).exists():
            return Response(
                {'error': 'You have already reviewed this product'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = ProductReviewSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user, product=product)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=404)

@api_view(['GET'])
def product_stats(request):
    """Get product statistics (admin only)"""
    if not request.user.is_staff:
        return Response({'error': 'Admin access required'}, status=403)
    
    stats = {
        'total_products': Product.objects.count(),
        'active_products': Product.objects.filter(is_active=True).count(),
        'featured_products': Product.objects.filter(is_featured=True).count(),
        'out_of_stock': Product.objects.filter(
            track_stock=True, stock_quantity=0
        ).count(),
        'low_stock': Product.objects.filter(
            track_stock=True, 
            stock_quantity__lte=models.F('low_stock_threshold'),
            stock_quantity__gt=0
        ).count(),
    }
    return Response(stats)

@api_view(['POST'])
@permission_classes([IsAdminUser])
@parser_classes([MultiPartParser, FormParser])
def upload_product_image(request):
    """
    Upload a product image and return the URL
    """
    try:
        image_file = request.FILES.get('image')
        if not image_file:
            return Response(
                {'error': 'No image file provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        if image_file.content_type not in allowed_types:
            return Response(
                {'error': 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file size (max 5MB)
        max_size = 5 * 1024 * 1024  # 5MB
        if image_file.size > max_size:
            return Response(
                {'error': 'File too large. Maximum size is 5MB.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate unique filename
        file_extension = os.path.splitext(image_file.name)[1]
        unique_filename = f"products/{uuid.uuid4()}{file_extension}"
        
        # Save file
        file_path = default_storage.save(unique_filename, image_file)
        
        # Get the public URL - for local storage, we need to construct the full URL
        if hasattr(default_storage, 'url'):
            image_url = default_storage.url(file_path)
        else:
            # Fallback for local storage
            image_url = f"http://localhost:8000/media/{file_path}"
        
        # Ensure the URL is absolute
        if not image_url.startswith('http'):
            image_url = f"http://localhost:8000/media/{file_path}"
        
        return Response({
            'success': True,
            'image_url': image_url,
            'message': 'Image uploaded successfully'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {'error': f'Upload failed: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
