CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT DEFAULT 'image',
  thumbnail_url TEXT,
  caption TEXT,
  views INT DEFAULT 0,
  duration INT DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '48 hours'
);

CREATE INDEX IF NOT EXISTS stories_listing_id_idx ON public.stories(listing_id);
CREATE INDEX IF NOT EXISTS stories_expires_at_idx ON public.stories(expires_at);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read stories" ON public.stories FOR SELECT USING (true);
CREATE POLICY "Service role all on stories" ON public.stories FOR ALL USING (auth.role() = 'service_role');
