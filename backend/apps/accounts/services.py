from django.contrib.auth import get_user_model
from django.db import transaction
from django.contrib.auth import authenticate
from django.core.exceptions import ValidationError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from typing import Dict, Tuple, Optional
from .models import UserRole, StaffRole

User = get_user_model()

class AuthService:
    """Service layer for handling authentication operations"""
    
    @staticmethod
    @transaction.atomic
    def register_user(*, username: str, password: str, email: str = "", 
                     role: str = "CUSTOMER", phone_number: str = "", 
                     staff_role: str = "", organization=None) -> Tuple[User, Dict[str, str]]:
        """
        Register a new user with optional Pro-Contractor or Staff role
        
        Args:
            username: Unique username
            password: User password
            email: User email (optional)
            role: User role (CUSTOMER, PRO_CONTRACTOR, STAFF)
            phone_number: User phone number (optional)
            staff_role: Staff role (required when role is STAFF)
            
        Returns:
            Tuple of (User instance, tokens dict)
            
        Raises:
            ValidationError: If user data is invalid
        """
        # Validate role
        if role not in dict(UserRole.choices):
            raise ValueError(f"Invalid role. Must be one of: {dict(UserRole.choices).keys()}")
        
        # Validate staff_role if provided
        if staff_role:
            if staff_role not in dict(StaffRole.choices):
                raise ValueError(f"Invalid staff_role. Must be one of: {dict(StaffRole.choices).keys()}")
        
        # Validate staff_role is only set when role is STAFF
        if staff_role and role != UserRole.STAFF:
            raise ValueError("staff_role can only be set when role is STAFF")
        
        # Validate staff_role is required when role is STAFF
        if role == UserRole.STAFF and not staff_role:
            raise ValueError("staff_role is required when role is STAFF")
        
        # Create user
        user = User(
            username=username,
            email=email,
            role=role,
            phone_number=phone_number,
            staff_role=staff_role if role == UserRole.STAFF else None,
            organization=organization
        )
        user.set_password(password)
        
        # Validate and save
        try:
            user.full_clean()
        except ValidationError as e:
            # Convert ValidationError to dict format for API response
            error_dict = {}
            for field, errors in e.message_dict.items():
                error_dict[field] = errors
            raise ValueError(error_dict)
        
        user.save()
        
        # Generate tokens
        tokens = AuthService.generate_tokens(user)
        
        return user, tokens
    
    @staticmethod
    def login_user(*, username: str, password: str) -> Tuple[User, Dict[str, str]]:
        """
        Authenticate user and return tokens
        
        Args:
            username: User username or email
            password: User password
            
        Returns:
            Tuple of (User instance, tokens dict)
            
        Raises:
            ValidationError: If credentials are invalid
        """
        # Try to authenticate with username, fallback to email
        user = authenticate(username=username, password=password)
        
        if not user:
            # Try email authentication
            try:
                email_user = User.objects.get(email=username)
                user = authenticate(username=email_user.username, password=password)
            except User.DoesNotExist:
                pass
        
        if not user:
            raise ValueError("Invalid credentials")
        
        if not user.is_active:
            raise ValueError("Account is disabled")
        
        # Check subscription status for users with organization
        # Refresh from DB to ensure organization is loaded
        user = User.objects.select_related('organization').get(pk=user.pk)
        if user.organization and not user.organization.is_subscription_active():
            raise ValueError(
                f"Organization subscription has expired. "
                f"Status: {user.organization.subscription_status}, "
                f"Expiry date: {user.organization.expiry_date}"
            )
        
        # Generate tokens
        tokens = AuthService.generate_tokens(user)
        
        return user, tokens
    
    @staticmethod
    def generate_tokens(user: User) -> Dict[str, str]:
        """Generate JWT tokens for user"""
        refresh = RefreshToken.for_user(user)
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }
    
    @staticmethod
    def refresh_token(refresh_token: str) -> Dict[str, str]:
        """
        Refresh access token using refresh token
        
        Args:
            refresh_token: Valid refresh token
            
        Returns:
            New access token
            
        Raises:
            TokenError: If refresh token is invalid
        """
        try:
            refresh = RefreshToken(refresh_token)
            return {
                "access": str(refresh.access_token),
            }
        except TokenError as e:
            raise ValueError(f"Invalid refresh token: {str(e)}")
    
    @staticmethod
    def logout_user(refresh_token: str) -> bool:
        """
        Blacklist refresh token to logout user
        
        Args:
            refresh_token: Refresh token to blacklist
            
        Returns:
            True if successful
            
        Raises:
            TokenError: If refresh token is invalid
        """
        try:
            refresh = RefreshToken(refresh_token)
            refresh.blacklist()
            return True
        except TokenError as e:
            raise ValueError(f"Invalid refresh token: {str(e)}")
    
    @staticmethod
    def get_user_profile(user: User) -> Dict:
        """Get user profile with relevant information"""
        profile_data = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "phone_number": user.phone_number,
            "date_joined": user.date_joined,
        }
        
        # Add staff_role if user is staff
        if user.role == UserRole.STAFF:
            profile_data["staff_role"] = user.staff_role
        
        # Add verification status for Pro-Contractors (will be implemented later)
        if user.role == UserRole.PRO_CONTRACTOR:
            profile_data["is_verified_pro_contractor"] = getattr(user, 'is_verified_pro_contractor', False)
        
        return profile_data

# Legacy function for backward compatibility
@transaction.atomic
def create_user(*, username: str, password: str, email: str = "", role: str | None = None, phone_number: str = ""):
    """Legacy function - use AuthService.register_user instead"""
    user, _ = AuthService.register_user(
        username=username,
        password=password,
        email=email,
        role=role or "CUSTOMER",
        phone_number=phone_number
    )
    return user
