
-- =============================================
-- Carbon Footprint System - IPCC Emission Factors
-- =============================================

-- 1. Emission factors reference table
CREATE TABLE public.carbon_emission_factors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  sub_category TEXT NOT NULL,
  factor_name TEXT NOT NULL,
  factor_name_ar TEXT NOT NULL,
  emission_factor NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'IPCC 2006',
  scope INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.carbon_emission_factors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Emission factors readable by all authenticated" ON public.carbon_emission_factors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage emission factors" ON public.carbon_emission_factors FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_organizations WHERE user_id = auth.uid() AND role_in_organization = 'admin')
);

-- 2. Carbon footprint per shipment
CREATE TABLE public.carbon_footprint_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id UUID REFERENCES public.shipments(id),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  calculation_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  generation_emissions NUMERIC DEFAULT 0,
  generation_details JSONB,
  transport_emissions NUMERIC DEFAULT 0,
  transport_distance_km NUMERIC,
  fuel_consumed_liters NUMERIC,
  fuel_type TEXT DEFAULT 'diesel',
  vehicle_type TEXT,
  transport_details JSONB,
  recycling_emissions NUMERIC DEFAULT 0,
  recycling_savings NUMERIC DEFAULT 0,
  recycling_details JSONB,
  disposal_emissions NUMERIC DEFAULT 0,
  disposal_method TEXT,
  disposal_details JSONB,
  total_emissions NUMERIC GENERATED ALWAYS AS (
    COALESCE(generation_emissions, 0) + COALESCE(transport_emissions, 0) + COALESCE(recycling_emissions, 0) + COALESCE(disposal_emissions, 0)
  ) STORED,
  total_savings NUMERIC DEFAULT 0,
  net_impact NUMERIC GENERATED ALWAYS AS (
    COALESCE(generation_emissions, 0) + COALESCE(transport_emissions, 0) + COALESCE(recycling_emissions, 0) + COALESCE(disposal_emissions, 0) - COALESCE(recycling_savings, 0)
  ) STORED,
  verified BOOLEAN DEFAULT false,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  document_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.carbon_footprint_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View org carbon records" ON public.carbon_footprint_records FOR SELECT TO authenticated USING (
  organization_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid())
);
CREATE POLICY "Insert org carbon records" ON public.carbon_footprint_records FOR INSERT TO authenticated WITH CHECK (
  organization_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid())
);

-- 3. Carbon summary per organization per period
CREATE TABLE public.carbon_summary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_type TEXT DEFAULT 'monthly',
  total_waste_tons NUMERIC DEFAULT 0,
  total_recycled_tons NUMERIC DEFAULT 0,
  total_landfilled_tons NUMERIC DEFAULT 0,
  scope1_emissions NUMERIC DEFAULT 0,
  scope2_emissions NUMERIC DEFAULT 0,
  scope3_emissions NUMERIC DEFAULT 0,
  total_emissions NUMERIC DEFAULT 0,
  total_savings NUMERIC DEFAULT 0,
  net_impact NUMERIC DEFAULT 0,
  recycling_rate NUMERIC,
  carbon_intensity NUMERIC,
  report_generated BOOLEAN DEFAULT false,
  report_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, period_start, period_end)
);

ALTER TABLE public.carbon_summary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View org carbon summary" ON public.carbon_summary FOR SELECT TO authenticated USING (
  organization_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid())
);
CREATE POLICY "Manage org carbon summary" ON public.carbon_summary FOR ALL TO authenticated USING (
  organization_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid())
);

-- 4. Seed IPCC emission factors
INSERT INTO public.carbon_emission_factors (category, sub_category, factor_name, factor_name_ar, emission_factor, unit, source, scope, notes) VALUES
('transport_fuel', 'diesel', 'Diesel combustion', 'احتراق الديزل', 2.68, 'kg_co2e_per_liter', 'IPCC 2006', 1, 'Vol 2 Table 3.2.1'),
('transport_fuel', 'gasoline', 'Gasoline combustion', 'احتراق البنزين', 2.31, 'kg_co2e_per_liter', 'IPCC 2006', 1, NULL),
('transport_fuel', 'cng', 'CNG combustion', 'احتراق غاز طبيعي', 2.02, 'kg_co2e_per_kg', 'IPCC 2006', 1, NULL),
('electricity', 'egypt_grid', 'Egypt grid', 'شبكة كهرباء مصر', 0.489, 'kg_co2e_per_kwh', 'IEA 2023', 2, NULL),
('waste_landfill', 'organic_waste', 'Organic landfill', 'عضوي - مدفن', 580, 'kg_co2e_per_ton', 'IPCC 2006', 1, 'Vol 5 Ch 3'),
('waste_landfill', 'paper_cardboard', 'Paper landfill', 'ورق - مدفن', 460, 'kg_co2e_per_ton', 'IPCC 2006', 1, NULL),
('waste_landfill', 'wood_waste', 'Wood landfill', 'خشب - مدفن', 330, 'kg_co2e_per_ton', 'IPCC 2006', 1, NULL),
('waste_landfill', 'textile_waste', 'Textile landfill', 'نسيج - مدفن', 400, 'kg_co2e_per_ton', 'IPCC 2006', 1, NULL),
('waste_landfill', 'plastic_landfill', 'Plastic landfill', 'بلاستيك - مدفن', 21, 'kg_co2e_per_ton', 'IPCC 2006', 1, NULL),
('waste_landfill', 'mixed_msw', 'Mixed MSW landfill', 'مختلط - مدفن', 450, 'kg_co2e_per_ton', 'IPCC 2006', 1, NULL),
('waste_landfill', 'hazardous_waste', 'Hazardous landfill', 'خطرة - مدفن آمن', 200, 'kg_co2e_per_ton', 'Egypt EEAA', 1, NULL),
('waste_incineration', 'plastic_incineration', 'Plastic incineration', 'حرق بلاستيك', 2700, 'kg_co2e_per_ton', 'IPCC 2006', 1, NULL),
('waste_incineration', 'mixed_incineration', 'Mixed incineration', 'حرق مختلط', 1200, 'kg_co2e_per_ton', 'IPCC 2006', 1, NULL),
('waste_recycling', 'plastic_recycling', 'Plastic recycling savings', 'توفير تدوير بلاستيك', 1400, 'kg_co2e_per_ton', 'GHG Protocol', 3, NULL),
('waste_recycling', 'paper_recycling', 'Paper recycling savings', 'توفير تدوير ورق', 900, 'kg_co2e_per_ton', 'GHG Protocol', 3, NULL),
('waste_recycling', 'metal_recycling', 'Metal recycling savings', 'توفير تدوير معادن', 4000, 'kg_co2e_per_ton', 'GHG Protocol', 3, NULL),
('waste_recycling', 'aluminum_recycling', 'Aluminum recycling savings', 'توفير تدوير ألومنيوم', 9000, 'kg_co2e_per_ton', 'GHG Protocol', 3, NULL),
('waste_recycling', 'glass_recycling', 'Glass recycling savings', 'توفير تدوير زجاج', 300, 'kg_co2e_per_ton', 'GHG Protocol', 3, NULL),
('waste_recycling', 'organic_composting', 'Composting savings', 'توفير تحويل لسماد', 200, 'kg_co2e_per_ton', 'IPCC 2006', 3, NULL),
('waste_recycling', 'e_waste_recycling', 'E-waste recycling savings', 'توفير تدوير إلكتروني', 3500, 'kg_co2e_per_ton', 'GHG Protocol', 3, NULL),
('waste_recycling', 'textile_recycling', 'Textile recycling savings', 'توفير تدوير نسيج', 3000, 'kg_co2e_per_ton', 'GHG Protocol', 3, NULL);
