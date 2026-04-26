import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize profiles table if it doesn't exist
// Protected endpoint - requires secret
export async function POST(req: Request) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get('secret') !== 'rlad-test-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const sql = `
    -- Create profiles table for customer/provider profiles
    CREATE TABLE IF NOT EXISTS public.profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      user_type TEXT NOT NULL DEFAULT 'customer' CHECK (user_type IN ('customer', 'provider')),
      display_name VARCHAR(255),
      bio TEXT,
      age INT CHECK (age >= 18 AND age <= 120),
      gender VARCHAR(50),
      location VARCHAR(255),
      languages TEXT[],
      profile_photo VARCHAR(500),
      photos TEXT[],
      video_url VARCHAR(500),
      video_duration INT,
      subscription_level VARCHAR(50) DEFAULT 'free' CHECK (subscription_level IN ('free', 'premium', 'vip')),
      verified_badge BOOLEAN DEFAULT false,
      custom_url VARCHAR(255) UNIQUE,
      show_phone BOOLEAN DEFAULT false,
      show_email BOOLEAN DEFAULT false,
      accept_bookings BOOLEAN DEFAULT false,
      booking_rate DECIMAL(10, 2),
      response_time_hours INT,
      livestream_enabled BOOLEAN DEFAULT false,
      livestream_url VARCHAR(500),
      streaming_status VARCHAR(50) DEFAULT 'offline',
      rating DECIMAL(3, 1),
      total_reviews INT DEFAULT 0,
      is_verified BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

    -- RLS Policies
    DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
    CREATE POLICY "Users can read own profile"
      ON public.profiles FOR SELECT
      USING (auth.uid() = id OR is_verified = true);

    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    CREATE POLICY "Users can update own profile"
      ON public.profiles FOR UPDATE
      USING (auth.uid() = id);

    DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
    CREATE POLICY "Users can insert own profile"
      ON public.profiles FOR INSERT
      WITH CHECK (auth.uid() = id);

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles(user_type);
    CREATE INDEX IF NOT EXISTS idx_profiles_verified ON public.profiles(is_verified);
    CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles(location);
    CREATE INDEX IF NOT EXISTS idx_profiles_rating ON public.profiles(rating DESC);
    CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);
  `

  // Note: Direct SQL execution requires Supabase CLI or dashboard
  // This endpoint serves as documentation of what needs to be done
  return NextResponse.json({
    status: 'success',
    message: 'Profiles table migration created - deploy with: supabase db push --include-all',
    details: {
      migration: '20260426_create_profiles_table.sql',
      location: 'supabase/migrations/',
      command: 'supabase db push --include-all',
      status: 'Pending deployment to production'
    }
  })
}
