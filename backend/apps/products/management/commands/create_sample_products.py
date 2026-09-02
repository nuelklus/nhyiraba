from django.core.management.base import BaseCommand
from django.db import transaction
from apps.products.models import (
    Product, Category, Brand, Warehouse, 
    ProductImage, TechnicalSpecification, WarehouseStock
)
from decimal import Decimal

class Command(BaseCommand):
    help = 'Create sample hardware products for testing'

    def handle(self, *args, **options):
        with transaction.atomic():
            # Create warehouses
            tema_warehouse, created = Warehouse.objects.get_or_create(
                code='TEMA',
                defaults={
                    'name': 'Tema Main Warehouse',
                    'address': 'Tema Industrial Area, Plot 24, Accra, Ghana',
                    'phone': '+233 30 123 4567',
                    'email': 'tema@hardwarehub.com'
                }
            )
            
            accra_warehouse, created = Warehouse.objects.get_or_create(
                code='ACCRA',
                defaults={
                    'name': 'Accra Distribution Center',
                    'address': 'Spintex Road, Accra, Ghana',
                    'phone': '+233 30 987 6543',
                    'email': 'accra@hardwarehub.com'
                }
            )

            # Create categories
            categories_data = [
                ('Power Tools', 'power-tools', 'Cordless drills, saws, grinders and more'),
                ('Hand Tools', 'hand-tools', 'Wrenches, sockets, pliers and manual tools'),
                ('Electrical', 'electrical', 'Wiring, lighting, circuit breakers and electrical supplies'),
                ('Plumbing', 'plumbing', 'Pipes, fittings, valves and plumbing supplies'),
                ('Building Materials', 'building-materials', 'Cement, blocks, steel and construction materials'),
                ('Safety Equipment', 'safety-equipment', 'Hard hats, gloves, safety gear and equipment'),
            ]

            for name, slug, description in categories_data:
                Category.objects.get_or_create(
                    slug=slug,
                    defaults={'name': name, 'description': description}
                )

            # Create brands
            brands_data = [
                ('DeWalt', 'dewalt', 'Professional power tools and accessories'),
                ('Bosch', 'bosch', 'Power tools, home appliances and more'),
                ('Milwaukee', 'milwaukee', 'Heavy-duty power tools and equipment'),
                ('Stanley', 'stanley', 'Hand tools, storage solutions and more'),
                ('Ridgid', 'ridgid', 'Plumbing and pipe tools'),
                ('GearWrench', 'gearwrench', 'Automotive and general purpose tools'),
                ('Makita', 'makita', 'Professional power tools'),
                ('Hilti', 'hilti', 'Construction tools and fasteners'),
                ('Dangote', 'dangote', 'Building materials and cement'),
            ]

            for name, slug, description in brands_data:
                Brand.objects.get_or_create(
                    slug=slug,
                    defaults={'name': name, 'description': description}
                )

            # Create sample products
            products_data = [
                {
                    'name': 'DeWalt 18V Cordless Drill Kit',
                    'slug': 'dewalt-18v-cordless-drill-kit',
                    'sku': 'DW-DCD780C2',
                    'description': 'Professional-grade cordless drill with 2 batteries and charger. Perfect for construction and DIY projects.',
                    'short_description': '18V cordless drill with 2 batteries and charger',
                    'category': 'power-tools',
                    'brand': 'dewalt',
                    'price': Decimal('1850.00'),
                    'compare_price': Decimal('2100.00'),
                    'weight': Decimal('3.5'),
                    'stock_quantity': 25,
                    'is_featured': True
                },
                {
                    'name': 'Stainless Steel Pipe Wrench Set',
                    'slug': 'stainless-steel-pipe-wrench-set',
                    'sku': 'PW-SS-SET3',
                    'description': 'Heavy-duty pipe wrench set for plumbing and industrial applications. Rust-resistant stainless steel construction.',
                    'short_description': '3-piece stainless steel pipe wrench set',
                    'category': 'hand-tools',
                    'brand': 'ridgid',
                    'price': Decimal('320.00'),
                    'weight': Decimal('2.8'),
                    'stock_quantity': 8,
                    'is_featured': False
                },
                {
                    'name': 'Bosch 12V Impact Driver',
                    'slug': 'bosch-12v-impact-driver',
                    'sku': 'BS-PS41-2A',
                    'description': 'Compact impact driver for tight spaces and precision work. LED light and variable speed control.',
                    'short_description': '12V compact impact driver with LED light',
                    'category': 'power-tools',
                    'brand': 'bosch',
                    'price': Decimal('1250.00'),
                    'compare_price': Decimal('1450.00'),
                    'weight': Decimal('2.1'),
                    'stock_quantity': 15,
                    'is_featured': True
                },
                {
                    'name': 'Carbon Steel Hacksaw Blades',
                    'slug': 'carbon-steel-hacksaw-blades',
                    'sku': 'HB-CS-24TPI',
                    'description': 'Professional-grade hacksaw blades for metal cutting. 24 TPI for fine cuts.',
                    'short_description': '24 TPI carbon steel hacksaw blades',
                    'category': 'hand-tools',
                    'brand': 'stanley',
                    'price': Decimal('45.00'),
                    'weight': Decimal('0.1'),
                    'stock_quantity': 0,
                    'is_featured': False
                },
                {
                    'name': 'Milwaukee M18 Fuel Hammer Drill',
                    'slug': 'milwaukee-m18-fuel-hammer-drill',
                    'sku': 'MW-2712-20',
                    'description': 'Heavy-duty hammer drill with SDS-Plus chuck. Concrete drilling capability with chisel function.',
                    'short_description': '18V hammer drill with SDS-Plus chuck',
                    'category': 'power-tools',
                    'brand': 'milwaukee',
                    'price': Decimal('2850.00'),
                    'compare_price': Decimal('3200.00'),
                    'weight': Decimal('4.2'),
                    'stock_quantity': 0,
                    'is_featured': True
                },
                {
                    'name': 'Chrome Vanadium Socket Set',
                    'slug': 'chrome-vadium-socket-set',
                    'sku': 'SKT-CV-145',
                    'description': 'Complete socket set with chrome vanadium construction. Includes metric and SAE sizes.',
                    'short_description': '145-piece chrome vanadium socket set',
                    'category': 'hand-tools',
                    'brand': 'gearwrench',
                    'price': Decimal('680.00'),
                    'weight': Decimal('8.5'),
                    'stock_quantity': 12,
                    'is_featured': False
                },
                {
                    'name': 'PVC Pipe 1 Inch Schedule 40',
                    'slug': 'pvc-pipe-1-inch-schedule-40',
                    'sku': 'PVC-P-1-40',
                    'description': 'Standard PVC pipe for plumbing and irrigation applications. Schedule 40 for durability.',
                    'short_description': '1 inch PVC pipe schedule 40',
                    'category': 'plumbing',
                    'brand': 'dewalt',
                    'price': Decimal('25.00'),
                    'weight': Decimal('0.5'),
                    'stock_quantity': 100,
                    'is_featured': False
                },
                {
                    'name': 'Copper Wire 2.5mm Single Core',
                    'slug': 'copper-wire-2-5mm-single-core',
                    'sku': 'CW-CU-25',
                    'description': 'High-quality copper wire for electrical wiring. 2.5mm single core for general purpose use.',
                    'short_description': '2.5mm single core copper wire',
                    'category': 'electrical',
                    'brand': 'bosch',
                    'price': Decimal('15.00'),
                    'weight': Decimal('0.1'),
                    'stock_quantity': 200,
                    'is_featured': False
                },
                {
                    'name': 'Dangote Cement 50kg',
                    'slug': 'dangote-cement-50kg',
                    'sku': 'DC-50KG',
                    'description': 'Premium quality cement for construction. 50kg bags for easy handling.',
                    'short_description': '50kg Dangote cement bag',
                    'category': 'building-materials',
                    'brand': 'dangote',
                    'price': Decimal('35.00'),
                    'weight': Decimal('50.0'),
                    'stock_quantity': 500,
                    'is_featured': True
                },
                {
                    'name': 'Industrial Hard Hat',
                    'slug': 'industrial-hard-hat',
                    'sku': 'HH-IND-001',
                    'description': 'ANSI certified hard hat for construction safety. Adjustable suspension and comfortable fit.',
                    'short_description': 'ANSI certified industrial hard hat',
                    'category': 'safety-equipment',
                    'brand': 'stanley',
                    'price': Decimal('85.00'),
                    'weight': Decimal('0.4'),
                    'stock_quantity': 50,
                    'is_featured': False
                }
            ]

            for product_data in products_data:
                category = Category.objects.get(slug=product_data['category'])
                brand = Brand.objects.get(slug=product_data['brand'])
                
                product, created = Product.objects.get_or_create(
                    sku=product_data['sku'],
                    defaults={
                        'name': product_data['name'],
                        'slug': product_data['slug'],
                        'description': product_data['description'],
                        'short_description': product_data['short_description'],
                        'category': category,
                        'brand': brand,
                        'price': product_data['price'],
                        'compare_price': product_data.get('compare_price'),
                        'weight': product_data.get('weight'),
                        'stock_quantity': product_data['stock_quantity'],
                        'is_featured': product_data['is_featured'],
                    }
                )

                if created:
                    # Add product images
                    ProductImage.objects.create(
                        product=product,
                        image=f'https:
                        alt_text=product.name,
                        is_primary=True
                    )

                    # Add technical specifications
                    if 'drill' in product.name.lower():
                        TechnicalSpecification.objects.create(
                            product=product,
                            label='Voltage',
                            value='18V' if '18V' in product.name else '12V',
                            spec_type='voltage'
                        )
                        TechnicalSpecification.objects.create(
                            product=product,
                            label='Chuck Size',
                            value='13mm',
                            spec_type='size'
                        )
                    
                    if 'wrench' in product.name.lower():
                        TechnicalSpecification.objects.create(
                            product=product,
                            label='Material',
                            value='Stainless Steel',
                            spec_type='material'
                        )
                        TechnicalSpecification.objects.create(
                            product=product,
                            label='Sizes',
                            value='8"-24"',
                            spec_type='size'
                        )

                    # Add warehouse stock
                    WarehouseStock.objects.create(
                        product=product,
                        warehouse=tema_warehouse,
                        quantity=product.stock_quantity
                    )
                    
                    WarehouseStock.objects.create(
                        product=product,
                        warehouse=accra_warehouse,
                        quantity=max(0, product.stock_quantity - 5)
                    )

            self.stdout.write(
                self.style.SUCCESS('Successfully created sample products!')
            )
