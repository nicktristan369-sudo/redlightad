-- Fix: recursive RLS on profiles table caused infinite recursion
-- Replace inline subqueries with SECURITY DEFINER function

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
$$;

-- Drop old recursive policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all listings" ON public.listings;
DROP POLICY IF EXISTS "Admins can update all listings" ON public.listings;
DROP POLICY IF EXISTS "Admins can delete all listings" ON public.listings;

-- Recreate using SECURITY DEFINER function (no recursion)
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin_user());

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (public.is_admin_user());

CREATE POLICY "Admins can view all listings" ON public.listings
  FOR SELECT USING (public.is_admin_user());

CREATE POLICY "Admins can update all listings" ON public.listings
  FOR UPDATE USING (public.is_admin_user());

CREATE POLICY "Admins can delete all listings" ON public.listings
  FOR DELETE USING (public.is_admin_user());
