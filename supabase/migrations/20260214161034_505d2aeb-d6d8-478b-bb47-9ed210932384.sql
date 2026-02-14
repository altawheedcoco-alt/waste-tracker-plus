-- Allow generators to create delivery receipts/certificates
CREATE POLICY "Generators can create delivery receipts"
ON public.shipment_receipts
FOR INSERT
TO authenticated
WITH CHECK (user_belongs_to_org(auth.uid(), generator_id));
