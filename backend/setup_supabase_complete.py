#!/usr/bin/env python
"""
Complete Supabase setup for image storage
"""
import os
import sys
import django
from pathlib import Path

def update_settings_file():
    """Update base.py with Supabase storage configuration"""
    print("🔧 UPDATING DJANGO SETTINGS FOR SUPABASE")
    print("=" * 50)
    
    settings_file = Path("hardware_api/settings/base.py")
    
    if not settings_file.exists():
        print("❌ Settings file not found")
        return False
    
    # Read current settings
    with open(settings_file, 'r') as f:
        content = f.read()
    
    # Check if Supabase config already exists
    if "SUPABASE_URL" in content:
        print("✅ Supabase settings already exist")
        return True
    
    # Add Supabase configuration
    supabase_config = '''
# Supabase Configuration
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://your-project.supabase.co')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY', 'your-anon-key')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY', 'your-service-key')

'''
    
    # Insert after database configuration
    db_end = content.find('}')
    if db_end != -1:
        insert_pos = content.find('\n', db_end) + 1
        new_content = content[:insert_pos] + supabase_config + content[insert_pos:]
        
        # Write updated settings
        with open(settings_file, 'w') as f:
            f.write(new_content)
        
        print("✅ Supabase configuration added to settings")
        return True
    else:
        print("❌ Could not find database configuration")
        return False

def install_supabase_client():
    """Install Supabase Python client"""
    print("\n📦 INSTALLING SUPABASE CLIENT")
    print("=" * 30)
    
    try:
        import subprocess
        result = subprocess.run([sys.executable, '-m', 'pip', 'install', 'supabase'], 
                              capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Supabase client installed successfully")
            return True
        else:
            print(f"❌ Installation failed: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ Installation error: {e}")
        return False

def create_env_template():
    """Create .env template with Supabase credentials"""
    print("\n📝 CREATING ENVIRONMENT TEMPLATE")
    print("=" * 40)
    
    env_template = """
# DATABASE (you already have these)
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres.xxxxxx
SUPABASE_DB_PASSWORD=mnXfvRtXM3xxxxx
SUPABASE_DB_HOST=aws-1-eu-west-1.xxxxxx.supabase.co
SUPABASE_DB_PORT=5432

# STORAGE (add these to your .env file)
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# JWT
DJANGO_SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key

# Other settings...
"""
    
    print("📋 Add these to your backend/.env file:")
    print(env_template)
    
    return True

def main():
    """Main setup function"""
    print("🚀 COMPLETE SUPABASE SETUP")
    print("=" * 50)
    
    # Step 1: Update settings
    if not update_settings_file():
        print("❌ Failed to update settings")
        return False
    
    # Step 2: Install client
    if not install_supabase_client():
        print("❌ Failed to install client")
        return False
    
    # Step 3: Create env template
    if not create_env_template():
        print("❌ Failed to create template")
        return False
    
    print("\n🎉 SETUP COMPLETED!")
    print("\n📋 NEXT STEPS:")
    print("1. Add SUPABASE_URL to your .env file")
    print("2. Add SUPABASE_ANON_KEY to your .env file")
    print("3. Add SUPABASE_SERVICE_KEY to your .env file")
    print("4. Run: python setup_supabase_images.py")
    print("5. Test: python manage.py runserver")
    
    return True

if __name__ == "__main__":
    main()
