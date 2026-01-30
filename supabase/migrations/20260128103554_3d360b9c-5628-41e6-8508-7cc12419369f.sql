-- Make organization_id nullable in drivers table to allow pending driver registrations
ALTER TABLE public.drivers ALTER COLUMN organization_id DROP NOT NULL;

-- Create a table for pending driver approvals (admin can see all pending drivers)
CREATE OR REPLACE FUNCTION public.get_pending_drivers()
RETURNS TABLE (
  id uuid,
  profile_id uuid,
  license_number text,
  vehicle_type text,
  vehicle_plate text,
  license_expiry date,
  is_available boolean,
  created_at timestamptz,
  full_name text,
  email text,
  phone text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    d.id,
    d.profile_id,
    d.license_number,
    d.vehicle_type,
    d.vehicle_plate,
    d.license_expiry,
    d.is_available,
    d.created_at,
    p.full_name,
    p.email,
    p.phone
  FROM drivers d
  JOIN profiles p ON d.profile_id = p.id
  WHERE d.organization_id IS NULL
  ORDER BY d.created_at DESC;
$$;

-- Add RLS policy to allow admins to view all drivers (including pending)
CREATE POLICY "Admins can view all drivers"
ON public.drivers
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policy to allow admins to update drivers (for approval)
CREATE POLICY "Admins can update all drivers"
ON public.drivers
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policy to allow driver self-registration (insert without organization)
CREATE POLICY "Users can register as drivers"
ON public.drivers
FOR INSERT
WITH CHECK (
  profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);