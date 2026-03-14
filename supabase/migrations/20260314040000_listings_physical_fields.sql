ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS height integer,
  ADD COLUMN IF NOT EXISTS weight integer,
  ADD COLUMN IF NOT EXISTS body_build text,
  ADD COLUMN IF NOT EXISTS hair_color text,
  ADD COLUMN IF NOT EXISTS eye_color text,
  ADD COLUMN IF NOT EXISTS grooming text,
  ADD COLUMN IF NOT EXISTS bra_size text,
  ADD COLUMN IF NOT EXISTS nationality text,
  ADD COLUMN IF NOT EXISTS outcall boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS handicap_friendly boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_own_place boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_trans boolean DEFAULT false;
