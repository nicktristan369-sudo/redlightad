-- Add missing profile fields for complete provider registration
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS hair_length text,
  ADD COLUMN IF NOT EXISTS bust_size text,
  ADD COLUMN IF NOT EXISTS bust_type text,
  ADD COLUMN IF NOT EXISTS pubic_hair text,
  ADD COLUMN IF NOT EXISTS tattoos text,
  ADD COLUMN IF NOT EXISTS piercings text,
  ADD COLUMN IF NOT EXISTS available_for text;

-- Add indexes for commonly filtered fields
CREATE INDEX IF NOT EXISTS idx_listings_tattoos ON public.listings(tattoos);
CREATE INDEX IF NOT EXISTS idx_listings_piercings ON public.listings(piercings);
