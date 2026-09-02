import time
import logging
from django.db import DatabaseError, OperationalError
from django.http import HttpResponse
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)

class DatabaseRetryMiddleware(MiddlewareMixin):
    """Middleware to retry database operations on connection failures"""
    
    def process_request(self, request):
        """No processing needed for requests"""
        return None
    
    def process_exception(self, request, exception):
        """Handle database connection exceptions"""
        if isinstance(exception, (DatabaseError, OperationalError)):
            logger.error(f"Database connection error: {exception}")
            
            # Check if it's a connection-related error
            error_msg = str(exception).lower()
            connection_errors = [
                'could not translate host name',
                'connection timeout',
                'connection refused',
                'too many connections',
                'connection already closed'
            ]
            
            if any(err in error_msg for err in connection_errors):
                # Return a user-friendly error response
                return HttpResponse(
                    '{"error": "Database temporarily unavailable. Please try again."}',
                    status=503,
                    content_type="application/json"
                )
        
        return None
