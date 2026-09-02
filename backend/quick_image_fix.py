#!/usr/bin/env python
"""
Quick fix for production image URLs - update localhost to Supabase
"""
import os
import django
import sys
from pathlib import Path

def quick_fix_images():
    """Quick fix for localhost URLs"""
    print("🔧 QUICK PRODUCTION IMAGE FIX")
    print("=" * 40)
    
    # Setup Django
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hardware_api.settings.dev')
    django.setup()
    
    from apps.products.models import Product
    
    # Find products with localhost URLs
    localhost_products = Product.objects.filter(
        image_url__startswith='http://localhost:8000/media/'
    )
    
    print(f"📦 Found {localhost_products.count()} products with localhost URLs")
    
    if not localhost_products.exists():
        print("✅ No localhost URLs found!")
        return True
    
    # You'll need to replace this with your actual Supabase URL
    # Get this from your Render dashboard or Supabase project
    SUPABASE_URL = "https://your-actual-project-ref.supabase.co"  # <-- UPDATE THIS
    
    if "your-actual-project-ref" in SUPABASE_URL:
        print("❌ Please update SUPABASE_URL in this script")
        print("📋 Get your Supabase URL from:")
        print("   1. Supabase Dashboard → Settings → API")
        print("   2. Copy the Project URL")
        print("   3. Replace the placeholder in this script")
        return False
    
    print(f"✅ Using Supabase URL: {SUPABASE_URL}")
    
    # Update URLs
    success_count = 0
    for product in localhost_products:
        try:
            old_url = product.image_url
            filename = old_url.split('/')[-1]
            new_url = f"{SUPABASE_URL}/storage/v1/object/public/products/{filename}"
            
            print(f"🔄 {product.name}")
            print(f"   {old_url}")
            print(f"   {new_url}")
            
            product.image_url = new_url
            product.save(update_fields=['image_url'])
            success_count += 1
            
        except Exception as e:
            print(f"❌ Error: {e}")
    
    print(f"\n✅ Updated {success_count} product URLs")
    return True

def show_current_urls():
    """Show current image URLs"""
    print("\n📊 CURRENT IMAGE URL STATUS")
    print("=" * 40)
    
    from apps.products.models import Product
    
    for product in Product.objects.all():
        print(f"📦 {product.name}")
        print(f"   URL: {product.image_url}")
        print()

if __name__ == "__main__":
    # Show current status first
    show_current_urls()
    
    # Then run the fix
    quick_fix_images()
