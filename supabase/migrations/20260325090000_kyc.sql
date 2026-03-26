CREATE TABLE IF NOT EXISTS kyc_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  listing_id UUID REFERENCES listings(id),
  full_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  country TEXT NOT NULL,
  id_front_url TEXT,
  id_back_url TEXT,
  selfie_url TEXT,
  status TEXT DEFAULT 'pending',
  rejection_reason TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id)
);

ALTER TABLE listings ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'unverified';

CREATE INDEX IF NOT EXISTS kyc_submissions_user_id_idx ON kyc_submissions(user_id);
CREATE INDEX IF NOT EXISTS kyc_submissions_status_idx ON kyc_submissions(status);
