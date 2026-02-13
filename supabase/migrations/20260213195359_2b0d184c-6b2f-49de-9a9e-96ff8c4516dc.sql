
-- Update seed_org_structure with advanced recycler structure based on Gemini's model
-- 5 قطاعات تخصصية: الإنتاج، الجودة والمختبر، المشتريات والمبيعات، الصيانة + أقسام داعمة

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
    -- مصنع متكامل: مدخلات (نفايات) → مخرجات (منتجات / مواد خام)
    -- التركيز على التصنيع والقيمة المضافة
    -- ═══════════════════════════════════════════════════════════════

    -- 1. الإدارة العليا (Executive Management)
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Executive Management', 'الإدارة العليا', 'وضع الاستراتيجية الكبرى وإدارة الربحية الكلية للمصنع', 'Crown', 'purple', 1) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'General Manager', 'المدير العام', 'المسؤول عن الربحية الكلية للمصنع وتوجيه القطاعات', 4, 1),
      (p_org_id, dept_id, 'COO / Operations Director', 'المدير العملياتي', 'الإشراف على جميع العمليات التشغيلية والإنتاجية', 3, 2),
      (p_org_id, dept_id, 'Sustainability Director', 'مدير الاستدامة', 'علاقة الشركة بالمنظمات البيئية وتحقيق أهداف صفر نفايات', 3, 3),
      (p_org_id, dept_id, 'Executive Assistant', 'مساعد تنفيذي', 'تنسيق أجندة الإدارة العليا والاتصالات', 1, 4);

    -- ═══════════════════════════════════════════════════════════════
    -- قطاع 1: الإنتاج والتشغيل — "قلب" المصنع
    -- تحويل الخشب أو البلاستيك لمادة جديدة
    -- ═══════════════════════════════════════════════════════════════

    -- 2. الإنتاج والتشغيل (Production & Operations)
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Production & Operations', 'الإنتاج والتشغيل', 'خطوط الإنتاج والعمالة — تحويل المخلفات إلى منتجات ومواد خام', 'Factory', 'green', 2) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Plant Manager', 'مدير المصنع', 'المسؤول عن خطوط الإنتاج والعمالة وتحقيق المستهدفات', 3, 1),
      (p_org_id, dept_id, 'Production Engineer', 'مهندس إنتاج', 'الإشراف على كفاءة الماكينات (مفارم، مكابس، خطوط غسل)', 2, 2),
      (p_org_id, dept_id, 'Shift Supervisor', 'مشرف وردية', 'مسؤول عن طقم العمال في كل وردية وضمان استمرارية الإنتاج', 1, 3),
      (p_org_id, dept_id, 'Machine Operator - Shredder', 'مشغل ماكينة فرم', 'تشغيل ماكينات الفرم والطحن', 0, 4),
      (p_org_id, dept_id, 'Machine Operator - Press', 'مشغل ماكينة كبس', 'تشغيل مكابس الضغط والتشكيل', 0, 5),
      (p_org_id, dept_id, 'Machine Operator - Washing Line', 'مشغل خط الغسل', 'تشغيل خطوط الغسل والتنظيف', 0, 6),
      (p_org_id, dept_id, 'Production Worker', 'عامل إنتاج', 'تنفيذ مهام الإنتاج العامة على خط التصنيع', 0, 7);

    -- 3. الفرز والتصنيف (Sorting & Classification)
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Sorting & Classification', 'الفرز والتصنيف', 'فصل وتصنيف أنواع المخلفات قبل دخول خط الإنتاج', 'Package', 'amber', 3) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Sorting Supervisor', 'مشرف الفرز', 'إدارة عمليات الفرز وضمان دقة التصنيف', 1, 1),
      (p_org_id, dept_id, 'Senior Sorter', 'فارز أول', 'فرز متقدم وتصنيف المواد حسب الجودة والنوع', 0, 2),
      (p_org_id, dept_id, 'Sorter', 'عامل فرز', 'فصل أنواع الخشب أو البلاستيك عن بعضها يدوياً', 0, 3),
      (p_org_id, dept_id, 'Contamination Inspector', 'فاحص التلوث', 'كشف الشوائب والملوثات في المواد الواردة', 0, 4);

    -- ═══════════════════════════════════════════════════════════════
    -- قطاع 2: الجودة والمختبر (Quality Control - QC)
    -- ضمان مطابقة المنتج النهائي للمواصفات
    -- ═══════════════════════════════════════════════════════════════

    -- 4. الجودة والمختبر
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Quality Control & Lab', 'الجودة والمختبر', 'ضمان مطابقة المنتج النهائي للمواصفات وإصدار شهادات التحليل', 'FlaskConical', 'blue', 4) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'QC Manager', 'مدير الجودة', 'ضمان مطابقة المنتج النهائي للمواصفات المطلوبة', 2, 1),
      (p_org_id, dept_id, 'Lab Technician', 'فني مختبر', 'تحليل عينات (نسبة الرطوبة، درجة النقاء، الكثافة)', 1, 2),
      (p_org_id, dept_id, 'Quality Inspector', 'فاحص جودة', 'فحص المنتجات على خط الإنتاج ومراقبة المعايير', 0, 3),
      (p_org_id, dept_id, 'Certificate Issuer', 'مسؤول إصدار الشهادات', 'إصدار شهادات التحليل (Certificate of Analysis) للمشتريين', 0, 4);

    -- ═══════════════════════════════════════════════════════════════
    -- قطاع 3: المشتريات والمبيعات (Trading & Sourcing)
    -- المشتريات = مخلفات، المبيعات = خامات معاد تدويرها
    -- ═══════════════════════════════════════════════════════════════

    -- 5. المشتريات والتوريد (Sourcing & Procurement)
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Sourcing & Procurement', 'المشتريات والتوريد', 'التعاقد مع المولدين لتوريد المخلفات كمدخلات إنتاج', 'Truck', 'orange', 5) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Sourcing Manager', 'مدير المشتريات والتوريد', 'التعاقد مع المولدين (المصانع) لتوريد مخلفاتهم', 2, 1),
      (p_org_id, dept_id, 'Supplier Relations Officer', 'مسؤول علاقات الموردين', 'بناء وإدارة علاقات مع مصادر المخلفات', 1, 2),
      (p_org_id, dept_id, 'Procurement Officer', 'مسؤول المشتريات', 'متابعة طلبات التوريد وإدارة العقود', 0, 3),
      (p_org_id, dept_id, 'Market Analyst / Price Analyst', 'محلل أسعار السوق', 'مراقبة أسعار المخلفات والخامات وتوقيت الشراء والبيع', 0, 4);

    -- 6. المبيعات والتسويق (Commodity Sales)
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Commodity Sales & Marketing', 'مبيعات السلع والتسويق', 'بيع الخامات المعاد تدويرها والبحث عن مشترين', 'TrendingUp', 'emerald', 6) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Commodity Sales Manager', 'مدير مبيعات السلع', 'البحث عن مصانع محتاجة خشب مفروم أو طبالي معاد تدويرها', 2, 1),
      (p_org_id, dept_id, 'Sales Representative', 'مندوب مبيعات', 'التواصل مع العملاء وإتمام الصفقات', 0, 2),
      (p_org_id, dept_id, 'Export & Logistics Coordinator', 'منسق التصدير واللوجستيات', 'تنسيق عمليات الشحن والتصدير للعملاء', 0, 3),
      (p_org_id, dept_id, 'Customer Account Manager', 'مدير حسابات العملاء', 'إدارة العلاقة مع المشترين الرئيسيين', 1, 4);

    -- ═══════════════════════════════════════════════════════════════
    -- قطاع 4: الاستقبال والوزن والمخازن
    -- ═══════════════════════════════════════════════════════════════

    -- 7. الاستقبال والوزن
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Receiving & Weighing', 'الاستقبال والوزن', 'استلام المخلفات الواردة وتوثيق الأوزان', 'Scale', 'amber', 7) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Receiving Manager', 'مدير الاستقبال', 'إدارة عمليات الاستقبال والتحقق من الشحنات', 2, 1),
      (p_org_id, dept_id, 'Weighbridge Operator', 'مشغل البسكول', 'تشغيل الميزان وتسجيل الأوزان الدقيقة', 0, 2),
      (p_org_id, dept_id, 'Material Inspector', 'فاحص المواد الواردة', 'فحص جودة ونوعية المخلفات عند الاستلام', 0, 3),
      (p_org_id, dept_id, 'Yard & Gate Coordinator', 'منسق الساحة والبوابة', 'تنظيم دخول وخروج الشاحنات', 0, 4);

    -- 8. المخازن والمخزون
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Warehouse & Inventory', 'المخازن والمخزون', 'إدارة مخزون المواد الخام والمنتجات النهائية', 'Package', 'blue', 8) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Warehouse Manager', 'مدير المخازن', 'إدارة المخازن وضمان دقة المخزون', 2, 1),
      (p_org_id, dept_id, 'Raw Materials Storekeeper', 'أمين مخزن المواد الخام', 'إدارة مخزون المخلفات الواردة قبل التصنيع', 0, 2),
      (p_org_id, dept_id, 'Finished Goods Storekeeper', 'أمين مخزن المنتجات النهائية', 'إدارة مخزون المنتجات الجاهزة للبيع', 0, 3),
      (p_org_id, dept_id, 'Forklift Operator', 'مشغل رافعة شوكية', 'نقل المواد داخل المصنع والمخازن', 0, 4);

    -- ═══════════════════════════════════════════════════════════════
    -- قطاع 5: الصيانة — إهلاك عالي على الماكينات
    -- ═══════════════════════════════════════════════════════════════

    -- 9. الصيانة
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Maintenance', 'الصيانة', 'صيانة ماكينات التدوير (المفارم والمكابس) لمنع توقف خط الإنتاج', 'Cog', 'cyan', 9) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Maintenance Manager', 'مدير الصيانة', 'تخطيط وإدارة الصيانة الوقائية والتصحيحية', 2, 1),
      (p_org_id, dept_id, 'Electrical Technician', 'فني كهرباء', 'صيانة الأنظمة الكهربائية ولوحات التحكم', 0, 2),
      (p_org_id, dept_id, 'Mechanical Technician', 'فني ميكانيكا', 'إصلاح الأعطال الميكانيكية فوراً لمنع توقف الخط', 0, 3),
      (p_org_id, dept_id, 'Spare Parts Officer', 'مسؤول قطع الغيار', 'إدارة مخزون قطع الغيار وطلبات الشراء', 0, 4),
      (p_org_id, dept_id, 'Preventive Maintenance Planner', 'مخطط الصيانة الوقائية', 'جدولة أعمال الصيانة الدورية لتقليل الأعطال', 0, 5);

    -- ═══════════════════════════════════════════════════════════════
    -- الأقسام الداعمة (Support Functions)
    -- ═══════════════════════════════════════════════════════════════

    -- 10. البيئة والسلامة والامتثال
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'HSE & Compliance', 'البيئة والسلامة والامتثال', 'ضمان سلامة العاملين والامتثال البيئي والتراخيص', 'Shield', 'red', 10) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'HSE Manager', 'مدير السلامة والبيئة', 'الإشراف على معايير السلامة والامتثال البيئي', 2, 1),
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
