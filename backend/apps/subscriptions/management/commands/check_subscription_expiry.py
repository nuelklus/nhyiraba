from django.core.management.base import BaseCommand
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from apps.subscriptions.models import Organization


class Command(BaseCommand):
    help = 'Check and update expired subscriptions'

    def handle(self, *args, **options):
        today = timezone.now().date()
        
        # Find organizations with monthly pricing that have expired
        expired_orgs = Organization.objects.filter(
            pricing_type='monthly',
            expiry_date__lt=today,
            subscription_status__in=['active', 'trial']
        )
        
        count = 0
        for org in expired_orgs:
            org.subscription_status = 'expired'
            org.save()
            count += 1
            self.stdout.write(
                self.style.WARNING(
                    f'Expired: {org.business_name} (Plan: {org.current_plan.name}, '
                    f'Expired on: {org.expiry_date})'
                )
            )
            
            # Send email notification if configured
            if hasattr(settings, 'DEFAULT_FROM_EMAIL'):
                try:
                    send_mail(
                        subject=f'Subscription Expired - {org.business_name}',
                        message=f'Your subscription has expired on {org.expiry_date}. '
                               f'Please renew to continue using the service.',
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[org.users.filter(role='STAFF', staff_role='ADMIN').first().email],
                        fail_silently=True,
                    )
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f'Failed to send email to {org.business_name}: {e}')
                    )
        
        if count == 0:
            self.stdout.write(self.style.SUCCESS('No expired subscriptions found.'))
        else:
            self.stdout.write(
                self.style.SUCCESS(f'Successfully updated {count} expired subscription(s).')
            )
