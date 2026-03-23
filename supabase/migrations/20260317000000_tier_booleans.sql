-- Add is_premium and is_featured as generated boolean columns
-- is_premium = any non-null tier (basic, featured, vip)
-- is_featured = specifically the 'featured' tier

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS is_premium boolean
    GENERATED ALWAYS AS (premium_tier IS NOT NULL) STORED,
  ADD COLUMN IF NOT EXISTS is_featured boolean
    GENERATED ALWAYS AS (premium_tier = 'featured') STORED;

COMMENT ON COLUMN public.listings.is_premium IS 'True when listing has any premium tier set';
COMMENT ON COLUMN public.listings.is_featured IS 'True when listing tier is specifically ''featured''';
