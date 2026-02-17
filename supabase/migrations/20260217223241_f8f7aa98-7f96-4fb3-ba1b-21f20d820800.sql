
-- ========================================
-- 1. Digital Product Passport (DPP) - جواز المنتج الرقمي
-- ========================================
CREATE TABLE public.digital_product_passports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  passport_number TEXT NOT NULL UNIQUE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  
  -- Product info
  product_name TEXT NOT NULL,
  product_name_en TEXT,
  product_category TEXT NOT NULL, -- recycled_plastic, recycled_metal, compost, etc.
  product_description TEXT,
  batch_number TEXT,
  production_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Source material traceability
  source_waste_type TEXT NOT NULL,
  source_shipment_ids UUID[] DEFAULT '{}',
  source_generator_ids UUID[] DEFAULT '{}',
  source_regions TEXT[] DEFAULT '{}',
  
  -- Recycled content
  recycled_content_percent NUMERIC(5,2) DEFAULT 0,
  virgin_content_percent NUMERIC(5,2) DEFAULT 0,
  
  -- Quality & compliance
  quality_grade TEXT DEFAULT 'standard', -- premium, standard, economy
  iso_certifications TEXT[] DEFAULT '{}',
  basel_code TEXT,
  hazard_class TEXT,
  
  -- Environmental metrics
  carbon_footprint_kg NUMERIC(12,4) DEFAULT 0,
  carbon_saved_kg NUMERIC(12,4) DEFAULT 0,
  water_saved_liters NUMERIC(12,2) DEFAULT 0,
  energy_saved_kwh NUMERIC(12,2) DEFAULT 0,
  landfill_diverted_kg NUMERIC(12,4) DEFAULT 0,
  
  -- Circularity
  mci_score NUMERIC(5,4) DEFAULT 0, -- Material Circularity Index 0-1
  recyclability_score NUMERIC(5,2) DEFAULT 0, -- 0-100
  expected_lifecycles INTEGER DEFAULT 1,
  current_lifecycle INTEGER DEFAULT 1,
  
  -- EU DPP Compliance
  eu_dpp_compliant BOOLEAN DEFAULT false,
  eu_regulation_ref TEXT,
  
  -- Verification
  qr_code_hash TEXT,
  verification_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ,
  
  -- Status
  status TEXT DEFAULT 'draft', -- draft, active, expired, revoked
  valid_until DATE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

ALTER TABLE public.digital_product_passports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org DPPs" ON public.digital_product_passports
  FOR SELECT USING (organization_id IN (
    SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Users can create own org DPPs" ON public.digital_product_passports
  FOR INSERT WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Users can update own org DPPs" ON public.digital_product_passports
  FOR UPDATE USING (organization_id IN (
    SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid() AND is_active = true
  ));

-- Public verification access (anyone with QR code can verify)
CREATE POLICY "Public can verify DPPs" ON public.digital_product_passports
  FOR SELECT USING (status = 'active' AND is_verified = true);

CREATE INDEX idx_dpp_org ON public.digital_product_passports(organization_id);
CREATE INDEX idx_dpp_status ON public.digital_product_passports(status);
CREATE INDEX idx_dpp_passport_number ON public.digital_product_passports(passport_number);

-- ========================================
-- 2. DPP Lifecycle Events - أحداث دورة حياة المنتج
-- ========================================
CREATE TABLE public.dpp_lifecycle_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  passport_id UUID NOT NULL REFERENCES public.digital_product_passports(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- sourced, processed, quality_checked, certified, shipped, received, recycled
  event_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor_organization_id UUID REFERENCES public.organizations(id),
  actor_name TEXT,
  location TEXT,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  details JSONB DEFAULT '{}',
  evidence_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.dpp_lifecycle_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view lifecycle events" ON public.dpp_lifecycle_events
  FOR SELECT USING (
    passport_id IN (SELECT id FROM public.digital_product_passports WHERE organization_id IN (
      SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid() AND is_active = true
    ))
  );

CREATE POLICY "Org members can insert lifecycle events" ON public.dpp_lifecycle_events
  FOR INSERT WITH CHECK (
    passport_id IN (SELECT id FROM public.digital_product_passports WHERE organization_id IN (
      SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid() AND is_active = true
    ))
  );

CREATE INDEX idx_dpp_lifecycle_passport ON public.dpp_lifecycle_events(passport_id);

-- ========================================
-- 3. Industrial Symbiosis Network - شبكة التكافل الصناعي
-- ========================================
CREATE TABLE public.symbiosis_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  listing_type TEXT NOT NULL, -- output (I have waste), input (I need material)
  material_type TEXT NOT NULL,
  material_description TEXT,
  quantity_tons_per_month NUMERIC(12,2) DEFAULT 0,
  quality_specs JSONB DEFAULT '{}',
  price_per_ton NUMERIC(12,2),
  currency TEXT DEFAULT 'EGP',
  location_governorate TEXT,
  location_lat NUMERIC(10,7),
  location_lng NUMERIC(10,7),
  available_from DATE DEFAULT CURRENT_DATE,
  available_until DATE,
  is_active BOOLEAN DEFAULT true,
  matched_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

ALTER TABLE public.symbiosis_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active listings" ON public.symbiosis_listings
  FOR SELECT USING (is_active = true OR organization_id IN (
    SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Users can manage own listings" ON public.symbiosis_listings
  FOR INSERT WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Users can update own listings" ON public.symbiosis_listings
  FOR UPDATE USING (organization_id IN (
    SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE INDEX idx_symbiosis_type ON public.symbiosis_listings(listing_type, material_type);
CREATE INDEX idx_symbiosis_active ON public.symbiosis_listings(is_active) WHERE is_active = true;

-- ========================================
-- 4. Symbiosis Matches - مطابقات التكافل
-- ========================================
CREATE TABLE public.symbiosis_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  output_listing_id UUID NOT NULL REFERENCES public.symbiosis_listings(id),
  input_listing_id UUID NOT NULL REFERENCES public.symbiosis_listings(id),
  output_org_id UUID NOT NULL REFERENCES public.organizations(id),
  input_org_id UUID NOT NULL REFERENCES public.organizations(id),
  material_type TEXT NOT NULL,
  matched_quantity_tons NUMERIC(12,2) DEFAULT 0,
  match_score NUMERIC(5,2) DEFAULT 0, -- AI confidence 0-100
  match_reason TEXT,
  status TEXT DEFAULT 'suggested', -- suggested, accepted, rejected, active, completed
  distance_km NUMERIC(10,2),
  estimated_savings_egp NUMERIC(12,2) DEFAULT 0,
  carbon_saved_kg NUMERIC(12,4) DEFAULT 0,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.symbiosis_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Involved orgs can view matches" ON public.symbiosis_matches
  FOR SELECT USING (
    output_org_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid() AND is_active = true)
    OR input_org_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Involved orgs can update matches" ON public.symbiosis_matches
  FOR UPDATE USING (
    output_org_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid() AND is_active = true)
    OR input_org_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid() AND is_active = true)
  );

CREATE INDEX idx_symbiosis_matches_orgs ON public.symbiosis_matches(output_org_id, input_org_id);

-- ========================================
-- 5. Circularity KPIs - مؤشرات الدائرية
-- ========================================
CREATE TABLE public.circularity_kpis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  period_month TEXT NOT NULL, -- YYYY-MM
  
  -- Core MCI
  mci_score NUMERIC(5,4) DEFAULT 0,
  
  -- Material flows (tons)
  total_input_tons NUMERIC(12,2) DEFAULT 0,
  recycled_input_tons NUMERIC(12,2) DEFAULT 0,
  virgin_input_tons NUMERIC(12,2) DEFAULT 0,
  total_output_tons NUMERIC(12,2) DEFAULT 0,
  recycled_output_tons NUMERIC(12,2) DEFAULT 0,
  waste_output_tons NUMERIC(12,2) DEFAULT 0,
  
  -- Rates
  recycling_rate NUMERIC(5,2) DEFAULT 0,
  recovery_rate NUMERIC(5,2) DEFAULT 0,
  waste_diversion_rate NUMERIC(5,2) DEFAULT 0,
  
  -- Economic
  material_value_recovered_egp NUMERIC(12,2) DEFAULT 0,
  cost_savings_egp NUMERIC(12,2) DEFAULT 0,
  revenue_from_secondary_materials_egp NUMERIC(12,2) DEFAULT 0,
  
  -- Environmental
  carbon_avoided_tons NUMERIC(12,4) DEFAULT 0,
  water_saved_m3 NUMERIC(12,2) DEFAULT 0,
  energy_saved_mwh NUMERIC(12,2) DEFAULT 0,
  
  -- Symbiosis
  symbiosis_connections INTEGER DEFAULT 0,
  symbiosis_volume_tons NUMERIC(12,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(organization_id, period_month)
);

ALTER TABLE public.circularity_kpis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org KPIs" ON public.circularity_kpis
  FOR SELECT USING (organization_id IN (
    SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Users can manage own org KPIs" ON public.circularity_kpis
  FOR INSERT WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Users can update own org KPIs" ON public.circularity_kpis
  FOR UPDATE USING (organization_id IN (
    SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE INDEX idx_circularity_kpis_org ON public.circularity_kpis(organization_id, period_month);

-- Triggers for updated_at
CREATE TRIGGER update_dpp_updated_at BEFORE UPDATE ON public.digital_product_passports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_symbiosis_listings_updated_at BEFORE UPDATE ON public.symbiosis_listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_symbiosis_matches_updated_at BEFORE UPDATE ON public.symbiosis_matches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_circularity_kpis_updated_at BEFORE UPDATE ON public.circularity_kpis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for symbiosis matches
ALTER PUBLICATION supabase_realtime ADD TABLE public.symbiosis_matches;
