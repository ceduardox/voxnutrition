# Vox Nutrition OEM Client Intake

Cloudflare Pages-ready registration form for Vox Nutrition OEM / white-label supplement leads.
The app uses Pages Functions, D1, and optional R2 file storage.

## Deploy on Cloudflare Pages

- Project type: static site
- Build command: none
- Output directory: `/`

## Data storage

The browser keeps a draft in `localStorage` so accidental refreshes do not lose the form.
Submitted records are sent to `/api/submit` and stored in Cloudflare D1.

Recommended production bindings:

- `DB`: D1 database for submissions.
- `FILES`: R2 bucket for signature and selfie images.
- `ADMIN_TOKEN`: secret token required by `admin.html`. If it is missing, admin APIs are blocked.

If `FILES` is not configured, signature and selfie data are stored inline in D1.

## Cloudflare setup

Create resources:

```bash
wrangler d1 create voxnutrition-db
wrangler r2 bucket create voxnutrition-files
```

Add the D1/R2 bindings in Cloudflare Pages project settings, or uncomment and fill
the binding examples in `wrangler.jsonc`.

Run the migration:

```bash
wrangler d1 migrations apply voxnutrition-db
```

Set an admin secret:

```bash
wrangler pages secret put ADMIN_TOKEN
```

Admin page:

```text
/admin.html
```

## Local verification

```bash
npm test
```
