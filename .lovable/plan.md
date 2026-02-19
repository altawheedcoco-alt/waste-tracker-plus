

# خطة المعالجة الأمنية الشاملة

## المرحلة 1: معالجة المشاكل الحرجة

### 1.1 تأمين جدول `organization_deposit_links`
- اضافة سياسة RLS تمنع القراءة العامة
- السماح فقط لأعضاء المنظمة المالكة بالوصول

### 1.2 تأمين حاويات التخزين (Storage Buckets)
تحويل الحاويات الحساسة من عامة إلى خاصة:
- `id-cards` (بطاقات هوية - حرج جداً)
- `organization-stamps` (أختام - يمكن استخدامها للتزوير)
- `payment-receipts` (إيصالات دفع)
- `deposit-receipts` (إيصالات إيداع)
- `document-archive` (أرشيف مستندات)
- `organization-documents` (مستندات منظمات)
- `weighbridge-photos` (صور ميزان)
- `rating-evidence` (أدلة تقييم)

الحاويات التالية ستبقى عامة (مقصودة للمشاركة الاجتماعية):
- `organization-posts`، `profile-media`، `stories`

### 1.3 إضافة سياسات RLS للتخزين
- سياسات قراءة/كتابة مبنية على `organization_id` لكل حاوية خاصة
- استخدام Signed URLs للوصول المؤقت

---

## المرحلة 2: معالجة المشاكل المتوسطة

### 2.1 تأمين جداول التسعير
إضافة سياسات RLS لتقييد الوصول:
- `ad_plans` — السماح للقراءة العامة (مطلوب لصفحة الباقات) مع تقييد التعديل
- `subscription_plans` — نفس المنطق
- `stationery_plans` — نفس المنطق
- `revenue_services` — تقييد للمستخدمين المسجلين فقط
- `pricing_rule_templates` — تقييد للمنظمات فقط (خوارزمية تسعير حساسة)
- `stationery_templates` — تقييد التفاصيل الكاملة للمشتركين

### 2.2 تحسين أمان sessionStorage
- إضافة طابع زمني لانتهاء صلاحية حالة الفتح (15 دقيقة)
- تخزين هاش مُوقّع بدلاً من "true" فقط

---

## المرحلة 3: إصلاح أخطاء قاعدة البيانات

### 3.1 إضافة عمود `organization_id` لجدول `notifications`
- الخطأ المتكرر: `column notifications.organization_id does not exist`
- إضافة العمود مع فهرس وسياسة RLS

### 3.2 إضافة قيمة `cancelled` لـ `shipment_status` enum
- الخطأ المتكرر: `invalid input value for enum shipment_status: "cancelled"`
- إضافة القيمة للـ enum

---

## التفاصيل التقنية

### Migration SQL (المرحلة 1 - حرج)

```sql
-- 1.1 تأمين organization_deposit_links
DROP POLICY IF EXISTS "Anyone can view deposit links" ON organization_deposit_links;
CREATE POLICY "Org members can view deposit links"
ON organization_deposit_links FOR SELECT
TO authenticated
USING (organization_id = get_user_org_id_safe(auth.uid()));

-- 1.2 تأمين حاويات التخزين
UPDATE storage.buckets SET public = false WHERE id IN (
  'id-cards', 'organization-stamps', 'payment-receipts',
  'deposit-receipts', 'document-archive', 'organization-documents',
  'weighbridge-photos', 'rating-evidence'
);

-- 1.3 سياسات RLS للتخزين (مثال لحاوية id-cards)
CREATE POLICY "Org members can read id-cards"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'id-cards'
  AND (storage.foldername(name))[1] = get_user_org_id_safe(auth.uid())::text
);
```

### Migration SQL (المرحلة 2 - متوسط)

```sql
-- 2.1 تأمين pricing_rule_templates
DROP POLICY IF EXISTS "Anyone can view pricing templates" ON pricing_rule_templates;
CREATE POLICY "Authenticated users view pricing templates"
ON pricing_rule_templates FOR SELECT
TO authenticated
USING (true);
```

### Migration SQL (المرحلة 3 - أخطاء)

```sql
-- 3.1 إضافة organization_id للإشعارات
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS organization_id uuid
  REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_notifications_org_id ON notifications(organization_id);

-- 3.2 إضافة cancelled للـ enum
ALTER TYPE shipment_status ADD VALUE IF NOT EXISTS 'cancelled';
```

### تعديل كود PagePasswordGate (المرحلة 2)

إضافة طابع زمني وهاش بسيط لحالة الفتح بدلاً من تخزين "true" مباشرة:
- تخزين كائن JSON يحتوي على `expiresAt` و `hash`
- التحقق من الصلاحية عند كل تحميل

---

## ملخص التأثير

| المرحلة | عدد التغييرات | الأولوية |
|---------|--------------|---------|
| المرحلة 1 (حرج) | 1 migration + سياسات تخزين | فوري |
| المرحلة 2 (متوسط) | 1 migration + تعديل كود | مرتفع |
| المرحلة 3 (أخطاء) | 1 migration | مرتفع |

جميع التغييرات متوافقة مع البيانات الحالية ولن تؤثر على الوظائف القائمة.

