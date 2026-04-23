-- ============================================================
-- RedLightAD Performance Indexes for 50,000+ Profiles
-- Run this in Supabase SQL Editor
-- ============================================================

-- ┌──────────────────────────────────────────────────────────┐
-- │ LISTINGS TABLE - Core indexes                            │
-- └──────────────────────────────────────────────────────────┘

-- Status filter (most common query)
CREATE INDEX IF NOT EXISTS idx_listings_status 
ON listings(status);

-- Country filter
CREATE INDEX IF NOT EXISTS idx_listings_country 
ON listings(country);

-- City filter (with case-insensitive support)
CREATE INDEX IF NOT EXISTS idx_listings_city 
ON listings(LOWER(city));

-- Category filter
CREATE INDEX IF NOT EXISTS idx_listings_category 
ON listings(category);

-- Premium tier for sorting
CREATE INDEX IF NOT EXISTS idx_listings_premium_tier 
ON listings(premium_tier) WHERE premium_tier IS NOT NULL;

-- Premium expiry for filtering active premiums
CREATE INDEX IF NOT EXISTS idx_listings_premium_until 
ON listings(premium_until) WHERE premium_until IS NOT NULL;

-- Boost score for sorting (descending)
CREATE INDEX IF NOT EXISTS idx_listings_boost_score 
ON listings(boost_score DESC NULLS LAST);

-- Created at for sorting
CREATE INDEX IF NOT EXISTS idx_listings_created_at 
ON listings(created_at DESC);

-- Gender filter
CREATE INDEX IF NOT EXISTS idx_listings_gender 
ON listings(gender);

-- Age range filter
CREATE INDEX IF NOT EXISTS idx_listings_age 
ON listings(age);

-- User ownership
CREATE INDEX IF NOT EXISTS idx_listings_user_id 
ON listings(user_id);

-- ┌──────────────────────────────────────────────────────────┐
-- │ COMPOSITE INDEXES - For common query patterns            │
-- └──────────────────────────────────────────────────────────┘

-- Active listings by country (most common query)
CREATE INDEX IF NOT EXISTS idx_listings_active_country 
ON listings(status, country) 
WHERE status = 'active';

-- Active listings by category
CREATE INDEX IF NOT EXISTS idx_listings_active_category 
ON listings(status, category) 
WHERE status = 'active';

-- Premium active listings (for premium-first sorting)
CREATE INDEX IF NOT EXISTS idx_listings_active_premium 
ON listings(status, premium_tier, boost_score DESC, created_at DESC) 
WHERE status = 'active';

-- ┌──────────────────────────────────────────────────────────┐
-- │ FULL TEXT SEARCH - For search functionality              │
-- └──────────────────────────────────────────────────────────┘

-- Title search (English)
CREATE INDEX IF NOT EXISTS idx_listings_title_fts 
ON listings USING gin(to_tsvector('english', COALESCE(title, '')));

-- About/description search
CREATE INDEX IF NOT EXISTS idx_listings_about_fts 
ON listings USING gin(to_tsvector('english', COALESCE(about, '')));

-- Combined search (title + about)
CREATE INDEX IF NOT EXISTS idx_listings_search_combined 
ON listings USING gin(
  to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(about, ''))
);

-- ┌──────────────────────────────────────────────────────────┐
-- │ USERS/PROFILES TABLE                                     │
-- └──────────────────────────────────────────────────────────┘

-- Email lookup (if profiles table exists)
CREATE INDEX IF NOT EXISTS idx_profiles_email 
ON profiles(email);

-- Created at for sorting
CREATE INDEX IF NOT EXISTS idx_profiles_created_at 
ON profiles(created_at DESC);

-- Role filter (admin, user, etc)
CREATE INDEX IF NOT EXISTS idx_profiles_role 
ON profiles(role) WHERE role IS NOT NULL;

-- Banned status
CREATE INDEX IF NOT EXISTS idx_profiles_banned 
ON profiles(banned) WHERE banned = true;

-- ┌──────────────────────────────────────────────────────────┐
-- │ MESSAGES TABLE                                           │
-- └──────────────────────────────────────────────────────────┘

-- Conversation lookup
CREATE INDEX IF NOT EXISTS idx_messages_conversation 
ON messages(conversation_id, created_at DESC);

-- Unread messages for user
CREATE INDEX IF NOT EXISTS idx_messages_unread 
ON messages(receiver_id, read) 
WHERE read = false;

-- Sender lookup
CREATE INDEX IF NOT EXISTS idx_messages_sender 
ON messages(sender_id, created_at DESC);

-- ┌──────────────────────────────────────────────────────────┐
-- │ REDCOINS & TRANSACTIONS                                  │
-- └──────────────────────────────────────────────────────────┘

-- User transactions (wallet page)
CREATE INDEX IF NOT EXISTS idx_redcoin_txns_user 
ON redcoin_transactions(user_id, created_at DESC);

-- Transaction type filter
CREATE INDEX IF NOT EXISTS idx_redcoin_txns_type 
ON redcoin_transactions(type, created_at DESC);

-- ┌──────────────────────────────────────────────────────────┐
-- │ ORDERS & PAYMENTS                                        │
-- └──────────────────────────────────────────────────────────┘

-- User orders
CREATE INDEX IF NOT EXISTS idx_orders_user 
ON orders(user_id, created_at DESC);

-- Stripe session lookup
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session 
ON orders(stripe_session_id) WHERE stripe_session_id IS NOT NULL;

-- Order status
CREATE INDEX IF NOT EXISTS idx_orders_status 
ON orders(status);

-- ┌──────────────────────────────────────────────────────────┐
-- │ REVIEWS                                                  │
-- └──────────────────────────────────────────────────────────┘

-- Reviews by listing
CREATE INDEX IF NOT EXISTS idx_reviews_listing 
ON reviews(listing_id, created_at DESC);

-- Reviews by status (pending, approved, rejected)
CREATE INDEX IF NOT EXISTS idx_reviews_status 
ON reviews(status);

-- ┌──────────────────────────────────────────────────────────┐
-- │ MARKETPLACE                                              │
-- └──────────────────────────────────────────────────────────┘

-- Active marketplace items
CREATE INDEX IF NOT EXISTS idx_marketplace_status 
ON marketplace_items(status) WHERE status = 'active';

-- Seller items
CREATE INDEX IF NOT EXISTS idx_marketplace_seller 
ON marketplace_items(seller_id, created_at DESC);

-- ┌──────────────────────────────────────────────────────────┐
-- │ TRAFFIC TRACKING                                         │
-- └──────────────────────────────────────────────────────────┘

-- Page views by date (for statistics)
CREATE INDEX IF NOT EXISTS idx_page_views_date 
ON page_views(created_at DESC);

-- Session tracking
CREATE INDEX IF NOT EXISTS idx_page_views_session 
ON page_views(session_id, created_at DESC);

-- ┌──────────────────────────────────────────────────────────┐
-- │ VERIFICATION/KYC                                         │
-- └──────────────────────────────────────────────────────────┘

-- Pending verifications
CREATE INDEX IF NOT EXISTS idx_kyc_status 
ON kyc_verifications(status) WHERE status = 'pending';

-- User verification
CREATE INDEX IF NOT EXISTS idx_kyc_user 
ON kyc_verifications(user_id);

-- ============================================================
-- ANALYZE TABLES (Update statistics for query planner)
-- ============================================================

ANALYZE listings;
ANALYZE profiles;
ANALYZE messages;
ANALYZE orders;
ANALYZE reviews;

-- ============================================================
-- DONE! Your database is now optimized for 50,000+ profiles
-- ============================================================
