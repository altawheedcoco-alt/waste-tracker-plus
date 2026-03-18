
-- Security Reports table for periodic reports
CREATE TABLE IF NOT EXISTS public.security_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL DEFAULT 'periodic' CHECK (report_type IN ('periodic', 'incident', 'on_demand')),
  report_period TEXT NOT NULL DEFAULT 'daily' CHECK (report_period IN ('hourly', 'daily', 'weekly', 'monthly')),
  status TEXT NOT NULL DEFAULT 'clean' CHECK (status IN ('clean', 'warning', 'critical')),
  summary TEXT NOT NULL,
  total_threats INTEGER NOT NULL DEFAULT 0,
  critical_threats INTEGER NOT NULL DEFAULT 0,
  high_threats INTEGER NOT NULL DEFAULT 0,
  medium_threats INTEGER NOT NULL DEFAULT 0,
  low_threats INTEGER NOT NULL DEFAULT 0,
  threats_mitigated INTEGER NOT NULL DEFAULT 0,
  threats_pending INTEGER NOT NULL DEFAULT 0,
  security_score INTEGER NOT NULL DEFAULT 100,
  findings JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.security_reports ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their org security reports"
ON public.security_reports FOR SELECT TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.security_reports;

-- Index for faster queries
CREATE INDEX idx_security_reports_org_date ON public.security_reports(organization_id, generated_at DESC);
