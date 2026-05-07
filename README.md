# Vox Nutrition OEM Client Intake

Static Cloudflare Pages-ready registration form for Vox Nutrition OEM / white-label supplement leads.

## Deploy on Cloudflare Pages

- Project type: static site
- Build command: none
- Output directory: `/`

## Data storage

This static version stores the latest submitted record in the visitor browser with `localStorage`.
That is useful for a quick prototype, but it is not a company database.

For production lead capture on Cloudflare, use one of these:

- Cloudflare Pages Functions + D1 for relational records.
- Cloudflare Pages Functions + KV for simple key-value lead files.
- Cloudflare Pages Functions + R2 for signature files and attachments.
- External CRM webhook or backend API.
