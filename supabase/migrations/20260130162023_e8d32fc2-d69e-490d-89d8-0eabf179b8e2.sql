-- إضافة الحقول الجديدة لجدول organizations
-- البيانات التنظيمية المشتركة
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS tax_card text;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS wmra_license text;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS establishment_registration text;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS registered_activity text;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS environmental_approval_number text;

-- حقول خاصة بالجهة الناقلة
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS land_transport_license text;

-- حقول خاصة بجهة التدوير
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS ida_license text;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS industrial_registry text;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS license_number text;

-- تعليقات الأعمدة لتوضيح الاستخدام
COMMENT ON COLUMN public.organizations.tax_card IS 'البطاقة الضريبية';
COMMENT ON COLUMN public.organizations.wmra_license IS 'رخصة جهاز تنظيم إدارة المخلفات';
COMMENT ON COLUMN public.organizations.establishment_registration IS 'رقم تسجيل المنشأة';
COMMENT ON COLUMN public.organizations.registered_activity IS 'النشاط المسجل';
COMMENT ON COLUMN public.organizations.environmental_approval_number IS 'رقم الموافقة البيئية';
COMMENT ON COLUMN public.organizations.land_transport_license IS 'رقم موافقة رخصة جهاز تنظيم النقل البري (للناقل)';
COMMENT ON COLUMN public.organizations.ida_license IS 'رقم الرخصة الهيئة العامة للتنمية الصناعية (للمدور)';
COMMENT ON COLUMN public.organizations.industrial_registry IS 'رقم السجل الصناعي للهيئة العامة للتنمية الصناعية (للمدور)';
COMMENT ON COLUMN public.organizations.license_number IS 'رقم الترخيص (للمدور)';