
-- Drop existing policies
DROP POLICY IF EXISTS "Users can create quotations for own org" ON public.quotations;
DROP POLICY IF EXISTS "Users can view own org quotations" ON public.quotations;
DROP POLICY IF EXISTS "Users can update own org quotations" ON public.quotations;
DROP POLICY IF EXISTS "Users can delete own org draft quotations" ON public.quotations;

-- Recreate with admin support
CREATE POLICY "Users can create quotations for own org" ON public.quotations
FOR INSERT TO authenticated
WITH CHECK (
  public.is_current_user_admin()
  OR organization_id IN (
    SELECT om.organization_id FROM organization_members om WHERE om.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view own org quotations" ON public.quotations
FOR SELECT TO authenticated
USING (
  public.is_current_user_admin()
  OR organization_id IN (
    SELECT om.organization_id FROM organization_members om WHERE om.user_id = auth.uid()
  )
  OR client_organization_id IN (
    SELECT om.organization_id FROM organization_members om WHERE om.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own org quotations" ON public.quotations
FOR UPDATE TO authenticated
USING (
  public.is_current_user_admin()
  OR organization_id IN (
    SELECT om.organization_id FROM organization_members om WHERE om.user_id = auth.uid()
  )
  OR client_organization_id IN (
    SELECT om.organization_id FROM organization_members om WHERE om.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own org draft quotations" ON public.quotations
FOR DELETE TO authenticated
USING (
  public.is_current_user_admin()
  OR (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om WHERE om.user_id = auth.uid()
    )
    AND status = 'draft'
  )
);
