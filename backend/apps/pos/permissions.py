from rest_framework import permissions
from django.contrib.auth import get_user_model
from apps.accounts.models import UserRole, StaffRole

User = get_user_model()


class IsPOSCapable(permissions.BasePermission):
    """
    Check if user has POS capabilities (Admin or Staff)
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admin users have full access
        if request.user.staff_role == StaffRole.ADMIN:
            return True
        
        # Staff users have POS access
        if request.user.role == UserRole.STAFF:
            return True
        
        return False


class CanUpdateStock(permissions.BasePermission):
    """
    Check if user can update stock (Admin, Manager, or Inventory Staff only)
    Cashiers cannot update stock
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Only staff users can potentially update stock
        if request.user.role != UserRole.STAFF:
            return False
        
        # Admin and Manager can always update stock
        if request.user.staff_role in [StaffRole.ADMIN, StaffRole.MANAGER]:
            return True
        
        # Inventory Staff can update stock
        if request.user.staff_role == StaffRole.INVENTORY_STAFF:
            return True
        
        # Cashiers cannot update stock
        if request.user.staff_role == StaffRole.CASHIER:
            return False
        
        return False


class CanAccessStore(permissions.BasePermission):
    """
    Check if user can access specific store/terminal
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admin users can access any store
        if request.user.staff_role == StaffRole.ADMIN:
            return True
        
        # Check store_id in request
        store_id = request.data.get('store_id') or request.query_params.get('store_id')
        if not store_id:
            return True  # Default store access
        
        # Check if user is assigned to this store (you can add this to User model)
        user_stores = getattr(request.user, 'assigned_stores', ['main'])
        return store_id in user_stores


class IsDeviceAuthenticated(permissions.BasePermission):
    """
    Check if request comes from authenticated POS device
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Check for device authentication header
        device_id = request.META.get('HTTP_X_POS_DEVICE_ID')
        if not device_id:
            return False
        
        # Verify device is registered (you can add Device model)
        # For now, just check that device_id is provided
        return True


class CanCreateProduct(permissions.BasePermission):
    """
    Check if user can create products (Admin, Manager, or Inventory Staff only)
    Cashiers cannot create products
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Only staff users can potentially create products
        if request.user.role != UserRole.STAFF:
            return False
        
        # Admin and Manager can always create products
        if request.user.staff_role in [StaffRole.ADMIN, StaffRole.MANAGER]:
            return True
        
        # Inventory Staff can create products
        if request.user.staff_role == StaffRole.INVENTORY_STAFF:
            return True
        
        # Cashiers cannot create products
        if request.user.staff_role == StaffRole.CASHIER:
            return False
        
        return False


class HasValidStoreAccess(permissions.BasePermission):
    """
    Combined permission for store and device access
    """
    
    def has_permission(self, request, view):
        return (
            IsPOSCapable().has_permission(request, view) and
            CanAccessStore().has_permission(request, view) and
            IsDeviceAuthenticated().has_permission(request, view)
        )
