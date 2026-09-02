from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        (
            "Hardware E-commerce",
            {
                "fields": (
                    "role",
                    "phone_number",
                    "staff_role",
                    "organization",
                )
            },
        ),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        (
            "Hardware E-commerce",
            {
                "fields": (
                    "role",
                    "phone_number",
                    "staff_role",
                    "organization",
                )
            },
        ),
    )
    list_display = ("username", "email", "role", "staff_role", "organization", "is_active")
    list_filter = ("role", "staff_role", "organization", "is_active")
