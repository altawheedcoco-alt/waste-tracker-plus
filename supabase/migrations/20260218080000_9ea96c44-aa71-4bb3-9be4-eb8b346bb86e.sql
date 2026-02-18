
-- =============================================
-- COMPREHENSIVE SECURITY FIX MIGRATION
-- =============================================

-- 1. Fix generate_partner_code function search_path
CREATE OR REPLACE FUNCTION public.generate_partner_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.partner_code IS NULL OR NEW.partner_code = '' THEN
    NEW.partner_code := 'PTR-' || UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$$;

-- 2. Fix overly permissive RLS policies

-- 2a. ad_analytics INSERT - restrict to authenticated users inserting for valid ads
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.ad_analytics;
CREATE POLICY "Authenticated users can insert analytics"
ON public.ad_analytics FOR INSERT
TO authenticated
WITH CHECK (true);
-- Note: ad analytics tracking needs to work for any authenticated user viewing any ad, keeping WITH CHECK (true) but restricting to authenticated role

-- 2b. audit_checklist_items UPDATE - restrict to org members or auditors
DROP POLICY IF EXISTS "Public checklist update" ON public.audit_checklist_items;
CREATE POLICY "Auditors can update checklist items"
ON public.audit_checklist_items FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.audit_sessions s
    WHERE s.id = audit_session_id
    AND (
      -- Organization members
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid()
        AND p.organization_id = s.organization_id
      )
      -- Or admin
      OR public.has_role(auth.uid(), 'admin')
    )
  )
);

-- 2c. commodity_market_prices - restrict to admin only (edge functions use service_role which bypasses RLS)
DROP POLICY IF EXISTS "Service role can manage commodity prices" ON public.commodity_market_prices;
CREATE POLICY "Admins can manage commodity prices"
ON public.commodity_market_prices FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2d. esg_reports - restrict to org members and admin
DROP POLICY IF EXISTS "Service role can manage ESG reports" ON public.esg_reports;
CREATE POLICY "Org members and admins can manage ESG reports"
ON public.esg_reports FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.organization_id = esg_reports.organization_id
  )
  OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.organization_id = esg_reports.organization_id
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- 2e. geo_concentration_alerts - restrict to admin
DROP POLICY IF EXISTS "Service role can manage geo alerts" ON public.geo_concentration_alerts;
CREATE POLICY "Admins can manage geo alerts"
ON public.geo_concentration_alerts FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2f. waste_flow_analytics - restrict to admin
DROP POLICY IF EXISTS "Service role can manage waste flows" ON public.waste_flow_analytics;
CREATE POLICY "Admins can manage waste flows"
ON public.waste_flow_analytics FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2g. whatsapp_messages INSERT - restrict to org members
DROP POLICY IF EXISTS "System can insert messages" ON public.whatsapp_messages;
CREATE POLICY "Org members can insert messages"
ON public.whatsapp_messages FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.organization_id = whatsapp_messages.organization_id
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- 3. Make sensitive storage buckets private
UPDATE storage.buckets SET public = false WHERE id IN (
  'id-cards',
  'weighbridge-photos', 
  'payment-receipts',
  'organization-stamps',
  'rating-evidence',
  'entity-documents',
  'document-archive'
);
