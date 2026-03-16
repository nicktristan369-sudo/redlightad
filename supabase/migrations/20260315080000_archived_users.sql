-- Add whatsapp to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS whatsapp text DEFAULT NULL;

-- Archived users table — permanent record when user deletes account
CREATE TABLE IF NOT EXISTS archived_users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_id     uuid NOT NULL,
  full_name       text,
  email           text,
  phone           text,
  whatsapp        text,
  country         text,
  account_type    text,
  subscription_tier text,
  is_verified     boolean DEFAULT false,
  avatar_url      text,
  registered_at   timestamptz,
  deleted_at      timestamptz NOT NULL DEFAULT now(),
  deleted_by      text DEFAULT 'user' -- 'user' | 'admin'
);

-- Only admins (service role) can read archived users
ALTER TABLE archived_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only"
  ON archived_users
  FOR ALL
  USING (false); -- blocked for anon/auth users; service role bypasses RLS

COMMENT ON TABLE archived_users IS
  'Permanent archive of deleted user accounts. Cannot be deleted by end users.';
