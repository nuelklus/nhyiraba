from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction

from .models import InventoryTransaction, Product, ProductUnit, StoreProductStock


def get_store_stock(product, store_id='main', for_update=False):
    queryset = StoreProductStock.objects
    if for_update:
        queryset = queryset.select_for_update()
    stock, _ = queryset.get_or_create(
        product=product, store_id=store_id, defaults={'quantity': product.stock_quantity if store_id == 'main' else 0}
    )
    return stock


@transaction.atomic
def sell_product(product_id, quantity, product_unit_id=None, user=None, reference='', store_id='main'):
    """Sell a quantity in a product unit and decrement stock in base units."""
    quantity = Decimal(str(quantity))
    if quantity <= 0:
        raise ValidationError('Quantity must be greater than zero.')

    product = Product.objects.get(pk=product_id)
    stock = get_store_stock(product, store_id, for_update=True)
    if product_unit_id:
        try:
            unit = ProductUnit.objects.get(pk=product_unit_id, product=product, active=True)
        except ProductUnit.DoesNotExist:
            raise ValidationError('Invalid or inactive product unit.')
    else:
        unit = ProductUnit.objects.filter(product=product, is_base=True, active=True).first()
        if unit is None:
            unit = ProductUnit.objects.filter(product=product, unit_type=product.base_unit, active=True).first()
        if unit is None:
            unit = ProductUnit.objects.create(
                product=product, name=product.get_base_unit_display(),
                abbreviation=product.base_unit, unit_type=product.base_unit,
                conversion_to_base=1, selling_price=product.price,
                active=True, is_base=True,
            )
    if unit is None:
        raise ValidationError('No active unit is configured for this product.')

    base_quantity = quantity * unit.conversion_to_base
    before = stock.quantity
    if product.track_stock and before < base_quantity:
        raise ValidationError('Insufficient stock.')
    after = before - base_quantity if product.track_stock else before
    if product.track_stock:
        product.stock_updated_by = getattr(user, 'username', '') if user else None
        product.stock_update_source = 'pos'
        stock.quantity = after
        stock.sync_version += 1
        stock.save(update_fields=['quantity', 'sync_version', 'updated_at'])
        if store_id == 'main':
            product.stock_quantity = after
            product.pos_stock_quantity = after
            product.save(update_fields=['stock_quantity', 'pos_stock_quantity', 'stock_updated_by',
                                        'stock_update_source', 'stock_last_updated', 'updated_at'])
        InventoryTransaction.objects.create(
            product=product, transaction_type='sale', quantity_change=-base_quantity,
            quantity_before=before, quantity_after=after, reference=reference, created_by=user,
        )
    return product, unit, base_quantity
