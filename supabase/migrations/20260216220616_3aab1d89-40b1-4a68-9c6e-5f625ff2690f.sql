
-- OHS Inspection Reports
CREATE TABLE public.ohs_inspections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  consultant_id UUID REFERENCES public.environmental_consultants(id),
  inspector_name TEXT NOT NULL,
  inspector_title TEXT,
  inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
  report_number TEXT NOT NULL,
  facility_name TEXT NOT NULL,
  facility_address TEXT,
  facility_type TEXT DEFAULT 'recycling', -- recycling, transport, disposal, collection
  inspection_type TEXT DEFAULT 'routine', -- routine, follow_up, incident, pre_operation, annual
  overall_risk_level TEXT DEFAULT 'medium', -- low, medium, high, critical
  overall_score NUMERIC DEFAULT 0, -- 0-100
  status TEXT DEFAULT 'draft', -- draft, in_review, approved, rejected, archived
  summary TEXT,
  recommendations TEXT,
  next_inspection_date DATE,
  weather_conditions TEXT,
  employees_present INTEGER,
  photos_urls TEXT[],
  signed_by_consultant BOOLEAN DEFAULT false,
  signature_date TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- OHS Inspection Categories & Checklist Items
CREATE TABLE public.ohs_checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inspection_id UUID NOT NULL REFERENCES public.ohs_inspections(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- ppe, fire_safety, chemical, electrical, ergonomics, emergency, housekeeping, permits, env_monitoring, training
  item_name TEXT NOT NULL,
  item_name_ar TEXT NOT NULL,
  status TEXT DEFAULT 'not_checked', -- compliant, non_compliant, partial, not_applicable, not_checked
  severity TEXT DEFAULT 'low', -- low, medium, high, critical
  notes TEXT,
  photo_url TEXT,
  corrective_action TEXT,
  deadline DATE,
  responsible_person TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Corrective Action Tracking
CREATE TABLE public.ohs_corrective_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inspection_id UUID NOT NULL REFERENCES public.ohs_inspections(id) ON DELETE CASCADE,
  checklist_item_id UUID REFERENCES public.ohs_checklist_items(id) ON DELETE SET NULL,
  action_description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium', -- low, medium, high, critical
  status TEXT DEFAULT 'open', -- open, in_progress, completed, overdue, cancelled
  assigned_to TEXT,
  due_date DATE,
  completed_date DATE,
  completion_notes TEXT,
  verification_photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ohs_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ohs_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ohs_corrective_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view org inspections" ON public.ohs_inspections
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can create org inspections" ON public.ohs_inspections
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can update org inspections" ON public.ohs_inspections
  FOR UPDATE USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can delete org inspections" ON public.ohs_inspections
  FOR DELETE USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage checklist items" ON public.ohs_checklist_items
  FOR ALL USING (
    inspection_id IN (SELECT id FROM public.ohs_inspections WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()))
  );

CREATE POLICY "Users can manage corrective actions" ON public.ohs_corrective_actions
  FOR ALL USING (
    inspection_id IN (SELECT id FROM public.ohs_inspections WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()))
  );

-- Indexes
CREATE INDEX idx_ohs_inspections_org ON public.ohs_inspections(organization_id);
CREATE INDEX idx_ohs_inspections_date ON public.ohs_inspections(inspection_date DESC);
CREATE INDEX idx_ohs_inspections_status ON public.ohs_inspections(status);
CREATE INDEX idx_ohs_checklist_inspection ON public.ohs_checklist_items(inspection_id);
CREATE INDEX idx_ohs_corrective_inspection ON public.ohs_corrective_actions(inspection_id);
CREATE INDEX idx_ohs_corrective_status ON public.ohs_corrective_actions(status);

-- Auto-generate report number
CREATE OR REPLACE FUNCTION public.generate_ohs_report_number()
RETURNS TRIGGER AS $$
DECLARE
  seq_num INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO seq_num
  FROM public.ohs_inspections
  WHERE organization_id = NEW.organization_id
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM now());
  
  NEW.report_number := 'OHS-' || TO_CHAR(now(), 'YYMM') || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_ohs_report_number
  BEFORE INSERT ON public.ohs_inspections
  FOR EACH ROW
  WHEN (NEW.report_number IS NULL OR NEW.report_number = '')
  EXECUTE FUNCTION public.generate_ohs_report_number();

-- Update timestamp trigger
CREATE TRIGGER update_ohs_inspections_updated_at
  BEFORE UPDATE ON public.ohs_inspections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ohs_corrective_actions_updated_at
  BEFORE UPDATE ON public.ohs_corrective_actions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
