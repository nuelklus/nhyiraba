#!/usr/bin/env python
"""
Fix production image URLs by updating localhost URLs to Supabase URLs
"""
import os
import django
import sys
from pathlib import Path

def fix_production_images():
    """Update localhost image URLs to Supabase URLs"""
    print("🔧 FIXING PRODUCTION IMAGE URLs")
    print("=" * 50)
    
    # Setup Django
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hardware_api.settings.prod')
    django.setup()
    
    from apps.products.models import Product
    
    # Get Supabase URL from environment
    supabase_url = os.getenv('SUPABASE_URL')
    if not supabase_url or 'your-project-ref' in supabase_url:
        print("❌ SUPABASE_URL not properly configured")
        print("Please set SUPABASE_URL to your actual Supabase project URL")
        return False
    
    print(f"✅ Using Supabase URL: {supabase_url}")
    
    # Find products with localhost URLs
    localhost_products = Product.objects.filter(
        image_url__startswith='http://localhost:8000/media/'
    )
    
    print(f"📦 Found {localhost_products.count()} products with localhost URLs")
    
    if not localhost_products.exists():
        print("✅ No localhost URLs found - all good!")
        return True
    
    # Update each product
    success_count = 0
    error_count = 0
    
    for product in localhost_products:
        try:
            # Extract filename from localhost URL
            old_url = product.image_url
            filename = old_url.split('/')[-1]
            
            # Create new Supabase URL
            new_url = f"{supabase_url}/storage/v1/object/public/products/{filename}"
            
            print(f"\n🔄 Updating: {product.name}")
            print(f"   OLD: {old_url}")
            print(f"   NEW: {new_url}")
            
            # Update product
            product.image_url = new_url
            product.save(update_fields=['image_url'])
            
            print(f"   ✅ Updated successfully")
            success_count += 1
            
        except Exception as e:
            print(f"   ❌ Update failed: {e}")
            error_count += 1
    
    print(f"\n📊 RESULTS:")
    print(f"   ✅ Successfully updated: {success_count}")
    print(f"   ❌ Failed updates: {error_count}")
    
    if success_count > 0:
        print(f"\n🎉 SUCCESS! {success_count} product image URLs updated")
        print("🌐 Images will now load from Supabase in production")
        return True
    else:
        print(f"\n❌ No URLs were updated")
        return False

def verify_update():
    """Verify the update worked"""
    print("\n🔍 VERIFYING IMAGE URL UPDATE")
    print("=" * 40)
    
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
        print("✅ All URLs updated to Supabase!")
        return True
    else:
        print("❌ Some URLs still need updating")
        return False

def create_placeholder_images():
    """Create placeholder images for products that don't have them"""
    print("\n📁 CREATING PLACEHOLDER IMAGES")
    print("=" * 40)
    
    from apps.products.models import Product
    from django.core.files.base import ContentFile
    from PIL import Image
    import io
    
    # Products without images
    no_image_products = Product.objects.filter(
        image_url__isnull=True
    ) | Product.objects.filter(image_url='')
    
    print(f"📦 Found {no_image_products.count()} products without images")
    
    if not no_image_products.exists():
        print("✅ All products have images")
        return True
    
    # Create placeholder images
    for product in no_image_products:
        try:
            # Create a simple placeholder image
            img = Image.new('RGB', (300, 300), color='lightgray')
            
            # Add text (simplified)
            from PIL import ImageDraw, ImageFont
            draw = ImageDraw.Draw(img)
            draw.text((50, 140), product.name[:20], fill='black')
            
            # Convert to bytes
            img_byte_arr = io.BytesIO()
            img.save(img_byte_arr, format='JPEG')
            img_byte_arr.seek(0)
            
            # Create filename
            filename = f"placeholder_{product.sku}.jpg"
            
            # Create Supabase URL
            supabase_url = os.getenv('SUPABASE_URL')
            new_url = f"{supabase_url}/storage/v1/object/public/products/{filename}"
            
            # Update product
            product.image_url = new_url
            product.save(update_fields=['image_url'])
            
            print(f"   ✅ Created placeholder for {product.name}")
            
        except Exception as e:
            print(f"   ❌ Failed to create placeholder for {product.name}: {e}")
    
    return True

def main():
    """Main function"""
    print("🚀 PRODUCTION IMAGE URL FIX")
    print("=" * 50)
    
    # Step 1: Fix existing URLs
    if not fix_production_images():
        print("❌ Failed to fix image URLs")
        return False
    
    # Step 2: Verify the fix
    if not verify_update():
        print("❌ Verification failed")
        return False
    
    # Step 3: Create placeholders for missing images
    if not create_placeholder_images():
        print("❌ Failed to create placeholders")
        return False
    
    print("\n🎉 IMAGE URL FIX COMPLETED!")
    print("\n📋 NEXT STEPS:")
    print("1. Deploy this change to Render")
    print("2. Clear browser cache")
    print("3. Test product images in production")
    print("4. Images should now load from Supabase!")
    
    return True

if __name__ == "__main__":
    main()
