from rest_framework import permissions
from django.contrib.auth import get_user_model

User = get_user_model()


class HasValidSubscription(permissions.BasePermission):
    """
    Check if user's organization has an active subscription
    Refreshes user from DB to get current subscription status
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Refresh user from DB to get current organization data
        try:
            user = User.objects.select_related('organization').get(pk=request.user.pk)
            if not user.organization:
                return False
            return user.organization.is_subscription_active()
        except User.DoesNotExist:
            return False


class HasFeaturePermission(permissions.BasePermission):
    """
    Check if user's organization has access to a specific feature
    The feature name should be set as a view attribute: required_feature
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Check if user has an organization
        if not hasattr(request.user, 'organization') or not request.user.organization:
            return False
        
        # Get required feature from view
        feature = getattr(view, 'required_feature', None)
        if not feature:
            return True  # No feature required, allow access
        
        return request.user.organization.has_feature(feature)


class CanAddUser(permissions.BasePermission):
    """
    Check if organization can add more users based on plan limits
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if not hasattr(request.user, 'organization') or not request.user.organization:
            return False
        
        organization = request.user.organization
        current_user_count = organization.users.count()
        return current_user_count < organization.max_users


class IsAdminOrSubscriptionAdmin(permissions.BasePermission):
    """
    Check if user is a superuser or has subscription management permissions
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Superusers have full access
        if request.user.is_superuser:
            return True
        
        # Check if user has role-based access enabled in their plan
        if hasattr(request.user, 'organization') and request.user.organization:
            return request.user.organization.has_feature('role_based_access')
        
        return False
