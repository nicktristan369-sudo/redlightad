CREATE TABLE IF NOT EXISTS public.listing_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT DEFAULT 'image',
  thumbnail_url TEXT,
  duration INT DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '48 hours'
);

CREATE INDEX IF NOT EXISTS listing_stories_listing_id_idx ON public.listing_stories(listing_id);
CREATE INDEX IF NOT EXISTS listing_stories_expires_at_idx ON public.listing_stories(expires_at);

ALTER TABLE public.listing_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read stories" ON public.listing_stories FOR SELECT USING (true);
CREATE POLICY "Service role all" ON public.listing_stories FOR ALL USING (auth.role() = 'service_role');
