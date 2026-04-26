-- Create profiles table for customer/provider profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type TEXT NOT NULL DEFAULT 'customer' CHECK (user_type IN ('customer', 'provider')),
  display_name VARCHAR(255),
  bio TEXT,
  age INT CHECK (age >= 18 AND age <= 120),
  gender VARCHAR(50),
  location VARCHAR(255),
  languages TEXT[], -- JSON array
  profile_photo VARCHAR(500),
  photos TEXT[], -- JSON array of URLs
  video_url VARCHAR(500),
  video_duration INT,
  
  -- Premium features
  subscription_level VARCHAR(50) DEFAULT 'free' CHECK (subscription_level IN ('free', 'premium', 'vip')),
  verified_badge BOOLEAN DEFAULT false,
  custom_url VARCHAR(255) UNIQUE,
  show_phone BOOLEAN DEFAULT false,
  show_email BOOLEAN DEFAULT false,
  
  -- Booking & availability
  accept_bookings BOOLEAN DEFAULT false,
  booking_rate DECIMAL(10, 2),
  response_time_hours INT,
  
  -- Livestream
  livestream_enabled BOOLEAN DEFAULT false,
  livestream_url VARCHAR(500),
  streaming_status VARCHAR(50) DEFAULT 'offline',
  
  -- Ratings
  rating DECIMAL(3, 1),
  total_reviews INT DEFAULT 0,
  
  -- Verification
  is_verified BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS policy: Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR is_verified = true);

-- RLS policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_verified ON public.profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles(location);
CREATE INDEX IF NOT EXISTS idx_profiles_rating ON public.profiles(rating DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- Create premium_profiles view for convenience
CREATE OR REPLACE VIEW public.premium_profiles AS
  SELECT * FROM public.profiles
  WHERE subscription_level IN ('premium', 'vip');
