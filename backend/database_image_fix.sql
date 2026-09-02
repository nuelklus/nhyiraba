-- SQL Script to fix localhost image URLs in production
-- Run this in your Supabase SQL Editor

-- First, let's see what we have
SELECT 
    id, 
    name, 
    sku, 
    image_url,
    CASE 
        WHEN image_url LIKE 'http://localhost:8000/media/%' THEN 'LOCALHOST_URL'
        WHEN image_url LIKE '%supabase%' THEN 'SUPABASE_URL'
        WHEN image_url IS NULL OR image_url = '' THEN 'NO_IMAGE'
        ELSE 'OTHER'
    END as url_type
FROM products_product 
ORDER BY url_type, name;

-- Update localhost URLs to Supabase URLs
-- Replace 'your-project-ref' with your actual Supabase project reference
UPDATE products_product 
SET image_url = REPLACE(
    image_url, 
    'http://localhost:8000/media/products/', 
    'https://your-project-ref.supabase.co/storage/v1/object/public/products/'
)
WHERE image_url LIKE 'http://localhost:8000/media/%';

-- Verify the update
SELECT 
    id, 
    name, 
    sku, 
    image_url,
    CASE 
        WHEN image_url LIKE 'http://localhost:8000/media/%' THEN 'LOCALHOST_URL'
        WHEN image_url LIKE '%supabase%' THEN 'SUPABASE_URL'
        WHEN image_url IS NULL OR image_url = '' THEN 'NO_IMAGE'
        ELSE 'OTHER'
    END as url_type
FROM products_product 
ORDER BY url_type, name;

-- Count results
SELECT 
    url_type,
    COUNT(*) as count
FROM (
    SELECT 
        CASE 
            WHEN image_url LIKE 'http://localhost:8000/media/%' THEN 'LOCALHOST_URL'
            WHEN image_url LIKE '%supabase%' THEN 'SUPABASE_URL'
            WHEN image_url IS NULL OR image_url = '' THEN 'NO_IMAGE'
            ELSE 'OTHER'
        END as url_type
    FROM products_product
) as url_stats
GROUP BY url_type;
