from django.urls import path
from . import views

app_name = 'products'

urlpatterns = [
    # Category endpoints (must come before slug-based routes)
    path('categories/', views.product_categories, name='category-list'),
    path('categories/<slug:slug>/', views.category_products, name='category-products'),
    
    # Brand endpoints (must come before slug-based routes)
    path('brands/', views.product_brands, name='brand-list'),
    path('brands/<slug:slug>/', views.brand_products, name='brand-products'),
    
    # Warehouse endpoints
    path('warehouses/', views.warehouses, name='warehouse-list'),
    
    # Product endpoints
    path('public/', views.PublicProductListView.as_view(), name='public-product-list'),
    path('', views.ProductListView.as_view(), name='product-list'),  # Admin endpoint
    path('featured/', views.featured_products, name='featured-products'),
    path('initial-data/', views.initial_data, name='initial-data'),
    path('search/', views.product_search_suggestions, name='search-suggestions'),
    
    # Product management (admin only) - MUST come before slug patterns
    path('create/', views.ProductCreateView.as_view(), name='product-create'),
    path('upload-image/', views.upload_product_image, name='upload-product-image'),
    
    # Admin product management by ID
    path('<int:pk>/update/', views.AdminProductUpdateView.as_view(), name='admin-product-update'),
    path('<int:pk>/delete/', views.AdminProductDeleteView.as_view(), name='admin-product-delete'),
    
    # Product detail (must come after specific routes)
    path('<slug:slug>/', views.ProductDetailView.as_view(), name='product-detail'),
    path('<slug:slug>/update/', views.ProductUpdateView.as_view(), name='product-update'),
    path('<slug:slug>/delete/', views.ProductDeleteView.as_view(), name='product-delete'),
    
    # Reviews
    path('<int:product_id>/reviews/', views.ProductReviewListCreateView.as_view(), name='review-list'),
    path('<int:product_id>/reviews/add/', views.add_product_review, name='add-review'),
]
