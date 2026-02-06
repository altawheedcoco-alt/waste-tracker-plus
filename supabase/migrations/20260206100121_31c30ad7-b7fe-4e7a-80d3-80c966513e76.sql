-- Drop and recreate the INSERT policy with better check
DROP POLICY IF EXISTS "Users can insert locations for their organization" ON public.organization_locations;

CREATE POLICY "Users can insert locations for their organization"
ON public.organization_locations
FOR INSERT
TO authenticated
WITH CHECK (
  -- User belongs to the organization they're inserting for
  public.user_belongs_to_org(auth.uid(), organization_id)
  OR public.has_role(auth.uid(), 'admin')
);

-- Also update UPDATE policy to use the same approach
DROP POLICY IF EXISTS "Users can update their organization locations" ON public.organization_locations;

CREATE POLICY "Users can update their organization locations"
ON public.organization_locations
FOR UPDATE
TO authenticated
USING (
  public.user_belongs_to_org(auth.uid(), organization_id)
  OR public.has_role(auth.uid(), 'admin')
);

-- Also update DELETE policy
DROP POLICY IF EXISTS "Users can delete their organization locations" ON public.organization_locations;

CREATE POLICY "Users can delete their organization locations"
ON public.organization_locations
FOR DELETE
TO authenticated
USING (
  public.user_belongs_to_org(auth.uid(), organization_id)
  OR public.has_role(auth.uid(), 'admin')
);