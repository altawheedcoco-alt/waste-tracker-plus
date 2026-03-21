

# خطة فحص شامل وربط الجهة الناقلة — كل زر، كل مسار، كل عداد

## المشكلة 1: خطأ البناء (عاجل)
الملف `MobileBottomNav.tsx` على القرص **لا يحتوي** على `unreadCount` (تم التحقق بالبحث). الخطأ ناتج عن كاش بناء قديم. الحل: إعادة حفظ الملف (touch) لإجبار المترجم على إعادة القراءة.

---

## المشكلة 2: الفحص الشامل — مسارات مكسورة وأزرار غير مرتبطة

### ❌ مسارات يُنقل إليها لكنها غير مسجلة في `DashboardRoutes.tsx`:

| المسار المستخدم | أين يُستخدم | المسار الصحيح الموجود |
|---|---|---|
| `/dashboard/drivers` | CommandCenter (السائقون) | `/dashboard/transporter-drivers` ✅ |
| `/dashboard/fleet` | CommandCenter (المركبات) | غير موجود — الأقرب: `/dashboard?tab=fleet` |
| `/dashboard/accounting` | CommandCenter (الإيرادات) | `/dashboard/erp/accounting` ✅ |
| `/dashboard/deposits` | CommandCenter (الإيداعات) | `/dashboard/quick-deposit-links` أو غير موجود |
| `/dashboard/documents` | CommandCenter (المستندات) | `/dashboard/document-center` ✅ |

### ❌ عدم تطابق الأرقام بين المكونات:

| البيان | مصدر `usePlatformCounts` | مصدر `TransporterCommandCenter` | متطابق؟ |
|---|---|---|---|
| الشحنات النشطة | `transporter_id + in_transit/approved/collecting` | نفس الاستعلام | ✅ |
| السائقون | `drivers.organization_id` | نفس الاستعلام | ✅ |
| الشركاء | `external_partners` | `external_partners` | ✅ |
| العقود | `contracts.status = 'active'` | `contracts.status in ('active','signed')` | ❌ مختلف |
| الإيصالات المعلقة | `shipment_receipts.status = 'pending'` | يعد الإجمالي فقط | ❌ مختلف |

### ❌ أزرار الهيدر (radarStats) تشير لمسارات مختلفة عن CommandCenter:

| الإحصائية | مسار الهيدر | مسار CommandCenter |
|---|---|---|
| السائقون | `/dashboard/transporter-drivers` ✅ | `/dashboard/drivers` ❌ |
| الشركاء | `/dashboard/partners` | `/dashboard/partners` | ✅ |
| نشطة | `/dashboard/tracking-center` | `/dashboard/tracking-center` | ✅ |

---

## خطة التنفيذ (مقسمة لمراحل)

### المرحلة 1: إصلاح خطأ البناء
- إعادة حفظ `MobileBottomNav.tsx` لتجاوز كاش البناء القديم

### المرحلة 2: تصحيح المسارات المكسورة في `TransporterCommandCenter.tsx`
تغيير 5 مسارات:
- `/dashboard/drivers` → `/dashboard/transporter-drivers`
- `/dashboard/fleet` → `/dashboard?tab=fleet` 
- `/dashboard/accounting` → `/dashboard/erp/accounting`
- `/dashboard/deposits` → `/dashboard/quick-deposit-links`
- `/dashboard/documents` → `/dashboard/document-center`

### المرحلة 3: توحيد استعلامات العقود
- في `usePlatformCounts`: تغيير فلتر العقود من `status = 'active'` إلى `status in ('active', 'signed')` ليتطابق مع CommandCenter
- في `useNotificationCounts`: إضافة شارات للعقود والمركبات

### المرحلة 4: ربط `useOperationalAlerts` بنفس مسارات التنقل
- التأكد من أن كل تنبيه يحمل `route` صحيحاً يتوافق مع المسارات المسجلة فعلاً

### المرحلة 5: ربط القائمة الجانبية
- التحقق أن شارات القائمة الجانبية (badges) تعكس `usePlatformCounts` لـ:
  - `transporter-drivers` (عدد السائقين)
  - `fleet` (عدد المركبات)
  - `contracts` (عدد العقود)
  - `erp-accounting` (الفواتير المعلقة)

## الملفات المتأثرة
| ملف | التغيير |
|------|---------|
| `src/components/layout/MobileBottomNav.tsx` | إعادة حفظ (touch) لإصلاح خطأ البناء |
| `src/components/dashboard/transporter/TransporterCommandCenter.tsx` | تصحيح 5 مسارات مكسورة |
| `src/hooks/usePlatformCounts.ts` | توحيد فلتر العقود |
| `src/hooks/useNotificationCounts.ts` | إضافة شارات إضافية |
| `src/hooks/useOperationalAlerts.ts` | تصحيح مسارات التنقل |
| `src/components/dashboard/TransporterDashboard.tsx` | التحقق من تطابق مسارات الهيدر |

