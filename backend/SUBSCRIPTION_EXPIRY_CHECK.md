# Subscription Expiry Check

## Overview
The `check_subscription_expiry` management command automatically updates expired subscriptions by:
- Checking all organizations with monthly pricing
- Updating `subscription_status` to 'expired' when `expiry_date` has passed
- Sending email notifications to admin users (if email is configured)

## Manual Execution
Run the command manually to check for expired subscriptions:
```bash
python manage.py check_subscription_expiry
```

## Automated Scheduling

### Linux (Cron)
Add a cron job to run daily at midnight:
```bash
crontab -e
```

Add this line:
```bash
0 0 * * * cd /path/to/backend && python manage.py check_subscription_expiry >> /var/log/subscription_check.log 2>&1
```

### Windows (Task Scheduler)
1. Open Task Scheduler
2. Create Basic Task
3. Name: "Check Subscription Expiry"
4. Trigger: Daily at 12:00 AM
5. Action: Start a program
   - Program: `python.exe`
   - Arguments: `manage.py check_subscription_expiry`
   - Start in: `C:\path\to\backend`

### Using Celery (Alternative)
If you use Celery for background tasks, add to your `celery.py`:
```python
from celery.schedules import crontab

app.conf.beat_schedule = {
    'check-subscription-expiry': {
        'task': 'apps.subscriptions.tasks.check_subscription_expiry',
        'schedule': crontab(hour=0, minute=0),  # Daily at midnight
    },
}
```

## Email Notifications
The command sends email notifications if:
- `DEFAULT_FROM_EMAIL` is configured in settings
- The organization has an admin user with an email

Configure email in `settings.py`:
```python
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'your-email@gmail.com'
EMAIL_HOST_PASSWORD = 'your-app-password'
DEFAULT_FROM_EMAIL = 'your-email@gmail.com'
```

## Testing
To test with an expired subscription:
1. Set an organization's `expiry_date` to yesterday
2. Run: `python manage.py check_subscription_expiry`
3. Verify the `subscription_status` changes to 'expired'
