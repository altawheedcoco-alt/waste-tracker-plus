
-- Drop old broken RLS policies that use organization_members (nearly empty table)
DROP POLICY IF EXISTS "Org members can manage auto actions" ON public.organization_auto_actions;
DROP POLICY IF EXISTS "Org members can read auto actions" ON public.organization_auto_actions;
DROP POLICY IF EXISTS "System admins can manage all auto actions" ON public.organization_auto_actions;

-- Create new policies using profiles.organization_id (where actual org membership is tracked)
CREATE POLICY "Org members can read auto actions"
ON public.organization_auto_actions
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT p.organization_id FROM profiles p WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Org members can update auto actions"
ON public.organization_auto_actions
FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT p.organization_id FROM profiles p WHERE p.user_id = auth.uid()
  )
)
WITH CHECK (
  organization_id IN (
    SELECT p.organization_id FROM profiles p WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Org members can insert auto actions"
ON public.organization_auto_actions
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT p.organization_id FROM profiles p WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "System admins can manage all auto actions"
ON public.organization_auto_actions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
