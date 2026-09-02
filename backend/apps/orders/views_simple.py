from django.http import JsonResponse
from django.core.mail import send_mail
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

@csrf_exempt
@require_http_methods(["GET", "POST"])
def test_email_simple(request):
    """Simple test email endpoint without DRF authentication"""
    print("📧 Testing email configuration (simple endpoint)...")
    print(f"📧 Email backend: {settings.EMAIL_BACKEND}")
    print(f"📧 Email host: {settings.EMAIL_HOST}")
    print(f"📧 Email port: {settings.EMAIL_PORT}")
    print(f"📧 Email user: {settings.EMAIL_HOST_USER}")
    print(f"📧 From email: {settings.DEFAULT_FROM_EMAIL}")
    
    config_info = {
        'backend': str(settings.EMAIL_BACKEND),
        'host': str(settings.EMAIL_HOST),
        'port': str(settings.EMAIL_PORT),
        'user': str(settings.EMAIL_HOST_USER),
        'from_email': str(settings.DEFAULT_FROM_EMAIL),
    }
    
    try:
        print("\n📧 Sending test email...")
        result = send_mail(
            subject='Test Email from Hardware E-commerce',
            message='This is a test email to verify SMTP configuration.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.EMAIL_HOST_USER],  # Send to self
            fail_silently=False
        )
        print(f"✅ Test email sent successfully! Result: {result}")
        return JsonResponse({
            'success': True,
            'message': 'Test email sent successfully',
            'result': result,
            'config': config_info
        })
    except Exception as e:
        print(f"❌ Test email failed: {e}")
        print(f"❌ Error type: {type(e).__name__}")
        return JsonResponse({
            'success': False,
            'message': 'Test email failed',
            'error': str(e),
            'error_type': type(e).__name__,
            'config': config_info
        }, status=500)
