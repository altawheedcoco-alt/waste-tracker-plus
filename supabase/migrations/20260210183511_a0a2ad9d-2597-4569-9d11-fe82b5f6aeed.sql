
-- إضافة حقول التراخيص القانونية لجهات التخلص النهائي
-- كل ترخيص له رقم + تاريخ انتهاء + رابط مرفق

-- ترخيص رقم 1: ترخيص مزاولة نشاط إدارة المخلفات (WMRA)
ALTER TABLE public.disposal_facilities
ADD COLUMN IF NOT EXISTS wmra_license_number TEXT,
ADD COLUMN IF NOT EXISTS wmra_license_expiry DATE,
ADD COLUMN IF NOT EXISTS wmra_license_url TEXT;

-- ترخيص رقم 2: التصريح البيئي / تقييم الأثر البيئي (EIA)
ALTER TABLE public.disposal_facilities
ADD COLUMN IF NOT EXISTS eia_permit_number TEXT,
ADD COLUMN IF NOT EXISTS eia_permit_expiry DATE,
ADD COLUMN IF NOT EXISTS eia_permit_url TEXT;

-- ترخيص رقم 3: ترخيص تشغيل المنشأة (المحافظة / الهيئة المحلية)
ALTER TABLE public.disposal_facilities
ADD COLUMN IF NOT EXISTS operation_license_number TEXT,
ADD COLUMN IF NOT EXISTS operation_license_expiry DATE,
ADD COLUMN IF NOT EXISTS operation_license_url TEXT;

-- ترخيص رقم 4: ترخيص نقل واستقبال المخلفات الخطرة
ALTER TABLE public.disposal_facilities
ADD COLUMN IF NOT EXISTS hazardous_license_number TEXT,
ADD COLUMN IF NOT EXISTS hazardous_license_expiry DATE,
ADD COLUMN IF NOT EXISTS hazardous_license_url TEXT;

-- ترخيص رقم 5: السجل التجاري والبطاقة الضريبية
ALTER TABLE public.disposal_facilities
ADD COLUMN IF NOT EXISTS commercial_register_number TEXT,
ADD COLUMN IF NOT EXISTS tax_card_number TEXT;

-- ترخيص رقم 6: تراخيص إضافية حسب النشاط (محرقة، مدفن، معالجة كيميائية، إلخ)
ALTER TABLE public.disposal_facilities
ADD COLUMN IF NOT EXISTS activity_specific_license_number TEXT,
ADD COLUMN IF NOT EXISTS activity_specific_license_type TEXT,
ADD COLUMN IF NOT EXISTS activity_specific_license_expiry DATE,
ADD COLUMN IF NOT EXISTS activity_specific_license_url TEXT;
