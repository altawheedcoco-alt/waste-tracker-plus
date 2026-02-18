
-- Employee documents (legal papers, insurance, IDs, etc.)
CREATE TABLE public.employee_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  member_id UUID NOT NULL,
  document_type TEXT NOT NULL, -- national_id, driving_license, health_cert, criminal_record, insurance_print, contract, other
  document_name TEXT NOT NULL,
  document_name_ar TEXT,
  file_url TEXT,
  file_type TEXT, -- pdf, image
  issue_date DATE,
  expiry_date DATE,
  notes TEXT,
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view their org documents"
  ON public.employee_documents FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can insert documents"
  ON public.employee_documents FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can update their org documents"
  ON public.employee_documents FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can delete their org documents"
  ON public.employee_documents FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  ));

-- External courses (platform courses already tracked via academy)
CREATE TABLE public.employee_external_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  member_id UUID NOT NULL,
  course_name TEXT NOT NULL,
  course_name_ar TEXT,
  provider TEXT,
  certificate_url TEXT,
  completion_date DATE,
  expiry_date DATE,
  notes TEXT,
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_external_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view their org courses"
  ON public.employee_external_courses FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can insert courses"
  ON public.employee_external_courses FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can update courses"
  ON public.employee_external_courses FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can delete courses"
  ON public.employee_external_courses FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  ));

-- Insurance records
CREATE TABLE public.employee_insurance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  member_id UUID NOT NULL,
  insurance_type TEXT NOT NULL, -- social, medical, life
  insurance_number TEXT,
  provider TEXT,
  start_date DATE,
  end_date DATE,
  document_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_insurance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view insurance"
  ON public.employee_insurance FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can insert insurance"
  ON public.employee_insurance FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can update insurance"
  ON public.employee_insurance FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can delete insurance"
  ON public.employee_insurance FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  ));

-- Storage bucket for employee files
INSERT INTO storage.buckets (id, name, public) VALUES ('employee-files', 'employee-files', false);

CREATE POLICY "Org members can upload employee files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'employee-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Org members can view employee files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'employee-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Org members can delete employee files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'employee-files' AND auth.uid() IS NOT NULL);
