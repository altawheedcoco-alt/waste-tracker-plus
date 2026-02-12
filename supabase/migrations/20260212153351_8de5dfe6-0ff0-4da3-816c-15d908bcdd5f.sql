
-- Create delivery declarations table
CREATE TABLE public.delivery_declarations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id UUID NOT NULL REFERENCES public.shipments(id),
  declared_by_user_id UUID NOT NULL,
  declared_by_organization_id UUID NOT NULL REFERENCES public.organizations(id),
  declaration_text TEXT NOT NULL,
  declared_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  driver_name TEXT,
  driver_national_id TEXT,
  shipment_number TEXT,
  waste_type TEXT,
  quantity NUMERIC,
  unit TEXT,
  generator_name TEXT,
  transporter_name TEXT,
  recycler_name TEXT,
  disposal_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.delivery_declarations ENABLE ROW LEVEL SECURITY;

-- Policy: Users in shared organizations can view declarations
CREATE POLICY "Shared orgs can view delivery declarations"
ON public.delivery_declarations
FOR SELECT
USING (
  declared_by_organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
  OR
  shipment_id IN (
    SELECT id FROM public.shipments 
    WHERE generator_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    OR transporter_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    OR recycler_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    OR disposal_facility_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  )
);

-- Policy: Users can create declarations for their org
CREATE POLICY "Users can create delivery declarations"
ON public.delivery_declarations
FOR INSERT
WITH CHECK (
  declared_by_organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);
