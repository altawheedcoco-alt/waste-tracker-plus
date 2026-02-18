
-- Remove the overly permissive public policy
DROP POLICY IF EXISTS "Anyone can view active disposal facilities" ON public.disposal_facilities;

-- Remove the broad ALL policy
DROP POLICY IF EXISTS "Authenticated users can manage disposal facilities" ON public.disposal_facilities;

-- Keep the org-based SELECT policy (already exists and is correct)
-- "Org members can view disposal facilities" - already TO authenticated with org check

-- Add proper INSERT/UPDATE/DELETE policies for authenticated org members
CREATE POLICY "Org members can insert disposal facilities"
ON public.disposal_facilities FOR INSERT TO authenticated
WITH CHECK (
  organization_id = get_user_org_id_safe(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Org members can update disposal facilities"
ON public.disposal_facilities FOR UPDATE TO authenticated
USING (
  organization_id = get_user_org_id_safe(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Org members can delete disposal facilities"
ON public.disposal_facilities FOR DELETE TO authenticated
USING (
  organization_id = get_user_org_id_safe(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);
