# POS Machine Deployment Guide

## Machine Specifications
- **RAM:** 8GB
- **Storage:** 128GB SSD
- **CPU:** Intel Core i5-3320M (3rd Gen)
- **OS:** Windows 10 Pro

## Hardware Compatibility Assessment

### ✅ Suitable For
- Development mode operation
- Single-terminal POS usage
- Cloud database (Supabase) connection
- Light to moderate transaction volume

### ⚠️ Limitations
- **RAM:** 8GB is adequate but may be tight when running both backend + frontend simultaneously
- **Storage:** 128GB SSD requires careful space management (node_modules, Python venv, logs)
- **CPU:** Older i5-3320M is sufficient for POS operations but not for heavy concurrent loads

### 💡 Recommendations
- Use Supabase cloud database (not local PostgreSQL) to save storage space
- Regular cleanup of node_modules and Python cache
- Monitor disk space usage
- Consider using `npm ci` instead of `npm install` for cleaner installs
- Disable unnecessary Windows services to free up RAM

---

## Prerequisites Checklist

### Required Software
- [ ] **Git** - Version control
- [ ] **Python 3.11+** - For Django backend
- [ ] **Node.js 18+** - For Next.js frontend
- [ ] **VS Code** (recommended) - Code editor
- [ ] **PowerShell** - Pre-installed on Windows 10

### Optional but Recommended
- [ ] **Windows Terminal** - Better terminal experience
- [ ] **7-Zip** - File compression/extraction

---

## Installation Steps

### 1. Install Git
```powershell
# Download from: https://git-scm.com/download/win
# Or use winget (Windows 10 1709+):
winget install Git.Git
```

### 2. Install Python 3.11+
```powershell
# Download from: https://www.python.org/downloads/
# Or use winget:
winget install Python.Python.3.11
```

**Important:** During installation, check "Add Python to PATH"

### 3. Install Node.js 18+
```powershell
# Download from: https://nodejs.org/
# Or use winget:
winget install OpenJS.NodeJS.LTS
```

### 4. Verify Installations
```powershell
git --version
python --version
node --version
npm --version
```

---

## Project Setup

### 1. Clone Repository
```powershell
# Navigate to desired location (e.g., C:\Projects)
cd C:\Projects

# Clone the repository
git clone <your-repo-url> hardware-ecommerce-monorepo
cd hardware-ecommerce-monorepo
```

### 2. Backend Setup (Django)

```powershell
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\activate

# Upgrade pip
python -m pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt

# Copy environment file
copy .env.example .env

# Edit .env with your Supabase credentials
notepad .env
```

**Required .env variables:**
```env
# Django Settings
DJANGO_SETTINGS_MODULE=hardware_api.settings.prod
DJANGO_SECRET_KEY=your-secret-key
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

# Supabase Configuration (Production - Use Supabase on POS machine)
DATABASE_URL=postgresql://postgres.xachljqxtnhnmbpcnymt:mnXfvRtXM3M3H7uh@aws-1-eu-west-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://xachljqxtnhnmbpcnymt.supabase.co
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres.xachljqxtnhnmbpcnymt
SUPABASE_DB_PASSWORD=mnXfvRtXM3M3H7uh
SUPABASE_DB_HOST=aws-1-eu-west-1.pooler.supabase.com
SUPABASE_DB_PORT=6543
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhY2hsanF4dG5obm1icGNueW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2Mjc1NjIsImV4cCI6MjA4MzIwMzU2Mn0.07igyf9f1zPWNrUb3X0H3iqkI22A4fIlObQ0Feeo7Jw
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhY2hsanF4dG5obm1icGNueW10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzYyNzU2MiwiZXhwIjoyMDgzMjAzNTYyfQ.JEaO-fLIGNzFcWmrmk5io1C0-mnHJasOhwdITv111HA

# JWT Configuration
JWT_SECRET_KEY=1s6tJZd1ilA9-zeKmgJb37xWvPasClxW6JjD4Y-vvFg

# CORS Configuration (includes POS frontend)
DJANGO_CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=nuelklus@gmail.com
EMAIL_HOST_PASSWORD=tmxi xdsv tlsq fsib
DEFAULT_FROM_EMAIL=noreply@hardware-ecommerce.com
ADMIN_EMAIL=nuelklus@gmail.com
```

### 3. Frontend Setup (POS)

```powershell
# Navigate to pos-frontend directory
cd ..\pos-frontend

# Install dependencies
npm install

# Create environment file
notepad .env.local
```

**Required .env.local variables:**
```env
# Backend API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_POS_API_URL=http://localhost:8000/api/pos

# Supabase Configuration (for direct database access if needed)
NEXT_PUBLIC_SUPABASE_URL=https://xachljqxtnhnmbpcnymt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhY2hsanF4dG5obm1icGNueW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2Mjc1NjIsImV4cCI6MjA4MzIwMzU2Mn0.07igyf9f1zPWNrUb3X0H3iqkI22A4fIlObQ0Feeo7Jw

# POS Configuration
NEXT_PUBLIC_DEFAULT_STORE_ID=main
NEXT_PUBLIC_API_TIMEOUT=30000

# WebSocket Configuration (for real-time stock updates)
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws/stock/

# Currency Configuration
NEXT_PUBLIC_DEFAULT_CURRENCY=GHS
NEXT_PUBLIC_DEFAULT_PHONE_COUNTRY_CODE=+233
```

---

## Running the Applications

### Option 1: Manual Start (Development Mode)

#### Backend
```powershell
# In PowerShell
cd C:\Projects\hardware-ecommerce-monorepo\backend
.\venv\Scripts\activate
python manage.py runserver
```

#### Frontend (Separate PowerShell window)
```powershell
# In new PowerShell window
cd C:\Projects\hardware-ecommerce-monorepo\pos-frontend
npm run dev
```

### Option 2: Production Mode (Recommended for POS Machine)

#### Backend (Production)
```powershell
# In PowerShell
cd C:\Projects\hardware-ecommerce-monorepo\backend
.\venv\Scripts\activate
python manage.py runserver 0.0.0.0:8000
```

#### Frontend (Static Export - Faster, Less Memory)
```powershell
# Build the frontend
cd C:\Projects\hardware-ecommerce-monorepo\pos-frontend
npm run build

# Serve the static files (use any static file server)
# Option A: Using Python
cd out
python -m http.server 3000

# Option B: Using Node.js http-server
npx http-server out -p 3000
```

### Option 3: Batch Script for Easy Startup

The project includes `start-pos.bat` in the project root. Simply double-click it to start both backend and frontend.

The script automatically:
- Checks prerequisites (Python, Node.js, Git)
- Creates virtual environment if needed
- Starts Django Backend on port 8000
- Starts POS Frontend on port 3000
- Opens POS Frontend in browser

**Note:** The script starts in development mode. For production deployment, use Option 2 above.

### Option 4: Windows Service (Production Mode)

For production, consider using:
- **NSSM (Non-Sucking Service Manager)** - For running Node.js as service
- **Windows Task Scheduler** - For auto-start on boot
- **PM2** - Node.js process manager (can run on Windows)

---

## Quick Deployment Checklist

### Pre-Deployment
- [ ] Install Git, Python 3.11+, Node.js 18+
- [ ] Clone repository to POS machine
- [ ] Configure backend `.env` with Supabase credentials
- [ ] Configure pos-frontend `.env.local` with API URLs
- [ ] Install backend dependencies: `pip install -r requirements.txt`
- [ ] Install frontend dependencies: `npm install`
- [ ] Run backend migrations: `python manage.py migrate`
- [ ] Create superuser: `python manage.py createsuperuser`

### Deployment
- [ ] Test backend: `python manage.py runserver`
- [ ] Test frontend: `npm run dev`
- [ ] Build frontend for production: `npm run build`
- [ ] Test production build: `cd out && python -m http.server 3000`
- [ ] Configure Windows Task Scheduler for auto-start (optional)

### Post-Deployment
- [ ] Verify POS frontend can access backend API
- [ ] Test product loading and cart functionality
- [ ] Test checkout process
- [ ] Verify stock synchronization works
- [ ] Set up regular backups (Supabase)
- [ ] Configure log rotation

---

## Storage Optimization

### 1. Clean npm Cache
```powershell
npm cache clean --force
```

### 2. Use Production Builds
```powershell
# Instead of dev mode, build for production
cd pos-frontend
npm run build
npm start
```

### 3. Python Cleanup
```powershell
# Clear Python cache
cd backend
find . -type d -name __pycache__ -exec rm -rf {} +
find . -type f -name "*.pyc" -delete
```

### 4. Log Rotation
Configure Django to rotate logs in `settings.py`:
```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/django.log',
            'maxBytes': 1024*1024*10,  # 10MB
            'backupCount': 5,
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}
```

---

## Performance Tuning

### 1. Django Settings
```python
# In settings/base.py
DEBUG = False  # Always False in production

# Database connection pooling
DATABASES['default']['CONN_MAX_AGE'] = 600

# Enable caching
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}
```

### 2. Next.js Production Build
```javascript
// next.config.ts
const nextConfig: NextConfig = {
  // Remove output: 'export' for production server
  images: {
    unoptimized: true,
  },
  compress: true,  // Enable compression
  swcMinify: true,  // Use SWC minification
};
```

### 3. Windows Performance
- Disable Windows Search service
- Disable Superfetch/SysMain
- Set Power Plan to "High Performance"
- Disable unnecessary startup programs

---

## Troubleshooting

### Issue: Out of Memory
**Solution:**
- Close unnecessary applications
- Reduce Django debug logging
- Use production build instead of dev mode

### Issue: Disk Space Full
**Solution:**
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear Python cache
- Delete old log files

### Issue: Backend Won't Start
**Solution:**
- Check if port 8000 is in use: `netstat -ano | findstr :8000`
- Kill process if needed: `taskkill /PID <pid> /F`
- Check .env file for correct credentials
- Verify virtual environment is activated

### Issue: Frontend Won't Start
**Solution:**
- Check if port 3000 is in use: `netstat -ano | findstr :3000`
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`

---

## Security Considerations

1. **Never commit .env files** - Add to .gitignore
2. **Use strong secrets** - Generate random strings for SECRET_KEY and JWT_SECRET
3. **Keep dependencies updated** - Run `pip install --upgrade` and `npm update` regularly
4. **Enable Windows Firewall** - Block unnecessary ports
5. **Use HTTPS in production** - Configure SSL certificates
6. **Regular backups** - Backup Supabase data regularly

---

## Maintenance Tasks

### Weekly
- [ ] Check disk space usage
- [ ] Review error logs
- [ ] Update dependencies (security patches)

### Monthly
- [ ] Clear npm and Python caches
- [ ] Rotate log files
- [ ] Test backup restoration

### Quarterly
- [ ] Review and update security settings
- [ ] Performance audit
- [ ] Update Windows system

---

## Contact & Support

For issues or questions:
- Check project documentation
- Review error logs in `backend/logs/` and browser console
- Verify all environment variables are set correctly
