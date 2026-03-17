
-- Security definer function to get a user from a partner org (bypasses RLS safely)
CREATE OR REPLACE FUNCTION public.get_partner_org_user_id(_partner_org_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id
  FROM profiles p
  WHERE p.organization_id = _partner_org_id
    AND p.is_active = true
  LIMIT 1
$$;

-- Allow viewing basic profiles of users in linked partner organizations
CREATE POLICY "Users can view profiles of linked partner orgs"
ON public.profiles
FOR SELECT
USING (
  organization_id IN (
    SELECT CASE
      WHEN vp.requester_org_id = get_user_org_id_safe(auth.uid()) THEN vp.partner_org_id
      ELSE vp.requester_org_id
    END
    FROM verified_partnerships vp
    WHERE vp.status = 'active'
      AND (
        vp.requester_org_id = get_user_org_id_safe(auth.uid())
        OR vp.partner_org_id = get_user_org_id_safe(auth.uid())
      )
  )
);
