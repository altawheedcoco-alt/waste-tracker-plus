
-- 2. Regulator levels/types
CREATE TABLE public.regulator_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_code TEXT NOT NULL UNIQUE,
  level_name_ar TEXT NOT NULL,
  level_name_en TEXT NOT NULL,
  parent_level_code TEXT REFERENCES public.regulator_levels(level_code),
  scope TEXT NOT NULL DEFAULT 'national',
  can_issue_penalties BOOLEAN DEFAULT false,
  can_suspend_licenses BOOLEAN DEFAULT false,
  can_ban_organizations BOOLEAN DEFAULT false,
  can_track_vehicles BOOLEAN DEFAULT true,
  can_view_all_shipments BOOLEAN DEFAULT true,
  can_field_inspect BOOLEAN DEFAULT true,
  description_ar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.regulator_levels (level_code, level_name_ar, level_name_en, scope, can_issue_penalties, can_suspend_licenses, can_ban_organizations) VALUES
  ('ministry', 'وزارة البيئة', 'Ministry of Environment', 'national', true, true, true),
  ('wmra', 'جهاز تنظيم إدارة المخلفات', 'Waste Management Regulatory Authority', 'national', true, true, true),
  ('eeaa', 'جهاز شؤون البيئة', 'Egyptian Environmental Affairs Agency', 'national', true, true, false),
  ('governorate', 'المحافظة', 'Governorate', 'governorate', true, false, false);

UPDATE public.regulator_levels SET parent_level_code = 'ministry' WHERE level_code IN ('wmra', 'eeaa');
UPDATE public.regulator_levels SET parent_level_code = 'wmra' WHERE level_code = 'governorate';

CREATE TABLE public.regulator_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  regulator_level_code TEXT NOT NULL REFERENCES public.regulator_levels(level_code),
  governorate TEXT,
  jurisdiction_area TEXT[],
  authority_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id)
);

CREATE TABLE public.field_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regulator_organization_id UUID NOT NULL REFERENCES public.organizations(id),
  inspector_user_id UUID NOT NULL REFERENCES auth.users(id),
  inspected_organization_id UUID NOT NULL REFERENCES public.organizations(id),
  inspection_type TEXT NOT NULL DEFAULT 'routine',
  inspection_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  location_address TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  overall_rating TEXT,
  compliance_score INTEGER,
  findings TEXT,
  recommendations TEXT,
  photos TEXT[],
  documents TEXT[],
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date TIMESTAMPTZ,
  follow_up_notes TEXT,
  inspector_signature_url TEXT,
  inspected_signature_url TEXT,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.inspection_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES public.field_inspections(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  item_name_ar TEXT NOT NULL,
  item_name_en TEXT,
  is_compliant BOOLEAN,
  severity TEXT DEFAULT 'minor',
  notes TEXT,
  photo_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.regulatory_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  violation_number TEXT NOT NULL DEFAULT '',
  regulator_organization_id UUID NOT NULL REFERENCES public.organizations(id),
  issued_by_user_id UUID NOT NULL REFERENCES auth.users(id),
  violating_organization_id UUID NOT NULL REFERENCES public.organizations(id),
  inspection_id UUID REFERENCES public.field_inspections(id),
  violation_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'minor',
  violation_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  description_ar TEXT NOT NULL,
  description_en TEXT,
  evidence_photos TEXT[],
  evidence_documents TEXT[],
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  location_address TEXT,
  legal_reference TEXT,
  status TEXT NOT NULL DEFAULT 'issued',
  response_deadline TIMESTAMPTZ,
  organization_response TEXT,
  response_date TIMESTAMPTZ,
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.regulatory_penalties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  penalty_number TEXT NOT NULL DEFAULT '',
  violation_id UUID NOT NULL REFERENCES public.regulatory_violations(id),
  regulator_organization_id UUID NOT NULL REFERENCES public.organizations(id),
  issued_by_user_id UUID NOT NULL REFERENCES auth.users(id),
  target_organization_id UUID NOT NULL REFERENCES public.organizations(id),
  penalty_type TEXT NOT NULL,
  fine_amount NUMERIC(12,2),
  fine_currency TEXT DEFAULT 'EGP',
  fine_paid BOOLEAN DEFAULT false,
  fine_paid_at TIMESTAMPTZ,
  fine_payment_reference TEXT,
  suspension_start_date TIMESTAMPTZ,
  suspension_end_date TIMESTAMPTZ,
  ban_reason TEXT,
  corrective_action_required TEXT,
  corrective_action_deadline TIMESTAMPTZ,
  corrective_action_completed BOOLEAN DEFAULT false,
  corrective_action_verified_at TIMESTAMPTZ,
  decision_document_url TEXT,
  appeal_allowed BOOLEAN DEFAULT true,
  appeal_deadline TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.regulator_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regulator_organization_id UUID NOT NULL REFERENCES public.organizations(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action_type TEXT NOT NULL,
  target_organization_id UUID REFERENCES public.organizations(id),
  target_resource_type TEXT,
  target_resource_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.regulator_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulator_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulatory_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulatory_penalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulator_activity_log ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION public.is_regulator_member(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_organizations uo
    JOIN organizations o ON o.id = uo.organization_id
    JOIN regulator_configs rc ON rc.organization_id = o.id
    WHERE uo.user_id = _user_id AND o.organization_type = 'regulator'
  )
$$;

CREATE OR REPLACE FUNCTION public.get_regulator_org_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT rc.organization_id FROM user_organizations uo
  JOIN regulator_configs rc ON rc.organization_id = uo.organization_id
  WHERE uo.user_id = _user_id LIMIT 1
$$;

-- RLS Policies
CREATE POLICY "Anyone can view regulator levels" ON public.regulator_levels FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage regulator configs" ON public.regulator_configs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Regulator members view config" ON public.regulator_configs FOR SELECT TO authenticated USING (
  organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
);

CREATE POLICY "Regulators manage inspections" ON public.field_inspections FOR ALL TO authenticated USING (
  regulator_organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Inspected orgs view inspections" ON public.field_inspections FOR SELECT TO authenticated USING (
  inspected_organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
);

CREATE POLICY "Checklist access via inspection" ON public.inspection_checklist_items FOR ALL TO authenticated USING (
  inspection_id IN (
    SELECT id FROM field_inspections WHERE
      regulator_organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
      OR inspected_organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
      OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Regulators manage violations" ON public.regulatory_violations FOR ALL TO authenticated USING (
  regulator_organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Violating orgs view violations" ON public.regulatory_violations FOR SELECT TO authenticated USING (
  violating_organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
);

CREATE POLICY "Regulators manage penalties" ON public.regulatory_penalties FOR ALL TO authenticated USING (
  regulator_organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Target orgs view penalties" ON public.regulatory_penalties FOR SELECT TO authenticated USING (
  target_organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
);

CREATE POLICY "Regulators view activity log" ON public.regulator_activity_log FOR ALL TO authenticated USING (
  regulator_organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- Indexes
CREATE INDEX idx_field_inspections_regulator ON public.field_inspections(regulator_organization_id);
CREATE INDEX idx_field_inspections_inspected ON public.field_inspections(inspected_organization_id);
CREATE INDEX idx_regulatory_violations_violating ON public.regulatory_violations(violating_organization_id);
CREATE INDEX idx_regulatory_violations_status ON public.regulatory_violations(status);
CREATE INDEX idx_regulatory_penalties_target ON public.regulatory_penalties(target_organization_id);
CREATE INDEX idx_regulator_activity_log_org ON public.regulator_activity_log(regulator_organization_id);

-- Auto-generate violation/penalty numbers
CREATE OR REPLACE FUNCTION public.generate_violation_number()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.violation_number := 'VIO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_violation_number BEFORE INSERT ON public.regulatory_violations
  FOR EACH ROW WHEN (NEW.violation_number IS NULL OR NEW.violation_number = '')
  EXECUTE FUNCTION public.generate_violation_number();

CREATE OR REPLACE FUNCTION public.generate_penalty_number()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.penalty_number := 'PEN-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_penalty_number BEFORE INSERT ON public.regulatory_penalties
  FOR EACH ROW WHEN (NEW.penalty_number IS NULL OR NEW.penalty_number = '')
  EXECUTE FUNCTION public.generate_penalty_number();
