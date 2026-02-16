
-- 1. Partner Risk Scores
CREATE TABLE IF NOT EXISTS public.partner_risk_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  partner_organization_id UUID REFERENCES public.organizations(id),
  external_partner_id UUID REFERENCES public.external_partners(id),
  partner_name TEXT NOT NULL,
  risk_score NUMERIC DEFAULT 50,
  risk_level TEXT DEFAULT 'medium',
  payment_score NUMERIC DEFAULT 50,
  delivery_score NUMERIC DEFAULT 50,
  compliance_score NUMERIC DEFAULT 50,
  reliability_score NUMERIC DEFAULT 50,
  total_shipments INTEGER DEFAULT 0,
  delayed_shipments INTEGER DEFAULT 0,
  disputed_shipments INTEGER DEFAULT 0,
  avg_payment_days NUMERIC DEFAULT 0,
  last_incident_date TIMESTAMPTZ,
  risk_factors JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  calculated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.partner_risk_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_members_view_risk" ON public.partner_risk_scores FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
);
CREATE POLICY "org_members_manage_risk" ON public.partner_risk_scores FOR ALL USING (
  organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
);

-- 2. Chain of Custody Records
CREATE TABLE IF NOT EXISTS public.chain_of_custody (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id UUID REFERENCES public.shipments(id),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  custody_hash TEXT NOT NULL,
  previous_hash TEXT,
  event_type TEXT NOT NULL,
  event_description TEXT,
  actor_id UUID,
  actor_name TEXT,
  actor_role TEXT,
  location_name TEXT,
  location_lat NUMERIC,
  location_lng NUMERIC,
  weight_at_event NUMERIC,
  waste_type TEXT,
  evidence_urls JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  verified BOOLEAN DEFAULT false,
  verified_by UUID,
  block_number INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chain_of_custody ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_view_custody" ON public.chain_of_custody FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
);
CREATE POLICY "org_insert_custody" ON public.chain_of_custody FOR INSERT WITH CHECK (
  organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
);

-- 3. Government Reports
CREATE TABLE IF NOT EXISTS public.government_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  report_type TEXT NOT NULL,
  report_period TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT DEFAULT 'draft',
  submission_date TIMESTAMPTZ,
  submission_reference TEXT,
  report_data JSONB DEFAULT '{}',
  summary JSONB DEFAULT '{}',
  compliance_score NUMERIC,
  issues_found JSONB DEFAULT '[]',
  generated_by UUID,
  submitted_by UUID,
  file_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.government_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_view_gov_reports" ON public.government_reports FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
);
CREATE POLICY "org_manage_gov_reports" ON public.government_reports FOR ALL USING (
  organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
);

-- 4. Carbon Credits
CREATE TABLE IF NOT EXISTS public.carbon_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  credit_type TEXT NOT NULL DEFAULT 'recycling',
  carbon_tons NUMERIC NOT NULL DEFAULT 0,
  credit_value_usd NUMERIC DEFAULT 0,
  credit_value_sar NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending',
  source_shipment_id UUID REFERENCES public.shipments(id),
  source_description TEXT,
  verification_status TEXT DEFAULT 'unverified',
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  certificate_number TEXT,
  certificate_url TEXT,
  tradeable BOOLEAN DEFAULT false,
  traded_to TEXT,
  traded_at TIMESTAMPTZ,
  traded_price NUMERIC,
  expiry_date DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.carbon_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_view_credits" ON public.carbon_credits FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
);
CREATE POLICY "org_manage_credits" ON public.carbon_credits FOR ALL USING (
  organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
);

-- 5. IoT Device Registry
CREATE TABLE IF NOT EXISTS public.iot_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  device_type TEXT NOT NULL,
  device_name TEXT NOT NULL,
  device_serial TEXT,
  vehicle_id UUID REFERENCES public.vehicles(id),
  status TEXT DEFAULT 'active',
  last_reading JSONB DEFAULT '{}',
  last_reading_at TIMESTAMPTZ,
  battery_level NUMERIC,
  firmware_version TEXT,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.iot_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_view_iot" ON public.iot_devices FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
);
CREATE POLICY "org_manage_iot" ON public.iot_devices FOR ALL USING (
  organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
);

CREATE TABLE IF NOT EXISTS public.iot_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID NOT NULL REFERENCES public.iot_devices(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  reading_type TEXT NOT NULL,
  value NUMERIC,
  unit TEXT,
  metadata JSONB DEFAULT '{}',
  alert_triggered BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.iot_readings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_view_readings" ON public.iot_readings FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
);
CREATE POLICY "org_insert_readings" ON public.iot_readings FOR INSERT WITH CHECK (
  organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
);

-- Enable realtime for IoT
ALTER PUBLICATION supabase_realtime ADD TABLE public.iot_readings;
