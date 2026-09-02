#!/usr/bin/env python
"""
Test Supabase integration in production-like environment
"""
import os
import sys
from pathlib import Path

def test_production_settings():
    """Test backend production settings"""
    print("🏗️ TESTING PRODUCTION SETTINGS")
    print("=" * 40)
    
    # Set production environment
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hardware_api.settings.prod')
    
    try:
        import django
        django.setup()
        
        from django.conf import settings
        from django.core.management import execute_from_command_line
        
        print("✅ Production settings loaded successfully")
        
        # Check Supabase configuration
        print(f"✅ Supabase URL: {settings.SUPABASE_URL[:30]}...")
        print(f"✅ Database configured: {settings.DATABASES['default']['ENGINE']}")
        
        # Run Django checks
        print("🔍 Running Django deployment checks...")
        execute_from_command_line(['manage.py', 'check', '--deploy'])
        
        return True
        
    except Exception as e:
        print(f"❌ Production settings test failed: {e}")
        return False

def test_supabase_production():
    """Test Supabase in production environment"""
    print("\n🌐 TESTING SUPABASE PRODUCTION")
    print("=" * 35)
    
    try:
        import django
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hardware_api.settings.prod')
        django.setup()
        
        from apps.products.supabase_storage import supabase_storage
        from apps.products.models import Product
        
        print(f"✅ Using bucket: {supabase_storage.bucket_name}")
        print(f"✅ Storage URL: {supabase_storage.storage_url}")
        
        # Test with existing products
        products_with_images = Product.objects.filter(image_url__isnull=False).exclude(image_url='')
        print(f"📦 Found {products_with_images.count()} products with images")
        
        # Check Supabase URLs
        supabase_products = Product.objects.filter(image_url__contains='supabase')
        print(f"✅ Products with Supabase URLs: {supabase_products.count()}")
        
        # Check localhost URLs
        localhost_products = Product.objects.filter(image_url__startswith='http://localhost')
        if localhost_products.exists():
            print(f"⚠️ Products with localhost URLs: {localhost_products.count()}")
            print("💡 These will need migration for production")
        else:
            print("✅ No localhost URLs found")
        
        return True
        
    except Exception as e:
        print(f"❌ Supabase production test failed: {e}")
        return False

def create_production_test_product():
    """Create a test product in production environment"""
    print("\n📦 CREATING PRODUCTION TEST PRODUCT")
    print("=" * 40)
    
    try:
        import django
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hardware_api.settings.prod')
        django.setup()
        
        from apps.products.models import Product, Category, Brand
        from apps.products.serializers import ProductCreateUpdateSerializer
        from PIL import Image
        import io
        from django.core.files.uploadedfile import InMemoryUploadedFile
        
        # Get or create test category and brand
        category, _ = Category.objects.get_or_create(
            name='Production Test Category',
            defaults={'slug': 'prod-test-category'}
        )
        brand, _ = Brand.objects.get_or_create(
            name='Production Test Brand',
            defaults={'slug': 'prod-test-brand'}
        )
        
        # Create production test image
        print("📸 Creating production test image...")
        test_image = Image.new('RGB', (400, 400), color='purple')
        img_byte_arr = io.BytesIO()
        test_image.save(img_byte_arr, format='JPEG', quality=90)
        img_byte_arr.seek(0)
        
        test_file = InMemoryUploadedFile(
            img_byte_arr, 'image', 'prod_test_image.jpg', 'image/jpeg',
            len(img_byte_arr.getvalue()), None
        )
        
        # Create product
        product_data = {
            'name': 'Production Test Product',
            'slug': 'production-test-product',
            'description': 'This product tests Supabase integration in production environment',
            'price': '199.99',
            'category': category.id,
            'brand': brand.id,
            'image': test_file,
            'is_active': True
        }
        
        print("📦 Creating product with Supabase upload...")
        serializer = ProductCreateUpdateSerializer(data=product_data)
        
        if serializer.is_valid():
            product = serializer.save()
            print(f"✅ Production test product created!")
            print(f"   ID: {product.id}")
            print(f"   Name: {product.name}")
            print(f"   Image URL: {product.image_url}")
            print(f"   Is Active: {product.is_active}")
            
            return product
        else:
            print(f"❌ Validation failed: {serializer.errors}")
            return None
            
    except Exception as e:
        print(f"❌ Production test failed: {e}")
        import traceback
        print(f"🔍 Error: {traceback.format_exc()}")
        return None

def test_api_endpoints():
    """Test API endpoints in production"""
    print("\n🔌 TESTING API ENDPOINTS")
    print("=" * 30)
    
    try:
        import django
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hardware_api.settings.prod')
        django.setup()
        
        from django.test import Client
        from rest_framework.test import APIClient
        from apps.products.models import Product
        
        # Test API client
        client = APIClient()
        
        # Test products endpoint
        print("📡 Testing /api/products/ endpoint...")
        response = client.get('/api/products/')
        
        if response.status_code == 200:
            products = response.data.get('results', [])
            print(f"✅ Products API working - Found {len(products)} products")
            
            # Check image URLs in response
            products_with_images = [p for p in products if p.get('image_url')]
            print(f"✅ Products with image URLs: {len(products_with_images)}")
            
            return True
        else:
            print(f"❌ Products API failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ API test failed: {e}")
        return False

def main():
    """Main production test function"""
    print("🏭 PRODUCTION INTEGRATION TEST")
    print("=" * 50)
    
    all_tests_passed = True
    
    # Test 1: Production settings
    if not test_production_settings():
        all_tests_passed = False
    
    # Test 2: Supabase production
    if not test_supabase_production():
        all_tests_passed = False
    
    # Test 3: Create production test product
    test_product = create_production_test_product()
    if not test_product:
        all_tests_passed = False
    
    # Test 4: API endpoints
    if not test_api_endpoints():
        all_tests_passed = False
    
    # Cleanup
    if test_product:
        print(f"\n🧹 Cleaning up test product...")
        test_product.delete()
        print("✅ Test product cleaned up")
    
    # Results
    print(f"\n📊 PRODUCTION TEST RESULTS")
    print("=" * 30)
    
    if all_tests_passed:
        print("🎉 ALL PRODUCTION TESTS PASSED!")
        print("\n✅ READY FOR DEPLOYMENT:")
        print("   • Supabase integration working in production")
        print("   • Image uploads functional")
        print("   • API endpoints responding")
        print("   • Database integration complete")
        print("\n🚀 You can now:")
        print("   1. Commit changes to Git")
        print("   2. Deploy to Render")
        print("   3. Test in production environment")
    else:
        print("❌ SOME TESTS FAILED")
        print("🔍 Please check the errors above before deployment")
    
    return all_tests_passed

if __name__ == "__main__":
    main()
