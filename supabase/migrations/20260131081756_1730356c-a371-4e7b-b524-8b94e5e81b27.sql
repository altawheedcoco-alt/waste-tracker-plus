
-- Drop existing driver policies
DROP POLICY IF EXISTS "Drivers can view assigned shipments" ON public.shipments;
DROP POLICY IF EXISTS "Drivers can update assigned shipments" ON public.shipments;

-- Create corrected policy: drivers view shipments by matching driver_id to their driver record
CREATE POLICY "Drivers can view assigned shipments"
ON public.shipments
FOR SELECT
USING (
  driver_id IN (
    SELECT d.id 
    FROM drivers d
    JOIN profiles p ON p.id = d.profile_id
    WHERE p.user_id = auth.uid()
  )
);

-- Create corrected policy: drivers can update their assigned shipments
CREATE POLICY "Drivers can update assigned shipments"
ON public.shipments
FOR UPDATE
USING (
  driver_id IN (
    SELECT d.id 
    FROM drivers d
    JOIN profiles p ON p.id = d.profile_id
    WHERE p.user_id = auth.uid()
  )
);
