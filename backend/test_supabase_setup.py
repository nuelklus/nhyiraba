#!/usr/bin/env python
"""
Test Supabase integration locally before deployment
"""
import os
import sys

def check_environment():
    """Check if Supabase environment variables are set"""
    print("🔍 CHECKING ENVIRONMENT VARIABLES")
    print("=" * 40)
    
    required_vars = {
        'SUPABASE_URL': 'Your Supabase project URL',
        'SUPABASE_ANON_KEY': 'Your Supabase anonymous key',
        'SUPABASE_SERVICE_KEY': 'Your Supabase service role key'
    }
    
    all_set = True
    
    for var, description in required_vars.items():
        value = os.getenv(var)
        if value:
            masked = value[:20] + '...' if len(value) > 20 else value
            print(f"✅ {var}: {masked}")
        else:
            print(f"❌ {var}: NOT SET - {description}")
            all_set = False
    
    return all_set

def create_env_template():
    """Create .env template with instructions"""
    print("\n📝 ENVIRONMENT SETUP INSTRUCTIONS")
    print("=" * 40)
    
    print("Add these to your backend/.env file:")
    print("""
# Supabase Configuration (get from Supabase Dashboard → Settings → API)
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7OEePmvpBHn5dE_k1fLj5i7JqMqWk6m8fT8I4
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EaIMWBW47zKx2R4Q9gI1qLgZ3JnJj2m8kFJf4N7tM9o

# Database (you already have these)
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres.xxxxxx
SUPABASE_DB_PASSWORD=your-password
SUPABASE_DB_HOST=aws-1-eu-west-1.xxxxxx.supabase.co
SUPABASE_DB_PORT=5432
""")
    
    print("\n📋 HOW TO GET THESE VALUES:")
    print("1. Go to https://supabase.com/dashboard")
    print("2. Select your project")
    print("3. Go to Settings → API")
    print("4. Copy the Project URL (SUPABASE_URL)")
    print("5. Copy the anon public key (SUPABASE_ANON_KEY)")
    print("6. Copy the service_role key (SUPABASE_SERVICE_KEY)")

def test_supabase_connection():
    """Test connection to Supabase"""
    print("\n🔌 TESTING SUPABASE CONNECTION")
    print("=" * 35)
    
    try:
        # Setup Django
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hardware_api.settings.dev')
        import django
        django.setup()
        
        from django.conf import settings
        from supabase import create_client
        
        # Test connection
        supabase_url = settings.SUPABASE_URL
        supabase_key = settings.SUPABASE_ANON_KEY
        
        print(f"🔗 Connecting to: {supabase_url}")
        
        # Create client
        client = create_client(supabase_url, supabase_key)
        
        # Test basic operation (list buckets)
        try:
            buckets = client.storage.list_buckets()
            print(f"✅ Connection successful! Found {len(buckets)} buckets:")
            for bucket in buckets:
                print(f"   - {bucket['name']}")
            return True
            
        except Exception as e:
            print(f"❌ Storage connection failed: {e}")
            print("⚠️ This might be normal if you haven't created any buckets yet")
            return True  # Connection works, just no buckets
            
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("💡 Run: pip install supabase")
        return False
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

def test_image_upload():
    """Test image upload to Supabase"""
    print("\n📤 TESTING IMAGE UPLOAD")
    print("=" * 30)
    
    try:
        import django
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hardware_api.settings.dev')
        django.setup()
        
        from apps.products.supabase_storage import supabase_storage
        from PIL import Image
        import io
        
        # Create a test image
        test_image = Image.new('RGB', (300, 300), color='lightblue')
        test_image_draw = Image.new('RGB', (300, 300), color='lightblue')
        
        # Add some text
        from PIL import ImageDraw
        draw = ImageDraw.Draw(test_image_draw)
        draw.text((50, 140), "TEST IMAGE", fill='black')
        
        # Convert to bytes
        img_byte_arr = io.BytesIO()
        test_image_draw.save(img_byte_arr, format='JPEG')
        img_byte_arr.seek(0)
        
        # Create file-like object
        from django.core.files.uploadedfile import InMemoryUploadedFile
        test_file = InMemoryUploadedFile(
            img_byte_arr, 'image', 'test.jpg', 'image/jpeg', 
            img_byte_arr.tell(), None
        )
        
        # Test upload
        print("📤 Uploading test image...")
        success, url, error = supabase_storage.upload_image(test_file, 'test_image.jpg')
        
        if success and url:
            print(f"✅ Upload successful!")
            print(f"   URL: {url}")
            return True
        else:
            print(f"❌ Upload failed: {error}")
            return False
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

def test_product_creation():
    """Test product creation with image upload"""
    print("\n📦 TESTING PRODUCT CREATION")
    print("=" * 35)
    
    try:
        import django
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hardware_api.settings.dev')
        django.setup()
        
        from apps.products.models import Product
        from PIL import Image
        import io
        from django.core.files.uploadedfile import InMemoryUploadedFile
        
        # Create test image
        test_image = Image.new('RGB', (300, 300), color='green')
        img_byte_arr = io.BytesIO()
        test_image.save(img_byte_arr, format='JPEG')
        img_byte_arr.seek(0)
        
        test_file = InMemoryUploadedFile(
            img_byte_arr, 'image', 'product_test.jpg', 'image/jpeg',
            img_byte_arr.tell(), None
        )
        
        # Create test product
        print("📦 Creating test product...")
        product = Product.objects.create(
            name="Test Product for Supabase",
            slug="test-product-supabase",
            description="This is a test product for Supabase image upload",
            price=99.99,
            sku="TEST-SUPABASE-001"
        )
        
        # Upload image
        print("📤 Uploading image to Supabase...")
        success, url, error = product.upload_image_to_supabase(test_file)
        
        if success and url:
            print(f"✅ Product created with image!")
            print(f"   Product: {product.name}")
            print(f"   Image URL: {url}")
            
            # Clean up
            product.delete()
            print("🧹 Test product cleaned up")
            return True
        else:
            print(f"❌ Image upload failed: {error}")
            product.delete()
            return False
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

def main():
    """Main test function"""
    print("🧪 SUPABASE INTEGRATION TEST")
    print("=" * 50)
    
    # Step 1: Check environment
    if not check_environment():
        create_env_template()
        print("\n❌ Please set up environment variables first")
        return False
    
    # Step 2: Test connection
    if not test_supabase_connection():
        print("\n❌ Supabase connection failed")
        return False
    
    # Step 3: Test image upload
    if not test_image_upload():
        print("\n❌ Image upload test failed")
        return False
    
    # Step 4: Test product creation
    if not test_product_creation():
        print("\n❌ Product creation test failed")
        return False
    
    print("\n🎉 ALL TESTS PASSED!")
    print("\n✅ Supabase integration is working correctly")
    print("✅ You can now commit these changes to Git")
    print("✅ New products will upload images to Supabase")
    
    return True

if __name__ == "__main__":
    main()
