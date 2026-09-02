#!/usr/bin/env python
"""
Script to remove remaining test products and their associated unused categories and brands
"""

import os
import django
from pathlib import Path

# Setup Django
BASE_DIR = Path(__file__).resolve().parent
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hardware_api.settings.dev')
django.setup()

from apps.products.models import Product, Category, Brand

def remove_remaining_test_products():
    print('🗑️ REMOVING REMAINING TEST PRODUCTS')
    print('=' * 40)
    
    # Target products to remove
    target_names = ["testproduct876", "testproduc7677890098", "Testproducts1111", "testproduct87699"]
    
    # Find products matching these names (case-insensitive)
    products_to_remove = Product.objects.filter(name__in=[name.lower() for name in target_names])
    
    # Also check for case variations
    for name in target_names:
        products_to_remove |= Product.objects.filter(name__icontains=name)
    
    # Remove duplicates
    products_to_remove = products_to_remove.distinct()
    
    print(f'📦 Found {products_to_remove.count()} products to remove:')
    
    if products_to_remove.count() == 0:
        print('✅ No matching test products found.')
        return
    
    # Show what will be deleted
    for product in products_to_remove:
        print(f'   - {product.name} (ID: {product.id})')
        print(f'     Category: {product.category.name if product.category else "None"}')
        print(f'     Brand: {product.brand.name if product.brand else "None"}')
        print(f'     Active: {product.is_active}')
        print()
    
    # Get categories and brands used by these products
    product_categories = set()
    product_brands = set()
    
    for product in products_to_remove:
        if product.category:
            product_categories.add(product.category.id)
        if product.brand:
            product_brands.add(product.brand.id)
    
    # Check if categories/brands are used by other active products
    categories_to_delete = []
    brands_to_delete = []
    
    for category_id in product_categories:
        category = Category.objects.get(id=category_id)
        other_active_products = Product.objects.filter(
            category=category, 
            is_active=True
        ).exclude(id__in=products_to_remove.values('id'))
        
        if other_active_products.count() == 0:
            categories_to_delete.append(category)
            print(f'📂 Category "{category.name}" will be deleted (no other active products)')
    
    for brand_id in product_brands:
        brand = Brand.objects.get(id=brand_id)
        other_active_products = Product.objects.filter(
            brand=brand, 
            is_active=True
        ).exclude(id__in=products_to_remove.values('id'))
        
        if other_active_products.count() == 0:
            brands_to_delete.append(brand)
            print(f'🏷️ Brand "{brand.name}" will be deleted (no other active products)')
    
    # Confirm deletion
    print(f'\n⚠️  Ready to delete:')
    print(f'   📦 Products: {products_to_remove.count()}')
    print(f'   📂 Categories: {len(categories_to_delete)}')
    print(f'   🏷️ Brands: {len(brands_to_delete)}')
    
    confirm = input('\n⚠️  Do you want to proceed with deletion? (yes/no): ').lower().strip()
    if confirm != 'yes':
        print('❌ Deletion cancelled.')
        return
    
    # Delete products
    deleted_products = products_to_remove.delete()[0]
    print(f'🗑️ Deleted {deleted_products} products')
    
    # Delete unused categories
    deleted_categories = 0
    for category in categories_to_delete:
        print(f'   📂 Deleting category: {category.name}')
        category.delete()
        deleted_categories += 1
    
    # Delete unused brands
    deleted_brands = 0
    for brand in brands_to_delete:
        print(f'   🏷️ Deleting brand: {brand.name}')
        brand.delete()
        deleted_brands += 1
    
    print('\n✅ Cleanup completed!')
    print(f'📊 Remaining active products: {Product.objects.filter(is_active=True).count()}')
    print(f'📂 Remaining categories: {Category.objects.count()}')
    print(f'🏷️ Remaining brands: {Brand.objects.count()}')
    
    # Show remaining products
    print('\n📦 Remaining Products:')
    for product in Product.objects.all():
        print(f'   - {product.name}')

if __name__ == '__main__':
    remove_remaining_test_products()
