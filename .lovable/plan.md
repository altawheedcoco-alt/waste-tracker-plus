

# خطة ربط بيانات الجهة الناقلة بالكامل — مركز التواصل والعمليات + لوحة التحكم + القوائم الجانبية + الهيدر

## المشكلة الحالية
مركز التواصل والعمليات (`CommunicationHubWidget`) يعرض 12 زراً لكنه يجلب **فقط** عدد الإشعارات غير المقروءة (`unreadCount`). باقي الأزرار (الرسائل، الملاحظات، التوقيعات، القنوات، البث، إلخ) لا تعرض بيانات حقيقية ولا أرقام شارات (badges). كذلك بعض أزرار مركز القيادة ليست مربوطة بمسارات فعلية.

## الجداول الموجودة فعلاً في قاعدة البيانات
- `direct_messages` ✅ (الرسائل)
- `signing_chain_steps` ✅ (التوقيعات)
- `work_orders` ✅ (الطلبات)
- `stories` ✅ (الحالات)
- `broadcast_channels` ✅ (البث)
- `notes` ✅ (الملاحظات)
- `notifications` ✅ (الإشعارات)
- `polls` ❌ غير موجود
- `meetings` ❌ غير موجود

---

## المرحلة 1: مركز التواصل والعمليات — ربط البيانات الحقيقية

### 1.1 إنشاء Hook جديد `useCommHubCounts`
سيجلب عدادات حقيقية من قاعدة البيانات لكل قسم:
- **الرسائل**: `direct_messages` حيث `receiver_organization_id = orgId AND is_read = false` → عدد الرسائل غير المقروءة
- **الملاحظات**: `notes` حيث `organization_id = orgId AND is_read = false` → عدد الملاحظات الجديدة
- **التوقيعات**: `signing_chain_steps` حيث `signer_org_id = orgId AND status = 'pending'` → عدد التوقيعات المعلقة
- **الحالات**: `stories` حيث `organization_id = orgId AND created_at > 24h ago` → عدد القصص النشطة
- **البث**: `broadcast_channels` حيث `organization_id = orgId` → عدد القنوات
- **الطلبات**: `work_orders` حيث `(sender_org_id = orgId OR recipient_org_id = orgId) AND status = 'pending'` → عدد الطلبات المعلقة
- تفعيل `refetchInterval: 30000` للتحديث التلقائي كل 30 ثانية

### 1.2 تحديث `CommunicationHubWidget.tsx`
- استبدال العداد الثابت بعدادات حقيقية من `useCommHubCounts`
- إضافة `badgeCount` لكل زر: الرسائل، الملاحظات، التوقيعات، الطلبات
- الأزرار التي لا يوجد لها جدول (الاجتماعات، التصويت) تبقى بدون عداد مع ملاحظة "قريباً"

---

## المرحلة 2: تحديث Realtime للناقل

### 2.1 توسيع `useTransporterRealtime.ts`
إضافة اشتراكات لحظية للجداول الجديدة:
- `direct_messages` → إبطال كاش `comm-hub-counts`
- `signing_chain_steps` → إبطال كاش `comm-hub-counts`
- `work_orders` → إبطال كاش `comm-hub-counts` + `transporter-incoming-requests`
- `notes` → إبطال كاش `comm-hub-counts`
- `stories` → إبطال كاش `comm-hub-counts`
- `invoices` → إبطال كاش `transporter-command-center-v4`
- `fleet_vehicles` → إبطال كاش `transporter-command-center-v4`
- `contracts` → إبطال كاش `transporter-command-center-v4`
- `organization_members` → إبطال كاش `transporter-command-center-v4`
- `entity_documents` → إبطال كاش `transporter-command-center-v4`

---

## المرحلة 3: مركز القيادة — ربط التنقل الكامل

### 3.1 تحديث `TransporterCommandCenter.tsx`
ربط كل `StatMicro` بمسار تنقل فعلي:
- **بانتظار الموافقة** → `/dashboard/transporter-shipments?status=new`
- **متأخرة** → `/dashboard/transporter-shipments?status=overdue`
- **الشهادات/الإيصالات** → `/dashboard/transporter-receipts`
- **المركبات** → `/dashboard/fleet` أو صفحة الأسطول
- **العقود** → `/dashboard/contracts`
- **الإيداعات** → `/dashboard/deposits`

---

## المرحلة 4: الهيدر — ربط التنبيهات الحقيقية

### 4.1 تحديث `DashboardV2Header` props في `TransporterDashboard.tsx`
تحويل التنبيهات من نصوص ثابتة إلى بيانات ديناميكية:
- جلب التنبيهات من `notifications` الأخيرة (آخر 5 تنبيهات عاجلة)
- جلب المستندات المنتهية من `entity_documents` 
- جلب الشحنات المتأخرة الفعلية وعرضها كتنبيهات
- إزالة التنبيهات المعلبة مثل "تذكير: فحص دوري" واستبدالها ببيانات حقيقية

### 4.2 ربط `radarStats` بمسارات التنقل
إضافة `route` لكل إحصائية في الرادار ليصبح كل رقم قابلاً للنقر:
- إجمالي الشحنات → `/dashboard/transporter-shipments`
- نشطة → `/dashboard/tracking-center`
- السائقون → `/dashboard/transporter-drivers`
- الشركاء → `/dashboard/partners`

---

## المرحلة 5: جداول مفقودة (اختياري)

### 5.1 Migration لإنشاء الجداول غير الموجودة
- `meetings` — جدول الاجتماعات (id, title, organizer_id, organization_id, scheduled_at, meeting_url, status)
- `polls` — جدول التصويتات (id, question, organization_id, created_by, created_at, is_active)
- مع RLS policies مناسبة

---

## الملفات المتأثرة
| ملف | التغيير |
|------|---------|
| `src/hooks/useCommHubCounts.ts` | **جديد** — Hook عدادات مركز التواصل |
| `src/components/dashboard/widgets/CommunicationHubWidget.tsx` | ربط العدادات الحقيقية |
| `src/hooks/useTransporterRealtime.ts` | توسيع الاشتراكات اللحظية |
| `src/components/dashboard/transporter/TransporterCommandCenter.tsx` | ربط التنقل للإحصائيات |
| `src/components/dashboard/TransporterDashboard.tsx` | تحويل التنبيهات لديناميكية |
| Migration SQL | جداول `meetings` و `polls` |

## ترتيب التنفيذ
1. المرحلة 1 + 2 معاً (Hook + Realtime + Widget)
2. المرحلة 3 (Command Center navigation)
3. المرحلة 4 (Header dynamic alerts)
4. المرحلة 5 (جداول جديدة إن أردت)

