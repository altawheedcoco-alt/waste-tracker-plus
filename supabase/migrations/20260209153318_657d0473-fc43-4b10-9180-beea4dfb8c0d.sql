
-- gps_device_types: no direct access, use security definer function if needed
DROP POLICY IF EXISTS "Only admins can view GPS device types" ON public.gps_device_types;

CREATE POLICY "No direct access to GPS device types"
ON public.gps_device_types FOR SELECT
USING (false);

-- Create a security definer function for internal use only
CREATE OR REPLACE FUNCTION public.get_gps_device_types()
RETURNS SETOF public.gps_device_types
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.gps_device_types WHERE is_active = true;
$$;
