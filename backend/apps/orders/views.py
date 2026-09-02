from rest_framework import generics, status, permissions, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.shortcuts import get_object_or_404
from django.utils import timezone
import random
import string
from .models import Order, OrderStatusUpdate
from .serializers import OrderSerializer, CreateOrderSerializer
from .services import OrderService

class CreateOrderView(generics.CreateAPIView):
    serializer_class = CreateOrderSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        print(f"=== ORDER CREATION DEBUG ===")
        print(f"Request data: {request.data}")
        print(f"Request headers: {dict(request.headers)}")
        print(f"Authenticated user: {request.user if request.user.is_authenticated else 'Anonymous'}")

        try:
            serializer = self.get_serializer(data=request.data)
            print(f"Serializer valid: {serializer.is_valid()}")
            if not serializer.is_valid():
                print(f"Serializer errors: {serializer.errors}")
                raise serializers.ValidationError(serializer.errors)

            # Associate order with authenticated user if available
            validated_data = serializer.validated_data
            if request.user.is_authenticated:
                validated_data['user'] = request.user
                print(f"Associating order with user: {request.user.username}")

            print(f"Creating order with validated data: {validated_data}")
            order = serializer.save(**validated_data)
            print(f"Order created successfully: {order.order_number}")

            # Send emails
            try:
                self.send_order_emails(order)
                print(f"✅ Emails sent successfully for order {order.order_number}")
            except Exception as e:
                # Log error but don't fail the order creation
                import traceback
                print(f"❌ Failed to send emails for order {order.order_number}: {e}")
                print(f"❌ Email configuration: HOST={settings.EMAIL_HOST}, PORT={settings.EMAIL_PORT}, USER={settings.EMAIL_HOST_USER}")
                print(f"❌ Full traceback: {traceback.format_exc()}")

            # Generate release code for COD orders
            if order.payment_method == 'cod' and not order.release_code:
                order.release_code = ''.join(random.choices(string.digits, k=6))
                order.save()

            # Return the created order
            response_serializer = OrderSerializer(order)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)

        except serializers.ValidationError as e:
            # Handle validation errors (like insufficient inventory) with proper 400 status
            print(f"❌ Validation error: {e}")
            # Extract the error message from DRF ValidationError
            if hasattr(e, 'detail') and e.detail:
                # e.detail is usually a list of ErrorDetail objects
                if isinstance(e.detail, list):
                    # Join multiple error messages with newlines
                    error_message = '\n'.join(str(detail) for detail in e.detail)
                else:
                    error_message = str(e.detail)
            else:
                error_message = str(e)

            # Clean up the error message - remove list brackets if present
            error_message = error_message.strip("[]'\"")

            return Response(
                {'error': error_message},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            import traceback
            print(f"❌ ORDER CREATION FAILED: {e}")
            print(f"❌ Error type: {type(e).__name__}")
            print(f"❌ Full traceback:")
            print(traceback.format_exc())
            return Response(
                {'error': 'An unexpected error occurred. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def send_order_emails(self, order):
        """Send order confirmation emails using Resend API"""
        print(f"📧 Starting email sending for order {order.order_number}")
        print(f"📧 Customer email: {order.email}")
        print(f"📧 Admin email: {settings.ADMIN_EMAIL}")
        print(f"📧 Using Resend API for email delivery")
        
        # Check if Resend API key is configured
        if not hasattr(settings, 'RESEND_API_KEY') or not settings.RESEND_API_KEY:
            print("⚠️ Resend API key not configured - using SMTP fallback")
            self._send_smtp_emails(order)
            return
        
        # Import Resend
        try:
            import resend
            resend.api_key = settings.RESEND_API_KEY
            print(f"✅ Resend API configured successfully")
        except ImportError:
            print("⚠️ Resend package not installed - falling back to console email")
            self._send_console_emails(order)
            return
        
        # Email to customer
        customer_subject = f"Order Confirmation - {order.order_number}"
        customer_message = render_to_string('emails/order_confirmation.html', {
            'order': order,
            'customer_name': f"{order.first_name} {order.last_name}",
            'is_admin': False
        })
        
        print(f"📧 Sending customer email to {order.email}")
        # For Resend free tier, send customer emails to your verified address
        # In production, verify a domain to send to any email
        customer_email = order.email if hasattr(settings, 'RESEND_DOMAIN_VERIFIED') and settings.RESEND_DOMAIN_VERIFIED else settings.ADMIN_EMAIL
        
        try:
            params = {
                "from": settings.RESEND_FROM_EMAIL,
                "to": [customer_email],
                "subject": customer_subject,
                "html": customer_message,
            }
            
            result = resend.Emails.send(params)
            print(f"✅ Customer email sent successfully via Resend. ID: {result.get('id')}")
            if customer_email != order.email:
                print(f"⚠️ Note: Email sent to {customer_email} instead of {order.email} (Resend free tier limitation)")
            
        except Exception as e:
            print(f"❌ Failed to send customer email via Resend: {e}")
            print(f"❌ Error type: {type(e).__name__}")
            # Don't raise exception - continue with order creation
        
        # Add delay before sending admin email
        import time
        print("⏳ Waiting 1 second before sending admin email...")
        time.sleep(1)
        
        # Email to admin
        admin_subject = f"New Order Received - {order.order_number}"
        admin_message = render_to_string('emails/order_confirmation.html', {
            'order': order,
            'customer_name': "Admin",
            'is_admin': True
        })
        
        print(f"📧 Sending admin email to {settings.ADMIN_EMAIL}")
        try:
            params = {
                "from": settings.DEFAULT_FROM_EMAIL,
                "to": [settings.ADMIN_EMAIL],
                "subject": admin_subject,
                "html": admin_message,
            }
            
            result = resend.Emails.send(params)
            print(f"✅ Admin email sent successfully via Resend. ID: {result.get('id')}")
            
        except Exception as e:
            print(f"❌ Failed to send admin email via Resend: {e}")
            print(f"❌ Error type: {type(e).__name__}")
            # Don't raise exception - continue with order creation
    
    def _send_smtp_emails(self, order):
        """Send emails using Django's SMTP backend when Resend is not available"""
        print("📧 Using SMTP email fallback...")
        
        try:
            # Customer email
            customer_subject = f"Order Confirmation - {order.order_number}"
            customer_message = render_to_string('emails/order_confirmation.html', {
                'order': order,
                'customer_name': f"{order.first_name} {order.last_name}",
                'is_admin': False
            })
            
            # Send customer email
            send_mail(
                subject=customer_subject,
                message=customer_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[order.email],
                html_message=customer_message,
                fail_silently=False
            )
            print(f"✅ Customer email sent to {order.email}")
            
            # Admin email
            admin_subject = f"New Order Received - {order.order_number}"
            admin_message = render_to_string('emails/order_confirmation.html', {
                'order': order,
                'customer_name': f"Admin",
                'is_admin': True
            })
            
            # Send admin email
            send_mail(
                subject=admin_subject,
                message=admin_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[settings.ADMIN_EMAIL],
                html_message=admin_message,
                fail_silently=False
            )
            print(f"✅ Admin email sent to {settings.ADMIN_EMAIL}")
            
        except Exception as e:
            print(f"❌ SMTP email sending failed: {e}")
            # Fallback to console
            self._send_console_emails(order)
    
    def _send_console_emails(self, order):
        """Fallback method to send emails to console when both Resend and SMTP fail"""
        print("📧 Using console email fallback...")
        
        # Customer email
        customer_subject = f"Order Confirmation - {order.order_number}"
        customer_message = render_to_string('emails/order_confirmation.html', {
            'order': order,
            'customer_name': f"{order.first_name} {order.last_name}",
            'is_admin': False
        })
        
        print(f"\n{'='*50}")
        print(f"📧 CUSTOMER EMAIL")
        print(f"{'='*50}")
        print(f"To: {order.email}")
        print(f"Subject: {customer_subject}")
        print(f"From: {settings.DEFAULT_FROM_EMAIL}")
        print(f"\n{customer_message}")
        print(f"{'='*50}")
        
        # Admin email
        admin_subject = f"New Order Received - {order.order_number}"
        admin_message = render_to_string('emails/order_confirmation.html', {
            'order': order,
            'customer_name': "Admin",
            'is_admin': True
        })
        
        print(f"\n{'='*50}")
        print(f"📧 ADMIN EMAIL")
        print(f"{'='*50}")
        print(f"To: {settings.ADMIN_EMAIL}")
        print(f"Subject: {admin_subject}")
        print(f"From: {settings.DEFAULT_FROM_EMAIL}")
        print(f"\n{admin_message}")
        print(f"{'='*50}")
        
        print("✅ Console emails sent successfully")

class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'order_number'

    def get_queryset(self):
        if self.request.user.is_staff:
            return Order.objects.all()
        return Order.objects.filter(user=self.request.user)

class OrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Order.objects.all()
        return Order.objects.filter(user=self.request.user)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_order_status(request, order_number):
    """Update order status (admin only)"""
    if not request.user.is_staff:
        return Response(
            {'error': 'Permission denied'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        order = Order.objects.get(order_number=order_number)
        new_status = request.data.get('status')
        notes = request.data.get('notes', '')
        
        if new_status not in dict(Order.ORDER_STATUS_CHOICES):
            return Response(
                {'error': 'Invalid status'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update order status
        order.status = new_status
        order.save()
        
        # Create status update record
        OrderStatusUpdate.objects.create(
            order=order,
            status=new_status,
            notes=notes,
            created_by=request.user
        )
        
        return Response({'message': 'Status updated successfully'})
    
    except Order.DoesNotExist:
        return Response(
            {'error': 'Order not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def track_order(request, order_number):
    """Track order status and details"""
    try:
        order = get_object_or_404(Order, order_number=order_number)
        serializer = OrderSerializer(order)
        
        # Add tracking timeline
        timeline = []
        status_updates = order.status_updates.all().order_by('created_at')
        
        for update in status_updates:
            timeline.append({
                'status': update.status,
                'notes': update.notes,
                'timestamp': update.created_at,
                'created_by': update.created_by.username if update.created_by else 'System'
            })
        
        return Response({
            'order': serializer.data,
            'timeline': timeline,
            'tracking_available': order.status in ['processing', 'shipped', 'delivered']
        })
    
    except Order.DoesNotExist:
        return Response(
            {'error': 'Order not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def confirm_delivery(request, order_number):
    """Confirm delivery with release code"""
    try:
        order = get_object_or_404(Order, order_number=order_number)
        
        if order.status != 'shipped':
            return Response(
                {'success': False, 'message': 'Order is not ready for delivery confirmation'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        release_code = request.data.get('release_code')
        
        if not release_code or len(release_code) != 6:
            return Response(
                {'success': False, 'message': 'Invalid release code format'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if order.release_code != release_code:
            return Response(
                {'success': False, 'message': 'Invalid release code'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update order status to delivered
        order.status = 'delivered'
        order.delivered_at = timezone.now()
        order.save()
        
        # Create status update record
        OrderStatusUpdate.objects.create(
            order=order,
            status='delivered',
            notes='Delivery confirmed with release code',
            created_by=request.user if request.user.is_authenticated else None
        )
        
        return Response({
            'success': True, 
            'message': 'Delivery confirmed successfully',
            'delivered_at': order.delivered_at
        })
    
    except Order.DoesNotExist:
        return Response(
            {'success': False, 'error': 'Order not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def cancel_order_with_inventory_restoration(request, order_number):
    """
    Cancel an order and restore inventory
    Only admin users can cancel orders
    """
    try:
        order = Order.objects.get(order_number=order_number)
        
        # Check if user is admin
        if not request.user.is_staff and not request.user.is_superuser:
            return Response(
                {'success': False, 'error': 'Only admin users can cancel orders'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if order can be cancelled
        if order.status in ['delivered', 'cancelled']:
            return Response(
                {'success': False, 'error': f'Order cannot be cancelled. Current status: {order.status}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        print(f"🔄 Cancelling order {order_number} and restoring inventory...")
        
        # Restore inventory and cancel order
        OrderService.restore_inventory_on_cancellation(order)
        
        return Response({
            'success': True, 
            'message': 'Order cancelled successfully and inventory restored',
            'order_number': order.order_number,
            'cancelled_at': order.updated_at
        })
        
    except Order.DoesNotExist:
        return Response(
            {'success': False, 'error': 'Order not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
