from django.conf import settings
from django.db import transaction

from .models import JobSite

def _normalize_phone(phone: str) -> str:
    phone = (phone or "").strip()
    if not phone:
        return ""

    default_cc = getattr(settings, "DEFAULT_PHONE_COUNTRY_CODE", "+233")

    if phone.startswith("+"):
        return phone

    if phone.startswith("0"):
        return f"{default_cc}{phone[1:]}"

    return f"{default_cc}{phone}"

@transaction.atomic
def create_job_site(
    *,
    name: str,
    address_line_1: str,
    address_line_2: str = "",
    city: str = "",
    region: str = "",
    contact_name: str = "",
    contact_phone: str = "",
    delivery_instructions: str = "",
    created_by=None,
) -> JobSite:
    job_site = JobSite(
        name=name,
        address_line_1=address_line_1,
        address_line_2=address_line_2,
        city=city,
        region=region,
        contact_name=contact_name,
        contact_phone=_normalize_phone(contact_phone),
        delivery_instructions=delivery_instructions,
        created_by=created_by if getattr(created_by, "is_authenticated", False) else None,
    )
    job_site.full_clean()
    job_site.save()
    return job_site
