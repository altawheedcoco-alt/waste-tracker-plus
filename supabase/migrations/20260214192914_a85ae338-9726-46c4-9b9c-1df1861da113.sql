
-- =============================================
-- Learning Management System (LMS) Schema
-- =============================================

-- Course categories
CREATE TABLE public.lms_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description TEXT,
  description_ar TEXT,
  icon TEXT DEFAULT 'BookOpen',
  color TEXT DEFAULT '#3B82F6',
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Courses
CREATE TABLE public.lms_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.lms_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  description TEXT,
  description_ar TEXT,
  cover_image_url TEXT,
  target_audience TEXT[] DEFAULT '{}', -- 'generator','transporter','recycler','disposal','driver','admin'
  difficulty_level TEXT DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner','intermediate','advanced')),
  estimated_duration_minutes INT DEFAULT 30,
  is_mandatory BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  passing_score INT DEFAULT 70, -- percentage
  certificate_template TEXT DEFAULT 'default',
  created_by UUID REFERENCES public.profiles(id),
  organization_id UUID REFERENCES public.organizations(id),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lessons within courses
CREATE TABLE public.lms_lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  content TEXT, -- markdown content
  content_ar TEXT, -- markdown content in Arabic
  lesson_type TEXT DEFAULT 'text' CHECK (lesson_type IN ('text','video','pdf','interactive')),
  video_url TEXT,
  pdf_url TEXT,
  duration_minutes INT DEFAULT 10,
  sort_order INT DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Quiz questions
CREATE TABLE public.lms_quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lms_lessons(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  question_ar TEXT NOT NULL,
  question_type TEXT DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice','true_false','short_answer')),
  options JSONB DEFAULT '[]', -- [{text, text_ar, is_correct}]
  correct_answer TEXT,
  explanation TEXT,
  explanation_ar TEXT,
  points INT DEFAULT 1,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User course enrollments
CREATE TABLE public.lms_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  course_id UUID NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id),
  status TEXT DEFAULT 'enrolled' CHECK (status IN ('enrolled','in_progress','completed','failed')),
  progress_percentage INT DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  enrollment_type TEXT DEFAULT 'voluntary' CHECK (enrollment_type IN ('voluntary','mandatory','assigned')),
  assigned_by UUID REFERENCES public.profiles(id),
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Lesson progress tracking
CREATE TABLE public.lms_lesson_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  lesson_id UUID NOT NULL REFERENCES public.lms_lessons(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  time_spent_seconds INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Quiz attempts
CREATE TABLE public.lms_quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  course_id UUID NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
  score INT DEFAULT 0,
  total_points INT DEFAULT 0,
  percentage NUMERIC(5,2) DEFAULT 0,
  passed BOOLEAN DEFAULT false,
  answers JSONB DEFAULT '[]', -- [{question_id, selected_answer, is_correct}]
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- LMS certificates issued upon completion
CREATE TABLE public.lms_certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  course_id UUID NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES public.lms_enrollments(id),
  certificate_number TEXT NOT NULL UNIQUE,
  score INT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_valid BOOLEAN DEFAULT true,
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.lms_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_certificates ENABLE ROW LEVEL SECURITY;

-- Categories: readable by all authenticated
CREATE POLICY "Categories readable by authenticated" ON public.lms_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Categories manageable by admins" ON public.lms_categories FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Courses: published courses readable by all, management by admins/creators
CREATE POLICY "Published courses readable" ON public.lms_courses FOR SELECT TO authenticated USING (is_published = true OR created_by = auth.uid());
CREATE POLICY "Courses manageable by admins" ON public.lms_courses FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  OR created_by = auth.uid()
);

-- Lessons: readable if course is accessible
CREATE POLICY "Lessons readable" ON public.lms_lessons FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.lms_courses WHERE id = course_id AND (is_published = true OR created_by = auth.uid()))
);
CREATE POLICY "Lessons manageable by admins" ON public.lms_lessons FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Quiz questions: readable if course is accessible
CREATE POLICY "Quiz questions readable" ON public.lms_quiz_questions FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.lms_courses WHERE id = course_id AND (is_published = true OR created_by = auth.uid()))
);
CREATE POLICY "Quiz questions manageable by admins" ON public.lms_quiz_questions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Enrollments: users see their own, admins see org
CREATE POLICY "Users see own enrollments" ON public.lms_enrollments FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can enroll themselves" ON public.lms_enrollments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own enrollments" ON public.lms_enrollments FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins manage enrollments" ON public.lms_enrollments FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Lesson progress: own data only
CREATE POLICY "Users see own progress" ON public.lms_lesson_progress FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users track own progress" ON public.lms_lesson_progress FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own progress" ON public.lms_lesson_progress FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Quiz attempts: own data only
CREATE POLICY "Users see own attempts" ON public.lms_quiz_attempts FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users create own attempts" ON public.lms_quiz_attempts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own attempts" ON public.lms_quiz_attempts FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Certificates: own + public verification
CREATE POLICY "Users see own certificates" ON public.lms_certificates FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins manage certificates" ON public.lms_certificates FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Auto-generate certificate number
CREATE OR REPLACE FUNCTION public.generate_lms_certificate_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.certificate_number := 'LMS-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTR(NEW.id::text, 1, 8);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_lms_certificate_number
BEFORE INSERT ON public.lms_certificates
FOR EACH ROW EXECUTE FUNCTION public.generate_lms_certificate_number();

-- Auto-issue certificate when quiz passed and course completed
CREATE OR REPLACE FUNCTION public.auto_issue_lms_certificate()
RETURNS TRIGGER AS $$
DECLARE
  _passing_score INT;
  _cert_exists BOOLEAN;
BEGIN
  IF NEW.passed = true THEN
    SELECT passing_score INTO _passing_score FROM public.lms_courses WHERE id = NEW.course_id;
    SELECT EXISTS(SELECT 1 FROM public.lms_certificates WHERE user_id = NEW.user_id AND course_id = NEW.course_id) INTO _cert_exists;
    
    IF NOT _cert_exists AND NEW.percentage >= COALESCE(_passing_score, 70) THEN
      -- Update enrollment
      UPDATE public.lms_enrollments 
      SET status = 'completed', completed_at = NOW(), progress_percentage = 100
      WHERE user_id = NEW.user_id AND course_id = NEW.course_id;
      
      -- Issue certificate
      INSERT INTO public.lms_certificates (user_id, course_id, score, enrollment_id)
      SELECT NEW.user_id, NEW.course_id, NEW.percentage::int,
        (SELECT id FROM public.lms_enrollments WHERE user_id = NEW.user_id AND course_id = NEW.course_id LIMIT 1);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_auto_issue_certificate
AFTER INSERT ON public.lms_quiz_attempts
FOR EACH ROW EXECUTE FUNCTION public.auto_issue_lms_certificate();

-- Seed default categories
INSERT INTO public.lms_categories (name, name_ar, description_ar, icon, sort_order) VALUES
('Safety & Transport', 'السلامة والنقل', 'دورات السلامة على الطريق والتعامل مع المواد الخطرة', 'ShieldCheck', 1),
('Recycling & Processing', 'التدوير والمعالجة', 'معايير الفرز والتصنيف وإدارة التخزين', 'Recycle', 2),
('Compliance & Regulations', 'الامتثال والتنظيم', 'القوانين البيئية والتحديثات التنظيمية', 'Scale', 3),
('Platform Usage', 'استخدام المنصة', 'دليل استخدام المنصة وأدواتها', 'Monitor', 4),
('Emergency Response', 'الاستجابة للطوارئ', 'إجراءات الطوارئ والتسربات والحوادث', 'AlertTriangle', 5),
('Management & Analytics', 'الإدارة والتحليل', 'تحليل البيانات وإدارة النزاعات', 'BarChart3', 6);

-- Seed sample courses
INSERT INTO public.lms_courses (title, title_ar, description_ar, category_id, target_audience, difficulty_level, estimated_duration_minutes, is_mandatory, is_published, passing_score) VALUES
('Safe Waste Transport Basics', 'أساسيات النقل الآمن للنفايات', 'القيادة الوقائية لمركبات النفايات الثقيلة وإجراءات السلامة', (SELECT id FROM public.lms_categories WHERE sort_order = 1), ARRAY['transporter','driver'], 'beginner', 45, true, true, 70),
('Hazardous Materials Handling', 'التعامل مع المواد الخطرة', 'كيفية قراءة ملصقات التحذير وفهم صحيفة بيانات السلامة MSDS', (SELECT id FROM public.lms_categories WHERE sort_order = 1), ARRAY['transporter','driver'], 'intermediate', 60, true, true, 80),
('Waste Sorting & Classification', 'معايير فرز وتصنيف المواد', 'كيف يتم فحص الشحنة القادمة والتأكد من مطابقتها للبيانات', (SELECT id FROM public.lms_categories WHERE sort_order = 2), ARRAY['recycler','disposal'], 'beginner', 60, true, true, 70),
('Emergency Response Procedures', 'إجراءات الطوارئ', 'ماذا يفعل السائق في حال حدوث تسرب أو حادث', (SELECT id FROM public.lms_categories WHERE sort_order = 5), ARRAY['transporter','driver'], 'intermediate', 30, true, true, 80),
('Platform User Guide', 'دليل استخدام المنصة', 'كيفية تحديث حالة الشحنة ورفع الصور وإغلاق بوليصة الرحلة رقمياً', (SELECT id FROM public.lms_categories WHERE sort_order = 4), ARRAY['generator','transporter','recycler','disposal','driver','admin'], 'beginner', 15, false, true, 60),
('Environmental Compliance', 'الامتثال البيئي', 'القوانين المحلية والدولية المنظمة لعمليات التدوير والتخلص', (SELECT id FROM public.lms_categories WHERE sort_order = 3), ARRAY['recycler','disposal','admin'], 'advanced', 90, true, true, 75),
('Data Analysis & Reporting', 'تحليل البيانات واستخراج التقارير', 'كيفية استخراج التقارير ومراقبة أداء الجهات الأخرى', (SELECT id FROM public.lms_categories WHERE sort_order = 6), ARRAY['admin'], 'intermediate', 45, false, true, 70),
('Dispute Management', 'إدارة النزاعات', 'ماذا نفعل إذا رفضت جهة استلام شحنة معينة', (SELECT id FROM public.lms_categories WHERE sort_order = 6), ARRAY['admin','generator','transporter'], 'intermediate', 30, false, true, 70);

-- Seed sample lessons for the first course
INSERT INTO public.lms_lessons (course_id, title, title_ar, content_ar, lesson_type, duration_minutes, sort_order) VALUES
((SELECT id FROM public.lms_courses WHERE sort_order = 0 LIMIT 1), 'Pre-Trip Inspection', 'فحص ما قبل الرحلة', '## فحص ما قبل الرحلة

### الخطوات الأساسية:
1. **فحص الإطارات**: التأكد من ضغط الهواء وعدم وجود تلف
2. **فحص الفرامل**: اختبار فرامل القدم واليد
3. **فحص الأنوار**: جميع الأنوار الأمامية والخلفية والإشارات
4. **فحص حاوية النقل**: التأكد من إحكام الغلق وعدم وجود تسريب
5. **فحص أدوات السلامة**: طفاية الحريق، مثلث التحذير، حقيبة الإسعاف

### نصائح مهمة:
- لا تبدأ الرحلة أبداً بدون إتمام الفحص الكامل
- وثّق أي ملاحظات في سجل المركبة
- أبلغ المشرف فوراً عن أي خلل', 'text', 10, 1),
((SELECT id FROM public.lms_courses WHERE sort_order = 0 LIMIT 1), 'Defensive Driving', 'القيادة الوقائية', '## القيادة الوقائية لمركبات النفايات

### مبادئ أساسية:
- **مسافة الأمان**: حافظ على مسافة 4 ثوان على الأقل من المركبة الأمامية
- **السرعة المناسبة**: التزم بالسرعات المحددة خاصة في المنعطفات
- **المرايا**: راقب المرايا كل 5-8 ثوان
- **النقاط العمياء**: انتبه للنقاط العمياء الكبيرة في مركبات النقل

### حالات خاصة:
- القيادة في الأمطار: قلل السرعة 30%
- القيادة الليلية: استخدم الأنوار العالية فقط خارج المدن
- المناطق السكنية: سرعة لا تتجاوز 30 كم/س', 'text', 15, 2),
((SELECT id FROM public.lms_courses WHERE sort_order = 0 LIMIT 1), 'Loading & Unloading Safety', 'سلامة التحميل والتفريغ', '## إجراءات التحميل والتفريغ الآمن

### معدات الوقاية الشخصية المطلوبة:
- قفازات مقاومة للمواد الكيميائية
- نظارات واقية
- حذاء أمان
- سترة عاكسة

### خطوات التحميل:
1. تأكد من استقرار المركبة (استخدم الفرامل والحواجز)
2. افحص الحمولة قبل التحميل
3. وزّع الحمولة بالتساوي
4. تأكد من تثبيت الحمولة بإحكام
5. أغلق الحاوية وتحقق من الإغلاق

### ممنوعات:
❌ لا تحمّل فوق الحد المسموح
❌ لا تخلط أنواع مختلفة من النفايات الخطرة
❌ لا تترك الحاوية مفتوحة أثناء النقل', 'text', 15, 3);

-- Seed quiz questions for the first course
INSERT INTO public.lms_quiz_questions (course_id, question, question_ar, question_type, options, points, sort_order) VALUES
((SELECT id FROM public.lms_courses WHERE sort_order = 0 LIMIT 1),
 'What is the minimum safe following distance for waste transport vehicles?',
 'ما هي مسافة الأمان الدنيا لمركبات نقل النفايات؟',
 'multiple_choice',
 '[{"text":"2 seconds","text_ar":"ثانيتان","is_correct":false},{"text":"4 seconds","text_ar":"4 ثوان","is_correct":true},{"text":"1 second","text_ar":"ثانية واحدة","is_correct":false},{"text":"6 seconds","text_ar":"6 ثوان","is_correct":false}]',
 1, 1),
((SELECT id FROM public.lms_courses WHERE sort_order = 0 LIMIT 1),
 'Which PPE is required during loading/unloading?',
 'ما هي معدات الوقاية الشخصية المطلوبة أثناء التحميل والتفريغ؟',
 'multiple_choice',
 '[{"text":"Only gloves","text_ar":"قفازات فقط","is_correct":false},{"text":"Gloves, goggles, safety shoes, reflective vest","text_ar":"قفازات، نظارات، حذاء أمان، سترة عاكسة","is_correct":true},{"text":"Just a helmet","text_ar":"خوذة فقط","is_correct":false},{"text":"No PPE needed","text_ar":"لا حاجة لمعدات وقاية","is_correct":false}]',
 1, 2),
((SELECT id FROM public.lms_courses WHERE sort_order = 0 LIMIT 1),
 'Is it allowed to mix different types of hazardous waste in the same container?',
 'هل يُسمح بخلط أنواع مختلفة من النفايات الخطرة في نفس الحاوية؟',
 'true_false',
 '[{"text":"True","text_ar":"نعم","is_correct":false},{"text":"False","text_ar":"لا","is_correct":true}]',
 1, 3),
((SELECT id FROM public.lms_courses WHERE sort_order = 0 LIMIT 1),
 'How often should you check your mirrors while driving?',
 'كم مرة يجب مراقبة المرايا أثناء القيادة؟',
 'multiple_choice',
 '[{"text":"Every 30 seconds","text_ar":"كل 30 ثانية","is_correct":false},{"text":"Every 5-8 seconds","text_ar":"كل 5-8 ثوان","is_correct":true},{"text":"Only when changing lanes","text_ar":"فقط عند تغيير المسار","is_correct":false},{"text":"Once per minute","text_ar":"مرة كل دقيقة","is_correct":false}]',
 1, 4),
((SELECT id FROM public.lms_courses WHERE sort_order = 0 LIMIT 1),
 'What should you do first before starting a trip?',
 'ما أول شيء يجب فعله قبل بدء الرحلة؟',
 'multiple_choice',
 '[{"text":"Start the engine","text_ar":"تشغيل المحرك","is_correct":false},{"text":"Complete pre-trip inspection","text_ar":"إتمام فحص ما قبل الرحلة","is_correct":true},{"text":"Load the waste","text_ar":"تحميل النفايات","is_correct":false},{"text":"Call dispatch","text_ar":"الاتصال بالإرسال","is_correct":false}]',
 1, 5);

-- Updated_at trigger
CREATE TRIGGER update_lms_courses_updated_at BEFORE UPDATE ON public.lms_courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lms_lessons_updated_at BEFORE UPDATE ON public.lms_lessons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lms_enrollments_updated_at BEFORE UPDATE ON public.lms_enrollments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lms_lesson_progress_updated_at BEFORE UPDATE ON public.lms_lesson_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
