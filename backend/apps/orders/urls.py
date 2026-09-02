from django.urls import path
from . import views

app_name = 'orders'

urlpatterns = [
    path('create/', views.CreateOrderView.as_view(), name='create-order'),
    path('list/', views.OrderListView.as_view(), name='order-list'),
    path('<str:order_number>/', views.OrderDetailView.as_view(), name='order-detail'),
    path('<str:order_number>/track/', views.track_order, name='track-order'),
    path('<str:order_number>/confirm-delivery/', views.confirm_delivery, name='confirm-delivery'),
    path('<str:order_number>/update-status/', views.update_order_status, name='update-status'),
    path('<str:order_number>/cancel/', views.cancel_order_with_inventory_restoration, name='cancel-order'),
]
