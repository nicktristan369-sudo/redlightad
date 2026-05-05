-- Tillad service role at indsætte listings på vegne af admin
-- (service role bypasser normalt RLS, men denne policy sikrer det eksplicit)

CREATE POLICY IF NOT EXISTS "Service role can insert listings" ON public.listings
  FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Service role can update listings" ON public.listings
  FOR UPDATE TO service_role
  USING (true);

CREATE POLICY IF NOT EXISTS "Service role can select listings" ON public.listings
  FOR SELECT TO service_role
  USING (true);
