
-- ==========================================
-- 1. Global Commodity Market Prices Table
-- ==========================================
CREATE TABLE public.commodity_market_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  commodity_type TEXT NOT NULL, -- 'metals', 'paper', 'plastics', 'rdf', 'wood', 'textiles', 'glass', 'organic'
  commodity_subtype TEXT NOT NULL, -- 'iron_scrap', 'copper', 'aluminum', 'occ_cardboard', 'hdpe', 'pet', etc.
  commodity_name TEXT NOT NULL,
  commodity_name_ar TEXT NOT NULL,
  price_per_ton NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  price_source TEXT NOT NULL, -- 'LME', 'RISI', 'PlasticsExchange', 'local_market', 'ai_estimate'
  source_url TEXT,
  price_date DATE NOT NULL DEFAULT CURRENT_DATE,
  previous_price NUMERIC,
  price_change_percent NUMERIC,
  trend TEXT DEFAULT 'stable', -- 'rising', 'falling', 'stable'
  region TEXT DEFAULT 'global', -- 'global', 'mena', 'egypt', 'europe', 'asia'
  unit TEXT DEFAULT 'ton',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.commodity_market_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view commodity prices" ON public.commodity_market_prices FOR SELECT USING (true);
CREATE POLICY "Service role can manage commodity prices" ON public.commodity_market_prices FOR ALL USING (true);

CREATE INDEX idx_commodity_prices_type ON public.commodity_market_prices(commodity_type, price_date DESC);
CREATE INDEX idx_commodity_prices_date ON public.commodity_market_prices(price_date DESC);

-- ==========================================
-- 2. Waste Flow Analytics Table
-- ==========================================
CREATE TABLE public.waste_flow_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id),
  source_region TEXT NOT NULL, -- geographic region name
  source_lat NUMERIC,
  source_lng NUMERIC,
  destination_region TEXT,
  destination_lat NUMERIC,
  destination_lng NUMERIC,
  waste_type TEXT NOT NULL,
  waste_category TEXT NOT NULL, -- 'commodity', 'rdf', 'hazardous', 'organic'
  quantity_tons NUMERIC NOT NULL DEFAULT 0,
  flow_date DATE NOT NULL DEFAULT CURRENT_DATE,
  flow_direction TEXT DEFAULT 'generator_to_recycler', -- 'generator_to_recycler', 'generator_to_disposal', 'transporter_delivery'
  shipment_count INTEGER DEFAULT 0,
  avg_price_per_ton NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.waste_flow_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view waste flows" ON public.waste_flow_analytics FOR SELECT USING (true);
CREATE POLICY "Service role can manage waste flows" ON public.waste_flow_analytics FOR ALL USING (true);

CREATE INDEX idx_waste_flow_date ON public.waste_flow_analytics(flow_date DESC);
CREATE INDEX idx_waste_flow_region ON public.waste_flow_analytics(source_region, destination_region);

-- ==========================================
-- 3. Geographic Concentration Alerts Table
-- ==========================================
CREATE TABLE public.geo_concentration_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  region_name TEXT NOT NULL,
  region_lat NUMERIC NOT NULL,
  region_lng NUMERIC NOT NULL,
  alert_type TEXT NOT NULL, -- 'accumulation', 'shortage', 'price_spike', 'capacity_warning'
  waste_type TEXT,
  severity TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  current_value NUMERIC,
  threshold_value NUMERIC,
  message TEXT NOT NULL,
  message_ar TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

ALTER TABLE public.geo_concentration_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view geo alerts" ON public.geo_concentration_alerts FOR SELECT USING (true);
CREATE POLICY "Service role can manage geo alerts" ON public.geo_concentration_alerts FOR ALL USING (true);

-- ==========================================
-- 4. ESG Reports Table
-- ==========================================
CREATE TABLE public.esg_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id),
  report_title TEXT NOT NULL,
  report_type TEXT NOT NULL DEFAULT 'quarterly', -- 'monthly', 'quarterly', 'annual', 'custom'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_waste_diverted_tons NUMERIC DEFAULT 0,
  total_waste_landfilled_tons NUMERIC DEFAULT 0,
  diversion_rate NUMERIC DEFAULT 0,
  carbon_emissions_saved_tons NUMERIC DEFAULT 0,
  carbon_credits_earned NUMERIC DEFAULT 0,
  carbon_credit_value_usd NUMERIC DEFAULT 0,
  renewable_energy_generated_kwh NUMERIC DEFAULT 0,
  water_saved_liters NUMERIC DEFAULT 0,
  trees_equivalent_saved NUMERIC DEFAULT 0,
  sdg_contributions JSONB DEFAULT '{}',
  environmental_score NUMERIC DEFAULT 0,
  social_score NUMERIC DEFAULT 0,
  governance_score NUMERIC DEFAULT 0,
  overall_esg_score NUMERIC DEFAULT 0,
  report_data JSONB DEFAULT '{}',
  report_url TEXT,
  status TEXT DEFAULT 'draft', -- 'draft', 'generated', 'reviewed', 'published'
  generated_by UUID,
  reviewed_by UUID,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.esg_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their org ESG reports" ON public.esg_reports FOR SELECT USING (true);
CREATE POLICY "Service role can manage ESG reports" ON public.esg_reports FOR ALL USING (true);

CREATE INDEX idx_esg_reports_org ON public.esg_reports(organization_id, period_start DESC);

-- Enable realtime for alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.geo_concentration_alerts;
