
-- Update seed_org_structure: Generator (FMCG Industrial) comprehensive organizational structure
-- Based on large industrial companies like Nestlé, PepsiCo, P&G

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
    -- ═══════════════════════════════════════════════════════════════
    -- الهيكل التنظيمي الشامل للشركات المولدة للمخلفات (FMCG / Industrial)
    -- مبني على نموذج الشركات الصناعية الكبرى (نستلة، بيبسي، بروكتر آند غامبل)
    -- هدف: Zero Waste to Landfill
    -- ═══════════════════════════════════════════════════════════════

    -- 1. الإدارة العليا والاستدامة (Strategic Level)
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Executive & Sustainability Leadership', 'الإدارة العليا والاستدامة', 'وضع الخطط الكبرى لتقليل الانبعاثات الكربونية وتحقيق أهداف Zero Waste to Landfill', 'Crown', 'purple', 1) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Head of Sustainability', 'رئيس قطاع الاستدامة', 'عضو مجلس الإدارة - يربط بين أرباح الشركة والحفاظ على البيئة وتقارير ESG', 4, 1),
      (p_org_id, dept_id, 'Regional Sustainability Director', 'مدير الاستدامة الإقليمي', 'وضع الخطط الكبرى لتقليل الانبعاثات والبلاستيك على مستوى الإقليم', 4, 2),
      (p_org_id, dept_id, 'Factory General Manager', 'المدير العام للمصنع', 'الإشراف العام على عمليات المصنع بالكامل', 4, 3),
      (p_org_id, dept_id, 'EHS Cluster Manager', 'مدير مجموعة مصانع EHS', 'الإشراف على سياسة البيئة والسلامة في أكثر من مصنع تابع للشركة', 3, 4),
      (p_org_id, dept_id, 'Executive Assistant', 'مساعد تنفيذي', 'تنسيق أجندة الإدارة العليا والتقارير', 1, 5);

    -- 2. إدارة البيئة والصحة والسلامة (EHS Department)
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Environment, Health & Safety (EHS)', 'البيئة والصحة والسلامة', 'المسؤول الأول أمام الدولة عن امتثال المصنع للقوانين البيئية - قلب المنظومة البيئية', 'Shield', 'green', 2) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'EHS Manager', 'مدير البيئة والصحة والسلامة', 'المسؤول الأول أمام الدولة عن امتثال المصنع للقوانين البيئية', 3, 1),
      (p_org_id, dept_id, 'Environmental Engineer', 'مهندس البيئة', 'دينامو المنظومة - مراقبة كميات النفايات من خطوط الإنتاج وتحليل البيانات واقتراح حلول تقليل الهالك', 2, 2),
      (p_org_id, dept_id, 'Sustainability Coordinator', 'منسق الاستدامة', 'التواصل مع شركات النقل والتدوير ومقارنة الأسعار والخدمات', 1, 3),
      (p_org_id, dept_id, 'EHS Specialist', 'أخصائي بيئة وسلامة', 'جمع البيانات البيئية وإدخالها على النظام وإعداد التقارير الدورية', 1, 4),
      (p_org_id, dept_id, 'EHS Inspector', 'مفتش بيئي وسلامة', 'تفتيش نقاط التجميع وخطوط الإنتاج للتأكد من الامتثال', 0, 5),
      (p_org_id, dept_id, 'Safety Officer', 'مسؤول السلامة', 'تأمين العمال والتأكد من ارتداء الملابس الوقائية', 0, 6),
      (p_org_id, dept_id, 'Carbon Footprint Analyst', 'محلل البصمة الكربونية', 'حساب الانبعاثات الكربونية وإعداد تقارير ESG', 1, 7);

    -- 3. إدارة المخلفات والفرز (Waste Management & Segregation)
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Waste Management & Segregation', 'إدارة المخلفات والفرز', 'إدارة نقاط التجميع داخل المصنع وفصل المخلفات حسب النوع (خشب، بلاستيك، كرتون، غذائي)', 'Package', 'amber', 3) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Site Waste Supervisor', 'مشرف مخلفات الموقع', 'إدارة أماكن تجميع النفايات (Waste Collection Points) والتأكد من فصلها بشكل صحيح', 2, 1),
      (p_org_id, dept_id, 'Waste Segregation Lead', 'رئيس فريق الفرز', 'قيادة فريق الفرز والتأكد من جودة الفصل', 1, 2),
      (p_org_id, dept_id, 'Sorting Worker', 'عامل فرز', 'فصل المخلفات يدوياً في نقاط التجميع', 0, 3),
      (p_org_id, dept_id, 'Collection Point Attendant', 'مسؤول نقطة تجميع', 'مراقبة نقاط التجميع والتأكد من عدم الخلط', 0, 4),
      (p_org_id, dept_id, 'Hazardous Waste Handler', 'مسؤول المخلفات الخطرة', 'التعامل مع المخلفات الخطرة وتخزينها بشكل آمن', 0, 5);

    -- 4. الميزان والتوثيق (Weighbridge & Documentation)
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Weighbridge & Documentation', 'الميزان والتوثيق', 'وزن الشحنات قبل خروجها من المصنع وتوثيقها رقمياً ومسح QR Code الرحلة', 'Scale', 'blue', 4) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Weighbridge Supervisor', 'مشرف الميزان', 'الإشراف على عمليات الوزن والتحقق من دقة البيانات', 1, 1),
      (p_org_id, dept_id, 'Weighbridge Operator', 'مشغل البسكول', 'وزن الشحنات ومسح QR Code وتسليمها للسائق', 0, 2),
      (p_org_id, dept_id, 'Waste Storekeeper', 'أمين مخزن المخلفات', 'وزن الشحنات قبل خروجها وتسليمها للسائق مع التوثيق', 0, 3),
      (p_org_id, dept_id, 'Gate Controller', 'مراقب البوابة', 'التحقق من هوية الشاحنات والسائقين عند الدخول والخروج', 0, 4),
      (p_org_id, dept_id, 'Manifest Officer', 'مسؤول المانيفست', 'إعداد وثائق المانيفست وضمان اكتمال البيانات', 0, 5);

    -- 5. المشتريات والعقود (Procurement & Contracts)
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Procurement & Waste Contracts', 'المشتريات وعقود المخلفات', 'إدارة التعاقدات مع شركات النقل والتدوير وخطابات الترسية', 'FileText', 'orange', 5) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Procurement Manager', 'مدير المشتريات', 'إدارة التعاقدات مع موردي خدمات النقل والتدوير', 2, 1),
      (p_org_id, dept_id, 'Waste Services Contract Manager', 'مدير عقود خدمات المخلفات', 'التفاوض وإدارة عقود النقل والتدوير والتخلص', 1, 2),
      (p_org_id, dept_id, 'Vendor Evaluation Officer', 'مسؤول تقييم الموردين', 'تقييم أداء شركات النقل والتدوير دورياً', 0, 3),
      (p_org_id, dept_id, 'Award Letter Specialist', 'أخصائي خطابات الترسية', 'إعداد ومتابعة خطابات الترسية والأسعار', 0, 4);

    -- 6. الإنتاج والجودة (Production & Quality)
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Production & Quality', 'الإنتاج والجودة', 'خطوط الإنتاج ومراقبة الجودة - مصدر توليد المخلفات الرئيسي', 'Factory', 'indigo', 6) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Production Manager', 'مدير الإنتاج', 'إدارة خطوط الإنتاج وتقليل الهالك (Waste Reduction)', 3, 1),
      (p_org_id, dept_id, 'Quality Manager', 'مدير الجودة', 'ضمان جودة المنتجات ومراقبة معدلات الهالك', 2, 2),
      (p_org_id, dept_id, 'Production Line Supervisor', 'مشرف خط إنتاج', 'الإشراف على خط الإنتاج وتسجيل كميات المخلفات الناتجة', 1, 3),
      (p_org_id, dept_id, 'Waste Reduction Engineer', 'مهندس تقليل الهالك', 'تحليل مصادر الهالك واقتراح حلول لتقليله', 1, 4),
      (p_org_id, dept_id, 'Quality Inspector', 'مفتش جودة', 'فحص المنتجات وتحديد المرفوض والهالك', 0, 5);

    -- 7. المختبر والتحليل (Laboratory)
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Laboratory & Analysis', 'المختبر والتحليل', 'تحليل المخلفات وتصنيفها (خطرة/غير خطرة) وفحص جودة المواد المعاد تدويرها', 'FlaskConical', 'purple', 7) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Lab Manager', 'مدير المختبر', 'الإشراف على تحليل المخلفات وإصدار شهادات التصنيف', 2, 1),
      (p_org_id, dept_id, 'Waste Analyst', 'محلل مخلفات', 'تحليل تركيب المخلفات وتحديد خطورتها', 1, 2),
      (p_org_id, dept_id, 'Lab Technician', 'فني مختبر', 'تحضير العينات وإجراء الاختبارات', 0, 3);

    -- 8. التقارير والبيانات (Reporting & Data Analytics)
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Reporting & Data Analytics', 'التقارير وتحليل البيانات', 'إعداد تقارير الاستدامة وداشبورد الأداء البيئي ومؤشرات KPI', 'BarChart3', 'cyan', 8) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Sustainability Reporting Manager', 'مدير تقارير الاستدامة', 'إعداد التقارير الدورية لمجلس الإدارة والجهات الرقابية', 2, 1),
      (p_org_id, dept_id, 'Data Analyst', 'محلل بيانات', 'تحليل بيانات المخلفات ومعدلات التدوير وتتبع KPIs', 1, 2),
      (p_org_id, dept_id, 'ESG Reporting Specialist', 'أخصائي تقارير ESG', 'إعداد تقارير البيئة والمسؤولية الاجتماعية للمساهمين', 1, 3),
      (p_org_id, dept_id, 'System Operator', 'مشغل النظام', 'إدخال البيانات على النظام وإصدار التقارير الآلية', 0, 4);

    -- 9. المالية والمحاسبة
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Finance & Accounting', 'المالية والمحاسبة', 'إدارة تكاليف التخلص من المخلفات وإيرادات بيع المواد القابلة للتدوير', 'Calculator', 'emerald', 9) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Finance Manager', 'مدير الشؤون المالية', 'الإشراف على ميزانية البيئة وتكاليف التخلص', 2, 1),
      (p_org_id, dept_id, 'Cost Accountant', 'محاسب تكاليف', 'حساب تكاليف التخلص والنقل مقابل إيرادات المواد المُعاد تدويرها', 1, 2),
      (p_org_id, dept_id, 'Billing Specialist', 'أخصائي الفوترة', 'إصدار ومراجعة فواتير شركات النقل والتدوير', 0, 3),
      (p_org_id, dept_id, 'Payroll Officer', 'مسؤول الرواتب', 'إعداد كشوف الرواتب', 0, 4);

    -- 10. الصيانة والمرافق
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Facilities & Maintenance', 'المرافق والصيانة', 'صيانة معدات الفرز والميزان والحاويات وإدارة مرافق المصنع', 'Cog', 'amber', 10) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Facilities Manager', 'مدير المرافق', 'إدارة صيانة المرافق والمعدات', 2, 1),
      (p_org_id, dept_id, 'Maintenance Technician', 'فني صيانة', 'صيانة معدات الفرز والميزان والحاويات', 0, 2),
      (p_org_id, dept_id, 'Compactor & Container Technician', 'فني حاويات وضواغط', 'صيانة الحاويات وماكينات الضغط', 0, 3);

    -- 11. تقنية المعلومات
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'IT & Digital Systems', 'تقنية المعلومات والأنظمة الرقمية', 'إدارة النظام الرقمي وربط الميزان بالمنصة وتكامل البيانات', 'Monitor', 'blue', 11) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'IT Manager', 'مدير تقنية المعلومات', 'إدارة البنية التحتية والتكاملات الرقمية', 2, 1),
      (p_org_id, dept_id, 'Integration Specialist', 'أخصائي التكاملات', 'ربط الميزان وأنظمة ERP بمنصة إدارة المخلفات', 1, 2),
      (p_org_id, dept_id, 'Technical Support', 'دعم فني', 'دعم المستخدمين وحل المشكلات التقنية', 0, 3);

    -- 12. الموارد البشرية
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Human Resources', 'الموارد البشرية', 'إدارة التوظيف والتدريب وشؤون الموظفين', 'Users', 'violet', 12) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'HR Manager', 'مدير الموارد البشرية', 'إدارة سياسات التوظيف والتطوير المهني', 2, 1),
      (p_org_id, dept_id, 'Training Coordinator', 'منسق التدريب', 'تدريب العمال على إجراءات فصل المخلفات والسلامة', 0, 2),
      (p_org_id, dept_id, 'Personnel Affairs Officer', 'مسؤول شؤون الموظفين', 'إدارة الحضور والإجازات', 0, 3);

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

    -- 2. الاستقبال والميزان
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Receiving & Weighbridge', 'الاستقبال والميزان', 'استلام المواد الخام (المخلفات) والتحقق من الكميات والجودة المبدئية', 'Scale', 'amber', 2) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Receiving Supervisor', 'مشرف الاستقبال', 'الإشراف على عمليات الاستلام والفحص المبدئي', 1, 1),
      (p_org_id, dept_id, 'Weighbridge Operator', 'مشغل البسكول', 'وزن الشاحنات وتسجيل البيانات في النظام', 0, 2),
      (p_org_id, dept_id, 'Load Inspector', 'مفتش الأحمال', 'فحص جودة المواد الواردة وتصنيفها مبدئياً', 0, 3),
      (p_org_id, dept_id, 'Yard Coordinator', 'منسق الساحة', 'تنظيم حركة الشاحنات داخل الساحة', 0, 4);

    -- 3. الفرز والتصنيف
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Sorting & Classification', 'الفرز والتصنيف', 'فصل المواد حسب النوع واللون والجودة قبل دخول خط الإنتاج', 'Package', 'blue', 3) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Sorting Line Supervisor', 'مشرف خط الفرز', 'إدارة فريق الفرز وضبط الجودة على الخط', 1, 1),
      (p_org_id, dept_id, 'Senior Sorter', 'فارز أول', 'فرز المواد عالية القيمة والتمييز بين الأنواع', 0, 2),
      (p_org_id, dept_id, 'Sorting Worker', 'عامل فرز', 'فصل المواد يدوياً على خط الفرز', 0, 3),
      (p_org_id, dept_id, 'Baler Operator', 'مشغل المكبس', 'تشغيل مكبس البالات وضبط الأحجام', 0, 4);

    -- 4. الإنتاج والتصنيع
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Production & Manufacturing', 'الإنتاج والتصنيع', 'تحويل المواد المفروزة إلى منتجات نهائية أو مواد خام قابلة للبيع', 'Factory', 'green', 4) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Production Manager', 'مدير الإنتاج', 'تخطيط وإدارة خطوط الإنتاج وتحقيق المستهدفات', 2, 1),
      (p_org_id, dept_id, 'Shift Supervisor', 'مشرف وردية', 'إدارة العمالة والماكينات خلال الوردية', 1, 2),
      (p_org_id, dept_id, 'Machine Operator', 'مشغل ماكينة', 'تشغيل ماكينات التقطيع والغسيل والتحبيب', 0, 3),
      (p_org_id, dept_id, 'Grinding Operator', 'مشغل مفرمة', 'تشغيل ماكينات الفرم والتكسير', 0, 4),
      (p_org_id, dept_id, 'Washing Line Operator', 'مشغل خط الغسيل', 'تشغيل ومراقبة خط الغسيل', 0, 5),
      (p_org_id, dept_id, 'Pelletizer Operator', 'مشغل التحبيب', 'تشغيل ماكينة التحبيب وضبط المواصفات', 0, 6);

    -- 5. مختبر الجودة
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Quality Control Lab', 'مختبر ضبط الجودة', 'فحص المواد الخام والمنتجات النهائية لضمان المطابقة للمواصفات', 'FlaskConical', 'purple', 5) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Lab Manager', 'مدير المختبر', 'الإشراف على جميع الاختبارات وإصدار شهادات الجودة', 2, 1),
      (p_org_id, dept_id, 'Quality Analyst', 'محلل جودة', 'إجراء الاختبارات الفيزيائية والكيميائية', 1, 2),
      (p_org_id, dept_id, 'Lab Technician', 'فني مختبر', 'تحضير العينات وتنفيذ الاختبارات الروتينية', 0, 3);

    -- 6. المخازن والشحن
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

    -- 9. النقل الداخلي
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Internal Transport', 'النقل الداخلي', 'إدارة أسطول المصنع لجلب المواد الخام من الموردين', 'Truck', 'blue', 9) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Transport Coordinator', 'منسق النقل', 'تنسيق رحلات جلب المواد الخام', 1, 1),
      (p_org_id, dept_id, 'Driver', 'سائق', 'قيادة شاحنات المصنع', 0, 2);

    -- 10. السلامة والبيئة
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'HSE & Compliance', 'السلامة والبيئة والامتثال', 'ضمان سلامة العمال والامتثال للقوانين البيئية', 'Shield', 'red', 10) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'HSE Manager', 'مدير السلامة والبيئة', 'الإشراف على برامج السلامة والامتثال البيئي', 2, 1),
      (p_org_id, dept_id, 'Safety Officer', 'مسؤول السلامة', 'تأمين العمال خاصة حول الماكينات الثقيلة', 1, 2),
      (p_org_id, dept_id, 'Environmental Officer', 'مسؤول البيئة', 'مراقبة الانبعاثات والمخلفات الصناعية', 0, 3),
      (p_org_id, dept_id, 'Licensing Officer', 'مسؤول التراخيص', 'متابعة تراخيص التدوير والتصاريح البيئية', 0, 4);

    -- 11. المالية
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Finance & Accounting', 'المالية والمحاسبة', 'محاسبة التكاليف والإيرادات وإعداد القوائم المالية', 'Calculator', 'emerald', 11) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Finance Manager', 'مدير الشؤون المالية', 'الإشراف على الحسابات والتقارير المالية', 2, 1),
      (p_org_id, dept_id, 'Cost Accountant', 'محاسب تكاليف', 'حساب تكلفة الإنتاج والمواد الخام (COGS)', 1, 2),
      (p_org_id, dept_id, 'Revenue Accountant', 'محاسب إيرادات', 'متابعة إيرادات المبيعات والتحصيل', 0, 3),
      (p_org_id, dept_id, 'Payroll Officer', 'مسؤول الرواتب', 'إعداد كشوف الرواتب والمستحقات', 0, 4);

    -- 12. تقنية المعلومات
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
    -- ═══════════════════════════════════════════════════════════════

    -- 1. الإدارة العليا
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Senior Management', 'الإدارة العليا', 'وضع الاستراتيجية والإشراف على كافة قطاعات المرفق', 'Crown', 'purple', 1) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Facility Director', 'مدير مرفق التخلص', 'المسؤول الأول عن إدارة المرفق بالكامل وتحقيق الأهداف البيئية', 4, 1),
      (p_org_id, dept_id, 'Technical Director', 'المدير الفني', 'الإشراف الفني على العمليات الهندسية والبيئية', 3, 2),
      (p_org_id, dept_id, 'Deputy Director', 'نائب المدير', 'إدارة العمليات اليومية والتنسيق بين القطاعات', 3, 3),
      (p_org_id, dept_id, 'Executive Assistant', 'مساعد تنفيذي', 'تنسيق أجندة الإدارة العليا والتقارير', 1, 4);

    -- 2. الإدارة الهندسية والعمليات
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Engineering & Facility Operations', 'الإدارة الهندسية والعمليات', 'إدارة موقع التخلص (المدفن أو المحرقة) وتشغيل المعدات الثقيلة', 'Cog', 'blue', 2) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Site Manager', 'مدير الموقع', 'المسؤول الأول عن إدارة المرفق ميدانياً', 3, 1),
      (p_org_id, dept_id, 'Landfill Engineer', 'مهندس مدافن', 'تصميم خلايا الدفن وإدارة أنظمة صرف العصارة', 2, 2),
      (p_org_id, dept_id, 'Incinerator Engineer', 'مهندس محارق', 'تشغيل وصيانة المحارق وضبط الانبعاثات', 2, 3),
      (p_org_id, dept_id, 'Weighbridge Operator', 'مشغل ميزان البسكول', 'استلام الشاحنات ووزنها والتحقق من كود الشحنة', 0, 4),
      (p_org_id, dept_id, 'Heavy Equipment Operator', 'مشغل معدات ثقيلة', 'قيادة البلدوزرات والهرسات لفرد المخلفات ودفنها', 0, 5),
      (p_org_id, dept_id, 'Crane Operator', 'مشغل رافعة', 'تشغيل الرافعات لنقل المخلفات والحاويات', 0, 6),
      (p_org_id, dept_id, 'Cell Supervisor', 'مشرف الخلايا', 'إدارة تشغيل خلايا الدفن وتحديد رقم الخلية لكل شحنة', 1, 7),
      (p_org_id, dept_id, 'Reception Inspector', 'مفتش الاستقبال', 'فحص الأحمال والتحقق من مطابقتها للمواصفات', 0, 8);

    -- 3. الرقابة البيئية والمختبر
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Environmental Monitoring & Lab', 'الرقابة البيئية والمختبر', 'ضمان الأمان البيئي ومنع التسريب', 'FlaskConical', 'green', 3) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Environmental Compliance Manager', 'مدير البيئة والامتثال', 'التأكد من تشغيل المرفق حسب القانون', 2, 1),
      (p_org_id, dept_id, 'Chemist / Treatment Specialist', 'كيميائي / أخصائي معالجة', 'تحديد طريقة التخلص للمخلفات الخطرة', 1, 2),
      (p_org_id, dept_id, 'Field Monitoring Technician', 'فني رصد بيئي ميداني', 'أخذ عينات من التربة والمياه الجوفية', 0, 3),
      (p_org_id, dept_id, 'Air Quality Monitor', 'مراقب جودة الهواء', 'مراقبة الانبعاثات الغازية وغاز الميثان', 0, 4),
      (p_org_id, dept_id, 'Water Quality Monitor', 'مراقب جودة المياه', 'مراقبة المياه الجوفية والرشاحة', 0, 5),
      (p_org_id, dept_id, 'Soil & Leachate Analyst', 'محلل التربة والعصارة', 'تحليل عينات التربة والعصارة', 0, 6),
      (p_org_id, dept_id, 'Lab Technician', 'فني مختبر', 'تحضير العينات وإجراء الاختبارات', 0, 7);

    -- 4. السلامة والصحة المهنية
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Health, Safety & Environment (HSE)', 'السلامة والصحة المهنية', 'حماية العمال من الغازات والمواد السامة', 'Shield', 'red', 4) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'HSE Manager', 'مدير السلامة والصحة المهنية', 'وضع وتنفيذ سياسات السلامة', 2, 1),
      (p_org_id, dept_id, 'Safety Officer', 'ضابط سلامة', 'مراقبة العمال والتأكد من أنظمة الحريق', 1, 2),
      (p_org_id, dept_id, 'Gas Detection Technician', 'فني كشف الغازات', 'مراقبة مستويات الميثان والغازات السامة', 0, 3),
      (p_org_id, dept_id, 'Emergency Response Lead', 'قائد فريق الطوارئ', 'قيادة فريق الاستجابة للحوادث', 1, 4),
      (p_org_id, dept_id, 'First Aid Attendant', 'مسعف أول', 'تقديم الإسعافات الأولية', 0, 5),
      (p_org_id, dept_id, 'PPE & Equipment Inspector', 'مفتش المعدات الوقائية', 'فحص صلاحية معدات الحماية', 0, 6);

    -- 5. وحدة التتبع والبيانات
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Data & Tracking Unit', 'وحدة التتبع والبيانات', 'ربط المدفن بالنظام الرقمي وإغلاق كل رحلة رقمياً', 'Activity', 'cyan', 5) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Tracking Coordinator', 'مسؤول التتبع', 'إغلاق كل طن رقمياً ومطابقته ببيانات المولد', 1, 1),
      (p_org_id, dept_id, 'System Operator', 'مشغل النظام', 'تشغيل النظام وإصدار شهادات التخلص الآمن', 0, 2),
      (p_org_id, dept_id, 'Data Entry Clerk', 'مدخل بيانات', 'إدخال بيانات الشحنات والأوزان', 0, 3),
      (p_org_id, dept_id, 'Document Controller', 'مسؤول مراقبة الوثائق', 'أرشفة المانيفست والشهادات', 0, 4);

    -- 6. الصيانة والبنية التحتية
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Maintenance & Infrastructure', 'الصيانة والبنية التحتية', 'صيانة المعدات الثقيلة والمحارق وأنظمة العصارة', 'Cog', 'amber', 6) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Maintenance Supervisor', 'مشرف الصيانة', 'إدارة برامج الصيانة', 1, 1),
      (p_org_id, dept_id, 'Mechanical Technician', 'فني ميكانيكا', 'صيانة المعدات الثقيلة', 0, 2),
      (p_org_id, dept_id, 'Electrical Technician', 'فني كهرباء', 'صيانة الأنظمة الكهربائية', 0, 3),
      (p_org_id, dept_id, 'Leachate System Technician', 'فني أنظمة العصارة', 'صيانة مضخات وأنابيب العصارة', 0, 4),
      (p_org_id, dept_id, 'Civil Works Supervisor', 'مشرف الأعمال المدنية', 'الإشراف على تبطين الخلايا والتغطية', 0, 5);

    -- 7. المالية والمحاسبة
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Finance & Accounting', 'المالية والمحاسبة', 'إدارة الإيرادات والفوترة والتحصيل', 'Calculator', 'emerald', 7) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Finance Manager', 'مدير الشؤون المالية', 'الإشراف على الحسابات والتقارير المالية', 2, 1),
      (p_org_id, dept_id, 'Chief Accountant', 'المحاسب الرئيسي', 'إعداد القوائم المالية', 1, 2),
      (p_org_id, dept_id, 'Billing Specialist', 'أخصائي الفوترة', 'إصدار فواتير خدمات التخلص', 0, 3),
      (p_org_id, dept_id, 'Collection Officer', 'مسؤول التحصيل', 'متابعة المستحقات', 0, 4);

    -- 8. الشؤون القانونية والتراخيص
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Legal & Licensing', 'الشؤون القانونية والتراخيص', 'متابعة التراخيص البيئية والتعامل مع الجهات الرقابية', 'FileCheck', 'purple', 8) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'Legal & Compliance Manager', 'مدير الشؤون القانونية', 'ضمان الامتثال القانوني', 2, 1),
      (p_org_id, dept_id, 'Licensing Officer', 'مسؤول التراخيص', 'متابعة تجديد تراخيص WMRA وEEAA', 0, 2),
      (p_org_id, dept_id, 'ISO & Quality Auditor', 'مدقق الجودة والأيزو', 'إعداد تقارير الامتثال', 0, 3);

    -- 9. تقنية المعلومات
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'IT & Systems', 'تقنية المعلومات والأنظمة', 'إدارة البنية التحتية الرقمية وأجهزة الاستشعار', 'Monitor', 'blue', 9) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'IT Manager', 'مدير تقنية المعلومات', 'إدارة البنية التحتية والأنظمة', 2, 1),
      (p_org_id, dept_id, 'SCADA & Sensors Admin', 'مدير أنظمة SCADA والاستشعار', 'إدارة أنظمة المراقبة الآلي', 1, 2),
      (p_org_id, dept_id, 'Technical Support', 'دعم فني', 'دعم المستخدمين وصيانة الأجهزة', 0, 3);

    -- 10. الموارد البشرية
    INSERT INTO organization_departments (organization_id, name, name_ar, description_ar, icon, color, sort_order)
    VALUES (p_org_id, 'Human Resources', 'الموارد البشرية', 'إدارة التوظيف والتدريب وشؤون الموظفين', 'Users', 'violet', 10) RETURNING id INTO dept_id;
    INSERT INTO organization_positions (organization_id, department_id, title, title_ar, description_ar, level, sort_order) VALUES
      (p_org_id, dept_id, 'HR Manager', 'مدير الموارد البشرية', 'إدارة سياسات التوظيف', 2, 1),
      (p_org_id, dept_id, 'Training Coordinator', 'منسق التدريب', 'تدريب العمال على السلامة والمخلفات الخطرة', 0, 2),
      (p_org_id, dept_id, 'Personnel Affairs Officer', 'مسؤول شؤون الموظفين', 'إدارة الحضور والإجازات', 0, 3);

  END IF;
END;
$$;
