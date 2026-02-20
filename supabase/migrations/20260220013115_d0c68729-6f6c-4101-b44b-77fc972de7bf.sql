
-- جدول دورات السلامة المهنية
CREATE TABLE public.safety_training_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  course_type TEXT NOT NULL DEFAULT 'general_safety', -- general_safety, fire_safety, chemical_handling, first_aid, ppe_usage, confined_space, height_work, electrical_safety, waste_handling
  duration_hours NUMERIC(5,1) NOT NULL DEFAULT 4,
  passing_score INTEGER NOT NULL DEFAULT 70,
  max_participants INTEGER DEFAULT 30,
  instructor_name TEXT,
  instructor_qualification TEXT,
  certificate_validity_months INTEGER DEFAULT 12,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.safety_training_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org safety courses"
  ON public.safety_training_courses FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can manage their org safety courses"
  ON public.safety_training_courses FOR ALL
  USING (organization_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid() AND is_active = true));

-- جدول المتدربين / كروت السلامة
CREATE TABLE public.safety_training_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.safety_training_courses(id) ON DELETE CASCADE,
  -- بيانات المتدرب
  trainee_name TEXT NOT NULL,
  trainee_national_id TEXT,
  trainee_phone TEXT,
  trainee_email TEXT,
  trainee_job_title TEXT,
  trainee_department TEXT,
  trainee_photo_url TEXT,
  -- بيانات الدورة
  training_date DATE NOT NULL,
  score INTEGER, -- 0-100
  passed BOOLEAN NOT NULL DEFAULT false,
  attendance_status TEXT NOT NULL DEFAULT 'registered', -- registered, attended, absent, incomplete
  -- بيانات الكارنيه
  card_number TEXT UNIQUE, -- AUTO: SC-YYYYMMDD-XXXX
  card_issued BOOLEAN NOT NULL DEFAULT false,
  card_issued_at TIMESTAMPTZ,
  card_expires_at TIMESTAMPTZ,
  card_qr_data TEXT, -- JSON string for QR verification
  -- Meta
  notes TEXT,
  issued_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.safety_training_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org training records"
  ON public.safety_training_records FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can manage their org training records"
  ON public.safety_training_records FOR ALL
  USING (organization_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid() AND is_active = true));

-- Auto-generate card number
CREATE OR REPLACE FUNCTION public.generate_safety_card_number()
RETURNS TRIGGER AS $$
DECLARE
  seq_num INTEGER;
BEGIN
  IF NEW.card_number IS NULL AND NEW.passed = true AND NEW.card_issued = true THEN
    SELECT COUNT(*) + 1 INTO seq_num
    FROM public.safety_training_records
    WHERE organization_id = NEW.organization_id AND card_issued = true;
    NEW.card_number := 'SC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(seq_num::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_generate_safety_card_number
  BEFORE INSERT OR UPDATE ON public.safety_training_records
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_safety_card_number();

-- Triggers for updated_at
CREATE TRIGGER update_safety_training_courses_updated_at BEFORE UPDATE ON public.safety_training_courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_safety_training_records_updated_at BEFORE UPDATE ON public.safety_training_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
