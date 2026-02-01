-- Add policy for drivers to view their own record
CREATE POLICY "Drivers can view own driver record"
ON public.drivers
FOR SELECT
USING (
  profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);

-- Add policy for drivers to update their own record
CREATE POLICY "Drivers can update own driver record"
ON public.drivers
FOR UPDATE
USING (
  profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);