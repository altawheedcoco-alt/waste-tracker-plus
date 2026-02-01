-- First, drop the existing problematic INSERT policy for drivers
DROP POLICY IF EXISTS "Drivers can insert own location" ON public.driver_location_logs;

-- Create a new, properly working INSERT policy for drivers
CREATE POLICY "Drivers can insert own location logs"
ON public.driver_location_logs
FOR INSERT
WITH CHECK (
  driver_id IN (
    SELECT d.id 
    FROM drivers d
    JOIN profiles p ON p.id = d.profile_id
    WHERE p.user_id = auth.uid()
  )
);

-- Add SELECT policy for drivers to read their own location logs
CREATE POLICY "Drivers can view own location logs"
ON public.driver_location_logs
FOR SELECT
USING (
  driver_id IN (
    SELECT d.id 
    FROM drivers d
    JOIN profiles p ON p.id = d.profile_id
    WHERE p.user_id = auth.uid()
  )
);

-- Add UPDATE policy for drivers (in case they need to correct location data)
CREATE POLICY "Drivers can update own location logs"
ON public.driver_location_logs
FOR UPDATE
USING (
  driver_id IN (
    SELECT d.id 
    FROM drivers d
    JOIN profiles p ON p.id = d.profile_id
    WHERE p.user_id = auth.uid()
  )
);

-- Enable realtime for driver_location_logs for live tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_location_logs;