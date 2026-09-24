from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('products', '0009_product_units_and_decimal_stock')]
    operations = [
        migrations.AlterField(model_name='stocksynclog', name='old_quantity',
                              field=models.DecimalField(decimal_places=3, help_text='Previous stock quantity', max_digits=12)),
        migrations.AlterField(model_name='stocksynclog', name='new_quantity',
                              field=models.DecimalField(decimal_places=3, help_text='New stock quantity', max_digits=12)),
        migrations.AlterField(model_name='stocksynclog', name='change_amount',
                              field=models.DecimalField(decimal_places=3, help_text='Quantity change (+ or -)', max_digits=12)),
    ]
