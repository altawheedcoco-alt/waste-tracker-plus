
-- Medical Examinations main table
CREATE TABLE public.medical_examinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.profiles(id),
  employee_name TEXT NOT NULL,
  examination_type TEXT NOT NULL DEFAULT 'periodic',
  examination_date DATE NOT NULL DEFAULT CURRENT_DATE,
  next_examination_date DATE,
  examiner_name TEXT,
  examiner_specialty TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  overall_result TEXT DEFAULT 'pending',
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Medical exam results (individual tests within an exam)
CREATE TABLE public.medical_exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  examination_id UUID NOT NULL REFERENCES public.medical_examinations(id) ON DELETE CASCADE,
  test_type TEXT NOT NULL,
  test_name TEXT NOT NULL,
  result_value TEXT,
  normal_range TEXT,
  unit TEXT,
  is_normal BOOLEAN DEFAULT true,
  notes TEXT,
  attachment_url TEXT,
  iot_device_id TEXT,
  iot_reading_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Medical certificates (fitness certificates)
CREATE TABLE public.medical_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  examination_id UUID REFERENCES public.medical_examinations(id),
  employee_id UUID REFERENCES public.profiles(id),
  employee_name TEXT NOT NULL,
  certificate_type TEXT NOT NULL DEFAULT 'fitness',
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  restrictions TEXT,
  issued_by TEXT,
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Vaccination records
CREATE TABLE public.vaccination_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.profiles(id),
  employee_name TEXT NOT NULL,
  vaccine_name TEXT NOT NULL,
  vaccine_type TEXT,
  dose_number INT DEFAULT 1,
  vaccination_date DATE NOT NULL,
  next_dose_date DATE,
  batch_number TEXT,
  administered_by TEXT,
  side_effects TEXT,
  attachment_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Injury/incident medical records
CREATE TABLE public.medical_injuries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.profiles(id),
  employee_name TEXT NOT NULL,
  injury_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  injury_type TEXT NOT NULL,
  body_part TEXT,
  severity TEXT NOT NULL DEFAULT 'minor',
  description TEXT,
  treatment TEXT,
  days_lost INT DEFAULT 0,
  return_to_work_date DATE,
  is_work_related BOOLEAN DEFAULT true,
  incident_report_id UUID,
  attachment_url TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Hazardous exposure records
CREATE TABLE public.hazardous_exposure_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.profiles(id),
  employee_name TEXT NOT NULL,
  exposure_date DATE NOT NULL,
  hazardous_material TEXT NOT NULL,
  exposure_type TEXT NOT NULL DEFAULT 'chemical',
  exposure_level TEXT DEFAULT 'low',
  duration_minutes INT,
  ppe_used TEXT,
  symptoms TEXT,
  medical_action TEXT,
  monitoring_result TEXT,
  attachment_url TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.medical_examinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccination_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_injuries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hazardous_exposure_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies (org-based access)
CREATE POLICY "org_access" ON public.medical_examinations FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "org_access" ON public.medical_exam_results FOR ALL TO authenticated
  USING (examination_id IN (SELECT id FROM public.medical_examinations WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())))
  WITH CHECK (examination_id IN (SELECT id FROM public.medical_examinations WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())));

CREATE POLICY "org_access" ON public.medical_certificates FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "org_access" ON public.vaccination_records FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "org_access" ON public.medical_injuries FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "org_access" ON public.hazardous_exposure_records FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
