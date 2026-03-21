
# إصلاح أخطاء شريط التنبيهات التشغيلية + توسيعه ليكون مسرح عمليات شامل

## المشكلة الحالية
الشبكة تُظهر **7 أخطاء 400** بسبب أعمدة/علاقات غير موجودة في قاعدة البيانات:

| الخطأ | السبب |
|-------|-------|
| `direct_messages.sender_name does not exist` | لا يوجد عمود `sender_name` — يجب استخدام `sender_id` + join مع `profiles` |
| `signing_chain_steps.step_label does not exist` | لا يوجد عمود `step_label` — يجب استخدام `signer_name` أو `notes` |
| `work_orders.title does not exist` | لا يوجد عمود `title` — يجب استخدام `order_number` + `waste_description` |
| `work_orders` لا تحتوي `sender_org_id/recipient_org_id` | الأعمدة هي `organization_id` + `created_by` |
| `verified_partnerships` FK hint خاطئ | FK اسمه مختلف — يجب استخدام `partner_org_id` مع join مباشر |
| `notes.is_read does not exist` | لا يوجد عمود `is_read` — يمكن استخدام `is_resolved` بدلاً منه |
| `shipment_status` لا تقبل `completed` | القيم المسموحة: `new, registered, approved, collecting, in_transit, delivered, confirmed, cancelled` |

## التنفيذ

### 1. إصلاح `useOperationalAlerts.ts` — تصحيح كل الاستعلامات
- **الرسائل**: `select('id,content,created_at,is_read,sender_id,sender:profiles!direct_messages_sender_id_fkey(full_name)')` بدل `sender_name`
- **التوقيعات**: `select('id,signer_name,status,chain_id')` بدل `step_label`
- **أوامر العمل**: `select('id,order_number,waste_description,status,created_at').eq('organization_id', orgId).eq('status', 'pending')` بدل `sender_org_id/recipient_org_id` و`title`
- **الشركاء**: `select('id,partner_org_id')` ثم fetch أسماء المنظمات بشكل منفصل من `organizations`
- **الشحنات**: إزالة `completed` من فلتر الحالات واستخدام القيم الصحيحة فقط

### 2. إصلاح `useCommHubCounts.ts` — نفس الأخطاء
- **الملاحظات**: إزالة فلتر `is_read` واستخدام `is_resolved` بدلاً منه
- **أوامر العمل**: تصحيح الفلتر ليستخدم `organization_id` بدل `sender_org_id/recipient_org_id`

### 3. توسيع التنبيهات — إضافة حالات القراءة والإخفاء
- إضافة حقل `isRead` لكل تنبيه (بناءً على `is_read` من الإشعارات والرسائل)
- عرض شارة "غير مقروء" بجانب كل تنبيه (نقطة ملونة)
- عند النقر على تنبيه → تحويله لـ "مقروء" + فتح الصفحة المعنية
- إضافة زر "عرض/إخفاء التفاصيل" لكل تنبيه في الشريط

## الملفات المتأثرة
| ملف | التغيير |
|------|---------|
| `src/hooks/useOperationalAlerts.ts` | إصلاح 7 استعلامات خاطئة + إضافة `isRead` |
| `src/hooks/useCommHubCounts.ts` | إصلاح استعلامات `notes` و`work_orders` |
| `src/components/dashboard/shared/DashboardV2Header.tsx` | إضافة شارة القراءة + زر إخفاء/إظهار |
