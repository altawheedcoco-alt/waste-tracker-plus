
-- =============================================
-- 1. Fix organizations: Remove broad "verified orgs" policy
-- The can_view_organization function already handles partner visibility
-- =============================================
DROP POLICY IF EXISTS "Verified orgs viewable by authenticated users" ON public.organizations;

-- =============================================
-- 2. Fix industrial_facilities: Restrict to authenticated only
-- No org_id column, so restrict to authenticated users (reference data)
-- =============================================
DROP POLICY IF EXISTS "Authenticated users can view industrial_facilities" ON public.industrial_facilities;
CREATE POLICY "Authenticated users can view industrial_facilities"
ON public.industrial_facilities FOR SELECT
TO authenticated
USING (true);
-- Note: This table has no organization_id - it's reference/lookup data (verified facilities list)
-- Keeping authenticated-only is appropriate for reference data

-- =============================================
-- 3. Fix disposal_facility_reviews: Only org members + admin
-- =============================================
DROP POLICY IF EXISTS "Users can view reviews" ON public.disposal_facility_reviews;
CREATE POLICY "Users can view own org reviews"
ON public.disposal_facility_reviews FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- =============================================
-- 4. Fix recycler_timeslots: Only org members + partners
-- =============================================
DROP POLICY IF EXISTS "Everyone can view active timeslots" ON public.recycler_timeslots;
CREATE POLICY "Org members and partners can view timeslots"
ON public.recycler_timeslots FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  )
  OR can_view_organization(organization_id)
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- =============================================
-- 5. Fix get_user_organization_id: wrong version uses id = auth.uid()
-- =============================================
CREATE OR REPLACE FUNCTION public.get_user_organization_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.profiles
  WHERE user_id = _user_id
  LIMIT 1
$$;
