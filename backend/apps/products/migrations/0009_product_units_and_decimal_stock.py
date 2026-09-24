from django.db import migrations, models
import django.db.models.deletion


def create_base_units(apps, schema_editor):
    Product = apps.get_model('products', 'Product')
    ProductUnit = apps.get_model('products', 'ProductUnit')
    for product in Product.objects.all().iterator():
        ProductUnit.objects.get_or_create(
            product=product, name='Piece',
            defaults={'abbreviation': 'pc', 'unit_type': product.base_unit,
                      'conversion_to_base': 1, 'selling_price': product.price,
                      'active': True, 'is_base': True},
        )


class Migration(migrations.Migration):
    dependencies = [('products', '0008_product_expiry_date')]

    operations = [
        migrations.AddField(
            model_name='product', name='base_unit',
            field=models.CharField(choices=[('piece', 'Piece'), ('kg', 'Kilogram'), ('g', 'Gram'),
                                            ('liter', 'Liter'), ('ml', 'Milliliter'), ('box', 'Box'),
                                            ('carton', 'Carton'), ('pack', 'Pack')],
                                   default='piece', max_length=20),
        ),
        migrations.CreateModel(
            name='ProductUnit',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=50)),
                ('abbreviation', models.CharField(blank=True, max_length=20)),
                ('unit_type', models.CharField(choices=[('piece', 'Piece'), ('kg', 'Kilogram'), ('g', 'Gram'),
                                                        ('liter', 'Liter'), ('ml', 'Milliliter'), ('box', 'Box'),
                                                        ('carton', 'Carton'), ('pack', 'Pack')], max_length=20)),
                ('conversion_to_base', models.DecimalField(decimal_places=6, default=1, max_digits=12)),
                ('selling_price', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('active', models.BooleanField(default=True)),
                ('is_base', models.BooleanField(default=False)),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='units', to='products.product')),
            ],
            options={'ordering': ['name']},
        ),
        migrations.AddConstraint(
            model_name='productunit',
            constraint=models.UniqueConstraint(fields=('product', 'name'), name='products_unit_product_name_uniq'),
        ),
        migrations.AddConstraint(
            model_name='productunit',
            constraint=models.UniqueConstraint(condition=models.Q(is_base=True), fields=('product',), name='products_one_base_unit'),
        ),
        migrations.AlterField(model_name='product', name='stock_quantity',
                              field=models.DecimalField(decimal_places=3, default=0, max_digits=12)),
        migrations.AlterField(model_name='product', name='low_stock_threshold',
                              field=models.DecimalField(decimal_places=3, default=5, max_digits=12)),
        migrations.AlterField(model_name='product', name='pos_stock_quantity',
                              field=models.DecimalField(decimal_places=3, default=0, max_digits=12, help_text='Stock quantity from POS system')),
        migrations.AlterField(model_name='inventorytransaction', name='quantity_change',
                              field=models.DecimalField(decimal_places=3, help_text='Positive for stock in, negative for stock out', max_digits=12)),
        migrations.AlterField(model_name='inventorytransaction', name='quantity_before',
                              field=models.DecimalField(decimal_places=3, max_digits=12)),
        migrations.AlterField(model_name='inventorytransaction', name='quantity_after',
                              field=models.DecimalField(decimal_places=3, max_digits=12)),
        migrations.RunPython(create_base_units, migrations.RunPython.noop),
    ]
