from datetime import date, timedelta
from types import SimpleNamespace

from django.test import TestCase

from apps.accounts.models import StaffRole, User, UserRole
from apps.subscriptions.models import Branch, Organization, Plan

from .views import resolve_pos_store_id


class POSBranchAccessTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        plan, _ = Plan.objects.get_or_create(
            name='ENTERPRISE',
            defaults={
                'monthly_price': 10,
                'max_users': 20,
                'multi_branch': True,
            },
        )
        cls.organization = Organization.objects.create(
            business_name='POS Branch Access Organization',
            current_plan=plan,
            expiry_date=date.today() + timedelta(days=30),
            max_users=20,
        )
        cls.main_branch = Branch.objects.create(
            organization=cls.organization,
            store_id='main-pos',
            name='Main POS',
        )
        cls.other_branch = Branch.objects.create(
            organization=cls.organization,
            store_id='other-pos',
            name='Other POS',
        )
        cls.admin = User.objects.create_user(
            username='pos-branch-admin',
            email='pos-branch-admin@example.com',
            password='test-password',
            role=UserRole.STAFF,
            staff_role=StaffRole.ADMIN,
            organization=cls.organization,
            branch=cls.main_branch,
        )
        cls.cashier = User.objects.create_user(
            username='pos-branch-cashier',
            email='pos-branch-cashier@example.com',
            password='test-password',
            role=UserRole.STAFF,
            staff_role=StaffRole.CASHIER,
            organization=cls.organization,
            branch=cls.main_branch,
        )

    def test_admin_can_select_other_active_branch_in_organization(self):
        request = SimpleNamespace(user=self.admin)
        self.assertEqual(
            resolve_pos_store_id(request, self.other_branch.store_id),
            self.other_branch.store_id,
        )

    def test_cashier_cannot_select_another_branch(self):
        request = SimpleNamespace(user=self.cashier)
        self.assertIsNone(resolve_pos_store_id(request, self.other_branch.store_id))
        self.assertEqual(
            resolve_pos_store_id(request, self.main_branch.store_id),
            self.main_branch.store_id,
        )
