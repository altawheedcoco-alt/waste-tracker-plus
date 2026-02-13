
-- Update the seed_org_structure function with Gemini's recommended transporter structure
-- 4 قطاعات رئيسية: العمليات واللوجستيات، التكنولوجيا والبيانات، الامتثال والبيئة، التنمية التجارية
-- مع الحفاظ على الأقسام الداعمة (المالية، الموارد البشرية)

CREATE OR REPLACE FUNCTION public.seed_org_structure(p_org_id UUID, p_org_type TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE dept_id UUID; sub_dept_id UUID;
BEGIN
  -- Delete existing structure for this org (fresh seed)
  DELETE FROM organization_positions WHERE organization_id = p_org_id;
  DELETE FROM organization_departments WHERE organization_id = p_org_id;

  IF p_org_type = 'transporter' THEN
    -- ═══════════════════════════════════════════════════════════════
    -- الهيكل التنظيمي المتقدم لشركات النقل والإدارة البيئية
    -- مبني على نموذج Tech-Enabled Waste Management Companies
    -- ═══════════════════════════════════════════════════════════════

    -- 1. الإدارة العليا (Executive Management)
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Executive Management', 'الإدارة العليا', 'وضع الاستراتيجية الكبرى وتوجيه القطاعات', 'Crown', 'purple', 1) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'CEO / General Manager', 'الرئيس التنفيذي / المدير العام', 'وضع الاستراتيجية الكبرى والإشراف على جميع القطاعات', 4, 1),
      (p_org_id, dept_id, 'Deputy General Manager', 'نائب المدير العام', 'إدارة العمليات اليومية نيابة عن المدير العام', 3, 2),
      (p_org_id, dept_id, 'Executive Assistant', 'مساعد تنفيذي', 'تنسيق أجندة الإدارة العليا والاتصالات', 1, 3),
      (p_org_id, dept_id, 'Strategic Planning Manager', 'مدير التخطيط الاستراتيجي', 'تطوير خطط النمو وتحليل السوق', 2, 4);

    -- ═══════════════════════════════════════════════════════════════
    -- قطاع 1: العمليات واللوجستيات (Operations & Logistics)
    -- "العضلات" — المسؤول عن التحرك على الأرض
    -- ═══════════════════════════════════════════════════════════════

    -- 2. العمليات والتشغيل
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Operations & Dispatch', 'العمليات والتشغيل', 'تنفيذ خطط الجمع والنقل وتوزيع المهام على السائقين', 'Settings', 'blue', 2) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Operations Director', 'مدير العمليات', 'تنفيذ خطط الجمع والنقل وتحقيق المستهدفات التشغيلية', 3, 1),
      (p_org_id, dept_id, 'Fleet Supervisor', 'مشرف الحركة', 'مراقبة حركة الشاحنات والتزام السائقين بالمسارات', 2, 2),
      (p_org_id, dept_id, 'Dispatcher', 'مسؤول الجدولة والتوزيع', 'توزيع المهمات على السائقين بناءً على أوامر الشغل الواردة', 1, 3),
      (p_org_id, dept_id, 'Trip Supervisor', 'مشرف الرحلات', 'متابعة تنفيذ الرحلات والتأكد من الالتزام بالجداول', 1, 4),
      (p_org_id, dept_id, 'Route Planner', 'مخطط المسارات', 'تحسين المسارات وتقليل زمن الرحلات والتكاليف', 0, 5);

    -- 3. إدارة الأسطول
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Fleet Management', 'إدارة الأسطول', 'صيانة المركبات وضمان جاهزيتها التشغيلية', 'Truck', 'amber', 3) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Fleet Manager', 'مدير الأسطول', 'إدارة دورة حياة المركبات والصيانة الوقائية', 2, 1),
      (p_org_id, dept_id, 'Maintenance Supervisor', 'مشرف الصيانة', 'جدولة وتنفيذ أعمال الصيانة الدورية والطارئة', 1, 2),
      (p_org_id, dept_id, 'Mechanic Technician', 'فني ميكانيكا', 'إصلاح وصيانة المركبات ميدانياً', 0, 3),
      (p_org_id, dept_id, 'Tire & Parts Specialist', 'أخصائي إطارات وقطع غيار', 'إدارة مخزون قطع الغيار والإطارات', 0, 4),
      (p_org_id, dept_id, 'Vehicle Inspector', 'فاحص المركبات', 'فحص جاهزية المركبات قبل الرحلات', 0, 5);

    -- 4. شؤون السائقين والعمالة الميدانية
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Driver & Field Affairs', 'شؤون السائقين والعمالة الميدانية', 'إدارة السائقين الحاصلين على رخص نقل ثقيل وعمال الجمع والتحميل', 'Users', 'green', 4) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Head Driver / Fleet Captain', 'رئيس السائقين', 'قيادة فريق السائقين وتوزيع الورديات', 1, 1),
      (p_org_id, dept_id, 'Senior Driver', 'سائق أول', 'سائق متمرس مدرب على المخلفات الخطرة وتطبيق السائق', 0, 2),
      (p_org_id, dept_id, 'Driver', 'سائق', 'قيادة المركبات وتنفيذ مهام النقل عبر تطبيق السائق', 0, 3),
      (p_org_id, dept_id, 'Driver Assistant', 'مساعد سائق / مرافق', 'المساعدة في التحميل والتفريغ والتوثيق الميداني', 0, 4),
      (p_org_id, dept_id, 'Loading & Collection Worker', 'عامل جمع وتحميل', 'التحميل والتأكد من سلامة الحاويات والحمولة', 0, 5),
      (p_org_id, dept_id, 'Training Coordinator', 'منسق التدريب', 'تدريب السائقين على استخدام التطبيق والإجراءات الميدانية', 0, 6);

    -- ═══════════════════════════════════════════════════════════════
    -- قطاع 2: التكنولوجيا والبيانات (Tech & Smart Systems)
    -- "العقل" — التتبع والتحليل والذكاء الاصطناعي
    -- ═══════════════════════════════════════════════════════════════

    -- 5. تكنولوجيا المعلومات والأنظمة الذكية
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Tech & Smart Systems', 'التكنولوجيا والأنظمة الذكية', 'إدارة السيرفرات والأنظمة وتحليل البيانات وغرفة التحكم', 'Monitor', 'indigo', 5) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'IT Manager', 'مدير تكنولوجيا المعلومات', 'ضمان استمرارية عمل السيرفرات والمنصة الرقمية', 2, 1),
      (p_org_id, dept_id, 'System Administrator', 'مدير الأنظمة', 'إدارة البنية التحتية والتكاملات مع الأطراف الخارجية', 1, 2),
      (p_org_id, dept_id, 'Data Analyst', 'محلل البيانات', 'تحليل أسعار المخلفات والعرض والطلب ورفع تقارير استباقية', 1, 3),
      (p_org_id, dept_id, 'Control Room Operator', 'مشغل غرفة التحكم', 'مراقبة GPS والـ Geofencing والإنذارات اللحظية على الشاشات', 0, 4),
      (p_org_id, dept_id, 'Technical Support', 'دعم فني', 'دعم المستخدمين الداخليين وحل المشكلات التقنية', 0, 5);

    -- ═══════════════════════════════════════════════════════════════
    -- قطاع 3: الامتثال والبيئة (Compliance & HSE)
    -- "الدرع" — التعامل مع الحكومة والأيزو والتقارير
    -- ═══════════════════════════════════════════════════════════════

    -- 6. السلامة والامتثال البيئي
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Compliance & HSE', 'الامتثال والسلامة والبيئة', 'ضمان قانونية العمليات ومطابقة المعايير البيئية وسلامة العاملين', 'Shield', 'red', 6) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Environmental Manager', 'مدير البيئة والامتثال', 'التأكد أن كل عمليات النقل والتخلص قانونية وضمن المعايير', 2, 1),
      (p_org_id, dept_id, 'HSE Officer', 'أخصائي السلامة والصحة المهنية', 'تأمين السائقين والعمال خاصة مع المخلفات الكيميائية الخطرة', 1, 2),
      (p_org_id, dept_id, 'Licensing & Permits Officer', 'مسؤول التراخيص والتصاريح', 'متابعة تجديد التراخيص (WMRA, EEAA) ومنع انقطاعها', 0, 3),
      (p_org_id, dept_id, 'Hazmat Compliance Officer', 'مسؤول امتثال المواد الخطرة', 'ضمان مطابقة نقل المواد الخطرة للقانون 202/2020', 0, 4),
      (p_org_id, dept_id, 'Quality & ISO Auditor', 'مدقق الجودة والأيزو', 'إعداد تقارير التدقيق وضمان مطابقة الأيزو', 0, 5);

    -- ═══════════════════════════════════════════════════════════════
    -- قطاع 4: التنمية التجارية (Business Development & Sales)
    -- "المحرك" — جلب العقود والعلاقات مع المصانع
    -- ═══════════════════════════════════════════════════════════════

    -- 7. التنمية التجارية والمبيعات
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Business Development & Sales', 'التنمية التجارية والمبيعات', 'جلب العقود مع المصانع وإدارة علاقات العملاء', 'TrendingUp', 'orange', 7) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Sales Manager', 'مدير المبيعات', 'التعاقد مع المصانع لتوريد مخلفاتهم (سكراب، خشب، إلخ)', 2, 1),
      (p_org_id, dept_id, 'Key Account Manager', 'مسؤول حسابات العملاء الرئيسيين', 'التواصل مع المصانع لحل مشاكل أوامر الشغل والأوزان', 1, 2),
      (p_org_id, dept_id, 'Business Development Officer', 'مسؤول تطوير الأعمال', 'استكشاف فرص عقود جديدة وتوسيع قاعدة العملاء', 0, 3),
      (p_org_id, dept_id, 'Contracts & Pricing Specialist', 'أخصائي العقود والتسعير', 'إعداد العروض وتسعير الخدمات وإدارة العقود', 0, 4);

    -- ═══════════════════════════════════════════════════════════════
    -- الأقسام الداعمة (Support Functions)
    -- ═══════════════════════════════════════════════════════════════

    -- 8. المالية والمحاسبة
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Finance & Accounting', 'المالية والمحاسبة', 'إدارة التدفقات النقدية والفوترة والتحصيل والرواتب', 'Calculator', 'emerald', 8) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Finance Manager', 'مدير الشؤون المالية', 'الإشراف على الحسابات والتدفقات المالية', 2, 1),
      (p_org_id, dept_id, 'Chief Accountant', 'المحاسب الرئيسي', 'إعداد القوائم المالية وإدارة دفتر الأستاذ', 1, 2),
      (p_org_id, dept_id, 'Billing & Invoicing Specialist', 'أخصائي الفوترة', 'إصدار الفواتير ومتابعة المستحقات', 0, 3),
      (p_org_id, dept_id, 'Collection Officer', 'مسؤول التحصيل', 'متابعة تحصيل المبالغ المستحقة من العملاء', 0, 4),
      (p_org_id, dept_id, 'Payroll Officer', 'مسؤول الرواتب', 'إعداد كشوف الرواتب والمستحقات', 0, 5);

    -- 9. خدمة العملاء ومركز الاتصال
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Customer Service & Call Center', 'خدمة العملاء ومركز الاتصال', 'دعم العملاء والشركاء ومتابعة الشكاوى', 'Headphones', 'cyan', 9) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Customer Service Manager', 'مدير خدمة العملاء', 'إدارة فريق خدمة العملاء وضمان رضا الشركاء', 2, 1),
      (p_org_id, dept_id, 'Call Center Team Lead', 'قائد فريق مركز الاتصال', 'إدارة فريق مركز الاتصال وتحسين مؤشرات الأداء', 1, 2),
      (p_org_id, dept_id, 'Call Center Agent', 'موظف مركز الاتصال', 'استقبال المكالمات والتعامل مع استفسارات العملاء', 0, 3),
      (p_org_id, dept_id, 'Complaints & Follow-up Officer', 'مسؤول الشكاوى والمتابعة', 'متابعة الشكاوى حتى الحل النهائي', 0, 4);

    -- 10. الموارد البشرية
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Human Resources', 'الموارد البشرية', 'إدارة التوظيف وشؤون الموظفين', 'Users', 'violet', 10) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'HR Manager', 'مدير الموارد البشرية', 'إدارة سياسات التوظيف والتطوير المهني', 2, 1),
      (p_org_id, dept_id, 'Recruitment Specialist', 'أخصائي توظيف', 'استقطاب الكفاءات وإدارة عمليات التوظيف', 0, 2),
      (p_org_id, dept_id, 'Personnel Affairs Officer', 'مسؤول شؤون الموظفين', 'إدارة الحضور والإجازات والملفات', 0, 3);

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
      (p_org_id, dept_id, 'Accountant', 'محاسب', 1, 1),
      (p_org_id, dept_id, 'Procurement Officer', 'مسؤول المشتريات', 0, 2);
    -- 7. تقنية المعلومات
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'IT', 'تقنية المعلومات', 'Monitor', 'blue', 7) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'System Operator', 'مشغل النظام', 0, 1);

  ELSIF p_org_type = 'recycler' THEN
    -- 1. الإدارة العليا
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Executive Management', 'الإدارة العليا', 'Crown', 'purple', 1) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Plant Director', 'مدير المصنع', 4, 1),
      (p_org_id, dept_id, 'Production Manager', 'مدير الإنتاج', 3, 2);
    -- 2. خط الإنتاج والتدوير
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Production & Recycling', 'خط الإنتاج والتدوير', 'Recycle', 'green', 2) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Production Line Supervisor', 'مشرف خط الإنتاج', 1, 1),
      (p_org_id, dept_id, 'Machine Operator', 'مشغل ماكينات', 0, 2),
      (p_org_id, dept_id, 'Quality Inspector', 'فاحص جودة', 0, 3),
      (p_org_id, dept_id, 'Recycling Technician', 'فني تدوير', 0, 4);
    -- 3. الاستقبال والوزن
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Receiving & Weighing', 'الاستقبال والوزن', 'Scale', 'amber', 3) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Receiving Manager', 'مدير الاستقبال', 2, 1),
      (p_org_id, dept_id, 'Weighbridge Operator', 'مشغل البسكول', 0, 2),
      (p_org_id, dept_id, 'Material Inspector', 'فاحص المواد الواردة', 0, 3),
      (p_org_id, dept_id, 'Yard Coordinator', 'منسق الساحة', 0, 4);
    -- 4. المخازن
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Warehouse & Inventory', 'المخازن والمخزون', 'Package', 'blue', 4) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Warehouse Manager', 'مدير المخازن', 2, 1),
      (p_org_id, dept_id, 'Inventory Clerk', 'أمين المخزن', 0, 2),
      (p_org_id, dept_id, 'Forklift Operator', 'مشغل رافعة شوكية', 0, 3);
    -- 5. البيئة والسلامة
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Environment & Safety', 'البيئة والسلامة', 'Shield', 'red', 5) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Environmental Officer', 'مسؤول البيئة', 2, 1),
      (p_org_id, dept_id, 'Safety Officer', 'مسؤول السلامة', 1, 2),
      (p_org_id, dept_id, 'Emissions Monitor', 'مراقب الانبعاثات', 0, 3);
    -- 6. المالية
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Finance', 'الشؤون المالية', 'Calculator', 'emerald', 6) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Finance Manager', 'مدير مالي', 2, 1),
      (p_org_id, dept_id, 'Cost Accountant', 'محاسب تكاليف', 1, 2),
      (p_org_id, dept_id, 'Purchasing Officer', 'مسؤول مشتريات', 0, 3);
    -- 7. المبيعات
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Sales & Marketing', 'المبيعات والتسويق', 'TrendingUp', 'orange', 7) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Sales Manager', 'مدير المبيعات', 2, 1),
      (p_org_id, dept_id, 'Sales Representative', 'مندوب مبيعات', 0, 2);
    -- 8. الصيانة
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Maintenance', 'الصيانة', 'Wrench', 'cyan', 8) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Maintenance Manager', 'مدير الصيانة', 2, 1),
      (p_org_id, dept_id, 'Electrical Technician', 'فني كهرباء', 0, 2),
      (p_org_id, dept_id, 'Mechanical Technician', 'فني ميكانيكا', 0, 3);
    -- 9. تقنية المعلومات
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'IT & Systems', 'تقنية المعلومات', 'Monitor', 'indigo', 9) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'IT Manager', 'مدير تقنية المعلومات', 2, 1),
      (p_org_id, dept_id, 'System Operator', 'مشغل النظام', 0, 2);

  ELSIF p_org_type = 'disposal' THEN
    -- 1. الإدارة العليا
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Executive Management', 'الإدارة العليا', 'Crown', 'purple', 1) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Facility Director', 'مدير المرفق', 4, 1),
      (p_org_id, dept_id, 'Operations Manager', 'مدير العمليات', 3, 2);
    -- 2. عمليات التخلص
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Disposal Operations', 'عمليات التخلص', 'Flame', 'red', 2) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Disposal Supervisor', 'مشرف التخلص', 1, 1),
      (p_org_id, dept_id, 'Incinerator Operator', 'مشغل المحرقة', 0, 2),
      (p_org_id, dept_id, 'Landfill Operator', 'مشغل المدفن', 0, 3),
      (p_org_id, dept_id, 'Treatment Technician', 'فني المعالجة', 0, 4);
    -- 3. الاستقبال
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Receiving', 'الاستقبال والتوزيع', 'LogIn', 'amber', 3) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Receiving Manager', 'مدير الاستقبال', 2, 1),
      (p_org_id, dept_id, 'Weighbridge Operator', 'مشغل البسكول', 0, 2),
      (p_org_id, dept_id, 'Inspector', 'مفتش الأحمال', 0, 3);
    -- 4. البيئة والرقابة
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Environmental Monitoring', 'الرقابة البيئية', 'Leaf', 'green', 4) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Environmental Manager', 'مدير البيئة', 2, 1),
      (p_org_id, dept_id, 'Air Quality Monitor', 'مراقب جودة الهواء', 0, 2),
      (p_org_id, dept_id, 'Water Quality Monitor', 'مراقب جودة المياه', 0, 3),
      (p_org_id, dept_id, 'Soil & Leachate Monitor', 'مراقب التربة والرشاحة', 0, 4);
    -- 5. السلامة
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Safety', 'السلامة والصحة المهنية', 'Shield', 'red', 5) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'HSE Manager', 'مدير السلامة', 2, 1),
      (p_org_id, dept_id, 'Safety Officer', 'مسؤول السلامة', 1, 2),
      (p_org_id, dept_id, 'Emergency Response', 'فريق الطوارئ', 0, 3);
    -- 6. المالية
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Finance', 'الشؤون المالية', 'Calculator', 'emerald', 6) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Accountant', 'محاسب', 1, 1),
      (p_org_id, dept_id, 'Collection Officer', 'مسؤول التحصيل', 0, 2);
    -- 7. الصيانة
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'Maintenance', 'الصيانة', 'Wrench', 'cyan', 7) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Maintenance Supervisor', 'مشرف الصيانة', 1, 1),
      (p_org_id, dept_id, 'Technician', 'فني صيانة', 0, 2);
    -- 8. تقنية المعلومات
    INSERT INTO organization_departments (organization_id, name, name_ar, icon, color, sort_order) VALUES (p_org_id, 'IT', 'تقنية المعلومات', 'Monitor', 'blue', 8) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'System Operator', 'مشغل النظام', 0, 1);
  END IF;
END;
$$;
