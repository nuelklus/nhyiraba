# 🔐 Environment Variables for Render Deployment

## 📋 Required Environment Variables

### Backend (Django API)

#### 🔐 Core Settings
```bash
# Django Configuration
DJANGO_SETTINGS_MODULE=hardware_api.settings.prod
DJANGO_DEBUG=False
DJANGO_SECRET_KEY=your-unique-secret-key-here-min-50-chars
DJANGO_ALLOWED_HOSTS=.onrender.com
PYTHON_VERSION=3.12.7
PORT=10000
```

#### 🗄️ Database (Supabase)
```bash
# Get from Supabase Dashboard → Settings → Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

#### 📧 Email (Optional - for order notifications)
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-gmail@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
```

#### 🛡️ Security
```bash
# JWT Configuration
JWT_SECRET_KEY=your-jwt-secret-key-here
CORS_ALLOWED_ORIGINS=https://hardware-frontend.onrender.com
FRONTEND_URL=https://hardware-frontend.onrender.com
```

---

### Frontend (Next.js)

#### 🌐 API Configuration
```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://hardware-ecommerce-api.onrender.com/api
```

#### 🗄️ Supabase (Client-side)
```bash
# Get from Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

## 🔧 How to Set Environment Variables on Render

### Method 1: Render Dashboard (Recommended)
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your service (Backend or Frontend)
3. Click "Environment" tab
4. Add each variable as "Key-Value" pair
5. Click "Save Changes"
6. Redeploy the service

### Method 2: render.yaml (For initial setup)
Variables are already defined in `render.yaml` files, but sensitive values should be overridden in the dashboard.

---

## 📊 Environment Variable Templates

### Backend Template
```bash
# Copy and replace values below
DJANGO_SETTINGS_MODULE=hardware_api.settings.prod
DJANGO_DEBUG=False
DJANGO_SECRET_KEY=django-insecure-your-very-long-secret-key-here-min-50-characters
DJANGO_ALLOWED_HOSTS=.onrender.com
PYTHON_VERSION=3.12.7
PORT=10000

# Database (get from Supabase)
DATABASE_URL=postgresql://postgres:your-password@db.abcdefghijk.supabase.co:5432/postgres

# Email (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com

# JWT
JWT_SECRET_KEY=jwt-secret-key-here-min-32-characters
CORS_ALLOWED_ORIGINS=https://hardware-frontend.onrender.com
FRONTEND_URL=https://hardware-frontend.onrender.com
```

### Frontend Template
```bash
# Copy and replace values below
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://hardware-ecommerce-api.onrender.com/api
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
```

---

## 🚨 Security Notes

### 🔐 Secret Keys
- **DJANGO_SECRET_KEY**: Generate unique key for production
- **JWT_SECRET_KEY**: Generate separate key for JWT tokens
- Never commit secrets to Git repository
- Use Render's encrypted environment variables

### 📧 Email Setup
- Use Gmail App Password (not regular password)
- Enable 2-factor authentication on Gmail
- Create App Password in Google Account settings

### 🗄️ Database Security
- Use strong Supabase database password
- Enable SSL (automatically done by Supabase)
- Don't share database credentials

---

## 🧪 Testing Environment Variables

### Backend Health Check
```bash
# After deployment, test:
curl https://hardware-ecommerce-api.onrender.com/api/health/
```

### Frontend API Connection
```bash
# Test API from frontend:
curl https://hardware-ecommerce-api.onrender.com/api/products/
```

### Database Connection
```bash
# In Render Dashboard → Backend Service → Shell:
python manage.py dbshell
# Should connect to Supabase successfully
```

---

## 🔄 Common Issues & Solutions

### Issue: Database Connection Failed
**Solution**: Verify `DATABASE_URL` format and Supabase credentials

### Issue: CORS Errors
**Solution**: Update `CORS_ALLOWED_ORIGINS` with correct frontend URL

### Issue: JWT Token Errors
**Solution**: Ensure `JWT_SECRET_KEY` is set and matches frontend expectations

### Issue: Static Files Not Loading
**Solution**: Check `STATIC_ROOT` and `WHITENOISE_ROOT` settings

---

## 📝 Quick Setup Checklist

### ✅ Backend Variables
- [ ] DJANGO_SETTINGS_MODULE
- [ ] DJANGO_DEBUG=False
- [ ] DJANGO_SECRET_KEY
- [ ] DJANGO_ALLOWED_HOSTS
- [ ] DATABASE_URL
- [ ] JWT_SECRET_KEY
- [ ] CORS_ALLOWED_ORIGINS

### ✅ Frontend Variables
- [ ] NODE_ENV=production
- [ ] NEXT_PUBLIC_API_URL
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY

### ✅ Optional Variables
- [ ] Email configuration
- [ ] Custom domain settings
- [ ] Monitoring/Analytics keys

---

## 🎯 Production Values Example

### Backend (Render Dashboard)
```
Key: DJANGO_SECRET_KEY
Value: django-insecure-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz

Key: DATABASE_URL  
Value: postgresql://postgres:SuperSecretPass123!@db.abcdefghijk.supabase.co:5432/postgres

Key: JWT_SECRET_KEY
Value: jwt-secret-key-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

### Frontend (Render Dashboard)
```
Key: NEXT_PUBLIC_API_URL
Value: https://hardware-ecommerce-api.onrender.com/api

Key: NEXT_PUBLIC_SUPABASE_URL
Value: https://abcdefghijk.supabase.co

Key: NEXT_PUBLIC_SUPABASE_ANON_KEY  
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Replace all example values with your actual production credentials!**
