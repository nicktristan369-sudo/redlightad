-- RPC functions for admin checks — bypasses RLS completely via SECURITY DEFINER

CREATE OR REPLACE FUNCTION public.get_my_admin_status()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;
GRANT EXECUTE ON FUNCTION public.get_my_admin_status() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS TABLE(id uuid, email text, is_admin boolean, is_banned boolean)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT p.id, p.email, p.is_admin, p.is_banned
  FROM public.profiles p
  WHERE p.id = auth.uid();
$$;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;
