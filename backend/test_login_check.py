from apps.accounts.models import User
from apps.subscriptions.models import Organization

# Get the user
user = User.objects.select_related('organization').get(username='ggsaloonadmin')
print(f'User: {user.username}')
print(f'Organization: {user.organization}')
print(f'Organization ID: {user.organization_id}')

if user.organization:
    print(f'Subscription status: {user.organization.subscription_status}')
    print(f'Expiry date: {user.organization.expiry_date}')
    print(f'Is subscription active: {user.organization.is_subscription_active()}')
    print(f'Pricing type: {user.organization.pricing_type}')
else:
    print('No organization assigned')
