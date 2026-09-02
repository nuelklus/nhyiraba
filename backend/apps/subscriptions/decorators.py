from functools import wraps
from django.http import JsonResponse
from rest_framework.response import Response


def require_feature(feature_name):
    """
    Decorator to check if user's organization has access to a specific feature
    Usage: @require_feature('barcode_scanning')
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapped_view(*args, **kwargs):
            # Handle both function-based views (request is first arg) and ViewSet methods (self is first arg)
            if len(args) > 0:
                # Check if first arg is request (has user attribute) or self (doesn't have user attribute)
                if hasattr(args[0], 'user'):
                    request = args[0]
                else:
                    # ViewSet method: request is second arg
                    request = args[1] if len(args) > 1 else kwargs.get('request')
            else:
                request = kwargs.get('request')
            
            if not request or not request.user or not request.user.is_authenticated:
                return Response({'error': 'Authentication required'}, status=401)
            
            if not hasattr(request.user, 'organization') or not request.user.organization:
                return Response({'error': 'Organization not found'}, status=403)
            
            if not request.user.organization.has_feature(feature_name):
                return Response({
                    'error': f'Feature {feature_name} is not available in your current plan',
                    'current_plan': request.user.organization.current_plan.name,
                    'required_feature': feature_name
                }, status=403)
            
            return view_func(*args, **kwargs)
        return wrapped_view
    return decorator


def check_subscription(view_func):
    """
    Decorator to check if user's organization has an active subscription
    Usage: @check_subscription
    """
    @wraps(view_func)
    def wrapped_view(*args, **kwargs):
        # Handle both function-based views (request is first arg) and ViewSet methods (self is first arg)
        if len(args) > 0:
            if hasattr(args[0], 'user'):
                request = args[0]
            else:
                request = args[1] if len(args) > 1 else kwargs.get('request')
        else:
            request = kwargs.get('request')
        
        if not request or not request.user or not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=401)
        
        if not hasattr(request.user, 'organization') or not request.user.organization:
            return Response({'error': 'Organization not found'}, status=403)
        
        if not request.user.organization.is_subscription_active():
            return Response({
                'error': 'Subscription expired or inactive',
                'subscription_status': request.user.organization.subscription_status,
                'expiry_date': request.user.organization.expiry_date
            }, status=403)
        
        return view_func(*args, **kwargs)
    return wrapped_view


def check_user_limit(view_func):
    """
    Decorator to check if organization can add more users
    Usage: @check_user_limit
    """
    @wraps(view_func)
    def wrapped_view(*args, **kwargs):
        # Handle both function-based views (request is first arg) and ViewSet methods (self is first arg)
        if len(args) > 0:
            if hasattr(args[0], 'user'):
                request = args[0]
            else:
                request = args[1] if len(args) > 1 else kwargs.get('request')
        else:
            request = kwargs.get('request')
        
        if not request or not request.user or not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=401)
        
        if not hasattr(request.user, 'organization') or not request.user.organization:
            return Response({'error': 'Organization not found'}, status=403)
        
        organization = request.user.organization
        current_user_count = organization.users.count()
        
        if current_user_count >= organization.max_users:
            return Response({
                'error': f'User limit reached for your plan',
                'current_users': current_user_count,
                'max_users': organization.max_users,
                'current_plan': organization.current_plan.name
            }, status=403)
        
        return view_func(*args, **kwargs)
    return wrapped_view


def check_multi_branch(view_func):
    """
    Decorator to check if organization has multi-branch support
    Usage: @check_multi_branch
    """
    @wraps(view_func)
    def wrapped_view(*args, **kwargs):
        # Handle both function-based views (request is first arg) and ViewSet methods (self is first arg)
        if len(args) > 0:
            if hasattr(args[0], 'user'):
                request = args[0]
            else:
                request = args[1] if len(args) > 1 else kwargs.get('request')
        else:
            request = kwargs.get('request')
        
        if not request or not request.user or not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=401)
        
        if not hasattr(request.user, 'organization') or not request.user.organization:
            return Response({'error': 'Organization not found'}, status=403)
        
        if not request.user.organization.has_feature('multi_branch'):
            return Response({
                'error': 'Multi-branch management is not available in your current plan',
                'current_plan': request.user.organization.current_plan.name
            }, status=403)
        
        return view_func(*args, **kwargs)
    return wrapped_view
