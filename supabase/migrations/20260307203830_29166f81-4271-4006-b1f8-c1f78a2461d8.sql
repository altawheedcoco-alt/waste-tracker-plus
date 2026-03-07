CREATE TABLE public.binding_audit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  org_type TEXT NOT NULL,
  report_content TEXT NOT NULL,
  audit_metadata JSONB DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.binding_audit_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org audit reports"
  ON public.binding_audit_reports
  FOR SELECT
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert own org audit reports"
  ON public.binding_audit_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE INDEX idx_binding_audit_reports_org ON public.binding_audit_reports(organization_id, created_at DESC);