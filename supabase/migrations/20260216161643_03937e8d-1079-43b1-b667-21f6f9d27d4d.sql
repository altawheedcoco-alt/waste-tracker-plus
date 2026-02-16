
-- Table for smart driver notifications/alerts
CREATE TABLE public.driver_smart_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  driver_id UUID REFERENCES public.drivers(id),
  alert_type TEXT NOT NULL, -- 'approaching_destination', 'delay_warning', 'maintenance_due', 'rest_reminder', 'document_expiry', 'fuel_reminder'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'critical'
  shipment_id UUID REFERENCES public.shipments(id),
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

ALTER TABLE public.driver_smart_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view their alerts"
ON public.driver_smart_alerts FOR SELECT
TO authenticated
USING (organization_id IN (
  SELECT uo.organization_id FROM public.user_organizations uo
  JOIN public.profiles p ON p.id = uo.user_id
  WHERE p.user_id = auth.uid() AND uo.is_active = true
));

CREATE POLICY "Org members can insert alerts"
ON public.driver_smart_alerts FOR INSERT
TO authenticated
WITH CHECK (organization_id IN (
  SELECT uo.organization_id FROM public.user_organizations uo
  JOIN public.profiles p ON p.id = uo.user_id
  WHERE p.user_id = auth.uid() AND uo.is_active = true
));

CREATE POLICY "Org members can update alerts"
ON public.driver_smart_alerts FOR UPDATE
TO authenticated
USING (organization_id IN (
  SELECT uo.organization_id FROM public.user_organizations uo
  JOIN public.profiles p ON p.id = uo.user_id
  WHERE p.user_id = auth.uid() AND uo.is_active = true
));

CREATE INDEX idx_driver_smart_alerts_org ON public.driver_smart_alerts(organization_id, is_read, created_at DESC);
CREATE INDEX idx_driver_smart_alerts_driver ON public.driver_smart_alerts(driver_id, is_read);

-- Table for sustainability reports sent to clients
CREATE TABLE public.sustainability_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  partner_organization_id UUID REFERENCES public.organizations(id),
  report_period TEXT NOT NULL, -- e.g., '2026-01', '2026-02'
  report_type TEXT NOT NULL DEFAULT 'monthly', -- 'monthly', 'quarterly', 'annual'
  total_waste_collected_tons NUMERIC DEFAULT 0,
  total_recycled_tons NUMERIC DEFAULT 0,
  total_landfilled_tons NUMERIC DEFAULT 0,
  recycling_rate NUMERIC DEFAULT 0,
  carbon_saved_kg NUMERIC DEFAULT 0,
  trees_equivalent NUMERIC DEFAULT 0,
  driving_km_equivalent NUMERIC DEFAULT 0,
  water_saved_liters NUMERIC DEFAULT 0,
  shipments_count INTEGER DEFAULT 0,
  report_data JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'generated', 'sent'
  sent_at TIMESTAMPTZ,
  generated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sustainability_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can manage their reports"
ON public.sustainability_reports FOR ALL
TO authenticated
USING (organization_id IN (
  SELECT uo.organization_id FROM public.user_organizations uo
  JOIN public.profiles p ON p.id = uo.user_id
  WHERE p.user_id = auth.uid() AND uo.is_active = true
));

CREATE POLICY "Partners can view reports shared with them"
ON public.sustainability_reports FOR SELECT
TO authenticated
USING (partner_organization_id IN (
  SELECT uo.organization_id FROM public.user_organizations uo
  JOIN public.profiles p ON p.id = uo.user_id
  WHERE p.user_id = auth.uid() AND uo.is_active = true
) AND status = 'sent');

CREATE INDEX idx_sustainability_reports_org ON public.sustainability_reports(organization_id, report_period DESC);

-- Driver performance scores table
CREATE TABLE public.driver_performance_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  driver_id UUID NOT NULL REFERENCES public.drivers(id),
  period_date DATE NOT NULL DEFAULT CURRENT_DATE,
  on_time_score NUMERIC DEFAULT 0, -- 0-100
  safety_score NUMERIC DEFAULT 0,
  customer_rating_score NUMERIC DEFAULT 0,
  efficiency_score NUMERIC DEFAULT 0, -- fuel efficiency, route optimization
  compliance_score NUMERIC DEFAULT 0, -- documents, vehicle checks
  overall_score NUMERIC DEFAULT 0,
  total_trips INTEGER DEFAULT 0,
  trips_on_time INTEGER DEFAULT 0,
  incidents_count INTEGER DEFAULT 0,
  total_distance_km NUMERIC DEFAULT 0,
  badges JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(driver_id, period_date)
);

ALTER TABLE public.driver_performance_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can manage driver scores"
ON public.driver_performance_scores FOR ALL
TO authenticated
USING (organization_id IN (
  SELECT uo.organization_id FROM public.user_organizations uo
  JOIN public.profiles p ON p.id = uo.user_id
  WHERE p.user_id = auth.uid() AND uo.is_active = true
));

CREATE INDEX idx_driver_perf_scores ON public.driver_performance_scores(organization_id, driver_id, period_date DESC);
