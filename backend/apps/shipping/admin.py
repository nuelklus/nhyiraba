from django.contrib import admin

from .models import JobSite

@admin.register(JobSite)
class JobSiteAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "city", "region", "contact_phone", "created_at")
    search_fields = ("name", "address_line_1", "city", "region", "contact_phone")
