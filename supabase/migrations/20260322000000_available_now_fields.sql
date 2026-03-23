ALTER TABLE listings
ADD COLUMN IF NOT EXISTS work_hours_start INT,
ADD COLUMN IF NOT EXISTS work_hours_end INT,
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ;

-- RPC function for available-now query
CREATE OR REPLACE FUNCTION get_available_now_listings()
RETURNS SETOF listings
LANGUAGE sql
STABLE
AS $$
  SELECT l.* FROM listings l
  WHERE l.status = 'active'
  AND (
    l.last_seen > NOW() - INTERVAL '15 minutes'
    OR (
      l.work_hours_start IS NOT NULL
      AND l.work_hours_end IS NOT NULL
      AND l.work_hours_start <= EXTRACT(HOUR FROM NOW())
      AND l.work_hours_end >= EXTRACT(HOUR FROM NOW())
    )
  )
  ORDER BY l.last_seen DESC NULLS LAST;
$$;
