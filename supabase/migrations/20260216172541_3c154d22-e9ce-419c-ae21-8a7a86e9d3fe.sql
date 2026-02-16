
-- Fix the overly permissive FOR ALL policies from this migration
DROP POLICY IF EXISTS "org_members_manage_risk" ON public.partner_risk_scores;
CREATE POLICY "org_members_insert_risk" ON public.partner_risk_scores FOR INSERT WITH CHECK (
  organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
);
CREATE POLICY "org_members_update_risk" ON public.partner_risk_scores FOR UPDATE USING (
  organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
);
CREATE POLICY "org_members_delete_risk" ON public.partner_risk_scores FOR DELETE USING (
  organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "org_manage_gov_reports" ON public.government_reports;
CREATE POLICY "org_insert_gov_reports" ON public.government_reports FOR INSERT WITH CHECK (
  organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
);
CREATE POLICY "org_update_gov_reports" ON public.government_reports FOR UPDATE USING (
  organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "org_manage_credits" ON public.carbon_credits;
CREATE POLICY "org_insert_credits" ON public.carbon_credits FOR INSERT WITH CHECK (
  organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
);
CREATE POLICY "org_update_credits" ON public.carbon_credits FOR UPDATE USING (
  organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "org_manage_iot" ON public.iot_devices;
CREATE POLICY "org_insert_iot" ON public.iot_devices FOR INSERT WITH CHECK (
  organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
);
CREATE POLICY "org_update_iot" ON public.iot_devices FOR UPDATE USING (
  organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
);
