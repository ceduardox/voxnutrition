# Vox Nutrition OEM Client Intake

Static Cloudflare Pages-ready registration form for Vox Nutrition OEM / white-label supplement leads.

## Deploy on Cloudflare Pages

- Project type: static site
- Build command: none
- Output directory: `/`

## Data storage

The browser keeps a draft in `localStorage` so accidental refreshes do not lose the form.
Submitted records are also saved in `localStorage` and show a success confirmation.

There is no server database in this static version.
