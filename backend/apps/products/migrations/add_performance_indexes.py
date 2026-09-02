# Generated optimization migration

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0001_initial'),
    ]

    operations = [
        # Add indexes for frequently queried fields
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_product_name ON products_product(name);",
            reverse_sql="DROP INDEX IF EXISTS idx_product_name;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_product_slug ON products_product(slug);",
            reverse_sql="DROP INDEX IF EXISTS idx_product_slug;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_product_category ON products_product(category_id);",
            reverse_sql="DROP INDEX IF EXISTS idx_product_category;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_product_brand ON products_product(brand_id);",
            reverse_sql="DROP INDEX IF EXISTS idx_product_brand;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_product_is_active ON products_product(is_active);",
            reverse_sql="DROP INDEX IF EXISTS idx_product_is_active;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_product_created_at ON products_product(created_at);",
            reverse_sql="DROP INDEX IF EXISTS idx_product_created_at;"
        ),
        
        # Composite indexes for common query patterns
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_product_category_active ON products_product(category_id, is_active);",
            reverse_sql="DROP INDEX IF EXISTS idx_product_category_active;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_product_brand_active ON products_product(brand_id, is_active);",
            reverse_sql="DROP INDEX IF EXISTS idx_product_brand_active;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_product_active_featured ON products_product(is_active, is_featured);",
            reverse_sql="DROP INDEX IF EXISTS idx_product_active_featured;"
        ),
        
        # Category and brand indexes
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_category_name ON products_category(name);",
            reverse_sql="DROP INDEX IF EXISTS idx_category_name;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_category_slug ON products_category(slug);",
            reverse_sql="DROP INDEX IF EXISTS idx_category_slug;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_brand_name ON products_brand(name);",
            reverse_sql="DROP INDEX IF EXISTS idx_brand_name;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_brand_slug ON products_brand(slug);",
            reverse_sql="DROP INDEX IF EXISTS idx_brand_slug;"
        ),
    ]
