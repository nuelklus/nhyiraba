from .base import *  # noqa

DEBUG = True

# Local-only JWT signing key
SIMPLE_JWT["SIGNING_KEY"] = SECRET_KEY
# Local PostgreSQL database configuration for development
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "trendykiddos_db",
        "USER": "trendykiddos_user",
        "PASSWORD": "Trendykiddos2026Pass",
        "HOST": "127.0.0.1",
        "PORT": "5433",
        "TEST": {
            "NAME": "nexlogs_newapp",
        },
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
