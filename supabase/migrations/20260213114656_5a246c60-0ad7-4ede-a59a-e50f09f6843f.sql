
-- Fix iot_readings: the previous migration partially applied, verify and fix
DROP POLICY IF EXISTS "Authenticated can insert readings" ON public.iot_readings;
CREATE POLICY "Authenticated can insert readings"
ON public.iot_readings FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);
