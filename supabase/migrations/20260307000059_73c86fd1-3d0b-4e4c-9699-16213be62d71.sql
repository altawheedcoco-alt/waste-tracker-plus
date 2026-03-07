-- Allow regulators to view all non-regulator organizations for oversight purposes
CREATE POLICY "Regulators can view all organizations"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organizations o2
    WHERE o2.id = get_user_org_id_safe(auth.uid())
    AND o2.organization_type = 'regulator'
  )
);