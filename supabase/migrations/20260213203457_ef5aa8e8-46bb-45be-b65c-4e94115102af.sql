
-- Update seed_org_structure: Disposal facility comprehensive organizational structure
-- 4 قطاعات رئيسية: الإدارة الهندسية والعمليات، الرقابة البيئية والمختبر، السلامة والصحة المهنية، التتبع والبيانات
-- + أقسام داعمة: المالية، الصيانة، الموارد البشرية

CREATE OR REPLACE FUNCTION public.seed_org_structure(p_org_id UUID, p_org_type TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE dept_id UUID; sub_dept_id UUID;
BEGIN
  DELETE FROM organization_positions WHERE organization_id = p_org_id;
  DELETE FROM organization_departments WHERE organization_id = p_org_id;

  IF p_org_type = 'transporter' THEN
    -- ═══════════════════════════════════════════════════════════════
    -- الهيكل التنظيمي المتقدم لشركات النقل والإدارة البيئية
    -- ═══════════════════════════════════════════════════════════════

    -- 1. الإدارة العليا
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Executive Management', 'الإدارة العليا', 'وضع الاستراتيجية الكبرى وتوجيه القطاعات', 'Crown', 'purple', 1) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'CEO / General Manager', 'الرئيس التنفيذي / المدير العام', 'وضع الاستراتيجية الكبرى والإشراف على جميع القطاعات', 4, 1),
      (p_org_id, dept_id, 'Deputy General Manager', 'نائب المدير العام', 'إدارة العمليات اليومية نيابة عن المدير العام', 3, 2),
      (p_org_id, dept_id, 'Executive Assistant', 'مساعد تنفيذي', 'تنسيق أجندة الإدارة العليا والاتصالات', 1, 3),
      (p_org_id, dept_id, 'Strategic Planning Manager', 'مدير التخطيط الاستراتيجي', 'تطوير خطط النمو وتحليل السوق', 2, 4);

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

    -- 4. شؤون السائقين
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Driver & Field Affairs', 'شؤون السائقين والعمالة الميدانية', 'إدارة السائقين وعمال الجمع والتحميل', 'Users', 'green', 4) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Head Driver / Fleet Captain', 'رئيس السائقين', 'قيادة فريق السائقين وتوزيع الورديات', 1, 1),
      (p_org_id, dept_id, 'Senior Driver', 'سائق أول', 'سائق متمرس مدرب على المخلفات الخطرة', 0, 2),
      (p_org_id, dept_id, 'Driver', 'سائق', 'قيادة المركبات وتنفيذ مهام النقل', 0, 3),
      (p_org_id, dept_id, 'Driver Assistant', 'مساعد سائق / مرافق', 'المساعدة في التحميل والتفريغ والتوثيق', 0, 4),
      (p_org_id, dept_id, 'Loading & Collection Worker', 'عامل جمع وتحميل', 'التحميل والتأكد من سلامة الحاويات', 0, 5),
      (p_org_id, dept_id, 'Training Coordinator', 'منسق التدريب', 'تدريب السائقين على التطبيق والإجراءات', 0, 6);

    -- 5. التكنولوجيا والأنظمة الذكية
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Tech & Smart Systems', 'التكنولوجيا والأنظمة الذكية', 'إدارة السيرفرات والأنظمة وتحليل البيانات وغرفة التحكم', 'Monitor', 'indigo', 5) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'IT Manager', 'مدير تكنولوجيا المعلومات', 'ضمان استمرارية عمل السيرفرات والمنصة', 2, 1),
      (p_org_id, dept_id, 'System Administrator', 'مدير الأنظمة', 'إدارة البنية التحتية والتكاملات', 1, 2),
      (p_org_id, dept_id, 'Data Analyst', 'محلل البيانات', 'تحليل أسعار المخلفات والعرض والطلب', 1, 3),
      (p_org_id, dept_id, 'Control Room Operator', 'مشغل غرفة التحكم', 'مراقبة GPS والإنذارات اللحظية', 0, 4),
      (p_org_id, dept_id, 'Technical Support', 'دعم فني', 'دعم المستخدمين وحل المشكلات التقنية', 0, 5);

    -- 6. الامتثال والسلامة والبيئة
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Compliance & HSE', 'الامتثال والسلامة والبيئة', 'ضمان قانونية العمليات ومطابقة المعايير البيئية', 'Shield', 'red', 6) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Environmental Manager', 'مدير البيئة والامتثال', 'التأكد من قانونية عمليات النقل والتخلص', 2, 1),
      (p_org_id, dept_id, 'HSE Officer', 'أخصائي السلامة والصحة المهنية', 'تأمين السائقين والعمال', 1, 2),
      (p_org_id, dept_id, 'Licensing & Permits Officer', 'مسؤول التراخيص والتصاريح', 'متابعة تجديد التراخيص', 0, 3),
      (p_org_id, dept_id, 'Hazmat Compliance Officer', 'مسؤول امتثال المواد الخطرة', 'ضمان مطابقة نقل المواد الخطرة للقانون', 0, 4),
      (p_org_id, dept_id, 'Quality & ISO Auditor', 'مدقق الجودة والأيزو', 'إعداد تقارير التدقيق وضمان مطابقة الأيزو', 0, 5);

    -- 7. التنمية التجارية والمبيعات
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Business Development & Sales', 'التنمية التجارية والمبيعات', 'جلب العقود مع المصانع وإدارة علاقات العملاء', 'TrendingUp', 'orange', 7) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Sales Manager', 'مدير المبيعات', 'التعاقد مع المصانع لتوريد مخلفاتهم', 2, 1),
      (p_org_id, dept_id, 'Key Account Manager', 'مسؤول حسابات العملاء الرئيسيين', 'التواصل مع المصانع لحل المشاكل', 1, 2),
      (p_org_id, dept_id, 'Business Development Officer', 'مسؤول تطوير الأعمال', 'استكشاف فرص عقود جديدة', 0, 3),
      (p_org_id, dept_id, 'Contracts & Pricing Specialist', 'أخصائي العقود والتسعير', 'إعداد العروض وتسعير الخدمات', 0, 4);

    -- 8. المالية والمحاسبة
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Finance & Accounting', 'المالية والمحاسبة', 'إدارة التدفقات النقدية والفوترة والتحصيل', 'Calculator', 'emerald', 8) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Finance Manager', 'مدير الشؤون المالية', 'الإشراف على الحسابات والتدفقات المالية', 2, 1),
      (p_org_id, dept_id, 'Chief Accountant', 'المحاسب الرئيسي', 'إعداد القوائم المالية وإدارة دفتر الأستاذ', 1, 2),
      (p_org_id, dept_id, 'Billing & Invoicing Specialist', 'أخصائي الفوترة', 'إصدار الفواتير ومتابعة المستحقات', 0, 3),
      (p_org_id, dept_id, 'Collection Officer', 'مسؤول التحصيل', 'متابعة تحصيل المبالغ المستحقة', 0, 4),
      (p_org_id, dept_id, 'Payroll Officer', 'مسؤول الرواتب', 'إعداد كشوف الرواتب', 0, 5);

    -- 9. خدمة العملاء
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Customer Service & Call Center', 'خدمة العملاء ومركز الاتصال', 'دعم العملاء والشركاء ومتابعة الشكاوى', 'Headphones', 'cyan', 9) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Customer Service Manager', 'مدير خدمة العملاء', 'إدارة فريق خدمة العملاء', 2, 1),
      (p_org_id, dept_id, 'Call Center Team Lead', 'قائد فريق مركز الاتصال', 'إدارة فريق مركز الاتصال', 1, 2),
      (p_org_id, dept_id, 'Call Center Agent', 'موظف مركز الاتصال', 'استقبال المكالمات', 0, 3),
      (p_org_id, dept_id, 'Complaints & Follow-up Officer', 'مسؤول الشكاوى والمتابعة', 'متابعة الشكاوى حتى الحل', 0, 4);

    -- 10. الموارد البشرية
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Human Resources', 'الموارد البشرية', 'إدارة التوظيف وشؤون الموظفين', 'Users', 'violet', 10) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'HR Manager', 'مدير الموارد البشرية', 'إدارة سياسات التوظيف والتطوير المهني', 2, 1),
      (p_org_id, dept_id, 'Recruitment Specialist', 'أخصائي توظيف', 'استقطاب الكفاءات', 0, 2),
      (p_org_id, dept_id, 'Personnel Affairs Officer', 'مسؤول شؤون الموظفين', 'إدارة الحضور والإجازات', 0, 3);

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
    -- ═══════════════════════════════════════════════════════════════
    -- الهيكل التنظيمي المتقدم لمصانع إعادة التدوير
    -- ═══════════════════════════════════════════════════════════════

    -- 1. الإدارة العليا
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Executive Management', 'الإدارة العليا', 'وضع الاستراتيجية الكبرى وإدارة الربحية الكلية للمصنع', 'Crown', 'purple', 1) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Factory Director / CEO', 'مدير المصنع / الرئيس التنفيذي', 'وضع الاستراتيجية الكبرى وإدارة الربحية الكلية', 4, 1),
      (p_org_id, dept_id, 'Deputy Director', 'نائب المدير', 'إدارة العمليات اليومية والتنسيق بين القطاعات', 3, 2),
      (p_org_id, dept_id, 'Executive Assistant', 'مساعد تنفيذي', 'تنسيق أجندة الإدارة العليا', 1, 3);

    -- 2. الاستقبال والميزان (Receiving & Weighbridge)
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Receiving & Weighbridge', 'الاستقبال والميزان', 'استلام المواد الخام (المخلفات) والتحقق من الكميات والجودة المبدئية', 'Scale', 'amber', 2) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Receiving Supervisor', 'مشرف الاستقبال', 'الإشراف على عمليات الاستلام والفحص المبدئي', 1, 1),
      (p_org_id, dept_id, 'Weighbridge Operator', 'مشغل البسكول', 'وزن الشاحنات وتسجيل البيانات في النظام', 0, 2),
      (p_org_id, dept_id, 'Load Inspector', 'مفتش الأحمال', 'فحص جودة المواد الواردة وتصنيفها مبدئياً', 0, 3),
      (p_org_id, dept_id, 'Yard Coordinator', 'منسق الساحة', 'تنظيم حركة الشاحنات داخل الساحة', 0, 4);

    -- 3. الفرز والتصنيف (Sorting & Classification)
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Sorting & Classification', 'الفرز والتصنيف', 'فصل المواد حسب النوع واللون والجودة قبل دخول خط الإنتاج', 'Package', 'blue', 3) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Sorting Line Supervisor', 'مشرف خط الفرز', 'إدارة فريق الفرز وضبط الجودة على الخط', 1, 1),
      (p_org_id, dept_id, 'Senior Sorter', 'فارز أول', 'فرز المواد عالية القيمة والتمييز بين الأنواع', 0, 2),
      (p_org_id, dept_id, 'Sorting Worker', 'عامل فرز', 'فصل المواد يدوياً على خط الفرز', 0, 3),
      (p_org_id, dept_id, 'Baler Operator', 'مشغل المكبس', 'تشغيل مكبس البالات وضبط الأحجام', 0, 4);

    -- 4. الإنتاج والتصنيع (Production & Manufacturing)
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Production & Manufacturing', 'الإنتاج والتصنيع', 'تحويل المواد المفروزة إلى منتجات نهائية أو مواد خام قابلة للبيع', 'Factory', 'green', 4) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Production Manager', 'مدير الإنتاج', 'تخطيط وإدارة خطوط الإنتاج وتحقيق المستهدفات', 2, 1),
      (p_org_id, dept_id, 'Shift Supervisor', 'مشرف وردية', 'إدارة العمالة والماكينات خلال الوردية', 1, 2),
      (p_org_id, dept_id, 'Machine Operator', 'مشغل ماكينة', 'تشغيل ماكينات التقطيع والغسيل والتحبيب', 0, 3),
      (p_org_id, dept_id, 'Grinding Operator', 'مشغل مفرمة', 'تشغيل ماكينات الفرم والتكسير', 0, 4),
      (p_org_id, dept_id, 'Washing Line Operator', 'مشغل خط الغسيل', 'تشغيل ومراقبة خط الغسيل', 0, 5),
      (p_org_id, dept_id, 'Pelletizer Operator', 'مشغل التحبيب', 'تشغيل ماكينة التحبيب وضبط المواصفات', 0, 6);

    -- 5. مختبر الجودة (Quality Lab)
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Quality Control Lab', 'مختبر ضبط الجودة', 'فحص المواد الخام والمنتجات النهائية لضمان المطابقة للمواصفات', 'FlaskConical', 'purple', 5) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Lab Manager', 'مدير المختبر', 'الإشراف على جميع الاختبارات وإصدار شهادات الجودة', 2, 1),
      (p_org_id, dept_id, 'Quality Analyst', 'محلل جودة', 'إجراء الاختبارات الفيزيائية والكيميائية', 1, 2),
      (p_org_id, dept_id, 'Lab Technician', 'فني مختبر', 'تحضير العينات وتنفيذ الاختبارات الروتينية', 0, 3);

    -- 6. المخازن والشحن (Warehouse & Shipping)
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Warehouse & Shipping', 'المخازن والشحن', 'إدارة مخزون المواد الخام والمنتجات النهائية والشحن للعملاء', 'Package', 'orange', 6) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Warehouse Manager', 'مدير المخازن', 'إدارة المخزون والتنسيق مع الإنتاج والمبيعات', 2, 1),
      (p_org_id, dept_id, 'Finished Goods Keeper', 'أمين مخزن المنتجات', 'تسجيل المنتجات الجاهزة وتجهيز الطلبات', 0, 2),
      (p_org_id, dept_id, 'Raw Material Keeper', 'أمين مخزن المواد الخام', 'تسجيل المواد الواردة وتنظيم التخزين', 0, 3),
      (p_org_id, dept_id, 'Shipping Coordinator', 'منسق الشحن', 'تنسيق عمليات الشحن والتسليم', 0, 4),
      (p_org_id, dept_id, 'Forklift Operator', 'مشغل رافعة', 'نقل المواد والمنتجات داخل المصنع', 0, 5);

    -- 7. المشتريات والمبيعات
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Procurement & Sales', 'المشتريات والمبيعات', 'شراء المواد الخام (المخلفات) وبيع المنتجات المُعاد تدويرها', 'TrendingUp', 'cyan', 7) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Commercial Manager', 'المدير التجاري', 'إدارة عمليات الشراء والبيع وتحقيق الهوامش الربحية', 2, 1),
      (p_org_id, dept_id, 'Procurement Officer', 'مسؤول المشتريات', 'التفاوض مع الموردين وتأمين المواد الخام', 1, 2),
      (p_org_id, dept_id, 'Sales Representative', 'مندوب مبيعات', 'بيع المنتجات المُعاد تدويرها للمصانع', 0, 3),
      (p_org_id, dept_id, 'Pricing & Market Analyst', 'محلل أسعار وأسواق', 'متابعة أسعار المخلفات والمنتجات في السوق', 0, 4);

    -- 8. الصيانة والهندسة
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Maintenance & Engineering', 'الصيانة والهندسة', 'صيانة الماكينات وخطوط الإنتاج وضمان استمرارية التشغيل', 'Cog', 'amber', 8) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Maintenance Manager', 'مدير الصيانة', 'إدارة برامج الصيانة الوقائية والتصحيحية', 2, 1),
      (p_org_id, dept_id, 'Mechanical Engineer', 'مهندس ميكانيكا', 'صيانة وإصلاح المعدات الميكانيكية', 1, 2),
      (p_org_id, dept_id, 'Electrical Technician', 'فني كهرباء', 'صيانة الأنظمة الكهربائية والتحكم', 0, 3),
      (p_org_id, dept_id, 'Spare Parts Officer', 'مسؤول قطع الغيار', 'إدارة مخزون قطع الغيار', 0, 4);

    -- 9. إدارة النقل الداخلي (إن وجد أسطول)
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Internal Transport', 'النقل الداخلي', 'إدارة أسطول المصنع لجلب المواد الخام من الموردين', 'Truck', 'blue', 9) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Transport Coordinator', 'منسق النقل', 'تنسيق رحلات جلب المواد الخام', 1, 1),
      (p_org_id, dept_id, 'Driver', 'سائق', 'قيادة شاحنات المصنع', 0, 2);

    -- 10. الامتثال والسلامة والبيئة
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'HSE & Compliance', 'السلامة والبيئة والامتثال', 'ضمان سلامة العمال والامتثال للقوانين البيئية', 'Shield', 'red', 10) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'HSE Manager', 'مدير السلامة والبيئة', 'الإشراف على برامج السلامة والامتثال البيئي', 2, 1),
      (p_org_id, dept_id, 'Safety Officer', 'مسؤول السلامة', 'تأمين العمال خاصة حول الماكينات الثقيلة', 1, 2),
      (p_org_id, dept_id, 'Environmental Officer', 'مسؤول البيئة', 'مراقبة الانبعاثات والمخلفات الصناعية', 0, 3),
      (p_org_id, dept_id, 'Licensing Officer', 'مسؤول التراخيص', 'متابعة تراخيص التدوير والتصاريح البيئية', 0, 4);

    -- 11. المالية والمحاسبة
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Finance & Accounting', 'المالية والمحاسبة', 'محاسبة التكاليف والإيرادات وإعداد القوائم المالية', 'Calculator', 'emerald', 11) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Finance Manager', 'مدير الشؤون المالية', 'الإشراف على الحسابات والتقارير المالية', 2, 1),
      (p_org_id, dept_id, 'Cost Accountant', 'محاسب تكاليف', 'حساب تكلفة الإنتاج والمواد الخام (COGS)', 1, 2),
      (p_org_id, dept_id, 'Revenue Accountant', 'محاسب إيرادات', 'متابعة إيرادات المبيعات والتحصيل', 0, 3),
      (p_org_id, dept_id, 'Payroll Officer', 'مسؤول الرواتب', 'إعداد كشوف الرواتب والمستحقات', 0, 4);

    -- 12. تقنية المعلومات والأنظمة
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'IT & Systems', 'تقنية المعلومات والأنظمة', 'إدارة النظام الرقمي ومتابعة تقارير الإنتاج والمخزون', 'Monitor', 'indigo', 12) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'IT Manager', 'مدير تقنية المعلومات', 'إدارة البنية التحتية والنظام الرقمي', 2, 1),
      (p_org_id, dept_id, 'ERP System Admin', 'مدير نظام الـ ERP', 'إدارة وتشغيل نظام تخطيط الموارد', 1, 2),
      (p_org_id, dept_id, 'Data Entry & Reporting', 'مدخل بيانات وتقارير', 'إدخال بيانات الإنتاج وتوليد التقارير', 0, 3);

    -- 13. الموارد البشرية
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Human Resources', 'الموارد البشرية', 'إدارة التوظيف والتدريب وشؤون الموظفين', 'Users', 'violet', 13) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'HR Manager', 'مدير الموارد البشرية', 'إدارة سياسات التوظيف والتطوير المهني', 2, 1),
      (p_org_id, dept_id, 'Training Coordinator', 'منسق التدريب', 'تدريب العمال على تشغيل الماكينات والسلامة', 0, 2),
      (p_org_id, dept_id, 'Personnel Affairs Officer', 'مسؤول شؤون الموظفين', 'إدارة الحضور والإجازات والملفات', 0, 3);

  ELSIF p_org_type = 'disposal' THEN
    -- ═══════════════════════════════════════════════════════════════
    -- الهيكل التنظيمي الشامل لشركات التخلص الآمن من المخلفات
    -- Safe Disposal Company Structure (Landfill / Incineration / Chemical Treatment)
    -- 4 قطاعات رئيسية + أقسام داعمة
    -- ═══════════════════════════════════════════════════════════════

    -- 1. الإدارة العليا (Senior Management)
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Senior Management', 'الإدارة العليا', 'وضع الاستراتيجية والإشراف على كافة قطاعات المرفق', 'Crown', 'purple', 1) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Facility Director', 'مدير مرفق التخلص', 'المسؤول الأول عن إدارة المرفق بالكامل وتحقيق الأهداف البيئية', 4, 1),
      (p_org_id, dept_id, 'Technical Director', 'المدير الفني', 'الإشراف الفني على العمليات الهندسية والبيئية', 3, 2),
      (p_org_id, dept_id, 'Deputy Director', 'نائب المدير', 'إدارة العمليات اليومية والتنسيق بين القطاعات', 3, 3),
      (p_org_id, dept_id, 'Executive Assistant', 'مساعد تنفيذي', 'تنسيق أجندة الإدارة العليا والتقارير', 1, 4);

    -- 2. قطاع الإدارة الهندسية والعمليات (Landfill & Facility Management)
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Engineering & Facility Operations', 'الإدارة الهندسية والعمليات', 'إدارة موقع التخلص (المدفن أو المحرقة) وتشغيل المعدات الثقيلة وأنظمة الاستقبال', 'Cog', 'blue', 2) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Site Manager', 'مدير الموقع', 'المسؤول الأول عن إدارة المرفق ميدانياً وتنسيق كافة العمليات', 3, 1),
      (p_org_id, dept_id, 'Landfill Engineer', 'مهندس مدافن', 'تصميم خلايا الدفن وتبطين الأرض وإدارة أنظمة صرف العصارة (Leachate)', 2, 2),
      (p_org_id, dept_id, 'Incinerator Engineer', 'مهندس محارق', 'تشغيل وصيانة المحارق وضبط درجات الحرارة والانبعاثات', 2, 3),
      (p_org_id, dept_id, 'Weighbridge Operator', 'مشغل ميزان البسكول', 'استلام الشاحنات ووزنها والتحقق من كود الشحنة (QR Code) - حلقة الوصل مع النظام', 0, 4),
      (p_org_id, dept_id, 'Heavy Equipment Operator', 'مشغل معدات ثقيلة', 'قيادة البلدوزرات والهرسات (Compactors) لفرد المخلفات ودفنها', 0, 5),
      (p_org_id, dept_id, 'Crane Operator', 'مشغل رافعة', 'تشغيل الرافعات لنقل المخلفات والحاويات', 0, 6),
      (p_org_id, dept_id, 'Cell Supervisor', 'مشرف الخلايا', 'إدارة تشغيل خلايا الدفن وتحديد رقم الخلية لكل شحنة للتتبع المستقبلي', 1, 7),
      (p_org_id, dept_id, 'Reception Inspector', 'مفتش الاستقبال', 'فحص الأحمال الواردة والتحقق من مطابقتها للمواصفات المسموح بدفنها', 0, 8);

    -- 3. قطاع الرقابة البيئية والمختبر (Environmental Monitoring & Lab)
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Environmental Monitoring & Lab', 'الرقابة البيئية والمختبر', 'ضمان الأمان البيئي ومنع التسريب ومراقبة جودة التربة والمياه الجوفية', 'FlaskConical', 'green', 3) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Environmental Compliance Manager', 'مدير البيئة والامتثال', 'التأكد من تشغيل المرفق حسب قانون البيئة 4/1994 و202/2020', 2, 1),
      (p_org_id, dept_id, 'Chemist / Treatment Specialist', 'كيميائي / أخصائي معالجة', 'تحديد طريقة التخلص (حرق، تعادل كيميائي، تثبيت) للمخلفات الخطرة', 1, 2),
      (p_org_id, dept_id, 'Field Monitoring Technician', 'فني رصد بيئي ميداني', 'أخذ عينات من التربة والمياه الجوفية حول المدفن للكشف عن أي تلوث', 0, 3),
      (p_org_id, dept_id, 'Air Quality Monitor', 'مراقب جودة الهواء', 'مراقبة الانبعاثات الغازية وغاز الميثان', 0, 4),
      (p_org_id, dept_id, 'Water Quality Monitor', 'مراقب جودة المياه', 'مراقبة المياه الجوفية والرشاحة (Leachate)', 0, 5),
      (p_org_id, dept_id, 'Soil & Leachate Analyst', 'محلل التربة والعصارة', 'تحليل عينات التربة والعصارة في المختبر', 0, 6),
      (p_org_id, dept_id, 'Lab Technician', 'فني مختبر', 'تحضير العينات وإجراء الاختبارات الروتينية', 0, 7);

    -- 4. قطاع السلامة والصحة المهنية (HSE)
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Health, Safety & Environment (HSE)', 'السلامة والصحة المهنية', 'حماية العمال من الغازات (الميثان) والمواد السامة وإدارة أنظمة الطوارئ والحريق', 'Shield', 'red', 4) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'HSE Manager', 'مدير السلامة والصحة المهنية', 'وضع وتنفيذ سياسات السلامة ومنع الحوادث', 2, 1),
      (p_org_id, dept_id, 'Safety Officer', 'ضابط سلامة', 'مراقبة العمال والتأكد من ارتداء الملابس الوقائية وأنظمة الحريق', 1, 2),
      (p_org_id, dept_id, 'Gas Detection Technician', 'فني كشف الغازات', 'مراقبة مستويات الميثان والغازات السامة في الموقع', 0, 3),
      (p_org_id, dept_id, 'Emergency Response Lead', 'قائد فريق الطوارئ', 'قيادة فريق الاستجابة للحوادث والانسكابات', 1, 4),
      (p_org_id, dept_id, 'First Aid Attendant', 'مسعف أول', 'تقديم الإسعافات الأولية في الموقع', 0, 5),
      (p_org_id, dept_id, 'PPE & Equipment Inspector', 'مفتش المعدات الوقائية', 'فحص صلاحية معدات الحماية الشخصية', 0, 6);

    -- 5. قطاع التتبع والبيانات (Data & Tracking Unit)
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Data & Tracking Unit', 'وحدة التتبع والبيانات', 'ربط المدفن بالنظام الرقمي وضمان إغلاق كل رحلة رقمياً ومطابقتها ببيانات المولد', 'Activity', 'cyan', 5) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Tracking Coordinator', 'مسؤول إدخال بيانات وتتبع', 'التأكد من إغلاق كل طن رقمياً في النظام ومطابقته ببيانات المولد', 1, 1),
      (p_org_id, dept_id, 'System Operator', 'مشغل النظام', 'تشغيل النظام الرقمي وإصدار شهادات التخلص الآمن', 0, 2),
      (p_org_id, dept_id, 'Data Entry Clerk', 'مدخل بيانات', 'إدخال بيانات الشحنات والأوزان والتقارير', 0, 3),
      (p_org_id, dept_id, 'Document Controller', 'مسؤول مراقبة الوثائق', 'أرشفة المانيفست والشهادات وإدارة السجلات البيئية', 0, 4);

    -- 6. الصيانة والبنية التحتية
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Maintenance & Infrastructure', 'الصيانة والبنية التحتية', 'صيانة المعدات الثقيلة والمحارق وأنظمة صرف العصارة والبنية التحتية', 'Cog', 'amber', 6) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Maintenance Supervisor', 'مشرف الصيانة', 'إدارة برامج الصيانة الوقائية والتصحيحية للمعدات', 1, 1),
      (p_org_id, dept_id, 'Mechanical Technician', 'فني ميكانيكا', 'صيانة المعدات الثقيلة والبلدوزرات', 0, 2),
      (p_org_id, dept_id, 'Electrical Technician', 'فني كهرباء', 'صيانة الأنظمة الكهربائية وأنظمة التحكم', 0, 3),
      (p_org_id, dept_id, 'Leachate System Technician', 'فني أنظمة العصارة', 'صيانة مضخات وأنابيب صرف العصارة', 0, 4),
      (p_org_id, dept_id, 'Civil Works Supervisor', 'مشرف الأعمال المدنية', 'الإشراف على تبطين الخلايا وأعمال التغطية', 0, 5);

    -- 7. المالية والمحاسبة
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Finance & Accounting', 'المالية والمحاسبة', 'إدارة الإيرادات والفوترة والتحصيل من المولدين والناقلين', 'Calculator', 'emerald', 7) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Finance Manager', 'مدير الشؤون المالية', 'الإشراف على الحسابات والتقارير المالية', 2, 1),
      (p_org_id, dept_id, 'Chief Accountant', 'المحاسب الرئيسي', 'إعداد القوائم المالية ودفتر الأستاذ', 1, 2),
      (p_org_id, dept_id, 'Billing Specialist', 'أخصائي الفوترة', 'إصدار فواتير خدمات التخلص', 0, 3),
      (p_org_id, dept_id, 'Collection Officer', 'مسؤول التحصيل', 'متابعة المستحقات المالية', 0, 4);

    -- 8. الشؤون القانونية والتراخيص
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Legal & Licensing', 'الشؤون القانونية والتراخيص', 'متابعة التراخيص البيئية (WMRA, EEAA) والتعامل مع الجهات الرقابية', 'FileCheck', 'purple', 8) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Legal & Compliance Manager', 'مدير الشؤون القانونية والامتثال', 'ضمان الامتثال القانوني والتعامل مع الجهات الرقابية', 2, 1),
      (p_org_id, dept_id, 'Licensing Officer', 'مسؤول التراخيص', 'متابعة تجديد تراخيص WMRA وEEAA', 0, 2),
      (p_org_id, dept_id, 'ISO & Quality Auditor', 'مدقق الجودة والأيزو', 'إعداد تقارير الامتثال وشهادات الأيزو', 0, 3);

    -- 9. تقنية المعلومات
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'IT & Systems', 'تقنية المعلومات والأنظمة', 'إدارة البنية التحتية الرقمية وأجهزة القياس والاستشعار', 'Monitor', 'blue', 9) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'IT Manager', 'مدير تقنية المعلومات', 'إدارة البنية التحتية والأنظمة الرقمية', 2, 1),
      (p_org_id, dept_id, 'SCADA & Sensors Admin', 'مدير أنظمة SCADA والاستشعار', 'إدارة أنظمة المراقبة والتحكم الآلي', 1, 2),
      (p_org_id, dept_id, 'Technical Support', 'دعم فني', 'دعم المستخدمين وصيانة الأجهزة', 0, 3);

    -- 10. الموارد البشرية
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Human Resources', 'الموارد البشرية', 'إدارة التوظيف والتدريب وشؤون الموظفين', 'Users', 'violet', 10) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'HR Manager', 'مدير الموارد البشرية', 'إدارة سياسات التوظيف والتطوير المهني', 2, 1),
      (p_org_id, dept_id, 'Training Coordinator', 'منسق التدريب', 'تدريب العمال على إجراءات السلامة والتعامل مع المخلفات الخطرة', 0, 2),
      (p_org_id, dept_id, 'Personnel Affairs Officer', 'مسؤول شؤون الموظفين', 'إدارة الحضور والإجازات والملفات', 0, 3);

  END IF;
END;
$$;
