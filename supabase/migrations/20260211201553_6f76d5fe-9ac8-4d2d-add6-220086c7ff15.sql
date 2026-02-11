
-- =====================================================
-- تحسين فهارس قاعدة البيانات للاستعلامات المتكررة
-- =====================================================

-- 1. shipment_logs: جدول كبير بدون فهارس عملية
CREATE INDEX IF NOT EXISTS idx_shipment_logs_shipment_id 
  ON public.shipment_logs (shipment_id);

CREATE INDEX IF NOT EXISTS idx_shipment_logs_shipment_time 
  ON public.shipment_logs (shipment_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_shipment_logs_status 
  ON public.shipment_logs (status);

CREATE INDEX IF NOT EXISTS idx_shipment_logs_changed_by 
  ON public.shipment_logs (changed_by);

-- 2. accounting_ledger: يفتقر لفهارس المنظمة والتاريخ
CREATE INDEX IF NOT EXISTS idx_accounting_ledger_org 
  ON public.accounting_ledger (organization_id);

CREATE INDEX IF NOT EXISTS idx_accounting_ledger_org_date 
  ON public.accounting_ledger (organization_id, entry_date DESC);

CREATE INDEX IF NOT EXISTS idx_accounting_ledger_entry_type 
  ON public.accounting_ledger (entry_type);

CREATE INDEX IF NOT EXISTS idx_accounting_ledger_entry_category 
  ON public.accounting_ledger (entry_category);

CREATE INDEX IF NOT EXISTS idx_accounting_ledger_org_category 
  ON public.accounting_ledger (organization_id, entry_category);

CREATE INDEX IF NOT EXISTS idx_accounting_ledger_verified 
  ON public.accounting_ledger (verified) WHERE verified = false;

CREATE INDEX IF NOT EXISTS idx_accounting_ledger_deposit 
  ON public.accounting_ledger (deposit_id) WHERE deposit_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_accounting_ledger_invoice 
  ON public.accounting_ledger (invoice_id) WHERE invoice_id IS NOT NULL;

-- 3. notifications: تحسين استعلام العد السريع للإشعارات غير المقروءة
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread_time 
  ON public.notifications (user_id, created_at DESC) WHERE is_read = false;

-- 4. profiles: فهرس مركب للبحث حسب المنظمة والحالة
CREATE INDEX IF NOT EXISTS idx_profiles_org_active 
  ON public.profiles (organization_id, is_active) WHERE is_active = true;

-- 5. drivers: فهرس للسائقين المتاحين
CREATE INDEX IF NOT EXISTS idx_drivers_org_available 
  ON public.drivers (organization_id, is_available) WHERE is_available = true;

-- 6. carbon_footprint_records: تحسين استعلامات التقارير البيئية
CREATE INDEX IF NOT EXISTS idx_carbon_footprint_org 
  ON public.carbon_footprint_records (organization_id);

CREATE INDEX IF NOT EXISTS idx_carbon_footprint_org_date 
  ON public.carbon_footprint_records (organization_id, calculation_date DESC);

CREATE INDEX IF NOT EXISTS idx_carbon_footprint_shipment 
  ON public.carbon_footprint_records (shipment_id) WHERE shipment_id IS NOT NULL;
