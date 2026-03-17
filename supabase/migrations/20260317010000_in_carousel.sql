-- Admin can manually pin any listing to the Premium Members carousel,
-- regardless of whether the user has purchased a tier.

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS in_carousel boolean DEFAULT false;

COMMENT ON COLUMN public.listings.in_carousel IS
  'When true, listing is pinned to the Premium Members carousel by admin (independent of premium_tier)';

CREATE INDEX IF NOT EXISTS listings_in_carousel_idx ON public.listings (in_carousel) WHERE in_carousel = true;
