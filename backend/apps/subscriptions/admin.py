from django.contrib import admin
from django.utils.html import format_html, mark_safe
from django.utils import timezone
from .models import Plan, Organization


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'monthly_price', 'onetime_price', 'max_users', 'is_active']
    list_filter = ['is_active', 'multi_branch', 'barcode_support', 'api_access']
    search_fields = ['name']
    readonly_fields = ['created_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'monthly_price', 'onetime_price', 'max_users', 'is_active')
        }),
        ('Features', {
            'fields': (
                'multi_branch',
                'barcode_support',
                'supplier_management',
                'stock_adjustments',
                'low_stock_alerts',
                'profit_loss_reports',
                'audit_logs',
                'api_access',
                'role_based_access'
            )
        }),
        ('Metadata', {
            'fields': ('created_at',)
        })
    )


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ['business_name', 'current_plan', 'pricing_type', 'subscription_status', 'expiry_date', 'user_count']
    list_filter = ['subscription_status', 'current_plan', 'pricing_type']
    search_fields = ['business_name']
    readonly_fields = ['created_at', 'updated_at', 'user_count', 'expiry_warning']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('business_name', 'current_plan', 'pricing_type', 'subscription_status', 'expiry_date')
        }),
        ('Plan Limits', {
            'fields': ('max_users',)
        }),
        ('Status Information', {
            'fields': ('user_count', 'expiry_warning')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at')
        })
    )
    
    def user_count(self, obj):
        return obj.users.count()
    user_count.short_description = 'Current Users'
    
    def subscription_active(self, obj):
        is_active = obj.is_subscription_active()
        if is_active:
            return mark_safe('<span style="color: green;">Active</span>')
        else:
            return mark_safe('<span style="color: red;">Inactive</span>')
    subscription_active.short_description = 'Subscription Status'
    
    def expiry_warning(self, obj):
        is_warning = obj.is_expiry_warning()
        if is_warning:
            return mark_safe('<span style="color: orange;">Warning</span>')
        return mark_safe('<span style="color: gray;">OK</span>')
    expiry_warning.short_description = 'Expiry Warning'
    
    def save_model(self, request, obj, form, change):
        # Cache max_users from plan when saving
        if obj.current_plan:
            obj.max_users = obj.current_plan.max_users
        super().save_model(request, obj, form, change)
