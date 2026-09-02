from django.http import JsonResponse
from django.db import connection
from django.core.cache import cache
from .utils import get_database_connection_with_retry
import time

def health_check(request):
    """
    Enhanced health check endpoint with retry logic
    Returns 200 if all services are healthy
    """
    # Check database connection with retry
    db_healthy = get_database_connection_with_retry(max_retries=3, delay=1)
    db_status = "healthy" if db_healthy else "unhealthy"
    
    # Check cache
    try:
        cache.set('health_check', 'ok', 10)
        cache_status = "healthy" if cache.get('health_check') == 'ok' else "unhealthy"
    except Exception as e:
        cache_status = f"unhealthy: {str(e)}"
    
    # Check database response time
    db_response_time = None
    if db_healthy:
        try:
            start_time = time.time()
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
            db_response_time = round((time.time() - start_time) * 1000, 2)  # in milliseconds
        except Exception:
            db_response_time = None
    
    # Overall status
    overall_status = "healthy" if db_status == "healthy" and cache_status == "healthy" else "unhealthy"
    
    response_data = {
        "status": overall_status,
        "database": {
            "status": db_status,
            "response_time_ms": db_response_time
        },
        "cache": cache_status,
        "timestamp": time.time(),
        "version": "1.0.0"
    }
    
    status_code = 200 if overall_status == "healthy" else 503
    return JsonResponse(response_data, status=status_code)
