from django.utils import timezone
from django.contrib.auth import get_user_model
from .models import Plan, Organization

User = get_user_model()


class SubscriptionService:
    """Service layer for subscription-related business logic"""
    
    @staticmethod
    def get_organization_features(organization):
        """Get dictionary of all available features for an organization"""
        if not organization:
            return {}
        return organization.get_available_features()
    
    @staticmethod
    def can_add_user(organization):
        """Check if organization can add more users based on plan limits"""
        if not organization:
            return False
        current_users = organization.users.count()
        return current_users < organization.max_users
    
    @staticmethod
    def get_user_count(organization):
        """Get current user count for an organization"""
        if not organization:
            return 0
        return organization.users.count()
    
    @staticmethod
    def upgrade_plan(organization, new_plan, pricing_type=None):
        """
        Upgrade organization to a new plan
        This is an immediate change as per requirements
        """
        if not organization or not new_plan:
            raise ValueError("Organization and plan are required")
        
        organization.current_plan = new_plan
        organization.max_users = new_plan.max_users
        if pricing_type:
            organization.pricing_type = pricing_type
        organization.save()
        
        return organization
    
    @staticmethod
    def downgrade_plan(organization, new_plan, pricing_type=None):
        """
        Downgrade organization to a lower plan
        This is an immediate change as per requirements
        Note: This may result in exceeding user limits
        """
        if not organization or not new_plan:
            raise ValueError("Organization and plan are required")
        
        organization.current_plan = new_plan
        organization.max_users = new_plan.max_users
        if pricing_type:
            organization.pricing_type = pricing_type
        organization.save()
        
        return organization
    
    @staticmethod
    def extend_subscription(organization, days=30):
        """Extend subscription expiry date by specified number of days (only for monthly pricing)"""
        if not organization:
            raise ValueError("Organization is required")
        
        # Onetime pricing has no expiry - cannot extend
        if organization.pricing_type == 'onetime':
            raise ValueError("Cannot extend onetime pricing - it has no expiry")
        
        from datetime import timedelta
        if organization.expiry_date < timezone.now().date():
            # If already expired, extend from today
            organization.expiry_date = timezone.now().date() + timedelta(days=days)
        else:
            # Extend from current expiry date
            organization.expiry_date = organization.expiry_date + timedelta(days=days)
        
        organization.subscription_status = 'active'
        organization.save()
        
        return organization
    
    @staticmethod
    def suspend_subscription(organization):
        """Suspend organization subscription"""
        if not organization:
            raise ValueError("Organization is required")
        
        organization.subscription_status = 'suspended'
        organization.save()
        
        return organization
    
    @staticmethod
    def activate_subscription(organization):
        """Activate organization subscription"""
        if not organization:
            raise ValueError("Organization is required")
        
        organization.subscription_status = 'active'
        organization.save()
        
        return organization
    
    @staticmethod
    def get_subscription_info(user):
        """Get subscription information for a user"""
        if not user or not hasattr(user, 'organization') or not user.organization:
            return None
        
        org = user.organization
        return {
            'plan': org.current_plan.name,
            'pricing_type': org.pricing_type,
            'plan_features': org.get_available_features(),
            'subscription_status': org.subscription_status,
            'expiry_date': org.expiry_date,
            'is_active': org.is_subscription_active(),
            'is_expiry_warning': org.is_expiry_warning(),
            'max_users': org.max_users,
            'current_users': org.users.count(),
            'can_add_user': SubscriptionService.can_add_user(org),
        }
    
    @staticmethod
    def get_all_plans():
        """Get all active plans"""
        return Plan.objects.filter(is_active=True)
    
    @staticmethod
    def get_plan_by_name(plan_name):
        """Get a plan by its name"""
        try:
            return Plan.objects.get(name=plan_name, is_active=True)
        except Plan.DoesNotExist:
            return None
    
    @staticmethod
    def create_organization(business_name, plan_name, expiry_date=None, pricing_type=None):
        """
        Create a new organization
        """
        plan = SubscriptionService.get_plan_by_name(plan_name)
        if not plan:
            raise ValueError(f"Plan {plan_name} not found")
        
        if not pricing_type:
            pricing_type = 'monthly'  # Default to monthly if not specified
        
        # Set expiry date based on pricing_type
        if not expiry_date:
            from datetime import timedelta
            if pricing_type == 'onetime':
                # Onetime pricing has no expiry - set to far future date
                expiry_date = timezone.now().date() + timedelta(days=365*10)  # 10 years in future
            else:
                # Monthly pricing expires in 30 days
                expiry_date = timezone.now().date() + timedelta(days=30)
        
        organization = Organization.objects.create(
            business_name=business_name,
            current_plan=plan,
            pricing_type=pricing_type,
            subscription_status='trial',
            expiry_date=expiry_date,
            max_users=plan.max_users
        )
        
        return organization
    
    @staticmethod
    def check_feature_access(user, feature_name):
        """Check if user has access to a specific feature"""
        if not user or not hasattr(user, 'organization') or not user.organization:
            return False
        
        return user.organization.has_feature(feature_name)
