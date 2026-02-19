
-- =============================================
-- المرحلة 3: إصلاح أخطاء قاعدة البيانات
-- =============================================

-- 3.1 إضافة organization_id للإشعارات
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS organization_id uuid
  REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_notifications_org_id ON notifications(organization_id);

-- 3.2 إضافة cancelled للـ enum
ALTER TYPE shipment_status ADD VALUE IF NOT EXISTS 'cancelled';
