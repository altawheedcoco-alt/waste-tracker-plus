-- Add organization_id to disposal_facilities for facilities that have system accounts
ALTER TABLE public.disposal_facilities ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- Create index for organization lookup
CREATE INDEX IF NOT EXISTS idx_disposal_facilities_org ON public.disposal_facilities(organization_id);

-- Create disposal_operations table for tracking operations
CREATE TABLE IF NOT EXISTS public.disposal_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disposal_facility_id UUID REFERENCES public.disposal_facilities(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  shipment_id UUID REFERENCES public.shipments(id) ON DELETE SET NULL,
  operation_type TEXT NOT NULL DEFAULT 'disposal',
  waste_type TEXT,
  waste_description TEXT,
  hazard_level TEXT DEFAULT 'hazardous',
  quantity NUMERIC NOT NULL,
  unit TEXT DEFAULT 'طن',
  disposal_method TEXT,
  disposal_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  certificate_number TEXT,
  certificate_url TEXT,
  manifest_number TEXT,
  receiving_officer TEXT,
  notes TEXT,
  environmental_impact_score NUMERIC,
  cost NUMERIC,
  currency TEXT DEFAULT 'EGP',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create disposal_certificates table
CREATE TABLE IF NOT EXISTS public.disposal_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  disposal_facility_id UUID REFERENCES public.disposal_facilities(id) ON DELETE SET NULL,
  operation_id UUID REFERENCES public.disposal_operations(id) ON DELETE SET NULL,
  certificate_number TEXT NOT NULL,
  issue_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  expiry_date TIMESTAMPTZ,
  waste_type TEXT,
  waste_description TEXT,
  quantity NUMERIC,
  unit TEXT DEFAULT 'طن',
  disposal_method TEXT,
  environmental_compliance_score NUMERIC,
  issued_by TEXT,
  verified BOOLEAN DEFAULT false,
  verification_code TEXT,
  qr_code_url TEXT,
  pdf_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create disposal_incoming_requests table
CREATE TABLE IF NOT EXISTS public.disposal_incoming_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disposal_facility_id UUID REFERENCES public.disposal_facilities(id) ON DELETE CASCADE,
  requesting_organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  shipment_id UUID REFERENCES public.shipments(id) ON DELETE SET NULL,
  waste_type TEXT,
  waste_description TEXT,
  hazard_level TEXT,
  estimated_quantity NUMERIC,
  unit TEXT DEFAULT 'طن',
  preferred_date DATE,
  priority TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'pending',
  notes TEXT,
  response_notes TEXT,
  responded_at TIMESTAMPTZ,
  responded_by UUID REFERENCES auth.users(id),
  scheduled_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_disposal_operations_facility ON public.disposal_operations(disposal_facility_id);
CREATE INDEX IF NOT EXISTS idx_disposal_operations_org ON public.disposal_operations(organization_id);
CREATE INDEX IF NOT EXISTS idx_disposal_operations_date ON public.disposal_operations(disposal_date);
CREATE INDEX IF NOT EXISTS idx_disposal_certificates_org ON public.disposal_certificates(organization_id);
CREATE INDEX IF NOT EXISTS idx_disposal_incoming_facility ON public.disposal_incoming_requests(disposal_facility_id);

-- Enable RLS
ALTER TABLE public.disposal_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disposal_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disposal_incoming_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for disposal_operations
CREATE POLICY "Disposal facilities can view their operations"
ON public.disposal_operations FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
  OR disposal_facility_id IN (
    SELECT df.id FROM public.disposal_facilities df
    WHERE df.organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  )
);

CREATE POLICY "Disposal facilities can insert operations"
ON public.disposal_operations FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Disposal facilities can update their operations"
ON public.disposal_operations FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- RLS Policies for disposal_certificates
CREATE POLICY "Users can view their certificates"
ON public.disposal_certificates FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Disposal facilities can insert certificates"
ON public.disposal_certificates FOR INSERT
WITH CHECK (true);

-- RLS Policies for disposal_incoming_requests
CREATE POLICY "Disposal facilities can view incoming requests"
ON public.disposal_incoming_requests FOR SELECT
USING (
  disposal_facility_id IN (
    SELECT df.id FROM public.disposal_facilities df
    WHERE df.organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  )
  OR requesting_organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Organizations can create disposal requests"
ON public.disposal_incoming_requests FOR INSERT
WITH CHECK (
  requesting_organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Disposal facilities can update requests"
ON public.disposal_incoming_requests FOR UPDATE
USING (
  disposal_facility_id IN (
    SELECT df.id FROM public.disposal_facilities df
    WHERE df.organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  )
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.disposal_operations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.disposal_incoming_requests;