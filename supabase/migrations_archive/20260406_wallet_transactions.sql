-- Enhanced wallet transactions with source info
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'tip' | 'private_show' | 'content_sale' | 'payout' | 'bonus'
  amount INTEGER NOT NULL, -- positive = earned, negative = paid out
  source_username TEXT, -- who tipped/booked
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_user ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_created ON wallet_transactions(created_at DESC);

ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own transactions" ON wallet_transactions
  FOR ALL USING (user_id = auth.uid());

-- Payout requests (create if not exists with all fields)
CREATE TABLE IF NOT EXISTS public.payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coins_amount INTEGER NOT NULL,
  usd_amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'bank', -- 'bank' | 'payoneer' | 'usdt'
  payment_details JSONB, -- {iban, account_name, payoneer_email, usdt_address, etc.}
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'processing' | 'paid' | 'rejected'
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own payouts" ON payout_requests
  FOR ALL USING (seller_id = auth.uid());
