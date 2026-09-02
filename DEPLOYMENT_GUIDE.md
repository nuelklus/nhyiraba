# 🚀 DRF to Render Deployment Guide

## 📋 Pre-Deployment Checklist

### ✅ Project Status
- **WhiteNoise**: ✅ Configured and tested
- **Static files**: ✅ Collected and serving
- **Production settings**: ✅ Optimized for 512MB RAM
- **Environment variables**: ✅ Ready for configuration
- **render.yaml**: ✅ Created and configured
- **Git repository**: ✅ Initialized and committed

---

## 🎯 Step 1: Create GitHub Repository

### 1.1 Create Repository on GitHub
1. Go to [GitHub](https://github.com)
2. Click "New repository"
3. **Repository name**: `hardware-ecommerce-monorepo`
4. **Description**: `Hardware E-commerce Django DRF + Next.js`
5. **Visibility**: Private (recommended)
6. **Don't initialize** with README, .gitignore, or license (we already have them)
7. Click "Create repository"

### 1.2 Push to GitHub
```bash
# Add remote repository (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/hardware-ecommerce-monorepo.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## 🎯 Step 2: Deploy to Render

### 2.1 Create Render Account
1. Go to [Render](https://render.com)
2. Sign up with GitHub (recommended)
3. Authorize Render to access your repositories

### 2.2 Create Web Service
1. Click "New +" → "Web Service"
2. **Connect Repository**: Select `hardware-ecommerce-monorepo`
3. **Configure Service**:
   - **Name**: `hardware-ecommerce-api`
   - **Region**: Choose nearest (e.g., Oregon)
   - **Branch**: `main`
   - **Root Directory**: `backend` (important!)
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn hardware_api.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120`

### 2.3 Advanced Settings
1. **Auto-Deploy**: ✅ Enabled
2. **Health Check Path**: `/api/health/`
3. **Health Check Timeout**: `30` seconds

---

## 🎯 Step 3: Configure Environment Variables

### 3.1 Go to Environment Variables
1. In Render Dashboard → Your Service → "Environment" tab
2. Add these environment variables:

### 3.2 Required Environment Variables

```bash
# Django Configuration
DJANGO_SETTINGS_MODULE=hardware_api.settings.prod
DJANGO_SECRET_KEY=your-very-secret-key-here-change-this
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=your-app-name.onrender.com

# Database (Supabase)
DATABASE_URL=postgresql://postgres.xachljqxtnhnmbpcnymt:mnXfvRtXM3M3H7uh@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
SUPABASE_DB_NAME=hardware_ecommerce
SUPABASE_DB_USER=postgres.xachljqxtnhnmbpcnymt
SUPABASE_DB_PASSWORD=mnXfvRtXM3M3H7uh
SUPABASE_DB_HOST=aws-1-eu-west-1.pooler.supabase.com
SUPABASE_DB_PORT=5432

# Email Configuration (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=nuelklus@gmail.com
EMAIL_HOST_PASSWORD=tmxi xdsv tlsq fsib
DEFAULT_FROM_EMAIL=noreply@hardware-ecommerce.com
ADMIN_EMAIL=nuelklus@gmail.com

# CORS Configuration
DJANGO_CORS_ALLOWED_ORIGINS=https://your-frontend-domain.onrender.com

# JWT Configuration
JWT_SECRET_KEY=your-jwt-secret-key-here

# Render-specific
RENDER_EXTERNAL_HOSTNAME=your-app-name.onrender.com
```

### 3.3 Important Notes
- **DJANGO_SECRET_KEY**: Generate a new one: `python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'`
- **DATABASE_URL**: Use your actual Supabase connection string
- **EMAIL_HOST_PASSWORD**: Use your Gmail App Password
- **CORS_ALLOWED_ORIGINS**: Update with your frontend URL

---

## 🎯 Step 4: Deploy and Test

### 4.1 Initial Deployment
1. Click "Create Web Service"
2. Wait for build to complete (2-5 minutes)
3. Check deployment logs

### 4.2 Test Deployment
1. **Health Check**: `https://your-app-name.onrender.com/api/health/`
   - Expected: `{"status": "healthy", "database": "healthy", "cache": "healthy"}`
2. **Admin Panel**: `https://your-app-name.onrender.com/admin/`
3. **API Endpoints**: `https://your-app-name.onrender.com/api/products/`

### 4.3 Run Migrations
If needed, add to build command:
```bash
pip install -r requirements.txt && python manage.py migrate --noinput && python manage.py collectstatic --noinput
```

---

## 🎯 Step 5: Post-Deployment Setup

### 5.1 Create Superuser
1. Access: `https://your-app-name.onrender.com/admin/`
2. Click "Create superuser" or run:
```bash
# In Render shell (if available)
python manage.py createsuperuser
```

### 5.2 Test Order System
1. **Create test order** via API or frontend
2. **Check email notifications** (customer + admin)
3. **Verify database storage**

---

## 🎯 Step 6: Frontend Deployment (Optional)

### 6.1 Update Frontend API URL
```typescript
// frontend/lib/api.ts
const API_BASE_URL = 'https://your-app-name.onrender.com/api';
```

### 6.2 Deploy Frontend to Render
1. Create new Web Service
2. **Root Directory**: `frontend`
3. **Build Command**: `npm run build`
4. **Start Command**: `npm start`

---

## 🔧 Troubleshooting

### Common Issues

#### 1. "ModuleNotFoundError: No module named 'whitenoise'"
- **Solution**: Ensure `whitenoise==6.7.0` is in requirements.txt

#### 2. Static files 404 errors
- **Solution**: Run `python manage.py collectstatic --noinput`

#### 3. Database connection errors
- **Solution**: Check DATABASE_URL format and SSL settings

#### 4. CORS errors
- **Solution**: Update CORS_ALLOWED_ORIGINS with frontend URL

#### 5. Email not sending
- **Solution**: Verify Gmail App Password and SMTP settings

### Debug Commands
```bash
# Check Django setup
python manage.py check --settings=hardware_api.settings.prod

# Test database connection
python manage.py dbshell --settings=hardware_api.settings.prod

# Test email
python manage.py test_email --settings=hardware_api.settings.prod
```

---

## 📊 Performance Optimization

### Memory Usage (512MB Limit)
- **Gunicorn workers**: 2 (optimized)
- **Cache backend**: LocMem (memory efficient)
- **Middleware**: Stripped (minimal)
- **Static files**: WhiteNoise (compressed)

### Expected Performance
- **Response time**: 200-500ms
- **Memory usage**: ~300-400MB
- **Static file serving**: <100ms

---

## 🎯 Production URLs

### After Deployment
- **API**: `https://your-app-name.onrender.com/api/`
- **Admin**: `https://your-app-name.onrender.com/admin/`
- **Health**: `https://your-app-name.onrender.com/api/health/`
- **Products**: `https://your-app-name.onrender.com/api/products/`

### Environment Variables Reference
Copy from `backend/env.example` for reference.

---

## 🎉 Deployment Complete!

Your DRF project is now running on Render with:
- ✅ **Production optimizations**
- ✅ **WhiteNoise static files**
- ✅ **Email notifications**
- ✅ **Memory efficiency**
- ✅ **Security headers**

**Ready for production use!** 🚀
