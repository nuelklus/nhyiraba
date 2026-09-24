from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ('pos', '0001_initial'),
        ('products', '0009_product_units_and_decimal_stock'),
    ]

    operations = [
        migrations.AlterField(
            model_name='transactionitem',
            name='quantity',
            field=models.DecimalField(decimal_places=3, max_digits=12),
        ),
        migrations.AddField(
            model_name='transactionitem', name='product_unit',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT,
                                    to='products.productunit'),
        ),
        migrations.AddField(model_name='transactionitem', name='base_quantity',
                            field=models.DecimalField(decimal_places=3, default=0, max_digits=12)),
        migrations.AddField(model_name='transactionitem', name='unit_name',
                            field=models.CharField(blank=True, max_length=50)),
        migrations.AddField(model_name='transactionitem', name='base_unit',
                            field=models.CharField(blank=True, max_length=20)),
    ]
