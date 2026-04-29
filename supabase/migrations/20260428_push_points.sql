-- Push Points system for provider accounts
-- Separate from Red Coins wallet — push points are bought specifically for push-to-top

-- Add push_points column to listings (or user-level if preferred)
-- We store points on user level in wallets table as a separate column
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS push_points integer DEFAULT 0;

-- Push points purchase log
CREATE TABLE IF NOT EXISTS public.push_point_purchases (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id text NOT NULL,
  points_bought integer NOT NULL,
  price_usd numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.push_point_purchases ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'push_point_purchases' AND policyname = 'Users view own push_point_purchases'
  ) THEN
    CREATE POLICY "Users view own push_point_purchases" ON public.push_point_purchases
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'push_point_purchases' AND policyname = 'Service role insert push_point_purchases'
  ) THEN
    CREATE POLICY "Service role insert push_point_purchases" ON public.push_point_purchases
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Push history log
CREATE TABLE IF NOT EXISTS public.push_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE,
  points_used integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.push_history ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'push_history' AND policyname = 'Users view own push_history'
  ) THEN
    CREATE POLICY "Users view own push_history" ON public.push_history
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'push_history' AND policyname = 'Service role insert push_history'
  ) THEN
    CREATE POLICY "Service role insert push_history" ON public.push_history
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;
