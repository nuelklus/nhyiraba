#!/usr/bin/env python
"""
Script to upload specific image files from Downloads folder to Supabase storage
"""

import os
import django
from pathlib import Path
from PIL import Image

# Setup Django
BASE_DIR = Path(__file__).resolve().parent
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hardware_api.settings.dev')
django.setup()

from apps.products.supabase_storage import supabase_storage

def upload_specific_images():
    print('📤 UPLOADING SPECIFIC IMAGES TO SUPABASE')
    print('=' * 45)
    
    # Target files in Downloads folder
    target_files = [
        "Diamond-cement.jpg",
        "Bolts.jpg", 
        "nails.jpg"
    ]
    
    # Downloads folder path
    downloads_path = Path.home() / "Downloads"
    
    print(f'📁 Looking for files in: {downloads_path}')
    print()
    
    uploaded_files = []
    failed_files = []
    
    for filename in target_files:
        file_path = downloads_path / filename
        
        print(f'🔍 Processing: {filename}')
        
        # Check if file exists
        if not file_path.exists():
            print(f'   ❌ File not found: {file_path}')
            failed_files.append((filename, "File not found"))
            continue
        
        # Check if it's actually a file
        if not file_path.is_file():
            print(f'   ❌ Not a file: {file_path}')
            failed_files.append((filename, "Not a file"))
            continue
        
        try:
            # Validate it's an image
            with Image.open(file_path) as img:
                print(f'   📷 Image format: {img.format}')
                print(f'   📏 Image size: {img.size}')
                print(f'   📊 File size: {file_path.stat().st_size} bytes')
            
            # Upload to Supabase
            print(f'   📤 Uploading to Supabase...')
            # Open file in binary mode for upload
            with open(file_path, 'rb') as file_obj:
                success, url, error = supabase_storage.upload_image(file_obj)
            
            if success and url:
                print(f'   ✅ Upload successful!')
                print(f'   🔗 URL: {url}')
                uploaded_files.append((filename, url))
            else:
                print(f'   ❌ Upload failed: {error}')
                failed_files.append((filename, error))
                
        except Exception as e:
            print(f'   ❌ Error processing file: {str(e)}')
            failed_files.append((filename, str(e)))
        
        print()
    
    # Summary
    print('📊 UPLOAD SUMMARY')
    print('=' * 20)
    print(f'✅ Successfully uploaded: {len(uploaded_files)}')
    print(f'❌ Failed uploads: {len(failed_files)}')
    
    if uploaded_files:
        print()
        print('✅ UPLOADED FILES:')
        for filename, url in uploaded_files:
            print(f'   📎 {filename}')
            print(f'      🔗 {url}')
    
    if failed_files:
        print()
        print('❌ FAILED UPLOADS:')
        for filename, error in failed_files:
            print(f'   📎 {filename}: {error}')
    
    print()
    print('🎯 You can now use these URLs in your product image_url fields!')
    
    return uploaded_files, failed_files

if __name__ == '__main__':
    upload_specific_images()
