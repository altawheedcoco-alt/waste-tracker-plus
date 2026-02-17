
-- ═══════════════════════════════════════════
-- 1. Risk Matrix (مصفوفة المخاطر)
-- ═══════════════════════════════════════════
CREATE TABLE public.risk_register (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  risk_title TEXT NOT NULL,
  risk_description TEXT,
  risk_category TEXT NOT NULL DEFAULT 'environmental',
  likelihood INT NOT NULL CHECK (likelihood BETWEEN 1 AND 5),
  impact INT NOT NULL CHECK (impact BETWEEN 1 AND 5),
  risk_score INT GENERATED ALWAYS AS (likelihood * impact) STORED,
  risk_level TEXT GENERATED ALWAYS AS (
    CASE
      WHEN likelihood * impact >= 20 THEN 'critical'
      WHEN likelihood * impact >= 12 THEN 'high'
      WHEN likelihood * impact >= 6 THEN 'medium'
      ELSE 'low'
    END
  ) STORED,
  preventive_actions TEXT,
  responsible_user_id UUID,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'mitigated', 'accepted', 'closed')),
  review_date DATE,
  iso_clause TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_risk_register_org ON public.risk_register(organization_id);
ALTER TABLE public.risk_register ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view risks" ON public.risk_register FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Org members manage risks" ON public.risk_register FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Org members update risks" ON public.risk_register FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Org members delete risks" ON public.risk_register FOR DELETE
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE TRIGGER update_risk_register_updated_at
  BEFORE UPDATE ON public.risk_register FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ═══════════════════════════════════════════
-- 2. Corrective Actions (الأفعال التصحيحية)
-- ═══════════════════════════════════════════
CREATE TABLE public.corrective_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  ticket_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  source TEXT NOT NULL DEFAULT 'internal_audit' CHECK (source IN ('internal_audit', 'external_audit', 'customer_complaint', 'incident', 'observation', 'risk_register')),
  source_reference_id UUID,
  severity TEXT NOT NULL DEFAULT 'minor' CHECK (severity IN ('minor', 'major', 'critical', 'observation')),
  root_cause TEXT,
  corrective_action TEXT,
  preventive_action TEXT,
  assigned_to UUID,
  deadline DATE,
  completed_at TIMESTAMPTZ,
  evidence_urls TEXT[],
  evidence_notes TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'pending_verification', 'closed', 'overdue')),
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  iso_clause TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_corrective_actions_org ON public.corrective_actions(organization_id);
CREATE INDEX idx_corrective_actions_status ON public.corrective_actions(status);
ALTER TABLE public.corrective_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view CARs" ON public.corrective_actions FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Org members create CARs" ON public.corrective_actions FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Org members update CARs" ON public.corrective_actions FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Org members delete CARs" ON public.corrective_actions FOR DELETE
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE TRIGGER update_corrective_actions_updated_at
  BEFORE UPDATE ON public.corrective_actions FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Auto ticket number
CREATE OR REPLACE FUNCTION public.generate_car_ticket_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seq_num INT;
BEGIN
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(ticket_number FROM 'CAR-\d{4}-(\d+)') AS INT)
  ), 0) + 1
  INTO seq_num
  FROM corrective_actions;
  
  NEW.ticket_number := 'CAR-' || TO_CHAR(NOW(), 'YYMM') || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_car_ticket_number
  BEFORE INSERT ON public.corrective_actions
  FOR EACH ROW
  WHEN (NEW.ticket_number IS NULL OR NEW.ticket_number = '')
  EXECUTE FUNCTION public.generate_car_ticket_number();

-- ═══════════════════════════════════════════
-- 3. External Audit Sessions (بوابة المراجع)
-- ═══════════════════════════════════════════
CREATE TABLE public.audit_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  audit_type TEXT NOT NULL DEFAULT 'iso_14001' CHECK (audit_type IN ('iso_14001', 'iso_45001', 'iso_9001', 'internal', 'regulatory')),
  auditor_name TEXT NOT NULL,
  auditor_organization TEXT,
  auditor_email TEXT,
  access_token TEXT NOT NULL UNIQUE,
  access_expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  audit_date DATE NOT NULL,
  scope_description TEXT,
  overall_result TEXT CHECK (overall_result IN ('conforming', 'minor_nc', 'major_nc', 'not_assessed')),
  auditor_notes TEXT,
  auditor_signature_url TEXT,
  auditor_stamp_url TEXT,
  signed_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_sessions_org ON public.audit_sessions(organization_id);
CREATE INDEX idx_audit_sessions_token ON public.audit_sessions(access_token);
ALTER TABLE public.audit_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view audit sessions" ON public.audit_sessions FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Org members create audit sessions" ON public.audit_sessions FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Org members update audit sessions" ON public.audit_sessions FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Public access via token for external auditors
CREATE POLICY "Auditor access via token" ON public.audit_sessions FOR SELECT
  USING (true);

CREATE TRIGGER update_audit_sessions_updated_at
  BEFORE UPDATE ON public.audit_sessions FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Audit Checklist Items
CREATE TABLE public.audit_checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_session_id UUID NOT NULL REFERENCES public.audit_sessions(id) ON DELETE CASCADE,
  iso_clause TEXT NOT NULL,
  clause_title TEXT NOT NULL,
  clause_title_ar TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'not_assessed' CHECK (status IN ('conforming', 'minor_nc', 'major_nc', 'observation', 'not_applicable', 'not_assessed')),
  evidence_link TEXT,
  evidence_type TEXT,
  auditor_comment TEXT,
  data_source_table TEXT,
  data_source_query TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_checklist_session ON public.audit_checklist_items(audit_session_id);
ALTER TABLE public.audit_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view checklist" ON public.audit_checklist_items FOR SELECT
  USING (audit_session_id IN (SELECT id FROM public.audit_sessions WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())));

CREATE POLICY "Org members manage checklist" ON public.audit_checklist_items FOR INSERT
  WITH CHECK (audit_session_id IN (SELECT id FROM public.audit_sessions WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())));

CREATE POLICY "Org members update checklist" ON public.audit_checklist_items FOR UPDATE
  USING (audit_session_id IN (SELECT id FROM public.audit_sessions WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())));

-- Public access for auditors
CREATE POLICY "Public checklist view" ON public.audit_checklist_items FOR SELECT
  USING (true);

CREATE POLICY "Public checklist update" ON public.audit_checklist_items FOR UPDATE
  USING (true);

CREATE TRIGGER update_checklist_items_updated_at
  BEFORE UPDATE ON public.audit_checklist_items FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
