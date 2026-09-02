# Remove ProductImage Table - Migration Instructions

## What Changed
- Removed ProductImage table integration
- Added `image_url` field directly to Product model
- Updated serializers to handle direct image URL
- Removed backend API endpoint for saving images

## Database Migration Required

Run these commands to update your database:

```bash
# 1. Create migration file
python manage.py makemigrations products

# 2. Apply migration
python manage.py migrate

# 3. (Optional) Remove ProductImage table and model if no longer needed
# After confirming everything works, you can remove:
# - ProductImage model from models.py
# - ProductImageSerializer from serializers.py
```

## New Flow
1. Image uploads to Supabase storage
2. Supabase URL returned to frontend
3. URL saved directly in Product.image_url field
4. No separate ProductImage table needed

## Benefits
- Simpler database schema
- Fewer API calls
- More reliable (Supabase URLs are permanent)
- Better performance (no joins needed)
- Easier maintenance
