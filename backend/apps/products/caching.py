"""
Caching utilities for products app
"""

from django.core.cache import cache
from django.conf import settings
from functools import wraps
import hashlib
import json

def cache_response(timeout=300, key_prefix=None):
    """
    Cache API responses for faster repeated requests
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(*args, **kwargs):
            # Generate cache key based on request parameters
            request = args[0] if args else None
            if not request:
                return view_func(*args, **kwargs)
            
            # Create cache key
            cache_key_parts = [
                key_prefix or view_func.__name__,
                request.method,
                str(request.user.id) if request.user.is_authenticated else 'anonymous',
                str(sorted(request.GET.items())),
                str(sorted(request.POST.items())) if request.method == 'POST' else ''
            ]
            
            cache_key = f"api_cache:{hashlib.md5(':'.join(cache_key_parts).encode()).hexdigest()}"
            
            # Try to get from cache
            cached_response = cache.get(cache_key)
            if cached_response:
                return cached_response
            
            # Execute view and cache response
            response = view_func(*args, **kwargs)
            
            # Cache successful responses
            if hasattr(response, 'status_code') and response.status_code == 200:
                cache.set(cache_key, response, timeout)
            
            return response
        
        return wrapper
    return decorator

def cache_product_list(timeout=300):
    """
    Cache product list responses with pagination and filtering
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(*args, **kwargs):
            request = args[0] if args else None
            if not request:
                return view_func(*args, **kwargs)
            
            # Create specific cache key for product lists
            cache_params = {
                'page': request.GET.get('page', '1'),
                'search': request.GET.get('search', ''),
                'category': request.GET.get('category', ''),
                'brand': request.GET.get('brand', ''),
                'is_active': request.GET.get('is_active', ''),
                'is_featured': request.GET.get('is_featured', ''),
            }
            
            cache_key = f"products:list:{hashlib.md5(json.dumps(cache_params, sort_keys=True).encode()).hexdigest()}"
            
            # Check cache
            cached_data = cache.get(cache_key)
            if cached_data:
                from rest_framework.response import Response
                return Response(cached_data)
            
            # Execute view
            response = view_func(*args, **kwargs)
            
            # Cache successful responses
            if hasattr(response, 'status_code') and response.status_code == 200:
                if hasattr(response, 'data'):
                    cache.set(cache_key, response.data, timeout)
            
            return response
        
        return wrapper
    return decorator

def invalidate_product_cache():
    """
    Invalidate all product-related caches
    """
    cache_keys = cache.keys('api_cache:*')
    cache.delete_many(cache_keys)
    
    product_keys = cache.keys('products:*')
    cache.delete_many(product_keys)

def cache_product_detail(timeout=600):
    """
    Cache individual product details
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(*args, **kwargs):
            request = args[0] if args else None
            if not request:
                return view_func(*args, **kwargs)
            
            # Get product ID from URL parameters
            product_id = kwargs.get('pk') or request.GET.get('id')
            if not product_id:
                return view_func(*args, **kwargs)
            
            cache_key = f"products:detail:{product_id}"
            
            # Check cache
            cached_data = cache.get(cache_key)
            if cached_data:
                from rest_framework.response import Response
                return Response(cached_data)
            
            # Execute view
            response = view_func(*args, **kwargs)
            
            # Cache successful responses
            if hasattr(response, 'status_code') and response.status_code == 200:
                if hasattr(response, 'data'):
                    cache.set(cache_key, response.data, timeout)
            
            return response
        
        return wrapper
    return decorator
