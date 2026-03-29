

# خطة: إتاحة iRecycle Health كصفحة عامة مفتوحة للجميع

## المشكلة
حالياً صفحة iRecycle Health موجودة فقط على مسار `/dashboard/health` — وهذا المسار محمي ويتطلب تسجيل دخول. الزر في الصفحة الرئيسية يوجه الزائر لهذا المسار فيُطلب منه تسجيل الدخول أولاً.

## الحل

### 1. إنشاء مسار عام `/health` (بدون dashboard)
- إنشاء صفحة عامة `src/pages/PublicHealth.tsx` تعرض نفس أدوات iRecycle Health الـ 9 بالكامل (PPG، الوجه، الصوت، التنفس، إلخ) بدون الحاجة لتسجيل دخول
- الصفحة تستخدم نفس التبويبات والمكونات الموجودة لكن بدون `DashboardLayout`
- حفظ النتائج يكون محلياً (localStorage) للزائر العادي، وفي قاعدة البيانات للمسجّل

### 2. تسجيل المسار في PublicRoutes
- إضافة `<Route path="/health" element={<PublicHealth />} />` في `src/routes/PublicRoutes.tsx`

### 3. تحديث روابط الصفحة الرئيسية
- تغيير زر "جرّب الآن مجاناً" في `HealthShowcase.tsx` من `/dashboard/health` إلى `/health`
- تحديث رابط الهيدر أيضاً ليوجه لـ `/health` بدلاً من anchor

### 4. إبقاء `/dashboard/health` للمسجلين
- المسار الداخلي يبقى كما هو مع حفظ البيانات في قاعدة البيانات والسجل الصحي الكامل

---

## التفاصيل التقنية

| الملف | التعديل |
|---|---|
| `src/pages/PublicHealth.tsx` | صفحة جديدة — تعرض أدوات Health بدون DashboardLayout |
| `src/routes/PublicRoutes.tsx` | إضافة مسار `/health` |
| `src/components/landing/HealthShowcase.tsx` | تغيير الرابط لـ `/health` |
| `src/components/Header.tsx` | تحديث رابط iRecycle Health لـ `/health` |

