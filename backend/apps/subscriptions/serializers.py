from rest_framework import serializers
from .models import Plan, Organization
from django.contrib.auth import get_user_model

User = get_user_model()


class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = [
            'id', 'name', 'monthly_price', 'onetime_price', 'max_users',
            'multi_branch', 'barcode_support', 'supplier_management',
            'stock_adjustments', 'low_stock_alerts', 'profit_loss_reports',
            'audit_logs', 'api_access', 'role_based_access', 'is_active'
        ]
        read_only_fields = ['id']


class OrganizationSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source='current_plan.name', read_only=True)
    user_count = serializers.SerializerMethodField()
    is_active = serializers.SerializerMethodField()
    is_expiry_warning = serializers.SerializerMethodField()
    
    class Meta:
        model = Organization
        fields = [
            'id', 'business_name', 'current_plan', 'plan_name', 'pricing_type',
            'subscription_status', 'expiry_date', 'max_users',
            'user_count', 'is_active', 'is_expiry_warning',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'user_count', 'is_active', 'is_expiry_warning']
    
    def get_user_count(self, obj):
        return obj.users.count()
    
    def get_is_active(self, obj):
        return obj.is_subscription_active()
    
    def get_is_expiry_warning(self, obj):
        return obj.is_expiry_warning()


class OrganizationDetailSerializer(OrganizationSerializer):
    plan_features = serializers.SerializerMethodField()
    
    class Meta(OrganizationSerializer.Meta):
        fields = OrganizationSerializer.Meta.fields + ['plan_features']
    
    def get_plan_features(self, obj):
        return obj.get_available_features()


class SubscriptionInfoSerializer(serializers.Serializer):
    plan = serializers.CharField()
    pricing_type = serializers.CharField()
    plan_features = serializers.DictField()
    subscription_status = serializers.CharField()
    expiry_date = serializers.DateField()
    is_active = serializers.BooleanField()
    is_expiry_warning = serializers.BooleanField()
    max_users = serializers.IntegerField()
    current_users = serializers.IntegerField()
    can_add_user = serializers.BooleanField()
