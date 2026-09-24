from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase

from apps.pos.models import Transaction, TransactionItem
from .inventory_service import sell_product
from .models import Brand, Category, InventoryTransaction, Product, ProductUnit, StoreProductStock


class ProductUnitConversionTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username='unit-teller', password='secret', role='STAFF'
        )
        category = Category.objects.create(name='Test', slug='test')
        brand = Brand.objects.create(name='Test Brand', slug='test-brand')
        self.product = Product.objects.create(
            name='Bulk Goods', slug='bulk-goods', description='Test product',
            sku='BULK-1', category=category, brand=brand, price=Decimal('3.00'),
            base_unit='piece', stock_quantity=Decimal('24'),
        )
        self.piece = ProductUnit.objects.create(
            product=self.product, name='Piece', unit_type='piece',
            conversion_to_base=1, selling_price=Decimal('3.00'), is_base=True,
        )
        self.carton = ProductUnit.objects.create(
            product=self.product, name='Carton', unit_type='carton',
            conversion_to_base=12, selling_price=Decimal('30.00'),
        )

    def test_carton_sale_converts_and_snapshots_base_quantity(self):
        product, unit, base_quantity = sell_product(
            self.product.id, Decimal('2'), self.carton.id, self.user, 'TX-CARTON'
        )
        self.assertEqual(unit, self.carton)
        self.assertEqual(base_quantity, Decimal('24'))
        self.assertEqual(product.stock_quantity, Decimal('0.000'))
        movement = InventoryTransaction.objects.get(reference='TX-CARTON')
        self.assertEqual(movement.quantity_change, Decimal('-24'))

    def test_fractional_kg_sale(self):
        product = Product.objects.create(
            name='Rice', slug='rice', description='Rice', sku='RICE-1',
            category=self.product.category, brand=self.product.brand,
            price=Decimal('10.00'), base_unit='kg', stock_quantity=Decimal('5'),
        )
        kg = ProductUnit.objects.create(
            product=product, name='Kilogram', unit_type='kg',
            conversion_to_base=1, selling_price=Decimal('10.00'), is_base=True,
        )
        _, _, base_quantity = sell_product(product.id, Decimal('0.375'), kg.id, self.user)
        product.refresh_from_db()
        self.assertEqual(base_quantity, Decimal('0.375'))
        self.assertEqual(product.stock_quantity, Decimal('4.625'))

    def test_sale_rejects_negative_result(self):
        with self.assertRaises(ValidationError):
            sell_product(self.product.id, Decimal('3'), self.carton.id, self.user)

    def test_sale_uses_branch_stock_without_changing_main_stock(self):
        StoreProductStock.objects.create(
            product=self.product, store_id='branch-2', quantity=Decimal('5')
        )
        sell_product(self.product.id, Decimal('2'), self.piece.id, self.user, store_id='branch-2')
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, Decimal('24.000'))
        self.assertEqual(
            StoreProductStock.objects.get(product=self.product, store_id='branch-2').quantity,
            Decimal('3.000'),
        )


class POSTransactionUnitSnapshotTests(TestCase):
    def test_transaction_item_stores_unit_and_base_quantity(self):
        user = get_user_model().objects.create_user(username='cashier', password='secret')
        category = Category.objects.create(name='Snapshot', slug='snapshot')
        brand = Brand.objects.create(name='Snapshot Brand', slug='snapshot-brand')
        product = Product.objects.create(
            name='Boxed', slug='boxed', description='Boxed', sku='BOX-1',
            category=category, brand=brand, price=Decimal('2.00'),
        )
        ProductUnit.objects.create(
            product=product, name='Piece', unit_type='piece',
            conversion_to_base=1, selling_price=Decimal('2.00'), is_base=True,
        )
        unit = ProductUnit.objects.create(
            product=product, name='Box', unit_type='box', conversion_to_base=10,
            selling_price=Decimal('18.00'),
        )
        transaction = Transaction.objects.create(
            user=user, store_id='main', subtotal=Decimal('18'),
            tax_amount=0, total_amount=Decimal('18'), amount_paid=Decimal('18'),
        )
        item = TransactionItem.objects.create(
            transaction=transaction, product=product, product_unit=unit,
            quantity=Decimal('1'), base_quantity=Decimal('10'), unit_name=unit.name,
            base_unit='piece', unit_price=Decimal('18'), total_price=Decimal('18'),
            product_name=product.name, product_sku=product.sku,
        )
        item.refresh_from_db()
        self.assertEqual(item.product_unit_id, unit.id)
        self.assertEqual(item.base_quantity, Decimal('10'))
