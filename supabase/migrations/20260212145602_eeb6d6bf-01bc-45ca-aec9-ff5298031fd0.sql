
-- Step 1: Create tables, RLS, function, trigger (NO seeding)
CREATE TABLE IF NOT EXISTS public.organization_departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description TEXT,
  description_ar TEXT,
  parent_department_id UUID REFERENCES public.organization_departments(id) ON DELETE SET NULL,
  head_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  icon TEXT DEFAULT 'Building2',
  color TEXT DEFAULT 'blue',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.organization_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.organization_departments(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  description TEXT,
  description_ar TEXT,
  level INTEGER DEFAULT 0,
  assigned_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reports_to_position_id UUID REFERENCES public.organization_positions(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  permissions JSONB DEFAULT '[]'::jsonb,
  max_holders INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.organization_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_positions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='organization_departments' AND policyname='dept_select') THEN
    CREATE POLICY "dept_select" ON public.organization_departments FOR SELECT USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) OR public.has_role(auth.uid(), 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='organization_departments' AND policyname='dept_insert') THEN
    CREATE POLICY "dept_insert" ON public.organization_departments FOR INSERT WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) OR public.has_role(auth.uid(), 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='organization_departments' AND policyname='dept_update') THEN
    CREATE POLICY "dept_update" ON public.organization_departments FOR UPDATE USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) OR public.has_role(auth.uid(), 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='organization_departments' AND policyname='dept_delete') THEN
    CREATE POLICY "dept_delete" ON public.organization_departments FOR DELETE USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) OR public.has_role(auth.uid(), 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='organization_positions' AND policyname='pos_select') THEN
    CREATE POLICY "pos_select" ON public.organization_positions FOR SELECT USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) OR public.has_role(auth.uid(), 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='organization_positions' AND policyname='pos_insert') THEN
    CREATE POLICY "pos_insert" ON public.organization_positions FOR INSERT WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) OR public.has_role(auth.uid(), 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='organization_positions' AND policyname='pos_update') THEN
    CREATE POLICY "pos_update" ON public.organization_positions FOR UPDATE USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) OR public.has_role(auth.uid(), 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='organization_positions' AND policyname='pos_delete') THEN
    CREATE POLICY "pos_delete" ON public.organization_positions FOR DELETE USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) OR public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_departments_updated_at ON public.organization_departments;
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.organization_departments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_positions_updated_at ON public.organization_positions;
CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON public.organization_positions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.seed_org_structure(p_org_id UUID, p_org_type TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE dept_id UUID;
BEGIN
  IF p_org_type = 'transporter' THEN
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Executive Management', 'الإدارة العليا', 'Crown', 'purple', 1) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES (p_org_id, dept_id, 'General Manager', 'المدير العام', 4, 1), (p_org_id, dept_id, 'Deputy Manager', 'نائب المدير', 3, 2);
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Operations', 'العمليات', 'Settings', 'blue', 2) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES (p_org_id, dept_id, 'Operations Manager', 'مدير العمليات', 2, 1), (p_org_id, dept_id, 'Trip Supervisor', 'مشرف الرحلات', 1, 2), (p_org_id, dept_id, 'Scheduling Coordinator', 'منسق الجدولة', 0, 3);
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Fleet Management', 'إدارة الأسطول', 'Truck', 'amber', 3) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES (p_org_id, dept_id, 'Fleet Manager', 'مدير الأسطول', 2, 1), (p_org_id, dept_id, 'Maintenance Technician', 'فني صيانة', 0, 2), (p_org_id, dept_id, 'GPS Monitor', 'مراقب GPS', 0, 3);
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Drivers', 'السائقون', 'Users', 'green', 4) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES (p_org_id, dept_id, 'Head Driver', 'رئيس السائقين', 1, 1), (p_org_id, dept_id, 'Driver', 'سائق', 0, 2), (p_org_id, dept_id, 'Driver Assistant', 'مساعد سائق', 0, 3);
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Safety & Compliance', 'السلامة والامتثال', 'Shield', 'red', 5) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES (p_org_id, dept_id, 'Safety Officer', 'مسؤول السلامة', 2, 1), (p_org_id, dept_id, 'Environmental Officer', 'مسؤول البيئة', 1, 2), (p_org_id, dept_id, 'Licensing Officer', 'مسؤول التراخيص', 0, 3);
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Finance', 'المالية', 'Calculator', 'emerald', 6) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES (p_org_id, dept_id, 'Accountant', 'محاسب', 1, 1), (p_org_id, dept_id, 'Billing Specialist', 'أخصائي فوترة', 0, 2), (p_org_id, dept_id, 'Collection Officer', 'مسؤول تحصيل', 0, 3);
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Customer Service', 'خدمة العملاء', 'Headphones', 'cyan', 7) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES (p_org_id, dept_id, 'Call Center Agent', 'موظف مركز اتصال', 0, 1), (p_org_id, dept_id, 'Complaints Manager', 'مدير الشكاوى', 1, 2);
  ELSIF p_org_type = 'generator' THEN
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Management', 'الإدارة', 'Crown', 'purple', 1) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES (p_org_id, dept_id, 'Facility Manager', 'مدير المنشأة', 3, 1);
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Environment', 'البيئة', 'Leaf', 'green', 2) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES (p_org_id, dept_id, 'Waste & Environment Officer', 'مسؤول البيئة والمخلفات', 2, 1), (p_org_id, dept_id, 'Compliance Monitor', 'مراقب الامتثال', 1, 2);
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Waste Storage', 'المخازن', 'Package', 'amber', 3) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES (p_org_id, dept_id, 'Waste Storekeeper', 'أمين مخزن المخلفات', 1, 1), (p_org_id, dept_id, 'Sorting Worker', 'عامل فرز', 0, 2);
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Documentation', 'التوثيق', 'FileText', 'blue', 4) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES (p_org_id, dept_id, 'Records & Manifest Officer', 'مسؤول السجلات والمانيفست', 1, 1);
  ELSIF p_org_type = 'recycler' THEN
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Executive Management', 'الإدارة العليا', 'Crown', 'purple', 1) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES (p_org_id, dept_id, 'General Manager', 'المدير العام', 4, 1), (p_org_id, dept_id, 'Plant Manager', 'مدير المصنع', 3, 2);
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Reception', 'الاستقبال', 'DoorOpen', 'blue', 2) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES (p_org_id, dept_id, 'Gate Supervisor', 'مشرف البوابة', 1, 1), (p_org_id, dept_id, 'Weighbridge Operator', 'مسؤول الميزان', 0, 2), (p_org_id, dept_id, 'Quality Inspector', 'مراقب الجودة', 0, 3);
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Production', 'الإنتاج', 'Factory', 'amber', 3) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES (p_org_id, dept_id, 'Production Manager', 'مدير الإنتاج', 2, 1), (p_org_id, dept_id, 'Sorting Line Supervisor', 'مشرف خط الفرز', 1, 2);
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Laboratory', 'المختبر', 'FlaskConical', 'green', 4) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES (p_org_id, dept_id, 'Lab Technician', 'فني مختبر', 0, 1), (p_org_id, dept_id, 'QA Officer', 'مسؤول ضمان الجودة', 1, 2);
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Environment & Compliance', 'البيئة والامتثال', 'Leaf', 'emerald', 5) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES (p_org_id, dept_id, 'Environmental Compliance Officer', 'مسؤول الامتثال البيئي', 2, 1), (p_org_id, dept_id, 'Emissions Monitor', 'مراقب الانبعاثات', 0, 2);
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Finance & Sales', 'المالية والمبيعات', 'Calculator', 'cyan', 6) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES (p_org_id, dept_id, 'Accountant', 'محاسب', 1, 1), (p_org_id, dept_id, 'Recycled Materials Sales', 'مبيعات المواد المعاد تدويرها', 0, 2);
  ELSIF p_org_type = 'disposal' THEN
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Management', 'الإدارة', 'Crown', 'purple', 1) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES (p_org_id, dept_id, 'Site Manager', 'مدير الموقع', 3, 1);
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Reception & Weighing', 'الاستقبال والوزن', 'Scale', 'blue', 2) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES (p_org_id, dept_id, 'Gate Supervisor', 'مشرف البوابة', 1, 1), (p_org_id, dept_id, 'Weighbridge Technician', 'فني الميزان', 0, 2);
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Operations', 'التشغيل', 'Cog', 'amber', 3) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES (p_org_id, dept_id, 'Landfill Cell Manager', 'مدير خلايا الدفن', 2, 1), (p_org_id, dept_id, 'Heavy Equipment Operator', 'مشغل معدات ثقيلة', 0, 2);
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Environmental Monitoring', 'المراقبة البيئية', 'Activity', 'green', 4) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES (p_org_id, dept_id, 'Monitoring Technician', 'فني المراقبة', 0, 1);
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Safety', 'السلامة', 'Shield', 'red', 5) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES (p_org_id, dept_id, 'Emergency Officer', 'مسؤول الطوارئ', 2, 1), (p_org_id, dept_id, 'Fire Team', 'فريق الإطفاء', 0, 2);
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Certificates', 'التوثيق', 'FileCheck', 'cyan', 6) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES (p_org_id, dept_id, 'Disposal Certificate Officer', 'مسؤول إصدار شهادات التخلص', 1, 1);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_seed_org_structure()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM seed_org_structure(NEW.id, NEW.organization_type::text);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_org_created_seed_structure ON public.organizations;
CREATE TRIGGER on_org_created_seed_structure AFTER INSERT ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.trigger_seed_org_structure();
