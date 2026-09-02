from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.exceptions import ValidationError

class UserRole(models.TextChoices):
    CUSTOMER = "CUSTOMER", "Customer"
    PRO_CONTRACTOR = "PRO_CONTRACTOR", "Pro-Contractor"
    STAFF = "STAFF", "Staff"

class StaffRole(models.TextChoices):
    MANAGER = "MANAGER", "Manager"
    CASHIER = "CASHIER", "Cashier"
    INVENTORY_STAFF = "INVENTORY_STAFF", "Inventory Staff"
    ADMIN = "ADMIN", "Admin"

class User(AbstractUser):
    email = models.EmailField(unique=True)  # Make email unique
    role = models.CharField(max_length=32, choices=UserRole.choices, default=UserRole.CUSTOMER)
    phone_number = models.CharField(max_length=32, unique=True, blank=True, null=True)
    staff_role = models.CharField(max_length=32, choices=StaffRole.choices, blank=True, null=True)
    store_id = models.CharField(max_length=100, default='main', blank=True, null=True, help_text="Store ID for STAFF users")
    organization = models.ForeignKey('subscriptions.Organization', on_delete=models.CASCADE, null=True, blank=True, related_name='users')
    is_staff = models.BooleanField(default=False)  # Required for Django admin access

    def clean(self):
        """Validate that staff_role is only set when role is STAFF"""
        super().clean()
        if self.staff_role and self.role != UserRole.STAFF:
            raise ValidationError({
                'staff_role': 'staff_role can only be set when role is STAFF'
            })

    def is_pro_contractor(self) -> bool:
        return self.role == UserRole.PRO_CONTRACTOR

    def is_admin(self) -> bool:
        return self.staff_role == StaffRole.ADMIN

    def is_manager(self) -> bool:
        return self.staff_role == StaffRole.MANAGER

    def is_cashier(self) -> bool:
        return self.staff_role == StaffRole.CASHIER

    def is_inventory_staff(self) -> bool:
        return self.staff_role == StaffRole.INVENTORY_STAFF