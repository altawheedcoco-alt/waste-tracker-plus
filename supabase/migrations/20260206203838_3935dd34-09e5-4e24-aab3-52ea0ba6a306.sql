-- ============================================
-- تخفيف القيود لتسهيل العمل
-- ============================================

-- 1. جدول الشحنات (shipments) - تخفيف القيود الإلزامية
ALTER TABLE public.shipments 
  ALTER COLUMN generator_id DROP NOT NULL,
  ALTER COLUMN recycler_id DROP NOT NULL,
  ALTER COLUMN driver_id DROP NOT NULL,
  ALTER COLUMN waste_type DROP NOT NULL,
  ALTER COLUMN quantity DROP NOT NULL,
  ALTER COLUMN pickup_address DROP NOT NULL,
  ALTER COLUMN delivery_address DROP NOT NULL,
  ALTER COLUMN created_by DROP NOT NULL;

-- إضافة قيم افتراضية (استخدام قيمة enum صالحة)
ALTER TABLE public.shipments 
  ALTER COLUMN waste_type SET DEFAULT 'other',
  ALTER COLUMN quantity SET DEFAULT 0,
  ALTER COLUMN pickup_address SET DEFAULT '',
  ALTER COLUMN delivery_address SET DEFAULT '';

-- 2. جدول المنظمات (organizations) - تخفيف القيود الإلزامية
ALTER TABLE public.organizations
  ALTER COLUMN address DROP NOT NULL,
  ALTER COLUMN city DROP NOT NULL;

ALTER TABLE public.organizations
  ALTER COLUMN address SET DEFAULT '',
  ALTER COLUMN city SET DEFAULT '';

-- 3. جدول شهادات الاستلام (shipment_receipts) - تخفيف القيود
ALTER TABLE public.shipment_receipts
  ALTER COLUMN transporter_id DROP NOT NULL;

-- 4. حذف قيود Foreign Key المشددة
ALTER TABLE public.shipments DROP CONSTRAINT IF EXISTS shipments_created_by_fkey;
ALTER TABLE public.shipments DROP CONSTRAINT IF EXISTS shipments_generator_id_fkey;
ALTER TABLE public.shipments DROP CONSTRAINT IF EXISTS shipments_recycler_id_fkey;
ALTER TABLE public.shipments DROP CONSTRAINT IF EXISTS shipments_driver_id_fkey;

ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_created_by_fkey;
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_approved_by_fkey;
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_partner_organization_id_fkey;

ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_created_by_fkey;
ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_verified_by_fkey;

ALTER TABLE public.shipment_receipts DROP CONSTRAINT IF EXISTS shipment_receipts_driver_id_fkey;
ALTER TABLE public.shipment_receipts DROP CONSTRAINT IF EXISTS shipment_receipts_generator_id_fkey;
ALTER TABLE public.shipment_receipts DROP CONSTRAINT IF EXISTS shipment_receipts_confirmed_by_fkey;
ALTER TABLE public.shipment_receipts DROP CONSTRAINT IF EXISTS shipment_receipts_transporter_id_fkey;

-- 5. تحديث trigger لتوليد رقم الشحنة
CREATE OR REPLACE FUNCTION public.generate_shipment_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF NEW.shipment_number IS NULL OR NEW.shipment_number = '' THEN
    NEW.shipment_number := 'SHP-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || 
                           LPAD(CAST(FLOOR(RANDOM() * 10000) AS TEXT), 4, '0');
  END IF;
  
  NEW.auto_approve_at := now() + INTERVAL '6 hours';
  
  IF NEW.waste_type IS NULL THEN
    NEW.waste_type := 'other';
  END IF;
  
  IF NEW.quantity IS NULL THEN
    NEW.quantity := 0;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 6. إنشاء trigger لتعيين created_by تلقائياً في الشحنات
CREATE OR REPLACE FUNCTION public.set_shipment_created_by()
RETURNS TRIGGER AS $$
DECLARE
  v_profile_id UUID;
BEGIN
  IF NEW.created_by IS NULL THEN
    SELECT id INTO v_profile_id 
    FROM public.profiles 
    WHERE user_id = auth.uid() 
    LIMIT 1;
    
    NEW.created_by := v_profile_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS set_shipment_created_by_trigger ON public.shipments;
CREATE TRIGGER set_shipment_created_by_trigger
  BEFORE INSERT ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_shipment_created_by();

-- 7. تخفيف قيود الفواتير
ALTER TABLE public.invoices
  ALTER COLUMN organization_id DROP NOT NULL,
  ALTER COLUMN partner_organization_id DROP NOT NULL,
  ALTER COLUMN created_by DROP NOT NULL;

-- 8. تخفيف قيود العقود  
ALTER TABLE public.contracts
  ALTER COLUMN organization_id DROP NOT NULL,
  ALTER COLUMN partner_organization_id DROP NOT NULL,
  ALTER COLUMN created_by DROP NOT NULL;

-- 9. تخفيف قيود profiles
ALTER TABLE public.profiles
  ALTER COLUMN organization_id DROP NOT NULL;