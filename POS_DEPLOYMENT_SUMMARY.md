# POS Machine Deployment - Quick Start Guide

## Overview
This guide provides a streamlined, stress-free deployment process for the Hardware E-commerce POS system on your POS machine (Windows 10 Pro, 8GB RAM, 128GB SSD).

## Pre-Deployment Checklist

### 1. Software Installation
- [ ] Git - https://git-scm.com/download/win
- [ ] Python 3.11+ - https://www.python.org/downloads/ (check "Add to PATH")
- [ ] Node.js 18+ - https://nodejs.org/

### 2. Verify Installations
```powershell
git --version
python --version
node --version
npm --version
```

## Deployment Steps

### Step 1: Clone Repository
```powershell
cd C:\Projects
git clone <your-repo-url> hardware-ecommerce-monorepo
cd hardware-ecommerce-monorepo
```

### Step 2: Backend Setup
```powershell
cd backend

# Create virtual environment
python -m venv venv
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (copy from backend/.env.example or use your existing .env)
# IMPORTANT: Use Supabase credentials (not local PostgreSQL) for POS machine
copy .env.example .env
notepad .env
```

**Required .env variables for POS machine:**
```env
DJANGO_SETTINGS_MODULE=hardware_api.settings.prod
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

# Supabase Configuration (Use these exact values)
DATABASE_URL=postgresql://postgres.xachljqxtnhnmbpcnymt:mnXfvRtXM3M3H7uh@aws-1-eu-west-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://xachljqxtnhnmbpcnymt.supabase.co
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres.xachljqxtnhnmbpcnymt
SUPABASE_DB_PASSWORD=mnXfvRtXM3M3H7uh
SUPABASE_DB_HOST=aws-1-eu-west-1.pooler.supabase.com
SUPABASE_DB_PORT=6543
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhY2hsanF4dG5obm1icGNueW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2Mjc1NjIsImV4cCI6MjA4MzIwMzU2Mn0.07igyf9f1zPWNrUb3X0H3iqkI22A4fIlObQ0Feeo7Jw
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhY2hsanF4dG5obm1icGNueW10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzYyNzU2MiwiZXhwIjoyMDgzMjAzNTYyfQ.JEaO-fLIGNzFcWmrmk5io1C0-mnHJasOhwdITv111HA

JWT_SECRET_KEY=1s6tJZd1ilA9-zeKmgJb37xWvPasClxW6JjD4Y-vvFg
DJANGO_CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=nuelklus@gmail.com
EMAIL_HOST_PASSWORD=tmxi xdsv tlsq fsib
DEFAULT_FROM_EMAIL=noreply@hardware-ecommerce.com
ADMIN_EMAIL=nuelklus@gmail.com
```

### Step 3: Run Migrations
```powershell
python manage.py migrate
python manage.py createsuperuser
```

### Step 4: Frontend Setup
```powershell
cd ..\pos-frontend

# Install dependencies
npm install

# Create .env.local file
copy env.example .env.local
notepad .env.local
```

**Required .env.local variables:**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_POS_API_URL=http://localhost:8000/api/pos
NEXT_PUBLIC_SUPABASE_URL=https://xachljqxtnhnmbpcnymt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhY2hsanF4dG5obm1icGNueW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2Mjc1NjIsImV4cCI6MjA4MzIwMzU2Mn0.07igyf9f1zPWNrUb3X0H3iqkI22A4fIlObQ0Feeo7Jw
NEXT_PUBLIC_DEFAULT_STORE_ID=main
NEXT_PUBLIC_API_TIMEOUT=30000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws/stock/
NEXT_PUBLIC_DEFAULT_CURRENCY=GHS
NEXT_PUBLIC_DEFAULT_PHONE_COUNTRY_CODE=+233
```

### Step 5: Test Development Mode
```powershell
# Return to project root
cd ..

# Double-click start-pos.bat
# OR run manually in two terminals:
# Terminal 1: cd backend && .\venv\Scripts\activate && python manage.py runserver
# Terminal 2: cd pos-frontend && npm run dev
```

### Step 6: Build for Production (Recommended)
```powershell
# Double-click start-pos-production.bat
# This will:
# 1. Start backend in production mode
# 2. Build frontend as static files
# 3. Provide instructions to start frontend server

# After build completes, start frontend server:
# Double-click start-pos-frontend.bat
```

## Starting the System

### Option 1: Development Mode (Easier for testing)
```powershell
# Double-click start-pos.bat
# This starts both backend (dev mode) and frontend (dev mode)
```

### Option 2: Production Mode (Recommended for POS machine)
```powershell
# Step 1: Start backend
cd backend
.\venv\Scripts\activate
python manage.py runserver 0.0.0.0:8000

# Step 2: Build frontend (in new terminal)
cd pos-frontend
npm run build

# Step 3: Start frontend server (in new terminal)
cd out
python -m http.server 3000

# OR use the provided scripts:
# start-pos-production.bat (builds frontend)
# start-pos-frontend.bat (serves static files)
```

## Access Points
- **Backend API:** http://localhost:8000
- **POS Frontend:** http://localhost:3000
- **Admin Panel:** http://localhost:8000/admin

## Auto-Start Configuration (Optional)

### Using Windows Task Scheduler
1. Open Task Scheduler
2. Create Basic Task
3. Set trigger: "At startup" or "At log on"
4. Action: Start a program
5. Program: `C:\Projects\hardware-ecommerce-monorepo\start-pos-production.bat`
6. Finish

## Troubleshooting

### Backend won't start
- Check if port 8000 is in use: `netstat -ano | findstr :8000`
- Kill process: `taskkill /PID <pid> /F`
- Verify .env file has correct Supabase credentials
- Check virtual environment is activated

### Frontend won't start
- Check if port 3000 is in use: `netstat -ano | findstr :3000`
- Clear Next.js cache: `cd pos-frontend && rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`

### Database connection errors
- Verify Supabase credentials in .env
- Check internet connection (Supabase is cloud-based)
- Verify DATABASE_URL format is correct

## Maintenance

### Weekly
- Check disk space usage
- Review error logs
- Test backup restoration

### Monthly
- Clear npm cache: `npm cache clean --force`
- Clear Python cache: delete __pycache__ folders
- Update dependencies

## Important Notes

1. **Use Supabase for database** - Don't use local PostgreSQL on POS machine to save resources
2. **Production mode is recommended** - Static build uses less memory and is faster
3. **Keep .env files secure** - Never commit them to git
4. **Regular backups** - Supabase has built-in backups, verify they work
5. **Monitor disk space** - 128GB SSD requires careful management

## Support

For detailed information, see:
- `POS_MACHINE_DEPLOYMENT_GUIDE.md` - Comprehensive deployment guide
- `DEVELOPMENT_GUIDE.md` - Development and configuration details
- `DEPLOYMENT_ENVIRONMENT_VARIABLES.md` - Environment variable reference

## Quick Reference

| Script | Purpose |
|--------|---------|
| `start-pos.bat` | Start in development mode (both backend and frontend) |
| `start-pos-production.bat` | Build frontend for production |
| `start-pos-frontend.bat` | Serve frontend static files |

| Command | Purpose |
|---------|---------|
| `python manage.py migrate` | Run database migrations |
| `python manage.py createsuperuser` | Create admin user |
| `npm run build` | Build frontend for production |
| `npm run dev` | Start frontend in development mode |
