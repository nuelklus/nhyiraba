from django.db import migrations, models
import django.db.models.deletion


def assign_existing_branches(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    Branch = apps.get_model("subscriptions", "Branch")
    for user in User.objects.filter(organization__isnull=False):
        store_id = user.store_id or "main"
        branch, _ = Branch.objects.get_or_create(
            organization_id=user.organization_id,
            store_id=store_id,
            defaults={"name": "Main Branch" if store_id == "main" else store_id},
        )
        if user.branch_id != branch.pk:
            user.branch_id = branch.pk
            user.save(update_fields=["branch"])


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0009_user_is_staff"),
        ("subscriptions", "0008_branch"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="branch",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="users", to="subscriptions.branch"),
        ),
        migrations.RunPython(assign_existing_branches, migrations.RunPython.noop),
    ]
