
-- إضافة تواريخ الإصدار والانتهاء لكل ترخيص
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS wmra_license_issue_date date,
  ADD COLUMN IF NOT EXISTS wmra_license_expiry_date date,
  ADD COLUMN IF NOT EXISTS eeaa_license_issue_date date,
  ADD COLUMN IF NOT EXISTS eeaa_license_expiry_date date,
  ADD COLUMN IF NOT EXISTS ida_license_issue_date date,
  ADD COLUMN IF NOT EXISTS ida_license_expiry_date date,
  ADD COLUMN IF NOT EXISTS land_transport_license_issue_date date,
  ADD COLUMN IF NOT EXISTS land_transport_license_expiry_date date,
  ADD COLUMN IF NOT EXISTS digital_declaration_number text,
  ADD COLUMN IF NOT EXISTS certifications_approvals jsonb DEFAULT '[]'::jsonb;

-- تعليق توضيحي
COMMENT ON COLUMN public.organizations.wmra_license_issue_date IS 'تاريخ إصدار ترخيص جهاز تنظيم إدارة المخلفات';
COMMENT ON COLUMN public.organizations.wmra_license_expiry_date IS 'تاريخ انتهاء ترخيص جهاز تنظيم إدارة المخلفات';
COMMENT ON COLUMN public.organizations.eeaa_license_issue_date IS 'تاريخ إصدار ترخيص جهاز شئون البيئة';
COMMENT ON COLUMN public.organizations.eeaa_license_expiry_date IS 'تاريخ انتهاء ترخيص جهاز شئون البيئة';
COMMENT ON COLUMN public.organizations.ida_license_issue_date IS 'تاريخ إصدار ترخيص الهيئة العامة للتنمية الصناعية';
COMMENT ON COLUMN public.organizations.ida_license_expiry_date IS 'تاريخ انتهاء ترخيص الهيئة العامة للتنمية الصناعية';
COMMENT ON COLUMN public.organizations.land_transport_license_issue_date IS 'تاريخ إصدار رخصة النقل البري';
COMMENT ON COLUMN public.organizations.land_transport_license_expiry_date IS 'تاريخ انتهاء رخصة النقل البري';
COMMENT ON COLUMN public.organizations.digital_declaration_number IS 'رقم الإقرار الرقمي بالشروط والسياسات';
COMMENT ON COLUMN public.organizations.certifications_approvals IS 'الشهادات والموافقات الحاصل عليها [{name, number, issue_date, expiry_date}]';
