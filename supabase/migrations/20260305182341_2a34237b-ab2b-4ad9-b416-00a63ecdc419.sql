
-- Table for saving manual shipment drafts (editable, shareable)
CREATE TABLE public.manual_shipment_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  created_by UUID NOT NULL,
  share_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  
  -- Core shipment data (all manual text)
  shipment_number TEXT,
  generator_name TEXT,
  generator_address TEXT,
  generator_phone TEXT,
  generator_license TEXT,
  transporter_name TEXT,
  transporter_address TEXT,
  transporter_phone TEXT,
  transporter_license TEXT,
  destination_name TEXT,
  destination_address TEXT,
  destination_phone TEXT,
  destination_license TEXT,
  destination_type TEXT DEFAULT 'recycling',
  
  -- Waste info
  waste_type TEXT,
  waste_description TEXT,
  waste_state TEXT DEFAULT 'solid',
  hazard_level TEXT DEFAULT 'non_hazardous',
  quantity NUMERIC,
  unit TEXT DEFAULT 'ton',
  packaging_method TEXT,
  disposal_method TEXT,
  
  -- Driver & vehicle
  driver_name TEXT,
  driver_phone TEXT,
  driver_license TEXT,
  vehicle_plate TEXT,
  vehicle_type TEXT,
  
  -- Logistics
  pickup_address TEXT,
  delivery_address TEXT,
  pickup_date DATE,
  delivery_date DATE,
  shipment_type TEXT DEFAULT 'regular',
  
  -- Financial
  price NUMERIC,
  price_notes TEXT,
  
  -- Notes & extras
  notes TEXT,
  special_instructions TEXT,
  
  -- Metadata
  status TEXT DEFAULT 'draft',
  is_submitted BOOLEAN DEFAULT false,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.manual_shipment_drafts ENABLE ROW LEVEL SECURITY;

-- Org members can CRUD their own drafts
CREATE POLICY "Org members manage drafts" ON public.manual_shipment_drafts
  FOR ALL TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()
  ));

-- Anyone with share_code can read (for editable links)
CREATE POLICY "Public read via share code" ON public.manual_shipment_drafts
  FOR SELECT TO anon, authenticated
  USING (share_code IS NOT NULL AND status = 'draft');

-- Index for share code lookups
CREATE INDEX idx_manual_shipment_drafts_share_code ON public.manual_shipment_drafts(share_code);
