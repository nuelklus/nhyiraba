# Hardware E-commerce Monorepo

This repo contains:
- backend/: Django REST Framework API
- frontend/: Next.js (App Router) web app

## Rules

See `.windsurfrules` in the repo root.

## Defaults

- Default currency: `GHS`
- Default phone country code: `+233`

## Environment

Copy `.env.example` to `.env` at the repo root and fill in values.

## Backend (Django + DRF)

From `backend/`:

1. Create a virtualenv and install deps
2. Run migrations
3. Start the server

Commands (PowerShell):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

python manage.py makemigrations
python manage.py migrate

python manage.py createsuperuser
python manage.py runserver 8000
```

Health check:

- `GET http://localhost:8000/api/health/`

## Frontend (Next.js App Router + Tailwind + shadcn/ui)

From `frontend/`:

```powershell
npm install
npm run dev
```

App:

- `http://localhost:3000`

## Notes

- Supabase: use your Supabase project Postgres connection values for `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`.
- Service Layer: keep business logic in `services.py` (views should be thin).
