-- Restore profiles data for redlightad admin panel
-- This script checks and restores the public.profiles table

-- Step 1: Check current state
\echo '==== CHECKING CURRENT STATE ===='
SELECT COUNT(*) as "Total Profiles" FROM public.profiles;
SELECT COUNT(*) as "Total Listings" FROM public.listings;

-- Step 2: If profiles are empty but listings exist, create profiles from listings users
\echo '==== CREATING PROFILES FROM LISTINGS ===='
INSERT INTO public.profiles (id, email, full_name, account_type, is_verified, created_at, updated_at)
SELECT DISTINCT ON (l.user_id)
  l.user_id,
  u.email,
  COALESCE(l.display_name, 'User ' || SUBSTRING(l.user_id::text, 1, 8)),
  'provider',
  false,
  l.created_at,
  l.updated_at
FROM public.listings l
JOIN auth.users u ON l.user_id = u.id
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = l.user_id
)
ON CONFLICT (id) DO NOTHING;

-- Step 3: Create test profiles if still empty
\echo '==== CREATING TEST PROFILES ===='
DO $$
DECLARE
  profile_count INT;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM public.profiles;
  
  IF profile_count = 0 THEN
    -- Create 10 test profiles
    FOR i IN 1..10 LOOP
      INSERT INTO public.profiles (
        id, 
        email, 
        full_name, 
        account_type, 
        country,
        is_admin, 
        is_banned, 
        is_verified, 
        phone, 
        subscription_tier, 
        created_at
      ) VALUES (
        gen_random_uuid(),
        'testprofile' || i || '@redlightad.local',
        'Test Profile ' || i,
        CASE WHEN i % 2 = 0 THEN 'provider' ELSE 'customer' END,
        'Denmark',
        false,
        false,
        i % 3 = 0,
        '+45' || LPAD((40000000 + i * 111111)::text, 8, '0'),
        CASE WHEN i % 5 = 0 THEN 'vip' WHEN i % 3 = 0 THEN 'featured' ELSE null END,
        NOW() - INTERVAL '1 day' * (i * 2)
      );
    END LOOP;
    
    RAISE NOTICE 'Created 10 test profiles';
  ELSE
    RAISE NOTICE 'Profiles already exist (count: %)', profile_count;
  END IF;
END $$;

-- Step 4: Verify results
\echo '==== VERIFICATION ===='
SELECT COUNT(*) as "Final Profile Count" FROM public.profiles;
SELECT 'Sample Profiles:' as "";
SELECT id, email, full_name, account_type, created_at FROM public.profiles LIMIT 5;

\echo 'Restore complete!'
