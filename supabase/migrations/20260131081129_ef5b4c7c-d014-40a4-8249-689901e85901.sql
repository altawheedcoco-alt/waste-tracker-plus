
-- Add RLS policy for drivers to view their assigned shipments
CREATE POLICY "Drivers can view their assigned shipments"
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

-- Add RLS policy for drivers to update their assigned shipments (status changes)
CREATE POLICY "Drivers can update their assigned shipments"
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
