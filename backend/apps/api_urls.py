from django.urls import include, path

urlpatterns = [
    path("accounts/", include("apps.accounts.urls")),
    path("shipping/", include("apps.shipping.urls")),
    path("products/", include("apps.products.urls")),
    path("orders/", include("apps.orders.urls")),
    path("admin/", include("apps.admin_dashboard.urls")),
    path("subscriptions/", include("apps.subscriptions.urls")),
    # path("pos/", include("apps.pos.urls")),
]
