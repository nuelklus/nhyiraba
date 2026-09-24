from django.db import migrations, models
import django.db.models.deletion


def create_main_branches(apps, schema_editor):
    Organization = apps.get_model("subscriptions", "Organization")
    Branch = apps.get_model("subscriptions", "Branch")
    for organization in Organization.objects.all().iterator():
        Branch.objects.get_or_create(
            organization_id=organization.pk,
            store_id="main",
            defaults={"name": "Main Branch"},
        )


class Migration(migrations.Migration):
    dependencies = [
        ("subscriptions", "0007_auto_20260622_0924"),
    ]

    operations = [
        migrations.CreateModel(
            name="Branch",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("store_id", models.CharField(max_length=100)),
                ("name", models.CharField(max_length=200)),
                ("address", models.TextField(blank=True)),
                ("phone", models.CharField(blank=True, max_length=32)),
                ("email", models.EmailField(blank=True, max_length=254)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("organization", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="branches", to="subscriptions.organization")),
            ],
            options={"ordering": ["name"]},
        ),
        migrations.AddConstraint(
            model_name="branch",
            constraint=models.UniqueConstraint(fields=("organization", "store_id"), name="subscriptions_org_branch_store_unique"),
        ),
        migrations.AddIndex(
            model_name="branch",
            index=models.Index(fields=["organization", "is_active"], name="subs_branch_active_idx"),
        ),
        migrations.AddIndex(
            model_name="branch",
            index=models.Index(fields=["store_id"], name="subs_branch_store_idx"),
        ),
        migrations.RunPython(create_main_branches, migrations.RunPython.noop),
    ]
