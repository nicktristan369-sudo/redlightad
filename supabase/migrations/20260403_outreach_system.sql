-- Outreach CRM columns on scraped_phones
ALTER TABLE public.scraped_phones
  ADD COLUMN IF NOT EXISTS sms_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS sms_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS invite_token TEXT,
  ADD COLUMN IF NOT EXISTS source_domain TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

UPDATE scraped_phones
SET source_domain = regexp_replace(source_url, 'https?://([^/]+).*', '\1')
WHERE source_domain IS NULL AND source_url IS NOT NULL;
