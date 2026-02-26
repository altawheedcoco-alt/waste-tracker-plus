
-- Enum for field display modes
CREATE TYPE public.quick_link_field_mode AS ENUM ('fixed', 'restricted_list', 'free_input');

-- Main table: Quick Shipment Links
CREATE TABLE public.quick_shipment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  
  -- Link identity
  link_code VARCHAR(10) NOT NULL UNIQUE,
  link_name TEXT NOT NULL,
  description TEXT,
  
  -- Target driver (NULL = open link for any/unregistered driver)
  assigned_driver_id UUID REFERENCES public.profiles(id),
  
  -- Link settings
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  max_uses INTEGER, -- NULL = unlimited
  current_uses INTEGER NOT NULL DEFAULT 0,
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  auto_capture_gps BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Field configuration per link
CREATE TABLE public.quick_link_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES public.quick_shipment_links(id) ON DELETE CASCADE,
  
  -- Field definition
  field_name TEXT NOT NULL, -- e.g. 'waste_type', 'generator', 'receiver', 'quantity', 'weight', 'vehicle_plate', 'notes', 'photo_scale', 'photo_load', 'signature'
  field_label TEXT NOT NULL, -- Display label in Arabic
  field_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'number', 'select', 'photo', 'signature', 'gps'
  
  -- Mode & values
  field_mode quick_link_field_mode NOT NULL DEFAULT 'free_input',
  fixed_value TEXT, -- used when mode = 'fixed'
  allowed_values JSONB, -- used when mode = 'restricted_list', e.g. ["خشب كسر", "خشب باليتات"]
  default_value TEXT,
  
  -- Constraints
  min_value NUMERIC,
  max_value NUMERIC,
  is_required BOOLEAN NOT NULL DEFAULT false,
  is_visible BOOLEAN NOT NULL DEFAULT true, -- false = fixed hidden field
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(link_id, field_name)
);

-- Submissions from drivers
CREATE TABLE public.quick_link_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES public.quick_shipment_links(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  
  -- Driver info (for unregistered: captured from form; for registered: from profile)
  driver_name TEXT NOT NULL,
  driver_phone TEXT NOT NULL,
  driver_profile_id UUID REFERENCES public.profiles(id), -- NULL if unregistered at submission time
  auto_created_profile_id UUID REFERENCES public.profiles(id), -- profile created automatically
  
  -- Submission data (dynamic fields stored as JSONB)
  form_data JSONB NOT NULL DEFAULT '{}',
  photo_urls TEXT[],
  signature_url TEXT,
  gps_lat DOUBLE PRECISION,
  gps_lng DOUBLE PRECISION,
  
  -- Resulting shipment
  shipment_id UUID REFERENCES public.shipments(id),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'converted')),
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Meta
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_qsl_org ON public.quick_shipment_links(organization_id);
CREATE INDEX idx_qsl_code ON public.quick_shipment_links(link_code);
CREATE INDEX idx_qsl_driver ON public.quick_shipment_links(assigned_driver_id);
CREATE INDEX idx_qlf_link ON public.quick_link_fields(link_id);
CREATE INDEX idx_qls_link ON public.quick_link_submissions(link_id);
CREATE INDEX idx_qls_org ON public.quick_link_submissions(organization_id);
CREATE INDEX idx_qls_phone ON public.quick_link_submissions(driver_phone);

-- RLS
ALTER TABLE public.quick_shipment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_link_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_link_submissions ENABLE ROW LEVEL SECURITY;

-- Links: org members can CRUD
CREATE POLICY "Org members manage links"
  ON public.quick_shipment_links FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Fields: same as parent link
CREATE POLICY "Org members manage link fields"
  ON public.quick_link_fields FOR ALL
  USING (
    link_id IN (
      SELECT id FROM public.quick_shipment_links WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  )
  WITH CHECK (
    link_id IN (
      SELECT id FROM public.quick_shipment_links WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

-- Public read for link fields (drivers need to see them)
CREATE POLICY "Anyone can read link fields by link"
  ON public.quick_link_fields FOR SELECT
  USING (true);

-- Public read for active links (drivers access via code)
CREATE POLICY "Anyone can read active links"
  ON public.quick_shipment_links FOR SELECT
  USING (is_active = true);

-- Submissions: org members can read/update, anyone can insert
CREATE POLICY "Anyone can submit"
  ON public.quick_link_submissions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Org members read submissions"
  ON public.quick_link_submissions FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Org members update submissions"
  ON public.quick_link_submissions FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_quick_shipment_links_updated_at
  BEFORE UPDATE ON public.quick_shipment_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
