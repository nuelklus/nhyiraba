#!/bin/bash

# Deployment script for Render
echo "🚀 Deploying Hardware E-commerce to Render..."

# Collect static files
echo "📦 Collecting static files..."
python manage.py collectstatic --noinput

# Run migrations
echo "🗄️ Running database migrations..."
python manage.py migrate --noinput

# Create superuser (if needed)
echo "👤 Creating superuser..."
python manage.py shell << EOF
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(is_superuser=True).exists():
    User.objects.create_superuser(
        username='admin',
        email=os.getenv('ADMIN_EMAIL', 'admin@hardware-ecommerce.com'),
        password='admin123456'
    )
    print('Superuser created: admin/admin123456')
else:
    print('Superuser already exists')
EOF

echo "✅ Deployment complete!"
