ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS cam_status text DEFAULT 'offline' CHECK (cam_status IN ('offline', 'available', 'scheduled')),
  ADD COLUMN IF NOT EXISTS cam_available_until timestamptz,
  ADD COLUMN IF NOT EXISTS cam_scheduled_at timestamptz;
