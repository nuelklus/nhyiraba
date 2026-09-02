#!/usr/bin/env python
"""
Cleanup script to remove inactive products and their associated unused categories and brands
"""

import os
import django
from pathlib import Path

# Setup Django
BASE_DIR = Path(__file__).resolve().parent
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hardware_api.settings.dev')
django.setup()

from apps.products.models import Product, Category, Brand

def cleanup_inactive_products():
    print('🧹 CLEANING INACTIVE PRODUCTS AND ASSOCIATED DATA')
    print('=' * 50)
    
    # Get all inactive products
    inactive_products = Product.objects.filter(is_active=False)
    print(f'📦 Found {inactive_products.count()} inactive products')
    
    if inactive_products.count() == 0:
        print('✅ No inactive products found. Database is already clean!')
        return
    
    # Get categories and brands used only by inactive products
    inactive_product_categories = set()
    inactive_product_brands = set()
    
    for product in inactive_products:
        if product.category:
            inactive_product_categories.add(product.category.id)
        if product.brand:
            inactive_product_brands.add(product.brand.id)
    
    print(f'📂 Categories used by inactive products: {len(inactive_product_categories)}')
    print(f'🏷️ Brands used by inactive products: {len(inactive_product_brands)}')
    
    # Show what will be deleted
    print('\n📋 Inactive products to be deleted:')
    for product in inactive_products[:5]:  # Show first 5
        print(f'   - {product.name} (Category: {product.category.name if product.category else "None"}, Brand: {product.brand.name if product.brand else "None"})')
    if inactive_products.count() > 5:
        print(f'   ... and {inactive_products.count() - 5} more')
    
    # Confirm deletion
    confirm = input('\n⚠️  Do you want to proceed with deletion? (yes/no): ').lower().strip()
    if confirm != 'yes':
        print('❌ Cleanup cancelled.')
        return
    
    # Delete inactive products
    deleted_products = inactive_products.delete()[0]
    print(f'🗑️ Deleted {deleted_products} inactive products')
    
    # Find categories that are now unused (only used by inactive products)
    unused_categories = Category.objects.filter(id__in=inactive_product_categories)
    deleted_categories = 0
    for category in unused_categories:
        active_products_count = Product.objects.filter(category=category, is_active=True).count()
        if active_products_count == 0:
            print(f'   📂 Deleting unused category: {category.name}')
            category.delete()
            deleted_categories += 1
    
    # Find brands that are now unused (only used by inactive products)
    unused_brands = Brand.objects.filter(id__in=inactive_product_brands)
    deleted_brands = 0
    for brand in unused_brands:
        active_products_count = Product.objects.filter(brand=brand, is_active=True).count()
        if active_products_count == 0:
            print(f'   🏷️ Deleting unused brand: {brand.name}')
            brand.delete()
            deleted_brands += 1
    
    print('\n✅ Cleanup completed!')
    print(f'📊 Remaining active products: {Product.objects.filter(is_active=True).count()}')
    print(f'📂 Deleted categories: {deleted_categories}')
    print(f'🏷️ Deleted brands: {deleted_brands}')
    print(f'📂 Remaining categories: {Category.objects.count()}')
    print(f'🏷️ Remaining brands: {Brand.objects.count()}')

if __name__ == '__main__':
    cleanup_inactive_products()
