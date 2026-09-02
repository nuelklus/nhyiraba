from django.core.management.base import BaseCommand
from django.conf import settings
from django.core.mail import send_mail

class Command(BaseCommand):
    help = 'Check email configuration and test connectivity'

    def handle(self, *args, **options):
        self.stdout.write('Checking Email Configuration')
        self.stdout.write('=' * 50)
        
        # Check email settings
        self.stdout.write(f'Email Backend: {settings.EMAIL_BACKEND}')
        self.stdout.write(f'Email Host: {settings.EMAIL_HOST}')
        self.stdout.write(f'Email Port: {settings.EMAIL_PORT}')
        self.stdout.write(f'Email Use TLS: {settings.EMAIL_USE_TLS}')
        self.stdout.write(f'Email User: {settings.EMAIL_HOST_USER}')
        self.stdout.write(f'Email Password: {"*" * len(settings.EMAIL_HOST_PASSWORD) if settings.EMAIL_HOST_PASSWORD else "NOT SET"}')
        self.stdout.write(f'From Email: {settings.DEFAULT_FROM_EMAIL}')
        self.stdout.write(f'Admin Email: {settings.ADMIN_EMAIL}')
        
        self.stdout.write('\n' + '=' * 50)
        
        # Check if password is set
        if not settings.EMAIL_HOST_PASSWORD:
            self.stdout.write(self.style.ERROR('ERROR: EMAIL_HOST_PASSWORD is not set in .env file'))
            self.stdout.write('Please add your Gmail app password to the .env file:')
            self.stdout.write('EMAIL_HOST_PASSWORD=your-16-character-app-password')
            return
        
        # Check if email user is set
        if not settings.EMAIL_HOST_USER:
            self.stdout.write(self.style.ERROR('ERROR: EMAIL_HOST_USER is not set in .env file'))
            self.stdout.write('Please add your Gmail address to the .env file:')
            self.stdout.write('EMAIL_HOST_USER=your-gmail@gmail.com')
            return
        
        # Test email sending
        self.stdout.write('\nTesting email sending...')
        try:
            send_mail(
                subject='Hardware E-commerce - Email Configuration Test',
                message='This is a test email to verify your email configuration is working.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[settings.ADMIN_EMAIL],
                fail_silently=False
            )
            self.stdout.write(self.style.SUCCESS('SUCCESS: Email configuration is working!'))
            self.stdout.write(f'SUCCESS: Test email sent to {settings.ADMIN_EMAIL}')
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'ERROR: Email test failed: {str(e)}'))
            self.stdout.write('\nCommon issues and solutions:')
            
            error_str = str(e).lower()
            if 'authentication' in error_str or 'username' in error_str or 'password' in error_str:
                self.stdout.write('- Authentication failed - Check EMAIL_HOST_USER and EMAIL_HOST_PASSWORD')
                self.stdout.write('- Make sure you are using an App Password, not your regular Gmail password')
                self.stdout.write('- Enable 2-factor authentication in your Google Account')
                self.stdout.write('- Generate a new App Password from Google Account settings')
            
            elif 'connection' in error_str or 'network' in error_str:
                self.stdout.write('- Connection failed - Check your internet connection')
                self.stdout.write('- Verify EMAIL_HOST and EMAIL_PORT settings')
                self.stdout.write('- Make sure your firewall allows SMTP connections')
            
            elif 'tls' in error_str or 'ssl' in error_str:
                self.stdout.write('- TLS/SSL issue - Check EMAIL_USE_TLS setting')
                self.stdout.write('- Try EMAIL_USE_TLS=False if your provider doesn\'t support TLS')
            
            else:
                self.stdout.write('- Check all email settings in your .env file')
                self.stdout.write('- Verify your Gmail account allows less secure apps or use App Password')
