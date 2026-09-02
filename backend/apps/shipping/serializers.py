from rest_framework import serializers

from .models import JobSite

class JobSiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobSite
        fields = [
            "id",
            "name",
            "address_line_1",
            "address_line_2",
            "city",
            "region",
            "contact_name",
            "contact_phone",
            "delivery_instructions",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_by", "created_at", "updated_at"]
