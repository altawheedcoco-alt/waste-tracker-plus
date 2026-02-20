
-- جدول أسئلة امتحانات السلامة
CREATE TABLE public.safety_quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.safety_training_courses(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  question_ar TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]', -- [{text_ar: "...", is_correct: true/false}]
  points INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.safety_quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org quiz questions"
  ON public.safety_quiz_questions FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can manage their org quiz questions"
  ON public.safety_quiz_questions FOR ALL
  USING (organization_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid() AND is_active = true));

-- جدول محاولات الامتحان
CREATE TABLE public.safety_quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  record_id UUID NOT NULL REFERENCES public.safety_training_records(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.safety_training_courses(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  answers JSONB, -- [{question_id, selected_answer, is_correct}]
  score INTEGER NOT NULL DEFAULT 0,
  total_points INTEGER NOT NULL DEFAULT 0,
  percentage INTEGER NOT NULL DEFAULT 0,
  passed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.safety_quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org quiz attempts"
  ON public.safety_quiz_attempts FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can manage their org quiz attempts"
  ON public.safety_quiz_attempts FOR ALL
  USING (organization_id IN (SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid() AND is_active = true));

CREATE TRIGGER update_safety_quiz_questions_updated_at BEFORE UPDATE ON public.safety_quiz_questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
