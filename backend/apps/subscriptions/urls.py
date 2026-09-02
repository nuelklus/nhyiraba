from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PlanViewSet, OrganizationViewSet, SubscriptionInfoViewSet

router = DefaultRouter()
router.register(r'plans', PlanViewSet, basename='plan')
router.register(r'organizations', OrganizationViewSet, basename='organization')
router.register(r'subscription', SubscriptionInfoViewSet, basename='subscription')

urlpatterns = [
    path('', include(router.urls)),
]
