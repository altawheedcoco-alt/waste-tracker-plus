-- Drop existing insert policy
DROP POLICY IF EXISTS "Shipments creatable by transporters" ON public.shipments;

-- Create new policy allowing both transporters and their drivers to create shipments
CREATE POLICY "Shipments creatable by transporters and drivers"
ON public.shipments
FOR INSERT
WITH CHECK (
  -- Transporter can create shipments for their organization
  (transporter_id = get_user_organization_id(auth.uid()))
  OR
  -- Driver can create shipments for their transporter organization
  (
    has_role(auth.uid(), 'driver') AND
    transporter_id IN (
      SELECT d.organization_id 
      FROM drivers d 
      JOIN profiles p ON p.id = d.profile_id 
      WHERE p.user_id = auth.uid()
    )
  )
);

-- Update view policy to include drivers seeing their assigned shipments
DROP POLICY IF EXISTS "Shipments viewable by related organizations" ON public.shipments;

CREATE POLICY "Shipments viewable by related parties"
ON public.shipments
FOR SELECT
USING (
  -- Organization members can view their org's shipments
  (generator_id = get_user_organization_id(auth.uid())) OR
  (transporter_id = get_user_organization_id(auth.uid())) OR
  (recycler_id = get_user_organization_id(auth.uid())) OR
  -- Drivers can view shipments they created or are assigned to
  (
    has_role(auth.uid(), 'driver') AND (
      driver_id IN (
        SELECT d.id FROM drivers d 
        JOIN profiles p ON p.id = d.profile_id 
        WHERE p.user_id = auth.uid()
      )
      OR
      created_by IN (
        SELECT p.id FROM profiles p WHERE p.user_id = auth.uid()
      )
    )
  )
);

-- Update the update policy similarly
DROP POLICY IF EXISTS "Shipments updatable by related parties" ON public.shipments;

CREATE POLICY "Shipments updatable by related parties"
ON public.shipments
FOR UPDATE
USING (
  (generator_id = get_user_organization_id(auth.uid())) OR
  (transporter_id = get_user_organization_id(auth.uid())) OR
  (recycler_id = get_user_organization_id(auth.uid())) OR
  -- Drivers can update shipments they're assigned to
  (
    has_role(auth.uid(), 'driver') AND
    driver_id IN (
      SELECT d.id FROM drivers d 
      JOIN profiles p ON p.id = d.profile_id 
      WHERE p.user_id = auth.uid()
    )
  )
);