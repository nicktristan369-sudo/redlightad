ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS admin_email TEXT,
  ADD COLUMN IF NOT EXISTS admin_password TEXT,
  ADD COLUMN IF NOT EXISTS admin_login_id TEXT;
