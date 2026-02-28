
-- ═══════════════════════════════════════════════════════
-- 1. جدول العمليات الميدانية للاستشاري
-- ═══════════════════════════════════════════════════════
CREATE TABLE public.consultant_field_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id UUID NOT NULL REFERENCES public.environmental_consultants(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL, -- site_inspection, waste_classification, hazard_assessment, vehicle_inspection, load_matching
  shipment_id UUID REFERENCES public.shipments(id) ON DELETE SET NULL,
  
  -- Site inspection data
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  location_address TEXT,
  inspection_photos TEXT[], -- URLs
  
  -- Waste classification (EWC)
  ewc_code TEXT,
  ewc_description TEXT,
  waste_category TEXT, -- solid, liquid, gaseous, sludge
  
  -- Hazard assessment
  is_hazardous BOOLEAN DEFAULT false,
  hazard_level TEXT, -- none, low, medium, high, critical
  hazard_classification TEXT, -- flammable, corrosive, toxic, reactive, infectious
  un_number TEXT, -- UN hazardous goods number
  
  -- Vehicle inspection
  vehicle_id UUID,
  vehicle_plate TEXT,
  vehicle_permit_valid BOOLEAN,
  vehicle_safety_check BOOLEAN,
  vehicle_labeling_check BOOLEAN,
  
  -- Load matching
  declared_weight NUMERIC,
  actual_weight NUMERIC,
  weight_match BOOLEAN,
  weight_variance_pct NUMERIC,
  
  -- Common
  result TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, needs_review
  notes TEXT,
  evidence_urls TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.consultant_field_operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Consultants can manage their own field ops"
  ON public.consultant_field_operations FOR ALL
  TO authenticated
  USING (
    consultant_id IN (
      SELECT id FROM public.environmental_consultants WHERE user_id = auth.uid()
    )
    OR
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE INDEX idx_field_ops_consultant ON public.consultant_field_operations(consultant_id);
CREATE INDEX idx_field_ops_org ON public.consultant_field_operations(organization_id);
CREATE INDEX idx_field_ops_shipment ON public.consultant_field_operations(shipment_id);

-- ═══════════════════════════════════════════════════════
-- 2. إضافة حقل الاعتماد الفني للشحنات (Lock Rule)
-- ═══════════════════════════════════════════════════════
ALTER TABLE public.shipments 
  ADD COLUMN IF NOT EXISTS consultant_technical_approval TEXT DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS consultant_approved_by UUID REFERENCES public.environmental_consultants(id),
  ADD COLUMN IF NOT EXISTS consultant_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS consultant_approval_notes TEXT;

-- ═══════════════════════════════════════════════════════
-- 3. جدول مسودات الاستشاري (Auto-Draft System)
-- ═══════════════════════════════════════════════════════
CREATE TABLE public.consultant_review_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id UUID REFERENCES public.environmental_consultants(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  shipment_id UUID REFERENCES public.shipments(id) ON DELETE CASCADE,
  
  -- Auto-pulled data
  shipment_data JSONB, -- snapshot of shipment at draft creation
  waste_type TEXT,
  weight_tons NUMERIC,
  distance_km NUMERIC,
  transport_office TEXT,
  generator_name TEXT,
  recycler_name TEXT,
  
  -- Consultant review
  status TEXT NOT NULL DEFAULT 'pending', -- pending, reviewed, approved, rejected, converted_to_certificate
  review_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  certificate_id TEXT, -- reference to generated certificate
  
  -- Watermark rule
  issued_by_type TEXT DEFAULT 'individual', -- individual or office
  office_approval_status TEXT DEFAULT 'not_required', -- not_required, pending, approved, rejected
  office_approved_by UUID REFERENCES public.environmental_consultants(id),
  office_approved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.consultant_review_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Consultants can manage review drafts"
  ON public.consultant_review_drafts FOR ALL
  TO authenticated
  USING (
    consultant_id IN (
      SELECT id FROM public.environmental_consultants WHERE user_id = auth.uid()
    )
    OR
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE INDEX idx_review_drafts_consultant ON public.consultant_review_drafts(consultant_id);
CREATE INDEX idx_review_drafts_shipment ON public.consultant_review_drafts(shipment_id);
CREATE INDEX idx_review_drafts_status ON public.consultant_review_drafts(status);

-- ═══════════════════════════════════════════════════════
-- 4. إضافة صلاحيات ميدانية لجدول تعيين الاستشاريين
-- ═══════════════════════════════════════════════════════
ALTER TABLE public.consultant_organization_assignments
  ADD COLUMN IF NOT EXISTS can_inspect_sites BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_classify_waste BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_inspect_vehicles BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_match_loads BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_approve_technical BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_issue_certificates BOOLEAN DEFAULT false;
