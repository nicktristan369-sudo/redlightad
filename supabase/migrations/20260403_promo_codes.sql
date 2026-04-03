CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT DEFAULT 'trial', -- 'trial' | 'percent' | 'fixed'
  trial_days INT DEFAULT 30,
  max_uses INT DEFAULT NULL, -- NULL = unlimited
  used_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indsæt GRATIS30 kode
INSERT INTO public.promo_codes (code, description, discount_type, trial_days, is_active)
VALUES ('GRATIS30', '30 dages gratis premium adgang', 'trial', 30, true)
ON CONFLICT (code) DO NOTHING;

-- Track brug af promo koder
CREATE TABLE IF NOT EXISTS public.promo_code_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id UUID REFERENCES public.promo_codes(id),
  user_id UUID REFERENCES auth.users(id),
  used_at TIMESTAMPTZ DEFAULT NOW()
);
