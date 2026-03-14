-- Coin-balance per bruger
CREATE TABLE IF NOT EXISTS public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  balance integer DEFAULT 0,
  total_earned integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own wallet" ON public.wallets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role manages wallets" ON public.wallets FOR ALL USING (true);

-- Køb af coins via Stripe
CREATE TABLE IF NOT EXISTS public.coin_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  coins_amount integer NOT NULL,
  price_usd numeric NOT NULL,
  stripe_payment_id text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.coin_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own purchases" ON public.coin_purchases FOR SELECT USING (auth.uid() = user_id);

-- Låst indhold knyttet til en annonce
CREATE TABLE IF NOT EXISTS public.locked_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  coin_price integer NOT NULL DEFAULT 10,
  media_urls text[] DEFAULT '{}',
  media_types text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.locked_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view locked_content metadata" ON public.locked_content FOR SELECT USING (true);
CREATE POLICY "Sellers manage own content" ON public.locked_content FOR ALL USING (auth.uid() = seller_id);

-- Hvem har købt hvad
CREATE TABLE IF NOT EXISTS public.content_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id uuid REFERENCES public.locked_content(id) ON DELETE CASCADE,
  coins_paid integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(buyer_id, content_id)
);
ALTER TABLE public.content_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own content purchases" ON public.content_purchases FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Service role manages content purchases" ON public.content_purchases FOR ALL USING (true);

-- Udbetalingsanmodninger
CREATE TABLE IF NOT EXISTS public.payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  coins_amount integer NOT NULL,
  usd_amount numeric NOT NULL,
  iban text NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sellers view own payouts" ON public.payout_requests FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Sellers insert own payouts" ON public.payout_requests FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Admins manage payouts" ON public.payout_requests FOR ALL USING (public.is_admin_user());

-- Alle coin-transaktioner (log)
CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  amount integer NOT NULL,
  reference_id uuid,
  note text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own transactions" ON public.coin_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role manages transactions" ON public.coin_transactions FOR ALL USING (true);

-- Auto-create wallet on new user (extend existing trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.wallets (user_id, balance)
  VALUES (new.id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
