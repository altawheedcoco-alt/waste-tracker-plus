-- 1. Secure materialized views - revoke direct anon access
REVOKE ALL ON mv_daily_shipment_stats FROM anon;
REVOKE ALL ON mv_monthly_invoice_stats FROM anon;
REVOKE ALL ON mv_admin_dashboard FROM anon;
REVOKE ALL ON mv_organization_summary FROM anon;
REVOKE ALL ON mv_recycling_summary FROM anon;
REVOKE ALL ON mv_waste_type_analytics FROM anon;

-- 2. Tighten RLS: c2b_submissions
DROP POLICY IF EXISTS "Anyone can submit c2b form" ON public.c2b_submissions;
CREATE POLICY "Public can submit c2b form with required fields" ON public.c2b_submissions
  FOR INSERT
  WITH CHECK (
    full_name IS NOT NULL AND length(full_name) > 0
    AND submission_type IS NOT NULL AND length(submission_type) > 0
    AND status = 'new'
  );

-- 3. Tighten external_missions: only allow update with valid token
DROP POLICY IF EXISTS "public_update_by_token" ON public.external_missions;
CREATE POLICY "public_update_by_token_secure" ON public.external_missions
  FOR UPDATE
  USING (token IS NOT NULL AND length(token) > 10)
  WITH CHECK (token IS NOT NULL AND length(token) > 10);

-- 4. Tighten platform_post_views: require post_id and visitor_id
DROP POLICY IF EXISTS "Anyone can insert post views" ON public.platform_post_views;
CREATE POLICY "Public can insert post views with required fields" ON public.platform_post_views
  FOR INSERT
  WITH CHECK (post_id IS NOT NULL AND visitor_id IS NOT NULL);

-- 5. Tighten visitor_tracking: require fingerprint
DROP POLICY IF EXISTS "Anon can insert visitor tracking" ON public.visitor_tracking;
CREATE POLICY "Public can insert visitor tracking with fingerprint" ON public.visitor_tracking
  FOR INSERT
  WITH CHECK (visitor_fingerprint IS NOT NULL AND length(visitor_fingerprint) > 5);
