# Hardware E-commerce - Render Deployment Guide

## 🚀 Deploy to Render Free Tier

### Prerequisites
- Render account (free tier)
- Supabase database
- Gmail account with App Password
- GitHub repository with your code

### Step 1: Prepare Your Code
1. Push all changes to GitHub
2. Ensure `render.yaml` is in the root directory
3. Verify `requirements.txt` is optimized
4. Check `.env.example` for required variables

### Step 2: Create Render Web Service
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: hardware-ecommerce-api
   - **Region**: Choose nearest region
   - **Branch**: main
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn hardware_api.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120`

### Step 3: Set Environment Variables
In Render Dashboard → Environment Variables, add:

```bash
# Database
DATABASE_URL=your-supabase-connection-string
DJANGO_SETTINGS_MODULE=hardware_api.settings.prod
DJANGO_SECRET_KEY=your-secret-key-here
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=your-app-name.onrender.com

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-gmail@gmail.com
EMAIL_HOST_PASSWORD=your-16-character-app-password
DEFAULT_FROM_EMAIL=noreply@hardware-ecommerce.com
ADMIN_EMAIL=admin@hardware-ecommerce.com

# CORS
DJANGO_CORS_ALLOWED_ORIGINS=https://your-frontend-domain.onrender.com

# JWT
JWT_SECRET_KEY=your-jwt-secret-key
```

### Step 4: Deploy
1. Click "Create Web Service"
2. Wait for build to complete
3. Check deployment logs
4. Test health endpoint: `https://your-app.onrender.com/api/health/`

### Step 5: Post-Deployment
1. Run migrations: Add to build command:
   ```bash
   pip install -r requirements.txt && python manage.py migrate --noinput && python manage.py collectstatic --noinput
   ```

2. Create superuser: Access Django admin at `/admin/`

3. Test API endpoints:
   - Health: `/api/health/`
   - Products: `/api/products/`
   - Orders: `/api/orders/create/`

## 📊 Performance Optimizations

### For 512MB RAM Limit:
- **2 Gunicorn workers** (instead of auto)
- **LocMem cache** (instead of Redis)
- **Connection pooling** (CONN_MAX_AGE=600)
- **Minimal middleware** (removed gzip)
- **Reduced log verbosity**
- **Static files via WhiteNoise**

### Memory Usage:
- Base Django: ~100MB
- DRF + apps: ~200MB
- Gunicorn workers: ~200MB (2x100MB)
- **Total: ~500MB** ✅

## 🔧 Troubleshooting

### Common Issues:
1. **Memory errors**: Reduce workers to 1
2. **Database connection**: Check DATABASE_URL
3. **Static files**: Run `collectstatic`
4. **CORS errors**: Update CORS_ALLOWED_ORIGINS
5. **Email failures**: Verify Gmail App Password

### Health Check:
```bash
curl https://your-app.onrender.com/api/health/
```

Expected response:
```json
{
  "status": "healthy",
  "database": "healthy",
  "cache": "healthy",
  "version": "1.0.0"
}
```

## 📱 Monitoring

### Render Dashboard:
- Metrics tab for performance
- Logs tab for errors
- Events tab for deployments

### Django Admin:
- Access: `/admin/`
- Monitor orders and users

## 🔄 Continuous Deployment

Auto-deployment is enabled in `render.yaml`. Push to main branch triggers:
1. Build process
2. Migration run
3. Static file collection
4. Server restart

## 🛡️ Security

- HTTPS enforced
- Security headers enabled
- CSRF protection active
- Environment variables protected
- Database connection secured

## 📧 Email Configuration

For production emails:
1. Enable 2-factor authentication in Gmail
2. Generate App Password
3. Set EMAIL_HOST_PASSWORD in Render
4. Test with order creation

## 🎯 Next Steps

1. Deploy frontend separately
2. Configure custom domain
3. Set up monitoring
4. Add error tracking (Sentry)
5. Implement backup strategy
