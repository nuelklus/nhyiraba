from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from apps.products import views as product_views
from apps.subscriptions import views as subscription_views

# Create router for POS endpoints
router = DefaultRouter()
router.register(r'products', views.POSProductViewSet, basename='pos-products')

urlpatterns = [
    # Authentication endpoints
    path('auth/login/', views.pos_login, name='pos-login'),
    path('auth/refresh/', views.pos_refresh, name='pos-refresh'),
    path('auth/logout/', views.pos_logout, name='pos-logout'),
    
    # Product-related endpoints
    path('', include(router.urls)),
    
    # Categories and brands (reused from products app)
    path('categories/', product_views.product_categories, name='pos-categories'),
    path('brands/', product_views.product_brands, name='pos-brands'),
    
    # Health check
    path('health/', views.pos_health_check, name='pos-health-check'),
    
    # Low stock alerts
    path('alerts/low-stock/', views.low_stock_alerts, name='pos-low-stock-alerts'),
    
    # Expiry alerts
    path('alerts/expiry/', views.expiry_alerts, name='pos-expiry-alerts'),
    
    # Transaction endpoints
    path('transactions/', views.transaction_history, name='pos-transaction-history'),
    path('transactions/create/', views.create_transaction, name='pos-create-transaction'),
    path('transactions/<str:transaction_id>/', views.transaction_detail, name='pos-transaction-detail'),
    path('refunds/', views.create_refund, name='pos-create-refund'),
    
    # Sales summary
    path('sales-summary/', views.sales_summary, name='pos-sales-summary'),
    
    # Subscription endpoints
    path('subscriptions/subscription/', subscription_views.subscription_info, name='pos-subscription-info'),
    path('subscriptions/subscription/check_feature/', subscription_views.check_feature_access, name='pos-check-feature'),
    path('subscriptions/subscription/features/', subscription_views.get_available_features, name='pos-available-features'),
]

# API documentation
app_name = 'pos'
