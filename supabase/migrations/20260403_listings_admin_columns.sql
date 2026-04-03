ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS created_by_admin BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS needs_completion BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS source_url TEXT;
