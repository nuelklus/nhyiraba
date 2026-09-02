#!/usr/bin/env python
"""
Setup Supabase image storage and migrate existing images
"""
import os
import django
import django
from django.conf import settings
from django.core.files.base import ContentFile
from apps.products.models import Product
import requests
import uuid
from pathlib import Path

def setup_supabase_images():
    """Setup Supabase and migrate existing images"""
    print("🚀 SETTING UP SUPABASE IMAGE STORAGE")
    print("=" * 60)
    
    # Check if Supabase is configured
    if not hasattr(settings, 'SUPABASE_URL') or not hasattr(settings, 'SUPABASE_ANON_KEY'):
        print("❌ Supabase not configured in settings")
        print("Please add these to your .env file:")
        print("SUPABASE_URL=https://your-project.supabase.co")
        print("SUPABASE_ANON_KEY=your-anon-key-here")
        print("SUPABASE_SERVICE_KEY=your-service-key-here")
        return False
    
    supabase_url = settings.SUPABASE_URL
    supabase_key = settings.SUPABASE_ANON_KEY
    
    print(f"✅ Supabase URL: {supabase_url}")
    print(f"✅ Supabase Key: {supabase_key[:20]}...")
    
    # Create Supabase client
    try:
        from supabase import create_client
        supabase_client = create_client(supabase_url, supabase_key)
        print("✅ Supabase client created successfully")
    except ImportError:
        print("❌ Supabase client not installed. Install with: pip install supabase")
        return False
    except Exception as e:
        print(f"❌ Failed to create Supabase client: {e}")
        return False
    
    # Get products with localhost images
    products_with_localhost_images = Product.objects.filter(
        image_url__startswith='http://localhost:8000/media/'
    )
    
    print(f"📦 Found {products_with_localhost_images.count()} products with localhost images")
    
    if not products_with_localhost_images.exists():
        print("✅ No localhost images found - all good!")
        return True
    
    # Create storage bucket URL
    storage_url = f"{supabase_url}/storage/v1/object/public/products"
    print(f"📁 Storage URL: {storage_url}")
    
    # Upload images to Supabase
    success_count = 0
    error_count = 0
    
    for product in products_with_localhost_images:
        try:
            # Extract filename from localhost URL
            filename = product.image_url.split('/')[-1]
            local_media_path = os.path.join(settings.MEDIA_ROOT, 'products', filename)
            
            print(f"\n🔄 Processing: {product.name}")
            print(f"   Local file: {local_media_path}")
            print(f"   Filename: {filename}")
            
            # Check if local file exists
            if not os.path.exists(local_media_path):
                print(f"   ⚠️ Local file not found: {local_media_path}")
                error_count += 1
                continue
            
            # Upload to Supabase
            with open(local_media_path, 'rb') as f:
                file_content = f.read()
            
            # Generate unique filename to avoid conflicts
            unique_filename = f"{uuid.uuid4().hex}_{filename}"
            
            # Upload to Supabase
            try:
                # Upload file
                storage_path = f"products/{unique_filename}"
                supabase_client.storage.from_('products').upload(
                    file_content, 
                    unique_filename,
                    file_options={'content-type': 'image/jpeg'}
                )
                
                # Get public URL
                public_url = f"{storage_url}/{unique_filename}"
                
                # Update product with new Supabase URL
                product.image_url = public_url
                product.save(update_fields=['image_url'])
                
                print(f"   ✅ Uploaded: {public_url}")
                success_count += 1
                
            except Exception as e:
                print(f"   ❌ Upload failed: {e}")
                error_count += 1
                
        except Exception as e:
            print(f"   ❌ Processing failed: {e}")
            error_count += 1
    
    print(f"\n📊 RESULTS:")
    print(f"   ✅ Successfully uploaded: {success_count}")
    print(f"   ❌ Failed uploads: {error_count}")
    
    if success_count > 0:
        print(f"\n🎉 SUCCESS! {success_count} product images migrated to Supabase")
        print("🔄 Product image URLs updated in database")
        print("🌐 Ready for production deployment")
        return True
    else:
        print(f"\n❌ No images were successfully uploaded")
        return False

def update_settings_for_supabase():
    """Update Django settings for Supabase image handling"""
    print("\n🔧 UPDATING DJANGO SETTINGS FOR SUPABASE")
    
    settings_content = """
# Supabase Configuration for Image Storage
# Add these to your hardware_api/settings/base.py

# Supabase Storage
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://your-project.supabase.co')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY', 'your-anon-key')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY', 'your-service-key')

# Media files configuration
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
"""
    
    print("📝 Settings template created. Add this to hardware_api/settings/base.py:")
    print(settings_content)

if __name__ == "__main__":
    # Setup Django
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hardware_api.settings.dev')
    django.setup()
    
    # Run the migration
    success = setup_supabase_images()
    
    if success:
        update_settings_for_supabase()
        print("\n🎯 NEXT STEPS:")
        print("1. Add Supabase settings to hardware_api/settings/base.py")
        print("2. Install Supabase client: pip install supabase")
        print("3. Test locally: python manage.py runserver")
        print("4. Deploy to production: Images will work!")
    else:
        print("\n❌ Migration failed. Check error messages above.")
