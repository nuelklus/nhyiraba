from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static
from django.core.mail import send_mail
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

def health(request):
    return JsonResponse({"status": "ok"})

@csrf_exempt
@require_http_methods(["GET", "POST"])
def test_email_main(request):
    """Main test email endpoint using Resend API"""
    print("📧 Testing email configuration (main endpoint)...")
    print(f"📧 Using Resend API for email delivery")
    
    # Check if Resend API key is configured
    if not hasattr(settings, 'RESEND_API_KEY') or not settings.RESEND_API_KEY:
        print("⚠️ Resend API key not configured - falling back to console email")
        return JsonResponse({
            'success': False,
            'message': 'Resend API key not configured',
            'error': 'RESEND_API_KEY missing'
        })
    
    # Import Resend
    try:
        import resend
        resend.api_key = settings.RESEND_API_KEY
        print(f"✅ Resend API configured successfully")
    except ImportError:
        print("⚠️ Resend package not installed - falling back to console email")
        return JsonResponse({
            'success': False,
            'message': 'Resend package not installed',
            'error': 'ImportError: resend package missing'
        })
    except Exception as e:
        print(f"⚠️ Resend import failed: {e}")
        return JsonResponse({
            'success': False,
            'message': 'Resend import failed',
            'error': str(e)
        })
    
    config_info = {
        'backend': 'Resend API',
        'api_key': settings.RESEND_API_KEY[:10] + '...' if settings.RESEND_API_KEY else 'None',
        'from_email': getattr(settings, 'RESEND_FROM_EMAIL', 'Not set'),
    }
    
    try:
        print("\n📧 Sending test email via Resend...")
        params = {
            "from": getattr(settings, 'RESEND_FROM_EMAIL', 'test@resend.dev'),
            "to": ["nuelklus@gmail.com"],  # Test with your email
            "subject": 'Test Email from Hardware E-commerce via Resend',
            "html": '<h1>Test Email</h1><p>This is a test email from your Hardware E-commerce application using Resend API.</p>',
        }
        
        result = resend.Emails.send(params)
        print(f"✅ Test email sent successfully via Resend. ID: {result.get('id')}")
        
        return JsonResponse({
            'success': True,
            'message': 'Test email sent successfully via Resend',
            'result': result,
            'config': config_info
        })
        
    except Exception as e:
        print(f"❌ Failed to send test email via Resend: {e}")
        print(f"❌ Error type: {type(e).__name__}")
        return JsonResponse({
            'success': False,
            'message': 'Test email failed',
            'error': str(e),
            'error_type': type(e).__name__,
            'config': config_info
        }, status=500)

def api_root(request):
    """API root endpoint"""
    return JsonResponse({
        "message": "Hardware E-commerce API",
        "version": "1.0.0",
        "endpoints": {
            "admin": "/admin/",
            "health": "/api/health/",
            "test-email": "/api/test-email/",
            "products": "/api/products/",
            "orders": "/api/orders/",
            "shipping": "/api/shipping/",
        },
        "docs": "https://your-api-docs-url.com"
    })

urlpatterns = [
    path("", api_root, name="api_root"),  # Root URL
    path("admin/", admin.site.urls),
    path("api/health/", health),  # Keep for backward compatibility
    path("api/", include("apps.api_urls")),
    path("api/pos/", include("apps.pos.urls")),  # Add POS endpoints
]

# Serve media and static files (both development and production)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
