
-- =============================================
-- Fix 1: shipment_movement_supervisors broken RLS (self-referencing tautology)
-- =============================================
DROP POLICY IF EXISTS "Members can insert supervisors for their org" ON public.shipment_movement_supervisors;
DROP POLICY IF EXISTS "Members can update supervisors of their org" ON public.shipment_movement_supervisors;
DROP POLICY IF EXISTS "Members can view supervisors of their shipments" ON public.shipment_movement_supervisors;

CREATE POLICY "Members can view supervisors of their org"
ON public.shipment_movement_supervisors FOR SELECT TO authenticated
USING (
  organization_id = get_user_org_id_safe(auth.uid())
  OR is_current_user_admin()
);

CREATE POLICY "Members can insert supervisors for their org"
ON public.shipment_movement_supervisors FOR INSERT TO authenticated
WITH CHECK (
  organization_id = get_user_org_id_safe(auth.uid())
  OR is_current_user_admin()
);

CREATE POLICY "Members can update supervisors of their org"
ON public.shipment_movement_supervisors FOR UPDATE TO authenticated
USING (
  organization_id = get_user_org_id_safe(auth.uid())
  OR is_current_user_admin()
);

-- =============================================
-- Fix 2: transfer_stations, sweeping_crews, sweeping_equipment, daily_attendance tautological RLS
-- =============================================
DROP POLICY IF EXISTS "org_access_transfer_stations" ON public.transfer_stations;
CREATE POLICY "org_access_transfer_stations" ON public.transfer_stations FOR ALL TO authenticated
USING (organization_id = get_user_org_id_safe(auth.uid()))
WITH CHECK (organization_id = get_user_org_id_safe(auth.uid()));

DROP POLICY IF EXISTS "org_access_sweeping_crews" ON public.sweeping_crews;
CREATE POLICY "org_access_sweeping_crews" ON public.sweeping_crews FOR ALL TO authenticated
USING (organization_id = get_user_org_id_safe(auth.uid()))
WITH CHECK (organization_id = get_user_org_id_safe(auth.uid()));

DROP POLICY IF EXISTS "org_access_sweeping_equipment" ON public.sweeping_equipment;
CREATE POLICY "org_access_sweeping_equipment" ON public.sweeping_equipment FOR ALL TO authenticated
USING (organization_id = get_user_org_id_safe(auth.uid()))
WITH CHECK (organization_id = get_user_org_id_safe(auth.uid()));

DROP POLICY IF EXISTS "org_access_daily_attendance" ON public.daily_attendance;
CREATE POLICY "org_access_daily_attendance" ON public.daily_attendance FOR ALL TO authenticated
USING (organization_id = get_user_org_id_safe(auth.uid()))
WITH CHECK (organization_id = get_user_org_id_safe(auth.uid()));

-- =============================================
-- Fix 3: signing-documents bucket - add org-scoped read policy
-- =============================================
DROP POLICY IF EXISTS "Users can read signing documents" ON storage.objects;
CREATE POLICY "Users can read signing documents" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'signing-documents'
  AND (storage.foldername(name))[1] = get_user_org_id_safe(auth.uid())::text
);

-- =============================================
-- Fix 4: external_missions - tighten the public_read_by_token to require token param
-- The public_update_by_token was already replaced with public_update_by_token_secure
-- But public_read_by_token still uses USING (true) for anon
-- =============================================
DROP POLICY IF EXISTS "public_read_by_token" ON public.external_missions;
CREATE POLICY "public_read_by_token" ON public.external_missions FOR SELECT TO anon, authenticated
USING (
  token IS NOT NULL AND token = current_setting('request.headers', true)::json->>'x-mission-token'
);

-- Also add org-member read for authenticated users
CREATE POLICY "org_members_read_external_missions" ON public.external_missions FOR SELECT TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  )
);
