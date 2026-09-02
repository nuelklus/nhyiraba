#!/usr/bin/env python
"""
Migrate existing product images to Supabase storage
"""
import os
import django
import sys
from pathlib import Path

def setup_django():
    """Setup Django environment"""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hardware_api.settings.dev')
    django.setup()

def migrate_existing_images():
    """Migrate existing localhost images to Supabase"""
    print("🚀 MIGRATING EXISTING IMAGES TO SUPABASE")
    print("=" * 50)
    
    setup_django()
    
    from apps.products.models import Product
    from apps.products.supabase_storage import supabase_storage
    from django.conf import settings
    import os
    
    # Check if Supabase is configured
    if not hasattr(settings, 'SUPABASE_URL') or 'your-project' in settings.SUPABASE_URL:
        print("❌ Supabase not properly configured")
        print("Please set SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_KEY in .env")
        return False
    
    print(f"✅ Using Supabase URL: {settings.SUPABASE_URL}")
    
    # Find products with localhost URLs
    localhost_products = Product.objects.filter(
        image_url__startswith='http://localhost:8000/media/'
    )
    
    print(f"📦 Found {localhost_products.count()} products with localhost URLs")
    
    if not localhost_products.exists():
        print("✅ No localhost URLs found - all good!")
        return True
    
    success_count = 0
    error_count = 0
    
    for product in localhost_products:
        try:
            print(f"\n🔄 Migrating: {product.name}")
            print(f"   Current URL: {product.image_url}")
            
            # Extract filename from localhost URL
            old_url = product.image_url
            filename = old_url.split('/')[-1]
            
            # Check if local file exists
            local_path = os.path.join(settings.MEDIA_ROOT, 'products', filename)
            if not os.path.exists(local_path):
                print(f"   ⚠️ Local file not found: {local_path}")
                error_count += 1
                continue
            
            # Upload to Supabase
            with open(local_path, 'rb') as f:
                from django.core.files.uploadedfile import InMemoryUploadedFile
                import io
                
                # Create file-like object
                file_obj = InMemoryUploadedFile(
                    f, 'image', filename, 'image/jpeg', os.path.getsize(local_path), None
                )
                
                # Upload to Supabase
                success, new_url, error = supabase_storage.upload_image(file_obj, filename)
                
                if success and new_url:
                    # Update product with new URL
                    product.image_url = new_url
                    product.save(update_fields=['image_url'])
                    
                    print(f"   ✅ Migrated to: {new_url}")
                    success_count += 1
                else:
                    print(f"   ❌ Upload failed: {error}")
                    error_count += 1
                    
        except Exception as e:
            print(f"   ❌ Migration failed: {e}")
            error_count += 1
    
    print(f"\n📊 MIGRATION RESULTS:")
    print(f"   ✅ Successfully migrated: {success_count}")
    print(f"   ❌ Failed migrations: {error_count}")
    
    return success_count > 0

def verify_migration():
    """Verify the migration worked"""
    print("\n🔍 VERIFYING MIGRATION")
    print("=" * 30)
    
    setup_django()
    
    from apps.products.models import Product
    
    # Check for localhost URLs
    localhost_count = Product.objects.filter(
        image_url__startswith='http://localhost:8000/media/'
    ).count()
    
    # Check for Supabase URLs
    supabase_count = Product.objects.filter(
        image_url__contains='supabase'
    ).count()
    
    print(f"📊 Current Status:")
    print(f"   Localhost URLs: {localhost_count}")
    print(f"   Supabase URLs: {supabase_count}")
    
    if localhost_count == 0 and supabase_count > 0:
        print("✅ Migration successful - all URLs now point to Supabase!")
        return True
    else:
        print("❌ Migration incomplete - some URLs still need updating")
        return False

def create_supabase_bucket():
    """Create Supabase bucket if it doesn't exist"""
    print("\n📁 CREATING SUPABASE BUCKET")
    print("=" * 35)
    
    setup_django()
    
    from apps.products.supabase_storage import supabase_storage
    
    try:
        supabase_storage.create_bucket_if_not_exists()
        print("✅ Bucket setup complete")
        return True
    except Exception as e:
        print(f"❌ Bucket setup failed: {e}")
        return False

def main():
    """Main migration function"""
    print("🚀 COMPLETE SUPABASE MIGRATION")
    print("=" * 50)
    
    # Step 1: Create bucket
    if not create_supabase_bucket():
        print("❌ Failed to create bucket")
        return False
    
    # Step 2: Migrate images
    if not migrate_existing_images():
        print("❌ Migration failed")
        return False
    
    # Step 3: Verify migration
    if not verify_migration():
        print("❌ Verification failed")
        return False
    
    print("\n🎉 MIGRATION COMPLETED SUCCESSFULLY!")
    print("\n📋 NEXT STEPS:")
    print("1. Test locally: python manage.py runserver")
    print("2. Create new product with image upload")
    print("3. Deploy to production")
    print("4. Images will now work in both environments!")
    
    return True

if __name__ == "__main__":
    main()
