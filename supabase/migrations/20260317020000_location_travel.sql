-- Feature: Daily location switch + travel schedule (premium only)

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS location_changed_at timestamptz,
  ADD COLUMN IF NOT EXISTS show_travel_schedule boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS public.listing_travel (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id   uuid REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  from_date    date NOT NULL,
  to_date      date NOT NULL,
  city         text NOT NULL,
  country      text NOT NULL,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE public.listing_travel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own travel entries" ON public.listing_travel
  USING (
    listing_id IN (SELECT id FROM public.listings WHERE user_id = auth.uid())
  )
  WITH CHECK (
    listing_id IN (SELECT id FROM public.listings WHERE user_id = auth.uid())
  );

CREATE POLICY "Public read travel entries" ON public.listing_travel
  FOR SELECT USING (
    listing_id IN (SELECT id FROM public.listings WHERE show_travel_schedule = true AND status = 'active')
  );

CREATE INDEX IF NOT EXISTS listing_travel_listing_id_idx ON public.listing_travel (listing_id);
CREATE INDEX IF NOT EXISTS listing_travel_dates_idx ON public.listing_travel (from_date, to_date);
