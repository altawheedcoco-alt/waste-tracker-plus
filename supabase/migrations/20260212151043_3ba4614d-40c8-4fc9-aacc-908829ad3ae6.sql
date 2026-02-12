
-- First clear existing departments and positions (cascade will handle positions)
DELETE FROM public.organization_departments;

-- Enhanced seed function with comprehensive departments
CREATE OR REPLACE FUNCTION public.seed_org_structure(p_org_id UUID, p_org_type TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE dept_id UUID; sub_dept_id UUID;
BEGIN
  IF p_org_type = 'transporter' THEN
    -- 1. الإدارة العليا
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Executive Management', 'الإدارة العليا', 'Crown', 'purple', 1) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'CEO / General Manager', 'الرئيس التنفيذي / المدير العام', 4, 1),
      (p_org_id, dept_id, 'Deputy General Manager', 'نائب المدير العام', 3, 2),
      (p_org_id, dept_id, 'Executive Assistant', 'مساعد تنفيذي', 1, 3),
      (p_org_id, dept_id, 'Strategic Planning Manager', 'مدير التخطيط الاستراتيجي', 2, 4);

    -- 2. العمليات والتشغيل
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Operations & Dispatch', 'العمليات والتشغيل', 'Settings', 'blue', 2) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Operations Director', 'مدير العمليات', 3, 1),
      (p_org_id, dept_id, 'Dispatch Manager', 'مدير التوزيع والإرسال', 2, 2),
      (p_org_id, dept_id, 'Trip Supervisor', 'مشرف الرحلات', 1, 3),
      (p_org_id, dept_id, 'Scheduling Coordinator', 'منسق الجدولة', 0, 4),
      (p_org_id, dept_id, 'Route Planner', 'مخطط المسارات', 0, 5),
      (p_org_id, dept_id, 'GPS Control Room Operator', 'مشغل غرفة التحكم GPS', 0, 6);

    -- 3. إدارة الأسطول
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Fleet Management', 'إدارة الأسطول', 'Truck', 'amber', 3) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Fleet Manager', 'مدير الأسطول', 2, 1),
      (p_org_id, dept_id, 'Maintenance Supervisor', 'مشرف الصيانة', 1, 2),
      (p_org_id, dept_id, 'Mechanic Technician', 'فني ميكانيكا', 0, 3),
      (p_org_id, dept_id, 'Tire & Parts Specialist', 'أخصائي إطارات وقطع غيار', 0, 4),
      (p_org_id, dept_id, 'Vehicle Inspector', 'فاحص المركبات', 0, 5);

    -- 4. شؤون السائقين
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Driver Affairs', 'شؤون السائقين', 'Users', 'green', 4) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Head Driver / Fleet Captain', 'رئيس السائقين', 1, 1),
      (p_org_id, dept_id, 'Senior Driver', 'سائق أول', 0, 2),
      (p_org_id, dept_id, 'Driver', 'سائق', 0, 3),
      (p_org_id, dept_id, 'Driver Assistant', 'مساعد سائق', 0, 4),
      (p_org_id, dept_id, 'Training Coordinator', 'منسق التدريب', 0, 5);

    -- 5. السلامة والامتثال
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Safety & Compliance', 'السلامة والامتثال البيئي', 'Shield', 'red', 5) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'HSE Manager', 'مدير الصحة والسلامة والبيئة', 2, 1),
      (p_org_id, dept_id, 'Safety Officer', 'مسؤول السلامة', 1, 2),
      (p_org_id, dept_id, 'Environmental Officer', 'مسؤول البيئة', 1, 3),
      (p_org_id, dept_id, 'Licensing & Permits Officer', 'مسؤول التراخيص والتصاريح', 0, 4),
      (p_org_id, dept_id, 'Hazmat Handler', 'مسؤول المواد الخطرة', 0, 5);

    -- 6. المالية والمحاسبة
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Finance & Accounting', 'المالية والمحاسبة', 'Calculator', 'emerald', 6) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Finance Manager', 'مدير الشؤون المالية', 2, 1),
      (p_org_id, dept_id, 'Chief Accountant', 'المحاسب الرئيسي', 1, 2),
      (p_org_id, dept_id, 'Billing & Invoicing Specialist', 'أخصائي الفوترة', 0, 3),
      (p_org_id, dept_id, 'Collection Officer', 'مسؤول التحصيل', 0, 4),
      (p_org_id, dept_id, 'Payroll Officer', 'مسؤول الرواتب', 0, 5);

    -- 7. خدمة العملاء ومركز الاتصال
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Customer Service & Call Center', 'خدمة العملاء ومركز الاتصال', 'Headphones', 'cyan', 7) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Customer Service Manager', 'مدير خدمة العملاء', 2, 1),
      (p_org_id, dept_id, 'Call Center Team Lead', 'قائد فريق مركز الاتصال', 1, 2),
      (p_org_id, dept_id, 'Call Center Agent', 'موظف مركز الاتصال', 0, 3),
      (p_org_id, dept_id, 'Complaints & Follow-up Officer', 'مسؤول الشكاوى والمتابعة', 0, 4);

    -- 8. الموارد البشرية
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Human Resources', 'الموارد البشرية', 'Users', 'purple', 8) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'HR Manager', 'مدير الموارد البشرية', 2, 1),
      (p_org_id, dept_id, 'Recruitment Specialist', 'أخصائي توظيف', 0, 2),
      (p_org_id, dept_id, 'Personnel Affairs Officer', 'مسؤول شؤون الموظفين', 0, 3);

    -- 9. تقنية المعلومات
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'IT & Technology', 'تقنية المعلومات', 'Settings', 'blue', 9) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'IT Manager', 'مدير تقنية المعلومات', 2, 1),
      (p_org_id, dept_id, 'System Administrator', 'مدير الأنظمة', 1, 2),
      (p_org_id, dept_id, 'Technical Support', 'دعم فني', 0, 3);

  ELSIF p_org_type = 'generator' THEN
    -- 1. الإدارة العليا
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Executive Management', 'الإدارة العليا', 'Crown', 'purple', 1) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Facility Director', 'مدير المنشأة', 4, 1),
      (p_org_id, dept_id, 'Operations Manager', 'مدير العمليات', 3, 2),
      (p_org_id, dept_id, 'Executive Secretary', 'سكرتير تنفيذي', 0, 3);

    -- 2. الشؤون البيئية
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Environmental Affairs', 'الشؤون البيئية', 'Leaf', 'green', 2) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Environmental Manager', 'مدير الشؤون البيئية', 2, 1),
      (p_org_id, dept_id, 'Waste Management Officer', 'مسؤول إدارة المخلفات', 1, 2),
      (p_org_id, dept_id, 'Compliance Monitor', 'مراقب الامتثال البيئي', 0, 3),
      (p_org_id, dept_id, 'Environmental Inspector', 'مفتش بيئي', 0, 4);

    -- 3. التخزين والفرز
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Storage & Sorting', 'التخزين والفرز', 'Package', 'amber', 3) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Warehouse Supervisor', 'مشرف المخازن', 1, 1),
      (p_org_id, dept_id, 'Waste Storekeeper', 'أمين مخزن المخلفات', 0, 2),
      (p_org_id, dept_id, 'Sorting Worker', 'عامل فرز', 0, 3),
      (p_org_id, dept_id, 'Weighbridge Operator', 'مشغل الميزان', 0, 4);

    -- 4. التوثيق والمانيفست
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Documentation & Manifest', 'التوثيق والمانيفست', 'FileText', 'blue', 4) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Document Control Manager', 'مدير مراقبة الوثائق', 2, 1),
      (p_org_id, dept_id, 'Manifest Officer', 'مسؤول المانيفست', 1, 2),
      (p_org_id, dept_id, 'Data Entry Clerk', 'مدخل بيانات', 0, 3);

    -- 5. السلامة
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Safety & Health', 'السلامة والصحة المهنية', 'Shield', 'red', 5) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Safety Manager', 'مدير السلامة', 2, 1),
      (p_org_id, dept_id, 'Safety Officer', 'مسؤول السلامة', 1, 2),
      (p_org_id, dept_id, 'First Aid Attendant', 'مسعف أول', 0, 3);

    -- 6. المالية
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Finance', 'الشؤون المالية', 'Calculator', 'emerald', 6) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Finance Manager', 'مدير المالية', 2, 1),
      (p_org_id, dept_id, 'Accountant', 'محاسب', 1, 2),
      (p_org_id, dept_id, 'Procurement Officer', 'مسؤول المشتريات', 0, 3);

    -- 7. الموارد البشرية
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Human Resources', 'الموارد البشرية', 'Users', 'cyan', 7) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'HR Officer', 'مسؤول الموارد البشرية', 1, 1),
      (p_org_id, dept_id, 'Personnel Clerk', 'كاتب شؤون موظفين', 0, 2);

  ELSIF p_org_type = 'recycler' THEN
    -- 1. الإدارة العليا
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Executive Management', 'الإدارة العليا', 'Crown', 'purple', 1) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'CEO / General Manager', 'الرئيس التنفيذي / المدير العام', 4, 1),
      (p_org_id, dept_id, 'Plant Director', 'مدير المصنع', 3, 2),
      (p_org_id, dept_id, 'Business Development Manager', 'مدير تطوير الأعمال', 2, 3);

    -- 2. الاستقبال والبوابة
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Reception & Gate', 'الاستقبال والبوابة', 'DoorOpen', 'blue', 2) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Gate Operations Manager', 'مدير عمليات البوابة', 2, 1),
      (p_org_id, dept_id, 'Gate Supervisor', 'مشرف البوابة', 1, 2),
      (p_org_id, dept_id, 'Weighbridge Operator', 'مشغل الميزان', 0, 3),
      (p_org_id, dept_id, 'Quality Inspector', 'مراقب جودة الوارد', 0, 4),
      (p_org_id, dept_id, 'Material Classifier', 'مصنّف المواد', 0, 5);

    -- 3. الإنتاج وخطوط الفرز
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Production & Sorting', 'الإنتاج وخطوط الفرز', 'Factory', 'amber', 3) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Production Manager', 'مدير الإنتاج', 2, 1),
      (p_org_id, dept_id, 'Sorting Line Supervisor', 'مشرف خط الفرز', 1, 2),
      (p_org_id, dept_id, 'Processing Line Supervisor', 'مشرف خط المعالجة', 1, 3),
      (p_org_id, dept_id, 'Machine Operator', 'مشغل معدات', 0, 4),
      (p_org_id, dept_id, 'Sorting Worker', 'عامل فرز', 0, 5),
      (p_org_id, dept_id, 'Packaging Worker', 'عامل تعبئة وتغليف', 0, 6);

    -- 4. المختبر وضمان الجودة
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Laboratory & QA', 'المختبر وضمان الجودة', 'FlaskConical', 'green', 4) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Lab Manager', 'مدير المختبر', 2, 1),
      (p_org_id, dept_id, 'QA Officer', 'مسؤول ضمان الجودة', 1, 2),
      (p_org_id, dept_id, 'Lab Technician', 'فني مختبر', 0, 3),
      (p_org_id, dept_id, 'Sample Collector', 'جامع عينات', 0, 4);

    -- 5. البيئة والامتثال
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Environment & Compliance', 'البيئة والامتثال', 'Leaf', 'emerald', 5) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Environmental Compliance Manager', 'مدير الامتثال البيئي', 2, 1),
      (p_org_id, dept_id, 'Emissions Monitor', 'مراقب الانبعاثات', 1, 2),
      (p_org_id, dept_id, 'Waste Water Monitor', 'مراقب المياه العادمة', 0, 3);

    -- 6. المالية والمبيعات
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Finance & Sales', 'المالية والمبيعات', 'Calculator', 'cyan', 6) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Finance Manager', 'مدير المالية', 2, 1),
      (p_org_id, dept_id, 'Chief Accountant', 'المحاسب الرئيسي', 1, 2),
      (p_org_id, dept_id, 'Recycled Materials Sales Manager', 'مدير مبيعات المواد المعاد تدويرها', 2, 3),
      (p_org_id, dept_id, 'Sales Representative', 'مندوب مبيعات', 0, 4);

    -- 7. الصيانة
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Maintenance', 'الصيانة', 'Cog', 'amber', 7) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Maintenance Manager', 'مدير الصيانة', 2, 1),
      (p_org_id, dept_id, 'Electrical Technician', 'فني كهرباء', 0, 2),
      (p_org_id, dept_id, 'Mechanical Technician', 'فني ميكانيكا', 0, 3);

    -- 8. الموارد البشرية والسلامة
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'HR & Safety', 'الموارد البشرية والسلامة', 'Shield', 'red', 8) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'HR & Safety Manager', 'مدير الموارد البشرية والسلامة', 2, 1),
      (p_org_id, dept_id, 'Safety Officer', 'مسؤول السلامة', 1, 2),
      (p_org_id, dept_id, 'HR Officer', 'مسؤول الموارد البشرية', 0, 3);

    -- 9. إصدار الشهادات
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Certificates', 'إصدار الشهادات', 'FileCheck', 'blue', 9) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Recycling Certificate Manager', 'مدير شهادات التدوير', 2, 1),
      (p_org_id, dept_id, 'Certificate Officer', 'مسؤول إصدار الشهادات', 1, 2);

  ELSIF p_org_type = 'disposal' THEN
    -- 1. الإدارة العليا
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Executive Management', 'الإدارة العليا', 'Crown', 'purple', 1) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Site Director', 'مدير الموقع', 4, 1),
      (p_org_id, dept_id, 'Deputy Site Manager', 'نائب مدير الموقع', 3, 2),
      (p_org_id, dept_id, 'Administrative Coordinator', 'منسق إداري', 0, 3);

    -- 2. الاستقبال والوزن
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Reception & Weighing', 'الاستقبال والوزن', 'Scale', 'blue', 2) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Gate Operations Manager', 'مدير عمليات البوابة', 2, 1),
      (p_org_id, dept_id, 'Gate Supervisor', 'مشرف البوابة', 1, 2),
      (p_org_id, dept_id, 'Weighbridge Operator', 'مشغل الميزان', 0, 3),
      (p_org_id, dept_id, 'Waste Inspector', 'مفتش المخلفات', 0, 4);

    -- 3. التشغيل والدفن
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Operations & Landfill', 'التشغيل والدفن', 'Cog', 'amber', 3) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Operations Manager', 'مدير التشغيل', 2, 1),
      (p_org_id, dept_id, 'Landfill Cell Manager', 'مدير خلايا الدفن', 1, 2),
      (p_org_id, dept_id, 'Heavy Equipment Operator', 'مشغل معدات ثقيلة', 0, 3),
      (p_org_id, dept_id, 'Compaction Technician', 'فني الدك والضغط', 0, 4),
      (p_org_id, dept_id, 'Cover Material Specialist', 'أخصائي مواد التغطية', 0, 5);

    -- 4. المراقبة البيئية
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Environmental Monitoring', 'المراقبة البيئية', 'Activity', 'green', 4) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Environmental Monitoring Manager', 'مدير المراقبة البيئية', 2, 1),
      (p_org_id, dept_id, 'Groundwater Monitor', 'مراقب المياه الجوفية', 1, 2),
      (p_org_id, dept_id, 'Gas Emissions Monitor', 'مراقب انبعاثات الغاز', 0, 3),
      (p_org_id, dept_id, 'Leachate Treatment Technician', 'فني معالجة العصارة', 0, 4);

    -- 5. السلامة والطوارئ
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Safety & Emergency', 'السلامة والطوارئ', 'Shield', 'red', 5) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Safety Manager', 'مدير السلامة', 2, 1),
      (p_org_id, dept_id, 'Emergency Response Officer', 'مسؤول الاستجابة للطوارئ', 1, 2),
      (p_org_id, dept_id, 'Fire Team Leader', 'قائد فريق الإطفاء', 1, 3),
      (p_org_id, dept_id, 'Safety Guard', 'حارس سلامة', 0, 4);

    -- 6. التوثيق والشهادات
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Documentation & Certificates', 'التوثيق والشهادات', 'FileCheck', 'cyan', 6) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Disposal Certificate Manager', 'مدير شهادات التخلص', 2, 1),
      (p_org_id, dept_id, 'Certificate Officer', 'مسؤول إصدار الشهادات', 1, 2),
      (p_org_id, dept_id, 'Records Clerk', 'كاتب سجلات', 0, 3);

    -- 7. المالية
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Finance', 'الشؤون المالية', 'Calculator', 'emerald', 7) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Finance Manager', 'مدير المالية', 2, 1),
      (p_org_id, dept_id, 'Accountant', 'محاسب', 1, 2),
      (p_org_id, dept_id, 'Invoice Specialist', 'أخصائي فوترة', 0, 3);

    -- 8. الصيانة
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Maintenance', 'الصيانة', 'Cog', 'amber', 8) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Maintenance Supervisor', 'مشرف الصيانة', 1, 1),
      (p_org_id, dept_id, 'Equipment Technician', 'فني معدات', 0, 2),
      (p_org_id, dept_id, 'Civil Works Technician', 'فني أعمال مدنية', 0, 3);
  END IF;
END;
$$;

-- Re-seed all existing organizations
DO $$
DECLARE org RECORD;
BEGIN
  FOR org IN SELECT id, organization_type::text as org_type FROM public.organizations LOOP
    PERFORM public.seed_org_structure(org.id, org.org_type);
  END LOOP;
END;
$$;
