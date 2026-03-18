
DROP POLICY IF EXISTS "Members can manage their org default supervisors" ON public.organization_movement_supervisors;
DROP POLICY IF EXISTS "Members can view their org default supervisors" ON public.organization_movement_supervisors;

CREATE POLICY "Members can view their org supervisors"
ON public.organization_movement_supervisors
FOR SELECT
USING (
  organization_id IN (
    SELECT p.organization_id FROM profiles p WHERE p.id = auth.uid()
  )
  OR is_current_user_admin()
);

CREATE POLICY "Members can manage their org supervisors"
ON public.organization_movement_supervisors
FOR ALL
USING (
  organization_id IN (
    SELECT p.organization_id FROM profiles p WHERE p.id = auth.uid()
  )
  OR is_current_user_admin()
)
WITH CHECK (
  organization_id IN (
    SELECT p.organization_id FROM profiles p WHERE p.id = auth.uid()
  )
  OR is_current_user_admin()
);
