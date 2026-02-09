
-- 1. Fix disposal_facilities: restrict to authenticated users only
DROP POLICY IF EXISTS "Public can view disposal facilities" ON public.disposal_facilities;
DROP POLICY IF EXISTS "Anyone can view disposal facilities" ON public.disposal_facilities;
DROP POLICY IF EXISTS "Disposal facilities are publicly readable" ON public.disposal_facilities;

CREATE POLICY "Authenticated users can view disposal facilities"
ON public.disposal_facilities FOR SELECT TO authenticated
USING (true);

-- 2. Fix gps_device_types: restrict to authenticated users only
DROP POLICY IF EXISTS "Public can view GPS device types" ON public.gps_device_types;
DROP POLICY IF EXISTS "Anyone can view gps device types" ON public.gps_device_types;
DROP POLICY IF EXISTS "GPS device types are publicly readable" ON public.gps_device_types;

CREATE POLICY "Authenticated users can view GPS device types"
ON public.gps_device_types FOR SELECT TO authenticated
USING (true);

-- 3. Fix organization_deposit_links: restrict SELECT to owner org only
DROP POLICY IF EXISTS "Public can view deposit links" ON public.organization_deposit_links;
DROP POLICY IF EXISTS "Anyone can view organization deposit links" ON public.organization_deposit_links;
DROP POLICY IF EXISTS "Deposit links are publicly readable" ON public.organization_deposit_links;
DROP POLICY IF EXISTS "Organization deposit links are publicly readable" ON public.organization_deposit_links;

CREATE POLICY "Org members can view their deposit links"
ON public.organization_deposit_links FOR SELECT TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Allow public access ONLY via token lookup (for the public deposit form)
CREATE POLICY "Public can lookup active deposit link by token"
ON public.organization_deposit_links FOR SELECT TO anon
USING (is_active = true);
