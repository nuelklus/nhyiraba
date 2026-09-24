from django.db import migrations, models


UNIT_CHOICES = [
    ('piece', 'Piece'), ('pack', 'Pack'), ('box', 'Box'), ('carton', 'Carton'),
    ('crate', 'Crate'), ('bundle', 'Bundle'), ('dozen', 'Dozen'), ('gram', 'Gram'),
    ('kg', 'Kilogram'), ('litre', 'Litre'), ('metre', 'Metre'), ('bag', 'Bag'),
    ('sack', 'Sack'), ('roll', 'Roll'), ('set', 'Set'), ('pair', 'Pair'), ('other', 'Other'),
    ('g', 'Gram (legacy)'), ('liter', 'Liter (legacy)'), ('ml', 'Milliliter (legacy)'),
]


class Migration(migrations.Migration):
    dependencies = [('products', '0010_decimal_stock_sync_logs')]
    operations = [
        migrations.AlterField(
            model_name='product', name='base_unit',
            field=models.CharField(choices=UNIT_CHOICES, default='piece', max_length=20),
        ),
        migrations.AlterField(
            model_name='productunit', name='unit_type',
            field=models.CharField(choices=UNIT_CHOICES, max_length=20),
        ),
        migrations.AddField(
            model_name='productunit', name='created_at',
            field=models.DateTimeField(auto_now_add=True),
        ),
        migrations.AddField(
            model_name='productunit', name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
    ]
