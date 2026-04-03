-- CRM improvements: country/source tracking on contacts + unique phone constraint
ALTER TABLE public.admin_contacts
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Denmark',
  ADD COLUMN IF NOT EXISTS source_domain TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

-- UNIQUE constraint on scraped_phones.phone to prevent duplicates at DB level
ALTER TABLE public.scraped_phones
  ADD CONSTRAINT scraped_phones_phone_unique UNIQUE (phone);
