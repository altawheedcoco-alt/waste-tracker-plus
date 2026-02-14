
-- Allow recyclers (and other parties) to UPDATE delivery declarations (e.g., reject/cancel)
DROP POLICY IF EXISTS "Users can update delivery declarations" ON public.delivery_declarations;
CREATE POLICY "Users can update delivery declarations"
ON public.delivery_declarations FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM shipments s
    WHERE s.id = delivery_declarations.shipment_id
    AND (
      s.generator_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
      OR s.transporter_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
      OR s.recycler_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
    )
  )
);
