
-- =============================================
-- 1) Helper functions (security definer)
-- =============================================

-- Check partner visibility setting
CREATE OR REPLACE FUNCTION public.check_partner_visibility(
  _viewer_org_id uuid,
  _owner_org_id uuid,
  _permission text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT 
      CASE _permission
        WHEN 'can_view_maps' THEN can_view_maps
        WHEN 'can_view_tracking' THEN can_view_tracking
        WHEN 'can_view_routes' THEN can_view_routes
        WHEN 'can_view_driver_location' THEN can_view_driver_location
        WHEN 'can_view_shipment_details' THEN can_view_shipment_details
        WHEN 'can_view_driver_info' THEN can_view_driver_info
        WHEN 'can_view_vehicle_info' THEN can_view_vehicle_info
        WHEN 'can_view_estimated_arrival' THEN can_view_estimated_arrival
        WHEN 'can_receive_notifications' THEN can_receive_notifications
        WHEN 'can_view_reports' THEN can_view_reports
        WHEN 'can_view_recycler_info' THEN can_view_recycler_info
        WHEN 'can_view_generator_info' THEN can_view_generator_info
        ELSE false
      END
    FROM partner_visibility_settings
    WHERE organization_id = _owner_org_id
      AND partner_organization_id = _viewer_org_id
    LIMIT 1),
    false
  );
$$;

-- Get user's organization_id
CREATE OR REPLACE FUNCTION public.get_user_org_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM profiles WHERE user_id = _user_id LIMIT 1;
$$;

-- Check if two orgs are verified partners
CREATE OR REPLACE FUNCTION public.are_verified_partners(_org1 uuid, _org2 uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM verified_partnerships
    WHERE status = 'active'
      AND (
        (requester_org_id = _org1 AND partner_org_id = _org2)
        OR (requester_org_id = _org2 AND partner_org_id = _org1)
      )
  );
$$;

-- =============================================
-- 2) RLS: drivers - partner sees only if allowed
-- =============================================
DROP POLICY IF EXISTS "Partners can view driver info" ON drivers;
CREATE POLICY "Partners can view driver info"
ON drivers
FOR SELECT
TO authenticated
USING (
  organization_id = public.get_user_org_id(auth.uid())
  OR (
    public.are_verified_partners(organization_id, public.get_user_org_id(auth.uid()))
    AND public.check_partner_visibility(public.get_user_org_id(auth.uid()), organization_id, 'can_view_driver_info')
  )
);

-- =============================================
-- 3) RLS: shipments - participating orgs always see,
--    verified partners see only if visibility enabled
-- =============================================
DROP POLICY IF EXISTS "Partners can view shipment details" ON shipments;
CREATE POLICY "Partners can view shipment details"
ON shipments
FOR SELECT
TO authenticated
USING (
  public.get_user_org_id(auth.uid()) IN (generator_id, transporter_id, recycler_id)
  OR (
    (
      public.are_verified_partners(generator_id, public.get_user_org_id(auth.uid()))
      OR public.are_verified_partners(transporter_id, public.get_user_org_id(auth.uid()))
      OR public.are_verified_partners(recycler_id, public.get_user_org_id(auth.uid()))
    )
    AND public.check_partner_visibility(
      public.get_user_org_id(auth.uid()), 
      transporter_id, 
      'can_view_shipment_details'
    )
  )
);
