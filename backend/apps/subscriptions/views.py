from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model

from .models import Plan, Organization
from .serializers import PlanSerializer, OrganizationSerializer, OrganizationDetailSerializer, SubscriptionInfoSerializer
from .permissions import IsAdminOrSubscriptionAdmin, HasValidSubscription
from .services import SubscriptionService

User = get_user_model()


class PlanViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing available plans"""
    queryset = Plan.objects.filter(is_active=True)
    serializer_class = PlanSerializer
    permission_classes = [IsAuthenticated]
    
    def list(self, request, *args, **kwargs):
        """List all available plans"""
        return super().list(request, *args, **kwargs)
    
    def retrieve(self, request, *args, **kwargs):
        """Get details of a specific plan"""
        return super().retrieve(request, *args, **kwargs)


class OrganizationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing organizations (admin only)"""
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [IsAuthenticated, IsAdminOrSubscriptionAdmin]
    
    def get_serializer_class(self):
        if self.action in ['retrieve', 'update', 'partial_update']:
            return OrganizationDetailSerializer
        return OrganizationSerializer
    
    def create(self, request, *args, **kwargs):
        """Create a new organization (admin only)"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    @action(detail=True, methods=['post'])
    def upgrade_plan(self, request, pk=None):
        """Upgrade organization to a new plan"""
        organization = self.get_object()
        plan_name = request.data.get('plan_name')
        
        if not plan_name:
            return Response({'error': 'plan_name is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        new_plan = SubscriptionService.get_plan_by_name(plan_name)
        if not new_plan:
            return Response({'error': 'Plan not found'}, status=status.HTTP_404_NOT_FOUND)
        
        try:
            organization = SubscriptionService.upgrade_plan(organization, new_plan)
            serializer = self.get_serializer(organization)
            return Response(serializer.data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def extend_subscription(self, request, pk=None):
        """Extend subscription by specified number of days"""
        organization = self.get_object()
        days = request.data.get('days', 30)
        
        try:
            organization = SubscriptionService.extend_subscription(organization, days)
            serializer = self.get_serializer(organization)
            return Response(serializer.data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def suspend(self, request, pk=None):
        """Suspend organization subscription"""
        organization = self.get_object()
        
        try:
            organization = SubscriptionService.suspend_subscription(organization)
            serializer = self.get_serializer(organization)
            return Response(serializer.data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate organization subscription"""
        organization = self.get_object()
        
        try:
            organization = SubscriptionService.activate_subscription(organization)
            serializer = self.get_serializer(organization)
            return Response(serializer.data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class SubscriptionInfoViewSet(viewsets.ViewSet):
    """ViewSet for getting current user's subscription information"""
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        """Get current user's subscription information"""
        if not hasattr(request.user, 'organization') or not request.user.organization:
            return Response({'error': 'Organization not found'}, status=status.HTTP_404_NOT_FOUND)
        
        subscription_info = SubscriptionService.get_subscription_info(request.user)
        serializer = SubscriptionInfoSerializer(subscription_info)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def features(self, request):
        """Get available features for current user's organization"""
        if not hasattr(request.user, 'organization') or not request.user.organization:
            return Response({'error': 'Organization not found'}, status=status.HTTP_404_NOT_FOUND)
        
        features = SubscriptionService.get_organization_features(request.user.organization)
        return Response(features)
    
    @action(detail=False, methods=['get'])
    def check_feature(self, request):
        """Check if a specific feature is available"""
        feature_name = request.query_params.get('feature')
        
        if not feature_name:
            return Response({'error': 'feature parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not hasattr(request.user, 'organization') or not request.user.organization:
            return Response({'error': 'Organization not found'}, status=status.HTTP_404_NOT_FOUND)
        
        has_feature = request.user.organization.has_feature(feature_name)
        return Response({
            'feature': feature_name,
            'available': has_feature,
            'current_plan': request.user.organization.current_plan.name
        })


# Function-based views for POS API integration
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def subscription_info(request):
    """Get current user's subscription information"""
    if not hasattr(request.user, 'organization') or not request.user.organization:
        return Response({'error': 'Organization not found'}, status=status.HTTP_404_NOT_FOUND)
    
    subscription_info = SubscriptionService.get_subscription_info(request.user)
    serializer = SubscriptionInfoSerializer(subscription_info)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_feature_access(request):
    """Check if a specific feature is available"""
    feature_name = request.query_params.get('feature')
    
    if not feature_name:
        return Response({'error': 'feature parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    if not hasattr(request.user, 'organization') or not request.user.organization:
        return Response({'error': 'Organization not found'}, status=status.HTTP_404_NOT_FOUND)
    
    has_feature = request.user.organization.has_feature(feature_name)
    return Response({
        'feature': feature_name,
        'available': has_feature,
        'current_plan': request.user.organization.current_plan.name
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_available_features(request):
    """Get available features for current user's organization"""
    if not hasattr(request.user, 'organization') or not request.user.organization:
        return Response({'error': 'Organization not found'}, status=status.HTTP_404_NOT_FOUND)
    
    features = SubscriptionService.get_organization_features(request.user.organization)
    return Response(features)
