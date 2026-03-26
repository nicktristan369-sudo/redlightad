CREATE TABLE IF NOT EXISTS payout_details (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  bank_name TEXT,
  account_number TEXT NOT NULL,
  reg_number TEXT,
  iban TEXT,
  swift TEXT,
  country TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  id_verified BOOLEAN DEFAULT false,
  id_document_url TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payout_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id),
  user_id UUID REFERENCES auth.users(id),
  amount_redcoins INT NOT NULL,
  amount_dkk NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending',
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  admin_note TEXT
);
