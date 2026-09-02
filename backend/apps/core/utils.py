import logging
import time
from django.db import connection
from django.core.cache import cache
from psycopg2 import OperationalError

logger = logging.getLogger(__name__)

def check_database_connection():
    """Check if database connection is healthy"""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            return True
    except Exception as e:
        logger.error(f"Database connection check failed: {e}")
        return False

def get_database_connection_with_retry(max_retries=3, delay=1):
    """Get database connection with retry logic"""
    for attempt in range(max_retries):
        try:
            if check_database_connection():
                return True
        except Exception as e:
            logger.warning(f"Database connection attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                time.sleep(delay * (attempt + 1))  # Exponential backoff
    
    return False

def cache_database_status():
    """Cache database connection status to avoid repeated checks"""
    cache_key = 'database_status'
    status = cache.get(cache_key)
    
    if status is None:
        status = get_database_connection_with_retry()
        cache.set(cache_key, status, timeout=30)  # Cache for 30 seconds
    
    return status
