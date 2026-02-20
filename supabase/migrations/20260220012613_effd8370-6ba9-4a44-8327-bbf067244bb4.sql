
-- جدول خطط الطوارئ
CREATE TABLE public.emergency_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  plan_type TEXT NOT NULL DEFAULT 'general', -- general, fire, chemical_spill, evacuation, earthquake
  description TEXT,
  procedures JSONB DEFAULT '[]'::jsonb, -- [{step: 1, action: "...", responsible: "..."}]
  emergency_contacts JSONB DEFAULT '[]'::jsonb, -- [{name, phone, role}]
  assembly_points TEXT[],
  equipment_list TEXT[],
  review_date DATE,
  last_drill_date DATE,
  next_drill_date DATE,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, active, under_review, archived
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.emergency_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org emergency plans"
  ON public.emergency_plans FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can manage their org emergency plans"
  ON public.emergency_plans FOR ALL
  USING (organization_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid() AND is_active = true));

-- جدول تدريبات الإخلاء
CREATE TABLE public.evacuation_drills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  emergency_plan_id UUID REFERENCES public.emergency_plans(id),
  drill_type TEXT NOT NULL DEFAULT 'evacuation', -- evacuation, fire, chemical, first_aid
  drill_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER,
  participants_count INTEGER,
  participants JSONB DEFAULT '[]'::jsonb, -- [{name, role, attended: bool}]
  evacuation_time_seconds INTEGER,
  target_time_seconds INTEGER,
  observations TEXT,
  issues_found TEXT[],
  corrective_actions TEXT[],
  score INTEGER, -- 0-100
  status TEXT NOT NULL DEFAULT 'planned', -- planned, completed, cancelled
  conducted_by UUID REFERENCES auth.users(id),
  photos TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.evacuation_drills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org drills"
  ON public.evacuation_drills FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can manage their org drills"
  ON public.evacuation_drills FOR ALL
  USING (organization_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid() AND is_active = true));

-- جدول تصاريح العمل الخطر
CREATE TABLE public.work_permits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  permit_number TEXT NOT NULL,
  permit_type TEXT NOT NULL DEFAULT 'hot_work', -- hot_work, confined_space, height_work, electrical, excavation, chemical_handling
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  work_start TIMESTAMPTZ NOT NULL,
  work_end TIMESTAMPTZ NOT NULL,
  hazards_identified TEXT[],
  precautions TEXT[],
  ppe_required TEXT[], -- hard_hat, gloves, goggles, respirator, harness, boots
  workers JSONB DEFAULT '[]'::jsonb, -- [{name, national_id, role, trained: bool}]
  supervisor_name TEXT,
  supervisor_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, active, completed, expired, cancelled
  requested_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  closed_by UUID REFERENCES auth.users(id),
  closed_at TIMESTAMPTZ,
  closure_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.work_permits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org work permits"
  ON public.work_permits FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can manage their org work permits"
  ON public.work_permits FOR ALL
  USING (organization_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid() AND is_active = true));

-- Triggers for updated_at
CREATE TRIGGER update_emergency_plans_updated_at BEFORE UPDATE ON public.emergency_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_evacuation_drills_updated_at BEFORE UPDATE ON public.evacuation_drills FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_work_permits_updated_at BEFORE UPDATE ON public.work_permits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
