from datetime import date, timedelta

from django.core.exceptions import ValidationError
from django.test import TestCase

from apps.subscriptions.models import Branch, Organization, Plan

from .models import StaffRole, User, UserRole


class BranchAssignmentTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        plan = Plan.objects.create(
            name="BRANCH_TEST_BUSINESS",
            monthly_price=10,
            max_users=20,
            multi_branch=True,
        )
        cls.organization = Organization.objects.create(
            business_name="Branch Test Organization",
            current_plan=plan,
            expiry_date=date.today() + timedelta(days=30),
            max_users=20,
        )

    def test_branch_has_stable_store_id_and_assigns_user(self):
        branch = Branch.objects.create(
            organization=self.organization,
            store_id="accra",
            name="Accra",
        )
        user = User(
            username="cashier",
            email="cashier@example.com",
            role=UserRole.STAFF,
            staff_role=StaffRole.CASHIER,
            organization=self.organization,
            branch=branch,
        )
        user.set_password("password123")
        user.full_clean()
        user.save()

        self.assertEqual(user.store_id, "accra")
        self.assertEqual(user.branch_id, branch.id)

    def test_inactive_branch_cannot_be_assigned(self):
        branch = Branch.objects.create(
            organization=self.organization,
            store_id="closed",
            name="Closed",
            is_active=False,
        )
        user = User(
            username="inactive-branch-user",
            email="inactive@example.com",
            role=UserRole.STAFF,
            staff_role=StaffRole.CASHIER,
            organization=self.organization,
            branch=branch,
        )

        with self.assertRaises(ValidationError):
            user.full_clean()
