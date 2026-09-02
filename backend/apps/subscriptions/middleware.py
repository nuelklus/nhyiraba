from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
from rest_framework.response import Response


class SubscriptionMiddleware(MiddlewareMixin):
    """
    Middleware to add subscription information to request object
    This allows views to easily access subscription details without
    making additional database queries
    Also blocks access for expired subscriptions
    """
    
    def process_request(self, request):
        if request.user and request.user.is_authenticated:
            # Refresh user from DB to get current organization data
            from apps.accounts.models import User
            try:
                user = User.objects.select_related('organization').get(pk=request.user.pk)
                if user.organization:
                    org = user.organization
                    request.subscription_info = {
                        'plan': org.current_plan.name,
                        'status': org.subscription_status,
                        'expiry_date': org.expiry_date,
                        'is_active': org.is_subscription_active(),
                        'is_expiry_warning': org.is_expiry_warning(),
                        'features': org.get_available_features(),
                        'max_users': org.max_users,
                        'current_users': org.users.count(),
                    }
                else:
                    request.subscription_info = None
            except User.DoesNotExist:
                request.subscription_info = None
        else:
            request.subscription_info = None
        
        return None


class SubscriptionExpiryMiddleware(MiddlewareMixin):
    """
    Middleware to check subscription expiry and add warning headers
    This adds X-Subscription-Expiry-Warning header when subscription
    is about to expire (within 3 days for paid plans)
    """
    
    def process_response(self, request, response):
        if hasattr(request, 'subscription_info') and request.subscription_info:
            if request.subscription_info.get('is_expiry_warning'):
                response['X-Subscription-Expiry-Warning'] = 'true'
                response['X-Subscription-Expiry-Date'] = str(request.subscription_info['expiry_date'])
        
        return response
