from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError


class Plan(models.Model):
    PLAN_CHOICES = [
        ('STARTER', 'Starter'),
        ('BUSINESS', 'Business'),
        ('ENTERPRISE', 'Enterprise'),
    ]
    
    name = models.CharField(max_length=20, choices=PLAN_CHOICES, unique=True)
    monthly_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    onetime_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    max_users = models.PositiveIntegerField()
    multi_branch = models.BooleanField(default=False)
    barcode_support = models.BooleanField(default=False)
    supplier_management = models.BooleanField(default=False)
    stock_adjustments = models.BooleanField(default=False)
    low_stock_alerts = models.BooleanField(default=False)
    profit_loss_reports = models.BooleanField(default=False)
    audit_logs = models.BooleanField(default=False)
    api_access = models.BooleanField(default=False)
    role_based_access = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['name'], name='plans_name_idx'),
            models.Index(fields=['is_active'], name='plans_active_idx'),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.max_users} users"


class Organization(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('trial', 'Trial'),
        ('expired', 'Expired'),
        ('suspended', 'Suspended'),
    ]
    
    PRICING_TYPE_CHOICES = [
        ('monthly', 'Monthly'),
        ('onetime', 'One-time'),
    ]
    
    business_name = models.CharField(max_length=200, unique=True)
    current_plan = models.ForeignKey(Plan, on_delete=models.PROTECT, related_name='organizations')
    pricing_type = models.CharField(max_length=20, choices=PRICING_TYPE_CHOICES, default='monthly', help_text="Selected pricing type for this organization")
    subscription_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='trial')
    expiry_date = models.DateField()
    max_users = models.PositiveIntegerField(help_text="Cached from plan for performance")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['business_name'], name='org_name_idx'),
            models.Index(fields=['subscription_status'], name='org_status_idx'),
            models.Index(fields=['expiry_date'], name='org_expiry_idx'),
            models.Index(fields=['current_plan'], name='org_plan_idx'),
        ]
    
    def __str__(self):
        return f"{self.business_name} ({self.current_plan.name})"
    
    def clean(self):
        # Ensure pricing_type matches available pricing options in the plan
        if self.pricing_type == 'monthly':
            if not self.current_plan.monthly_price:
                raise ValidationError("Monthly price is not available for this plan")
        elif self.pricing_type == 'onetime':
            if not self.current_plan.onetime_price:
                raise ValidationError("One-time price is not available for this plan")
    
    def is_subscription_active(self):
        """Check if subscription is active and not expired"""
        if self.subscription_status in ['suspended']:
            return False
        # Onetime pricing has no expiry - always active if not suspended
        if self.pricing_type == 'onetime':
            return True
        # Monthly pricing checks expiry date
        return self.expiry_date >= timezone.now().date()
    
    def is_expiry_warning(self):
        """Check if subscription expires within 3 days (only for monthly plans)"""
        # Onetime pricing has no expiry - no warning needed
        if self.pricing_type == 'onetime':
            return False
        if not self.current_plan.monthly_price and not self.current_plan.onetime_price:
            return False
        if not self.is_subscription_active():
            return False
        days_until_expiry = (self.expiry_date - timezone.now().date()).days
        return 0 <= days_until_expiry <= 3
    
    def has_feature(self, feature_name):
        """Check if organization has access to a specific feature"""
        feature_map = {
            'multi_branch': self.current_plan.multi_branch,
            'barcode_scanning': self.current_plan.barcode_support,
            'supplier_management': self.current_plan.supplier_management,
            'stock_adjustments': self.current_plan.stock_adjustments,
            'low_stock_alerts': self.current_plan.low_stock_alerts,
            'profit_loss_reports': self.current_plan.profit_loss_reports,
            'audit_logs': self.current_plan.audit_logs,
            'api_access': self.current_plan.api_access,
            'role_based_access': self.current_plan.role_based_access,
        }
        return feature_map.get(feature_name, False)
    
    def get_available_features(self):
        """Get dictionary of all available features for this organization"""
        return {
            'max_users': self.current_plan.max_users,
            'multi_branch': self.current_plan.multi_branch,
            'barcode_scanning': self.current_plan.barcode_support,
            'supplier_management': self.current_plan.supplier_management,
            'stock_adjustments': self.current_plan.stock_adjustments,
            'low_stock_alerts': self.current_plan.low_stock_alerts,
            'profit_loss_reports': self.current_plan.profit_loss_reports,
            'audit_logs': self.current_plan.audit_logs,
            'api_access': self.current_plan.api_access,
            'role_based_access': self.current_plan.role_based_access,
        }
    
    def save(self, *args, **kwargs):
        # Cache max_users from plan
        self.max_users = self.current_plan.max_users
        super().save(*args, **kwargs)
