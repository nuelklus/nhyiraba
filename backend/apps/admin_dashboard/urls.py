from django.urls import path
from . import views
from . import inventory_views

urlpatterns = [
    path("dashboard/stats/", views.dashboard_stats, name="dashboard_stats"),
    path("orders/", views.admin_orders, name="admin_orders"),
    path("orders/<uuid:order_id>/", views.admin_order_detail, name="admin_order_detail"),
    path("inventory/", views.admin_inventory, name="admin_inventory"),
    path("inventory/<int:product_id>/", views.admin_update_stock, name="admin_update_stock"),
    path("inventory/<int:product_id>/restock/", views.admin_restock_product, name="admin_restock_product"),
    
    # New inventory tracking endpoints
    path("inventory/overview/", inventory_views.inventory_overview, name="inventory_overview"),
    path("inventory/transactions/", inventory_views.inventory_transactions, name="inventory_transactions"),
    path("inventory/transactions/create/", inventory_views.create_inventory_transaction, name="create_inventory_transaction"),
    path("inventory/alerts/", inventory_views.stock_alerts, name="stock_alerts"),
    path("inventory/alerts/<int:alert_id>/resolve/", inventory_views.resolve_stock_alert, name="resolve_stock_alert"),
    path("approvals/pending/", inventory_views.pending_approvals, name="pending_approvals"),
    path("approvals/<int:approval_id>/process/", inventory_views.process_approval, name="process_approval"),
]
