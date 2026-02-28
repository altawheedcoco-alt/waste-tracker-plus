
-- 1. Job Lifecycle Gates: enforce consultant approval before invoice
CREATE TABLE IF NOT EXISTS public.job_lifecycle_gates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  gate_type TEXT NOT NULL CHECK (gate_type IN (
    'consultant_classification', 'consultant_approval', 'weight_verification',
    'document_completion', 'geofence_verification', 'safety_check'
  )),
  gate_status TEXT NOT NULL DEFAULT 'pending' CHECK (gate_status IN ('pending', 'passed', 'failed', 'bypassed')),
  gate_order INT NOT NULL DEFAULT 1,
  checked_by UUID,
  checked_at TIMESTAMPTZ,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(shipment_id, gate_type)
);

ALTER TABLE public.job_lifecycle_gates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view gates for their org shipments" ON public.job_lifecycle_gates
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage gates for their org" ON public.job_lifecycle_gates
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()
    )
  );

-- 2. Geofence alerts log table
CREATE TABLE IF NOT EXISTS public.geofence_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID REFERENCES public.shipments(id) ON DELETE CASCADE,
  driver_id UUID,
  organization_id UUID REFERENCES public.organizations(id),
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'entered_pickup', 'entered_delivery', 'unauthorized_dump',
    'route_deviation', 'signal_lost', 'eta_warning', 'speed_violation'
  )),
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  distance_meters DOUBLE PRECISION,
  message TEXT,
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.geofence_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view geofence alerts for their org" ON public.geofence_alerts
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage geofence alerts for their org" ON public.geofence_alerts
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()
    )
  );

-- 3. ESG report snapshots for archival
CREATE TABLE IF NOT EXISTS public.esg_report_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  report_period TEXT NOT NULL,
  report_type TEXT NOT NULL DEFAULT 'quarterly' CHECK (report_type IN ('monthly', 'quarterly', 'annual')),
  generated_by UUID,
  overall_score INT,
  environmental_score INT,
  social_score INT,
  governance_score INT,
  total_weight_tons DOUBLE PRECISION DEFAULT 0,
  recycled_weight_tons DOUBLE PRECISION DEFAULT 0,
  carbon_saved_tons DOUBLE PRECISION DEFAULT 0,
  diversion_rate DOUBLE PRECISION DEFAULT 0,
  report_data JSONB DEFAULT '{}',
  sdg_data JSONB DEFAULT '[]',
  certificate_number TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'final', 'published')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.esg_report_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ESG reports for their org" ON public.esg_report_snapshots
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create ESG reports for their org" ON public.esg_report_snapshots
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_job_lifecycle_gates_updated_at
  BEFORE UPDATE ON public.job_lifecycle_gates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_esg_report_snapshots_updated_at
  BEFORE UPDATE ON public.esg_report_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for geofence alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.geofence_alerts;
