# 🚀 GitHub + Render Deployment Guide

## 📋 Prerequisites

### ✅ Required Accounts
- **GitHub Account**: For code repository
- **Render Account**: For hosting services
- **Supabase Account**: For PostgreSQL database

### ✅ Repository Structure
```
hardware-ecommerce-monorepo/
├── backend/          # Django API
├── frontend/         # Next.js frontend
├── .gitignore       # Git ignore file
└── README.md        # Project documentation
```

---

## 🔧 Step 1: GitHub Repository Setup

### 1.1 Initialize Git Repository
```bash
# In your project root directory
git init
git add .
git commit -m "Initial commit: Production-ready hardware e-commerce"
```

### 1.2 Create GitHub Repository
1. Go to [GitHub](https://github.com)
2. Click "New repository"
3. Name: `hardware-ecommerce-monorepo`
4. Description: "Hardware e-commerce platform with Django + Next.js"
5. Make it **Public** (Render free tier requires public repos)
6. Don't initialize with README (we already have files)

### 1.3 Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/hardware-ecommerce-monorepo.git
git branch -M main
git push -u origin main
```

---

## 🌐 Step 2: Render Backend Deployment

### 2.1 Connect Render to GitHub
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub account
4. Select `hardware-ecommerce-monorepo` repository
5. Choose branch: `main`

### 2.2 Backend Service Configuration
```yaml
# Render will auto-detect from backend/render.yaml
Name: hardware-ecommerce-api
Environment: Python
Region: Choose nearest region
Branch: main
Root Directory: backend
Build Command: pip install -r requirements.txt && python manage.py collectstatic --noinput
Start Command: gunicorn hardware_api.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120 --max-requests 1000 --max-requests-jitter 50
Instance Type: Free
```

### 2.3 Backend Environment Variables
Set these in Render Dashboard:

#### 🔐 Required Variables
```bash
DJANGO_SETTINGS_MODULE=hardware_api.settings.prod
DJANGO_DEBUG=False
DJANGO_SECRET_KEY=your-unique-secret-key-here
DJANGO_ALLOWED_HOSTS=.onrender.com
PYTHON_VERSION=3.12.7
```

#### 🗄️ Database Variables (Supabase)
```bash
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

#### 📧 Email Variables (Optional)
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-gmail@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
```

---

## 🎨 Step 3: Render Frontend Deployment

### 3.1 Frontend Service Configuration
1. In Render Dashboard, click "New +" → "Web Service"
2. Select same repository
3. Configure:

```yaml
Name: hardware-frontend
Environment: Node
Region: Same as backend
Branch: main
Root Directory: frontend
Build Command: npm install && npm run build
Start Command: npm start
Instance Type: Free
```

### 3.2 Frontend Environment Variables
```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://hardware-ecommerce-api.onrender.com/api
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supababase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

## 🗄️ Step 4: Supabase Database Setup

### 4.1 Create Supabase Project
1. Go to [Supabase](https://supabase.com)
2. Click "New Project"
3. Organization: Your choice
4. Project Name: `hardware-ecommerce-db`
5. Database Password: Create strong password
6. Region: Choose nearest to your Render region

### 4.2 Get Database Credentials
1. In Supabase Dashboard → Settings → Database
2. Copy **Connection string**
3. Replace `[PASSWORD]` with your database password
4. Use this as `DATABASE_URL` in Render

### 4.3 Run Database Migrations
After backend deployment, run migrations:
```bash
# In Render Dashboard → Backend Service → Shell
python manage.py migrate
python manage.py createsuperuser
```

---

## 🔧 Step 5: Final Configuration

### 5.1 Update CORS Settings
In `backend/hardware_api/settings/prod.py`, update:
```python
CORS_ALLOWED_ORIGINS = [
    'https://hardware-frontend.onrender.com',  # Your frontend URL
    'https://your-custom-domain.com',         # If you have custom domain
]
```

### 5.2 Create Superuser
```bash
# In Render backend shell
python manage.py createsuperuser
# Follow prompts to create admin user
```

### 5.3 Test Deployment
1. **Backend**: Visit `https://hardware-ecommerce-api.onrender.com/api/health/`
2. **Frontend**: Visit `https://hardware-frontend.onrender.com`
3. **Admin**: Visit `https://hardware-ecommerce-api.onrender.com/admin/`

---

## 🚀 Step 6: Custom Domain (Optional)

### 6.1 Point Domain to Render
1. In your DNS provider, create CNAME records:
   ```
   api.yourdomain.com → CNAME → hardware-ecommerce-api.onrender.com
   yourdomain.com → CNAME → hardware-frontend.onrender.com
   ```

### 6.2 Update Render Settings
1. In Render Dashboard → Backend Service → Custom Domains
2. Add `api.yourdomain.com`
3. In Frontend Service → Custom Domains
4. Add `yourdomain.com`

### 6.3 Update Django Settings
```python
ALLOWED_HOSTS = [
    'api.yourdomain.com',
    'yourdomain.com',
    '.onrender.com',
]
```

---

## 📊 Step 7: Monitoring & Maintenance

### 7.1 Render Monitoring
- **Logs**: Check in Render Dashboard
- **Metrics**: Free tier includes basic metrics
- **Health Checks**: Automatic health monitoring

### 7.2 Database Backups
- **Supabase**: Automatic daily backups
- **Manual Backup**: Export data regularly

### 7.3 Performance Optimization
- **Backend**: Render auto-scales with paid plans
- **Frontend**: Next.js optimization enabled
- **Database**: Supabase handles scaling

---

## 🎯 Deployment Checklist

### ✅ Pre-Deployment
- [ ] Code pushed to GitHub
- [ ] Environment variables prepared
- [ ] Supabase project created
- [ ] Custom domain configured (if using)

### ✅ Backend Deployment
- [ ] Render service created
- [ ] Database URL configured
- [ ] Migrations run
- [ ] Superuser created
- [ ] Health check passing

### ✅ Frontend Deployment
- [ ] Render service created
- [ ] API URL configured
- [ ] Supabase keys set
- [ ] Build successful
- [ ] Site accessible

### ✅ Post-Deployment
- [ ] Test user registration
- [ ] Test product creation
- [ ] Test checkout process
- [ ] Test admin functionality
- [ ] Monitor logs for errors

---

## 🚨 Common Issues & Solutions

### Issue 1: Database Connection Error
**Solution**: Verify `DATABASE_URL` format and Supabase credentials

### Issue 2: CORS Errors
**Solution**: Update `CORS_ALLOWED_ORIGINS` with correct frontend URL

### Issue 3: Static Files Not Loading
**Solution**: Ensure `collectstatic` runs during build

### Issue 4: 502 Bad Gateway
**Solution**: Check backend logs, ensure gunicorn is running

### Issue 5: Frontend Build Fails
**Solution**: Check `package.json` and Node version compatibility

---

## 🎉 Success!

Your hardware e-commerce platform is now live on Render! 🚀

**URLs:**
- Frontend: `https://hardware-frontend.onrender.com`
- Backend API: `https://hardware-ecommerce-api.onrender.com/api`
- Admin Panel: `https://hardware-ecommerce-api.onrender.com/admin`

**Next Steps:**
1. Add products via admin panel
2. Test user registration and checkout
3. Configure email notifications
4. Set up custom domain
5. Monitor performance and logs
