
-- Fix RLS policy: profiles.id != auth.uid(), should use profiles.user_id = auth.uid()
DROP POLICY IF EXISTS "Shared orgs can view delivery declarations" ON public.delivery_declarations;

CREATE POLICY "Shared orgs can view delivery declarations"
ON public.delivery_declarations
FOR SELECT
USING (
  (declared_by_organization_id IN (
    SELECT profiles.organization_id FROM profiles WHERE profiles.user_id = auth.uid()
  ))
  OR
  (shipment_id IN (
    SELECT shipments.id FROM shipments
    WHERE
      shipments.generator_id IN (SELECT profiles.organization_id FROM profiles WHERE profiles.user_id = auth.uid())
      OR shipments.transporter_id IN (SELECT profiles.organization_id FROM profiles WHERE profiles.user_id = auth.uid())
      OR shipments.recycler_id IN (SELECT profiles.organization_id FROM profiles WHERE profiles.user_id = auth.uid())
      OR shipments.disposal_facility_id IN (SELECT profiles.organization_id FROM profiles WHERE profiles.user_id = auth.uid())
  ))
);

-- Also fix the INSERT policy
DROP POLICY IF EXISTS "Users can create delivery declarations" ON public.delivery_declarations;

CREATE POLICY "Users can create delivery declarations"
ON public.delivery_declarations
FOR INSERT
WITH CHECK (
  declared_by_organization_id IN (
    SELECT profiles.organization_id FROM profiles WHERE profiles.user_id = auth.uid()
  )
);
