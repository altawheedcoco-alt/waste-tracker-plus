
-- ═══════════════════════════════════════════════════════════════
-- المرحلة 2: KPIs سيادية + أزمات + SLA + تقارير ذكية
-- ═══════════════════════════════════════════════════════════════

-- 1) Crisis Management
CREATE TYPE public.crisis_severity AS ENUM ('level_1', 'level_2', 'level_3', 'level_4');

CREATE TABLE public.crisis_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  severity crisis_severity NOT NULL DEFAULT 'level_1',
  status TEXT NOT NULL DEFAULT 'active',
  affected_organizations UUID[] DEFAULT '{}',
  actions_taken JSONB DEFAULT '[]'::jsonb,
  emergency_plan JSONB DEFAULT '{}'::jsonb,
  initiated_by UUID,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.crisis_incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage crises" ON public.crisis_incidents
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

-- 2) SLA Definitions and Tracking
CREATE TABLE public.sla_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  target_value NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT 'hours',
  applies_to TEXT[] DEFAULT '{}',
  penalty_type TEXT DEFAULT 'warning',
  penalty_value NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sla_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage SLAs" ON public.sla_definitions
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE TABLE public.sla_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sla_id UUID REFERENCES public.sla_definitions(id) ON DELETE CASCADE,
  organization_id UUID,
  actual_value NUMERIC NOT NULL,
  target_value NUMERIC NOT NULL,
  deviation_percent NUMERIC,
  penalty_applied BOOLEAN DEFAULT false,
  penalty_amount NUMERIC DEFAULT 0,
  notes TEXT,
  shipment_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sla_violations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage SLA violations" ON public.sla_violations
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

-- 3) Sovereign Reports (AI-generated)
CREATE TABLE public.sovereign_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT NOT NULL,
  title TEXT NOT NULL,
  period TEXT NOT NULL,
  content TEXT,
  summary TEXT,
  key_metrics JSONB DEFAULT '{}'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  risk_indicators JSONB DEFAULT '[]'::jsonb,
  generated_by TEXT DEFAULT 'ai',
  status TEXT DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sovereign_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage reports" ON public.sovereign_reports
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

-- Seed default SLA definitions
INSERT INTO public.sla_definitions (name, name_ar, metric_type, target_value, unit, applies_to, penalty_type) VALUES
('Shipment Response Time', 'وقت الاستجابة للشحنات', 'response_time', 4, 'hours', ARRAY['transporter'], 'warning'),
('Delivery Completion Rate', 'معدل إتمام التسليم', 'completion_rate', 95, 'percent', ARRAY['transporter'], 'penalty'),
('Invoice Processing Time', 'وقت معالجة الفواتير', 'processing_time', 48, 'hours', ARRAY['generator','recycler'], 'warning'),
('Compliance Report Submission', 'تقديم تقارير الامتثال', 'submission_time', 72, 'hours', ARRAY['generator','transporter','recycler'], 'penalty'),
('Driver Assignment Speed', 'سرعة تعيين السائقين', 'assignment_time', 2, 'hours', ARRAY['transporter'], 'warning'),
('Waste Collection SLA', 'معيار جمع النفايات', 'collection_time', 24, 'hours', ARRAY['transporter'], 'penalty');

-- Enable realtime for crisis
ALTER PUBLICATION supabase_realtime ADD TABLE public.crisis_incidents;
