ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS videos text[] DEFAULT '{}';
