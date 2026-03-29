

# خطة: ترقية iRecycle Health — وصول شامل + زر عائم + تأكيد السجل الصحي

## ملخص
جعل iRecycle Health الأداة الأولى في القائمة الجانبية لجميع الحسابات، مع إضافة زر عائم (Floating Action Button) للوصول السريع، وتأكيد أن نظام التتبع الصحي والمقارنات يعمل بشكل كامل.

---

## 1. نقل iRecycle Health لأول قسم في القائمة الجانبية

**الوضع الحالي:** موجود ضمن قسم "الموارد البشرية" → "الصحة المهنية" (ترتيب متأخر)

**التعديل:**
- إنشاء قسم جديد مستقل `sec-health` يكون **أول قسم** في مصفوفة `SIDEBAR_SECTIONS` (قبل المؤسسة والهوية)
- نقل مجموعة `occupational-health` إليه مع جعل iRecycle Health العنصر الأول
- ضمان `visibleFor: []` (مرئي لجميع أنواع الحسابات)

**الملف:** `src/config/sidebarConfig.ts`

---

## 2. زر عائم (FAB) لـ iRecycle Health

**التعديل:**
- إنشاء مكون `FloatingHealthButton.tsx` — زر دائري عائم بأيقونة القلب/البصمة مع نبض أنيميشن
- يظهر في جميع صفحات الداشبورد (أسفل يسار الشاشة)
- عند الضغط ينقل مباشرة لـ `/dashboard/health`
- يظهر شارة صغيرة "فحص اليوم" إذا لم يُجرِ المستخدم فحصاً اليوم

**الملفات:**
- إنشاء: `src/components/health/FloatingHealthButton.tsx`
- تعديل: `src/pages/Dashboard.tsx` — إضافته ضمن widgets المؤجلة

---

## 3. تأكيد وتحسين السجل الصحي والمقارنات

**الموجود فعلاً:**
- جدول `health_measurements` في قاعدة البيانات مع RLS
- `useHealthHistory` hook يحفظ ويسترجع القياسات
- `HealthHistoryTab` يعرض الرسوم البيانية (stress/energy) ومتوسطات آخر 10 قياسات
- مؤشر الاتجاه (improving/declining/stable) يقارن آخر 5 قياسات بالـ 5 السابقة

**التحسينات:**
- إضافة مقارنة "اليوم vs الأمس" و"هذا الأسبوع vs الأسبوع الماضي" بنسب مئوية
- إضافة تنبيه ذكي عند تدهور المؤشرات لـ 3 أيام متتالية
- عرض عداد "أيام الفحص المتتالية" (Streak) لتحفيز الاستمرار

**الملف:** تعديل `src/components/health/HealthHistoryTab.tsx`

---

## التفاصيل التقنية

| الملف | التعديل |
|---|---|
| `src/config/sidebarConfig.ts` | نقل `occupational-health` لأول قسم مستقل |
| `src/components/health/FloatingHealthButton.tsx` | مكون جديد — FAB عائم |
| `src/pages/Dashboard.tsx` | إضافة FloatingHealthButton |
| `src/components/health/HealthHistoryTab.tsx` | مقارنات يومية/أسبوعية + streak |

