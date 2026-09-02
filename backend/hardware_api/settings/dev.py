from .base import *  # noqa

DEBUG = True

# Local PostgreSQL database configuration for development
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('LOCAL_DB_NAME', 'hardware_ecommerce'),
        'USER': os.getenv('LOCAL_DB_USER', 'postgres'),
        'PASSWORD': os.getenv('LOCAL_DB_PASSWORD', ''),
        'HOST': os.getenv('LOCAL_DB_HOST', 'localhost'),
        'PORT': os.getenv('LOCAL_DB_PORT', '5432'),
        'OPTIONS': {
            'connect_timeout': 120,
        },
        'CONN_MAX_AGE': 600,  # 10 minutes for development
        'ATOMIC_REQUESTS': True,
    }
}

# Reduce database connection overhead in dev
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'WARNING',  # Only show warnings, not all queries
        },
    },
}
