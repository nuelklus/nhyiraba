from .base import *
import os
import dj_database_url

# Production settings
DEBUG = os.getenv('DJANGO_DEBUG', 'False').lower() in {'1', 'true', 'yes'}

# Security
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# Database (optimized for production)
DATABASES = {
    'default': dj_database_url.config(
        conn_max_age=600,
        ssl_require=True
    )
}

# Caching (optimized for 512MB RAM)
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
        'OPTIONS': {
            'MAX_ENTRIES': 1000,  # Reduced for memory
        }
    }
}

# Session (optimized for memory)
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'

# Logging (minimal for production)
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'apps.orders': {
            'handlers': ['console'],
            'level': 'WARNING',  # Reduce log verbosity
            'propagate': False,
        },
    },
}

# Media files (using Render's disk)
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Static files (optimized with WhiteNoise)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Django 5.0.7 static files configuration
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'static'),
]

# WhiteNoise configuration - Use manifest storage for Django 5.0.7
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# WhiteNoise settings for production
WHITENOISE_ROOT = STATIC_ROOT
WHITENOISE_USE_FINDERS = True
WHITENOISE_AUTOREFRESH = False  # Production: don't auto-refresh
WHITENOISE_SKIP_COMPRESS_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'zip', 'gz', 'tgz', 'bz2', 'xz']
WHITENOISE_MANIFEST_STRICT = False  # Allow missing files gracefully
WHITENOISE_INDEX_FILE = False  # Don't serve index files automatically
WHITENOISE_ALLOW_ALL_ORIGINS = False  # Security: don't allow all origins

# Templates (optimized)
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
            'debug': False,  # Disabled in production
        },
    }
]

# Email (using Resend API to bypass Render SMTP blocking)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'  # Fallback to console
DEFAULT_FROM_EMAIL = 'onboarding@resend.dev'  # Use Resend's verified domain
ADMIN_EMAIL = os.getenv('ADMIN_EMAIL', 'nuelklus@gmail.com')

# Resend configuration
RESEND_API_KEY = os.getenv('RESEND_API_KEY', '')
RESEND_FROM_EMAIL = os.getenv('RESEND_FROM_EMAIL', 'onboarding@resend.dev')

# Performance optimizations
CONN_MAX_AGE = 600  # Database connection pooling
USE_L10N = False  # Disable localization to save memory
USE_TZ = True  # Keep timezone support

# Additional performance settings
DJANGO_DETERMINISTIC_APPS = True  # Faster app loading
SILENCED_SYSTEM_CHECKS = ['fields.W342', 'security.W008']  # Silence non-critical warnings

# Response compression middleware (add to MIDDLEWARE below)
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.gzip.GZipMiddleware',  # Add compression back for production
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Allowed hosts (Render will provide this)
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    'testserver',  # For testing
    os.getenv('RENDER_EXTERNAL_HOSTNAME', ''),
    '.onrender.com',
    'allshopsdepot.com',
    'www.allshopsdepot.com',
]

# CORS (production)
frontend_url = os.getenv('FRONTEND_URL', 'https://allshopsdepot.com')
pos_frontend_url = os.getenv('POS_FRONTEND_URL', 'https://ephritta.nexlogssolutions.com')
CORS_ALLOWED_ORIGINS = [
    frontend_url,
    pos_frontend_url,
]

# CSRF Trusted Origins (for secure form submission)
CSRF_TRUSTED_ORIGINS = [
    'https://ephritta.nexlogssolutions.com'
]

# Remove development CORS settings
if 'CORS_ALLOW_ALL_ORIGINS' in locals():
    del CORS_ALLOW_ALL_ORIGINS
