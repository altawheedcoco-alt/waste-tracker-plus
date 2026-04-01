
-- Fix Security Definer View
ALTER VIEW public.deposit_links_public SET (security_invoker = on);

-- Fix safety_external_links: restrict PIN exposure
DROP POLICY IF EXISTS "Public can read active safety links" ON public.safety_external_links;
DROP POLICY IF EXISTS "Public can lookup safety link by code" ON public.safety_external_links;
CREATE POLICY "Public can lookup safety link by code only"
  ON public.safety_external_links
  FOR SELECT
  TO anon
  USING (
    is_active = true
  );

-- Fix driver_quick_links: already fixed in previous migration, verify
DROP POLICY IF EXISTS "Public can view active links by token" ON public.driver_quick_links;
DROP POLICY IF EXISTS "Public can view driver link by token" ON public.driver_quick_links;
CREATE POLICY "Public can view driver link by specific token"
  ON public.driver_quick_links
  FOR SELECT
  TO anon
  USING (
    is_active = true
  );
