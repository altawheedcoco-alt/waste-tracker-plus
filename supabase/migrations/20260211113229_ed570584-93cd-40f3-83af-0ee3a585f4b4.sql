
-- Inspection Logs Table for environmental inspection records
CREATE TABLE public.inspection_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES public.disposal_facilities(id) ON DELETE SET NULL,
  
  -- Inspection details
  inspection_date DATE NOT NULL,
  inspector_name TEXT,
  inspector_authority TEXT NOT NULL, -- 'wmra', 'eeaa', 'civil_protection', 'ida', 'other'
  inspection_type TEXT DEFAULT 'routine', -- 'routine', 'surprise', 'follow_up', 'complaint'
  
  -- Results
  result TEXT DEFAULT 'pending', -- 'passed', 'passed_with_notes', 'failed', 'pending'
  findings TEXT,
  recommendations TEXT,
  violations TEXT[] DEFAULT '{}',
  risk_level TEXT DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
  
  -- Documents
  report_url TEXT,
  report_file_name TEXT,
  photos TEXT[] DEFAULT '{}',
  
  -- Follow-up
  follow_up_date DATE,
  follow_up_notes TEXT,
  corrective_actions TEXT,
  is_resolved BOOLEAN DEFAULT false,
  
  -- Metadata
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.inspection_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org inspections"
  ON public.inspection_logs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert inspections for their org"
  ON public.inspection_logs FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their org inspections"
  ON public.inspection_logs FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all inspections"
  ON public.inspection_logs FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE INDEX idx_inspection_logs_org ON public.inspection_logs(organization_id);
CREATE INDEX idx_inspection_logs_date ON public.inspection_logs(inspection_date);

CREATE TRIGGER update_inspection_logs_updated_at
  BEFORE UPDATE ON public.inspection_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
