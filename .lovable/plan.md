

# خطة ربط وتوحيد جميع الأزرار والمكونات المتشابهة عبر لوحة التحكم

## المشكلة الجذرية
يوجد **5 أنظمة منفصلة** تجلب نفس البيانات لكنها غير مترابطة:

| النظام | أين يُستخدم | ماذا يجلب |
|--------|------------|-----------|
| `useNotifications` | الهيدر، الشريط الجانبي، Mobile Nav، صفحة الإشعارات | إشعارات `notifications` |
| `useCommHubCounts` | مركز التواصل فقط | رسائل، ملاحظات، توقيعات، طلبات |
| `useOperationalAlerts` | شريط التنبيهات فقط (TransporterDashboard) | شحنات، سائقين، رسائل، شركاء... |
| `useNotificationCounts` | شارات الشريط الجانبي | يعيد تصنيف إشعارات `useNotifications` حسب القسم |
| `useChat.getPartnerUnreadCount` | صفحة الدردشة فقط | رسائل غير مقروءة لكل شريك |

**النتيجة**: الرسائل غير المقروءة تظهر في مركز التواصل لكن **لا تظهر** في الشريط الجانبي. التوقيعات المعلقة تظهر في مركز التواصل لكن **لا تنعكس** في شريط التنبيهات بنفس الرقم. وهكذا.

---

## الحل: طبقة بيانات موحدة (Unified Data Layer)

### المرحلة 1: إنشاء `usePlatformCounts` — مصدر واحد للحقيقة
Hook مركزي يجلب **كل** العدادات مرة واحدة ويُعيد استخدامها في كل مكان:

```
usePlatformCounts() → {
  unreadMessages, unreadNotes, pendingSignatures,
  pendingRequests, activeShipments, overdueShipments,
  availableDrivers, busyDrivers, activeContracts,
  activePartners, unreadNotifications, ...
}
```

- يستخدم نفس `queryKey` في كل مكان → React Query يعيد نفس الكاش
- `refetchInterval: 30s` + Realtime invalidation
- يحل محل `useCommHubCounts` بالكامل (يُحذف)

### المرحلة 2: ربط كل نقطة عرض بالمصدر الموحد

| المكون | التغيير |
|--------|---------|
| `CommunicationHubWidget` | يستخدم `usePlatformCounts` بدل `useCommHubCounts` |
| `DashboardLayout` (الشريط الجانبي) | شارات الرسائل والتوقيعات والطلبات تأتي من `usePlatformCounts` بدل `useNotificationCounts` فقط |
| `MobileBottomNav` | يعرض شارة مجمعة (إشعارات + رسائل) من `usePlatformCounts` |
| `NotificationDropdown` (الهيدر) | يعرض العدد الموحد |
| `TransporterDashboard` (شريط التنبيهات) | `useOperationalAlerts` يبقى للتفاصيل، لكن العدادات تأتي من `usePlatformCounts` |
| `useNotificationCounts` | يُوسَّع ليشمل الرسائل والتوقيعات وليس فقط `notifications` |

### المرحلة 3: توحيد مسارات التنقل
مراجعة كل زر يحمل نفس الاسم والتأكد أنه يفتح نفس الصفحة:
- زر "الرسائل" في كل مكان → `/dashboard/chat`
- زر "الإشعارات" في كل مكان → `/dashboard/notifications`
- زر "التوقيعات" في كل مكان → `/dashboard/chat?tab=signing`
- زر "الشحنات" في كل مكان → المسار الصحيح حسب نوع الجهة

### المرحلة 4: إصلاح خطأ `completed` المتبقي
- `TransporterCommandCenter.tsx` لا يزال يستخدم `"completed"` في فلتر shipment_status (خطأ 400 ظاهر في الشبكة)

---

## الملفات المتأثرة
| ملف | التغيير |
|------|---------|
| `src/hooks/usePlatformCounts.ts` | **جديد** — مصدر واحد للعدادات |
| `src/hooks/useCommHubCounts.ts` | **يُحذف** — يُستبدل بـ `usePlatformCounts` |
| `src/hooks/useNotificationCounts.ts` | يُوسَّع ليشمل الرسائل والتوقيعات |
| `src/components/dashboard/widgets/CommunicationHubWidget.tsx` | يستخدم المصدر الموحد |
| `src/components/dashboard/DashboardLayout.tsx` | شارات جانبية موحدة |
| `src/components/layout/MobileBottomNav.tsx` | شارة مجمعة |
| `src/components/dashboard/NotificationDropdown.tsx` | عدد موحد |
| `src/components/dashboard/transporter/TransporterCommandCenter.tsx` | إصلاح خطأ `completed` |

