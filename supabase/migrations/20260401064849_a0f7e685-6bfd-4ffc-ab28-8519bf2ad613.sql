-- Allow organization members to view their own organization's drivers
CREATE POLICY "Org members can view their drivers"
  ON public.drivers FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization_id(auth.uid()));

-- Allow organization members to insert drivers for their org
CREATE POLICY "Org members can insert drivers"
  ON public.drivers FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

-- Allow organization members to update their org's drivers
CREATE POLICY "Org members can update their drivers"
  ON public.drivers FOR UPDATE
  TO authenticated
  USING (organization_id = get_user_organization_id(auth.uid()))
  WITH CHECK (organization_id = get_user_organization_id(auth.uid()));