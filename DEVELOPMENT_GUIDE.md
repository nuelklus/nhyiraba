# 🚀 Hardware E-commerce - Development Guide

## 📋 Project Overview

**Project**: Hardware Materials E-commerce Platform  
**Architecture**: Monorepo with Django REST Framework + Next.js  
**Current Status**: **PRODUCTION DEPLOYMENT READY**  
**Last Updated**: April 28, 2026 (Updated with Inventory Management)  
**Deployment Target**: Render + GitHub + Supabase  

---

## 🏭 Inventory Management System (NEW)

### **🎯 Overview**
Complete inventory management system with automatic stock tracking, validation, and restoration. Prevents overselling and ensures accurate inventory levels across all operations.

### **🔧 Key Features**
- **Automatic Stock Reduction**: When orders are placed, inventory is automatically decremented
- **Stock Validation**: Prevents orders with insufficient inventory (overselling protection)
- **Inventory Restoration**: When orders are cancelled, stock is automatically restored
- **Transaction Safety**: Database transactions ensure data consistency
- **Admin Controls**: Only admin users can cancel orders with inventory restoration
- **Low Stock Alerts**: Automatic alerts when products fall below threshold

### **📊 Implementation Details**
- **Service Layer**: `apps/orders/services.py` with `OrderService` and `InventoryService`
- **Database Transactions**: Uses `@transaction.atomic` for safety
- **Stock Tracking**: Only affects products with `track_stock = True`
- **Error Handling**: Comprehensive validation with user-friendly error messages

### **🧪 Testing Verified**
- ✅ Order creation reduces stock (20 → 17 for 3 units ordered)
- ✅ Insufficient stock validation prevents overselling
- ✅ Order cancellation restores stock (17 → 20 for 3 units cancelled)
- ✅ Transaction rollback on errors
- ✅ Admin permissions for order cancellation  

---

## 🏗️ Tech Stack

### Backend (Django + DRF)
- **Framework**: Django 6.0.1 with Django REST Framework 3.15.2
- **Authentication**: djangorestframework-simplejwt 5.3.1
- **Database**: PostgreSQL via Supabase (psycopg2-binary 2.9.9)
- **Production Server**: Gunicorn 22.0.0
- **Static Files**: WhiteNoise 6.7.0
- **Email**: Resend API 0.8.0
- **Environment**: python-dotenv 1.0.1
- **CORS**: django-cors-headers 4.4.0
- **Filtering**: django-filter 23.5

### Frontend (Next.js + TypeScript)
- **Framework**: Next.js 14.2.35 (App Router)
- **Language**: TypeScript 5.5.4
- **UI Library**: React 18.3.1
- **Styling**: Tailwind CSS 3.4.14
- **Components**: Radix UI components (@radix-ui/*)
- **Forms**: React Hook Form 7.70.0 with Zod validation
- **HTTP Client**: Axios 1.13.2
- **Icons**: Lucide React 0.300.0
- **Authentication**: js-cookie 3.0.5
- **Database Client**: @supabase/supabase-js 2.90.1

---

## 📁 Project Structure (Cleaned & Optimized)

### Backend Architecture
```
backend/
├── hardware_api/          # Django project configuration
│   ├── settings/          # Environment-specific settings
│   │   ├── base.py       # Base configuration
│   │   ├── dev.py        # Development settings
│   │   └── prod.py       # Production settings (Render-optimized)
│   ├── urls.py           # Main URL routing
│   └── wsgi.py          # WSGI configuration
├── apps/                 # Django applications
│   ├── accounts/         # User management & authentication
│   ├── products/         # Product catalog management
│   ├── orders/           # Order processing & management
│   │   ├── services.py   # Inventory management service layer
│   ├── admin/            # Admin interface
│   └── core/            # Core utilities & health checks
├── render.yaml           # Render deployment configuration
├── requirements.txt      # Python dependencies
└── manage.py            # Django management
```

### Frontend Architecture
```
frontend/
├── app/                 # Next.js App Router pages
│   ├── (auth)/         # Authentication pages
│   ├── admin/          # Admin dashboard pages
│   ├── cart/           # Shopping cart
│   ├── checkout/       # Checkout process
│   ├── orders/         # Order management
│   └── products/       # Product catalog
├── components/         # Reusable React components (Cleaned)
│   ├── auth/          # Authentication components
│   ├── cart/          # Cart components
│   ├── admin/         # Admin components
│   ├── products/      # Product components
│   └── ui/            # Base UI components (shadcn/ui)
├── contexts/          # React contexts
│   ├── AuthContext.tsx # Authentication state
│   └── CartContext.tsx # Shopping cart state
├── lib/               # Utility libraries
│   ├── api.ts         # Main API client
│   ├── auth.ts        # Authentication utilities
│   └── utils.ts       # General utilities
├── render.yaml        # Render deployment configuration
└── package.json       # Dependencies
```

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.12.7** or higher
- **Node.js 18** or higher
- **Supabase Account** (for PostgreSQL database)
- **Render Account** (for deployment)

### Local Development Setup

#### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Database migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

#### 2. Frontend Setup
```bash
cd frontend
npm install

# Environment variables
cp env-template.txt .env.local
# Edit .env.local with your API URLs

# Start development server
npm run dev

# Production build
npm run build
npm start
```

---

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```bash
# Django Configuration
DJANGO_SETTINGS_MODULE=hardware_api.settings.dev
DJANGO_SECRET_KEY=your-secret-key-here
DJANGO_DEBUG=True

# Database Configuration
# For Development (Local PostgreSQL)
LOCAL_DB_NAME=hardware_ecommerce
LOCAL_DB_USER=postgres
LOCAL_DB_PASSWORD=your_local_postgres_password
LOCAL_DB_HOST=localhost
LOCAL_DB_PORT=5432

# For Production (Supabase)
DATABASE_URL=postgresql://postgres:your_password@db.your-project-ref.supabase.co:5432/postgres
SUPABASE_DB_NAME=hardware_ecommerce
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=your_supabase_password
SUPABASE_DB_HOST=db.your-project.supabase.co
SUPABASE_DB_PORT=5432

# Email (Resend)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-gmail@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# JWT
JWT_SECRET_KEY=your-jwt-secret-key
```

#### Database Configuration

**Development (Local PostgreSQL):**
- Set `DJANGO_SETTINGS_MODULE=hardware_api.settings.dev`
- Configure `LOCAL_DB_*` variables in `.env`
- Uses your local PostgreSQL installation
- No SSL required for local connections

**Production (Supabase):**
- Set `DJANGO_SETTINGS_MODULE=hardware_api.settings.prod`
- Configure `DATABASE_URL` in `.env` or Render environment variables
- Uses Supabase PostgreSQL
- SSL required (automatically configured)

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

## 📊 Features Status

### ✅ Completed Features

#### Authentication System
- **User Registration** with email verification
- **Login/Logout** with JWT tokens
- **Automatic Token Refresh** with comprehensive debugging
- **Role-Based Access** (Customer, Pro-Contractor, Admin)
- **Protected Routes** with authentication guards

#### Inventory Management System
- **Automatic Stock Reduction** when orders are placed
- **Stock Validation** prevents overselling with insufficient inventory
- **Inventory Restoration** when orders are cancelled
- **Low Stock Alerts** when products fall below threshold
- **Transaction Safety** with database rollbacks
- **Admin Order Cancellation** with automatic inventory restoration

#### Product Management
- **Product Catalog** with categories and brands
- **Product Search** and filtering
- **Product Detail Pages** with image galleries
- **Product Upload** with image handling
- **Inventory Management** with stock alerts
- **Featured Products** on homepage

#### Shopping Cart
- **Add to Cart** functionality
- **Cart Context** for state management
- **Quantity Updates** and item removal
- **Cart Dropdown** component
- **Cart Persistence** across sessions

#### Order Management
- **Checkout Process** with multi-step flow
- **Order Creation** with UUID tracking
- **Order Status Tracking** (pending → processing → shipped → delivered)
- **Order History** for customers
- **Admin Order Management** interface

#### Admin Dashboard
- **Inventory Management** with transactions
- **Stock Alerts** and notifications
- **Product Approval** workflow
- **Order Processing** dashboard
- **User Management** system

#### Payment System
- **Cash on Delivery (COD)** implementation
- **Manual Escrow Process** with release codes
- **Order Status Updates** with email notifications
- **Payment Method Tracking** (backend ready for future integration)

### 🔄 Features in Progress

#### Pro-Contractor System
- **Bulk Pricing** backend implementation
- **Job Site Management** (components removed for now)
- **Special Order System** (backend ready, frontend simplified)

#### Advanced Features
- **Product Reviews** (backend ready, frontend pending)
- **Wishlist** functionality
- **Advanced Search** with filters
- **Email Templates** design

---

## 🌐 API Documentation

### Authentication Endpoints
```
POST /api/accounts/register/     # User registration
POST /api/accounts/login/        # User login
POST /api/accounts/refresh/      # Token refresh
POST /api/accounts/logout/       # User logout
GET  /api/accounts/profile/      # User profile
```

### Product Endpoints
```
GET    /api/products/            # Product listing
GET    /api/products/{id}/       # Product detail
GET    /api/products/categories/ # Categories
GET    /api/products/brands/     # Brands
POST   /api/products/            # Create product (admin)
PUT    /api/products/{id}/       # Update product (admin)
DELETE /api/products/{id}/       # Delete product (admin)
```

### Order Endpoints
```
GET    /api/orders/              # User orders
POST   /api/orders/              # Create order (with inventory reduction)
GET    /api/orders/{id}/         # Order detail
PUT    /api/orders/{id}/         # Update order status
POST   /api/orders/{id}/cancel/  # Cancel order (admin only, restores inventory)
```

### Cart Endpoints
```
GET    /api/cart/                # Get cart
POST   /api/cart/                # Add to cart
PUT    /api/cart/{id}/           # Update cart item
DELETE /api/cart/{id}/           # Remove from cart
```

---

## 🚀 Deployment

### Production Deployment (Render + GitHub)

#### 1. GitHub Repository
```bash
git init
git add .
git commit -m "Production-ready hardware e-commerce"
git remote add origin https://github.com/YOUR_USERNAME/hardware-ecommerce-monorepo.git
git push -u origin main
```

#### 2. Render Backend
1. Connect GitHub repository to Render
2. Create Web Service from `backend/render.yaml`
3. Set environment variables in Render dashboard
4. Deploy automatically

#### 3. Render Frontend
1. Create Web Service from `frontend/render.yaml`
2. Set environment variables
3. Deploy automatically

#### 4. Database Setup
1. Create Supabase project
2. Get `DATABASE_URL`
3. Run migrations in Render shell

### Production Environment Variables

#### Backend (Render)
```bash
DJANGO_SETTINGS_MODULE=hardware_api.settings.prod
DJANGO_DEBUG=False
DJANGO_SECRET_KEY=your-production-secret
DATABASE_URL=postgresql://postgres:pass@db.project.supabase.co:5432/postgres
JWT_SECRET_KEY=your-jwt-secret
```

#### Frontend (Render)
```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://hardware-ecommerce-api.onrender.com/api
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 🛠️ Development Workflow

### Code Quality
- **TypeScript** with strict mode
- **ESLint** for code linting
- **Prettier** for code formatting
- **Git hooks** for pre-commit checks

### Testing Strategy
- **Manual Testing** completed for core flows
- **API Testing** with Postman collections
- **Frontend Testing** in browser dev tools
- **Integration Testing** between frontend and backend
- **Inventory Testing** verified stock reduction and restoration

### Debugging Tools
- **Console Logging** in API client
- **Token Refresh Debugging** with comprehensive logging
- **Error Handling** with user-friendly messages
- **Network Tab** debugging for API calls

---

## 📋 Current Status

### ✅ Production Ready
- **All critical issues resolved**
- **Code cleanup completed** (removed 11 unused components)
- **Production build optimized** (87.3kB shared JS)
- **Deployment configuration ready**
- **Environment variables documented**

### 🎯 Recent Achievements
- **Removed 11 unused components** (+80KB bundle reduction)
- **Production build optimized** (20 pages pre-rendered)
- **Deployment configuration complete** (Render + GitHub ready)
- **Documentation comprehensive** (4 new guides created)
- **Code quality improved** (no dead code, clean imports)
- **Inventory management implemented** (automatic stock reduction/restoration)
- **Order cancellation system** (admin controls with inventory restoration)
- **Stock validation added** (prevents overselling with insufficient inventory)

### 🚀 Next Steps
1. **Push to GitHub**
2. **Deploy to Render**
3. **Configure production environment variables**
4. **Run database migrations**
5. **Test production deployment**

---

## 🔧 Troubleshooting

### Common Issues

#### Backend Issues
- **Database Connection**: Check `DATABASE_URL` format
- **Static Files**: Run `python manage.py collectstatic`
- **Migrations**: Apply latest migrations with `python manage.py migrate`
- **Superuser**: Create with `python manage.py createsuperuser`

#### Frontend Issues
- **API Connection**: Verify `NEXT_PUBLIC_API_URL`
- **Build Errors**: Check TypeScript errors
- **Environment Variables**: Ensure `.env.local` is configured
- **Token Issues**: Check JWT configuration

#### Inventory Issues
- **Stock Not Reducing**: Check if `product.track_stock = True`
- **Overselling Prevention**: Verify stock validation in order creation
- **Inventory Not Restored**: Check admin permissions for order cancellation
- **Stock Discrepancies**: Review OrderService transaction logs

#### Deployment Issues
- **Render Build**: Check logs in Render dashboard
- **Environment Variables**: Verify all required variables are set
- **Database**: Ensure Supabase is accessible
- **CORS**: Check frontend URL in backend CORS settings

### Debug Commands
```bash
# Backend
python manage.py check          # Django system check
python manage.py dbshell        # Database shell
python manage.py showmigrations # Migration status

# Frontend
npm run build                  # Production build
npm run lint                   # Code linting
npm run type-check            # TypeScript checking

# Inventory Debug
python manage.py shell -c "
from apps.products.models import Product
for p in Product.objects.all()[:5]:
    print(f'{p.name}: {p.stock_quantity} units (track: {p.track_stock})')
"
```

---

## 📞 Support

### Documentation
- **Production Readiness**: `PRODUCTION_READINESS_CHECKLIST.md`
- **GitHub Deployment**: `GITHUB_DEPLOYMENT_GUIDE.md`
- **Environment Variables**: `DEPLOYMENT_ENVIRONMENT_VARIABLES.md`

### Quick Links
- **Backend Admin**: http://localhost:8000/admin
- **API Documentation**: http://localhost:8000/api/
- **Frontend**: http://localhost:3000
- **Render Dashboard**: https://dashboard.render.com

---

**Last Updated**: April 28, 2026  
**Status**: PRODUCTION DEPLOYMENT READY  
**Next**: Deploy to Render + GitHub  

**🚀 Ready for immediate production deployment!**
