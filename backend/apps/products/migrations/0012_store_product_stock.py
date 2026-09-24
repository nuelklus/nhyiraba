from django.db import migrations, models
import django.db.models.deletion


def migrate_legacy_stock(apps, schema_editor):
    Product = apps.get_model('products', 'Product')
    StoreProductStock = apps.get_model('products', 'StoreProductStock')
    StoreProductStock.objects.bulk_create([
        StoreProductStock(product_id=product.id, store_id='main',
                          quantity=product.stock_quantity)
        for product in Product.objects.all().iterator()
    ], ignore_conflicts=True)


class Migration(migrations.Migration):
    dependencies = [
        ('products', '0011_product_unit_choices_timestamps'),
    ]

    operations = [
        migrations.CreateModel(
            name='StoreProductStock',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('store_id', models.CharField(default='main', max_length=100)),
                ('quantity', models.DecimalField(decimal_places=3, default=0, max_digits=12)),
                ('sync_version', models.IntegerField(default=0)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                                              related_name='store_stocks', to='products.product')),
            ],
            options={
                'indexes': [
                    models.Index(fields=['store_id', 'product'], name='products_store_product_idx'),
                ],
                'constraints': [
                    models.UniqueConstraint(fields=('store_id', 'product'),
                                            name='products_store_product_unique'),
                ],
            },
        ),
        migrations.RunPython(migrate_legacy_stock, migrations.RunPython.noop),
    ]
