-- Create driver location logs table
CREATE TABLE public.driver_location_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  speed NUMERIC,
  heading NUMERIC,
  accuracy NUMERIC,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX idx_driver_location_logs_driver_id ON public.driver_location_logs(driver_id);
CREATE INDEX idx_driver_location_logs_recorded_at ON public.driver_location_logs(recorded_at);
CREATE INDEX idx_driver_location_logs_driver_date ON public.driver_location_logs(driver_id, recorded_at);

-- Enable RLS
ALTER TABLE public.driver_location_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all location logs
CREATE POLICY "Admins can view all location logs"
ON public.driver_location_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Company admins can view their drivers' location logs
CREATE POLICY "Company admins can view own drivers location logs"
ON public.driver_location_logs
FOR SELECT
USING (
  driver_id IN (
    SELECT d.id FROM drivers d
    WHERE d.organization_id = get_user_organization_id(auth.uid())
  )
  AND has_role(auth.uid(), 'company_admin'::app_role)
);

-- Drivers can log their own location
CREATE POLICY "Drivers can insert own location"
ON public.driver_location_logs
FOR INSERT
WITH CHECK (
  driver_id IN (
    SELECT d.id FROM drivers d
    JOIN profiles p ON p.id = d.profile_id
    WHERE p.user_id = auth.uid()
  )
);

-- Admins can insert location logs
CREATE POLICY "Admins can insert location logs"
ON public.driver_location_logs
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Company admins can insert for their drivers
CREATE POLICY "Company admins can insert for their drivers"
ON public.driver_location_logs
FOR INSERT
WITH CHECK (
  driver_id IN (
    SELECT d.id FROM drivers d
    WHERE d.organization_id = get_user_organization_id(auth.uid())
  )
  AND has_role(auth.uid(), 'company_admin'::app_role)
);