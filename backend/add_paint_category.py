#!/usr/bin/env python
"""
Script to add Paint category to the database
"""

import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hardware_api.settings.dev')

# Setup Django
import django
django.setup()

from apps.products.models import Category

def add_paint_category():
    """Add Paint category to the database"""
    
    # Check if Paint category already exists
    existing_category = Category.objects.filter(name__iexact='Paint').first()
    if existing_category:
        print(f"❌ Category 'Paint' already exists with ID: {existing_category.id}")
        return existing_category
    
    # Create Paint category
    paint_category = Category.objects.create(
        name='Paint',
        slug='paint',
        description='Paint and painting supplies for construction and home improvement',
        is_active=True
    )
    
    print(f"✅ Successfully created 'Paint' category with ID: {paint_category.id}")
    print(f"📝 Name: {paint_category.name}")
    print(f"🔗 Slug: {paint_category.slug}")
    print(f"📄 Description: {paint_category.description}")
    
    return paint_category

if __name__ == '__main__':
    try:
        category = add_paint_category()
        print(f"\n🎉 Paint category is ready for use!")
    except Exception as e:
        print(f"❌ Error creating Paint category: {e}")
        sys.exit(1)
