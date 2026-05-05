-- Extended review fields for detailed feedback
-- Time spent, ambience, photos accuracy, recommendation, meeting details

-- Add new columns to listing_reviews
ALTER TABLE public.listing_reviews ADD COLUMN IF NOT EXISTS time_spent text;
ALTER TABLE public.listing_reviews ADD COLUMN IF NOT EXISTS ambience text;
ALTER TABLE public.listing_reviews ADD COLUMN IF NOT EXISTS photos_accurate text;
ALTER TABLE public.listing_reviews ADD COLUMN IF NOT EXISTS would_recommend text;
ALTER TABLE public.listing_reviews ADD COLUMN IF NOT EXISTS meeting_country text;
ALTER TABLE public.listing_reviews ADD COLUMN IF NOT EXISTS meeting_date date;
ALTER TABLE public.listing_reviews ADD COLUMN IF NOT EXISTS is_anonymous boolean DEFAULT false;
ALTER TABLE public.listing_reviews ADD COLUMN IF NOT EXISTS reviewer_avatar text;
ALTER TABLE public.listing_reviews ADD COLUMN IF NOT EXISTS reviewer_location text;

-- Banned words/phrases table for review moderation
CREATE TABLE IF NOT EXISTS public.review_banned_words (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  word text NOT NULL,
  is_regex boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.review_banned_words ENABLE ROW LEVEL SECURITY;

-- Only admins can manage banned words
CREATE POLICY "Admins can manage banned words" ON public.review_banned_words
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Insert some default banned patterns
INSERT INTO public.review_banned_words (word, is_regex) VALUES
  ('http://', false),
  ('https://', false),
  ('www.', false),
  ('.com', false),
  ('.net', false),
  ('.org', false),
  ('telegram.me', false),
  ('t.me/', false),
  ('wa.me/', false),
  ('whatsapp', false)
ON CONFLICT DO NOTHING;

-- Review settings table
CREATE TABLE IF NOT EXISTS public.review_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key text UNIQUE NOT NULL,
  value text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.review_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage review settings" ON public.review_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Anyone can read review settings" ON public.review_settings
  FOR SELECT USING (true);

-- Default settings
INSERT INTO public.review_settings (key, value) VALUES
  ('require_login_to_read', 'true'),
  ('require_login_to_write', 'true'),
  ('auto_approve', 'false'),
  ('min_review_length', '20'),
  ('max_review_length', '2000')
ON CONFLICT (key) DO NOTHING;
