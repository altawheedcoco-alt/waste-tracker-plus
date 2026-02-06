-- Fix shipment links policies - correct syntax without IF NOT EXISTS
-- First drop if exists, then create

DROP POLICY IF EXISTS "Anyone can view shipment links" ON public.organization_shipment_links;
DROP POLICY IF EXISTS "Public can view organization_shipment_links" ON public.organization_shipment_links;
DROP POLICY IF EXISTS "Org members can view their shipment links" ON public.organization_shipment_links;
DROP POLICY IF EXISTS "Anon can access shipment link with token" ON public.organization_shipment_links;

-- Create policies for organization_shipment_links
CREATE POLICY "Org members can view their shipment links"
ON public.organization_shipment_links FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() AND is_active = true
  )
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Anon can access shipment link with token"
ON public.organization_shipment_links FOR SELECT
TO anon
USING (is_active = true);