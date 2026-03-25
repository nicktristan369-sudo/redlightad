-- Add subscription_tier to profiles
-- Allows admin to grant free premium access to users

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT NULL
    CHECK (subscription_tier IN ('basic', 'featured', 'vip'));

COMMENT ON COLUMN profiles.subscription_tier IS
  'Admin-granted subscription tier. Overrides Stripe payment for premium features.';
