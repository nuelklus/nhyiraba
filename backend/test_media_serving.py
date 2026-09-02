#!/usr/bin/env python
"""
Test script to verify media file serving configuration
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hardware_api.settings.prod')
django.setup()

from django.conf import settings
from django.test import Client
from django.urls import reverse
from apps.products.models import Product

def test_media_serving():
    """Test if media files are properly configured"""
    print("🧪 Testing Media File Serving Configuration")
    print("=" * 50)
    
    # Check Django settings
    print(f"📁 MEDIA_URL: {settings.MEDIA_URL}")
    print(f"📁 MEDIA_ROOT: {settings.MEDIA_ROOT}")
    print(f"📁 STATIC_URL: {settings.STATIC_URL}")
    print(f"📁 STATIC_ROOT: {settings.STATIC_ROOT}")
    print(f"🔧 DEBUG: {settings.DEBUG}")
    print()
    
    # Check if media directory exists
    if os.path.exists(settings.MEDIA_ROOT):
        print(f"✅ Media directory exists: {settings.MEDIA_ROOT}")
        media_files = os.listdir(settings.MEDIA_ROOT)
        print(f"📁 Media files found: {len(media_files)}")
        if media_files:
            print(f"📁 Sample files: {media_files[:5]}")  # Show first 5 files
    else:
        print(f"❌ Media directory does not exist: {settings.MEDIA_ROOT}")
        print("💡 This could cause 500 errors when serving product images")
    
    print()
    
    # Check products with images
    products_with_images = Product.objects.exclude(image_url__isnull=True).exclude(image_url='')[:5]
    print(f"📦 Products with images: {products_with_images.count()}")
    
    for product in products_with_images:
        print(f"  - {product.name}: {product.image_url}")
        if product.image_url:
            # Test if the image URL would be accessible
            if product.image_url.startswith('http'):
                print(f"    ✅ External URL: {product.image_url}")
            else:
                # Local media file - construct full URL
                full_url = settings.MEDIA_URL + product.image_url
                print(f"    🔗 Local media URL: {full_url}")
    
    print()
    print("🌐 Testing Media URL Configuration...")
    
    # Test Django URL configuration
    try:
        client = Client()
        response = client.get('/media/')
        print(f"📡 Media URL response status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Media URL is accessible")
        elif response.status_code == 404:
            print("⚠️ Media URL returns 404 - check URL configuration")
        else:
            print(f"❌ Media URL error: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Media URL test failed: {e}")
    
    print()
    print("=" * 50)
    print("🎯 Media Serving Test Complete")
    
    # Recommendations
    print("\n💡 RECOMMENDATIONS:")
    print("1. Ensure media directory is deployed to Render")
    print("2. Check render.yaml staticPublishPath includes 'media'")
    print("3. Verify WhiteNoise is serving media files")
    print("4. Test product image URLs in browser")
    print("5. Check Render logs for media file errors")

if __name__ == "__main__":
    test_media_serving()
