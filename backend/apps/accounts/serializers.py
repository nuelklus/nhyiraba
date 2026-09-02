import re
from django.contrib.auth import get_user_model
from rest_framework import serializers
from django.core.exceptions import ValidationError
from .models import UserRole, StaffRole

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """Basic user serializer for profile display"""
    
    class Meta:
        model = User
        fields = ["id", "username", "email", "role", "phone_number", "date_joined", "organization_id"]
        read_only_fields = ["id", "date_joined"]

class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    staff_role = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = User
        fields = ["username", "email", "password", "password_confirm", "role", "phone_number", "staff_role"]
    
    def validate_phone_number(self, value):
        """Format and validate phone number to +233 format"""
        if not value:
            return value
        
        # Remove all non-digit characters
        digits = re.sub(r'\D', '', value)
        
        # Handle Ghana phone numbers
        if digits.startswith('0'):
            # Convert 0202729861 to +233202729861
            if len(digits) == 10:
                formatted = f'+233{digits[1:]}'
                return formatted
            else:
                raise serializers.ValidationError("Invalid Ghana phone number format")
        elif digits.startswith('233'):
            # Already in Ghana format, just add +
            if len(digits) == 12:
                return f'+{digits}'
            else:
                raise serializers.ValidationError("Invalid Ghana phone number format")
        elif digits.startswith('+233'):
            # Already in international format - remove + and re-add to ensure consistency
            clean_digits = digits.replace('+', '')
            if len(clean_digits) == 12:
                return f'+{clean_digits}'
            else:
                raise serializers.ValidationError("Invalid international phone number format")
        else:
            # For other countries, just add + if missing
            if len(digits) >= 10:
                return f'+{digits}'
            else:
                raise serializers.ValidationError("Phone number must be at least 10 digits")
    
    def validate_role(self, value):
        if value not in dict(UserRole.choices):
            raise serializers.ValidationError(f"Invalid role. Must be one of: {dict(UserRole.choices).keys()}")
        return value
    
    def validate_staff_role(self, value):
        """Validate staff_role only when role is STAFF"""
        if value:
            if value not in dict(StaffRole.choices):
                raise serializers.ValidationError(f"Invalid staff_role. Must be one of: {dict(StaffRole.choices).keys()}")
        return value
    
    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError("Passwords don't match")
        
        # Validate staff_role is only set when role is STAFF
        role = attrs.get("role")
        staff_role = attrs.get("staff_role")
        
        if staff_role and role != UserRole.STAFF:
            raise serializers.ValidationError("staff_role can only be set when role is STAFF")
        
        if role == UserRole.STAFF and not staff_role:
            raise serializers.ValidationError("staff_role is required when role is STAFF")
        
        return attrs
    
    def create(self, validated_data):
        validated_data.pop("password_confirm")
        return User.objects.create_user(**validated_data)

class LoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        username = attrs.get("username")
        password = attrs.get("password")
        
        if not username or not password:
            raise serializers.ValidationError("Both username and password are required")
        
        return attrs

class TokenRefreshSerializer(serializers.Serializer):
    """Serializer for token refresh"""
    refresh = serializers.CharField()

class LogoutSerializer(serializers.Serializer):
    """Serializer for user logout"""
    refresh = serializers.CharField()
