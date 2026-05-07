CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  representative_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  role TEXT NOT NULL,
  company_name TEXT NOT NULL,
  website TEXT NOT NULL DEFAULT '',
  company_country TEXT NOT NULL,
  residence_country TEXT NOT NULL,
  product_interest TEXT NOT NULL,
  first_order TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  authority INTEGER NOT NULL DEFAULT 0,
  signature_key TEXT NOT NULL DEFAULT '',
  selfie_key TEXT NOT NULL DEFAULT '',
  signature_data TEXT NOT NULL DEFAULT '',
  selfie_data TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions (created_at DESC);
