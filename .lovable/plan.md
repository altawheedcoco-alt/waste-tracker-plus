

# خطة: توحيد اسم المنصة الكامل في جميع الصفحات

## المشكلة
حالياً الاسم يظهر بأشكال مختلفة وغير موحدة:
- اللوجو يعرض "iRecycle" فقط مع subtitle اختياري "Waste Management System"
- شريط الإصدار يعرض "منصة iRecycle" بدون وصف
- الهيدر والفوتر لا يظهر فيهما الاسم الكامل
- صفحة Auth تعرض "Waste Management System" فقط
- عنوان الصفحة (Tab) يعرض "آي ريسايكل - iRecycle"

## الحل المقترح

### الاسم الموحد المعتمد
- **بالإنجليزية:** `iRecycle — Waste Management Solution Platform`
- **بالعربية:** `آي ريسايكل — منصة حلول إدارة المخلفات`
- **اختصار للمساحات الضيقة:** `iRecycle Platform` / `منصة آي ريسايكل`

### 1. تحديث مكون IRecycleLogo
تغيير subtitle من "Waste Management System" إلى "Waste Management Solution Platform" مع إضافة prop لعرض النسخة المختصرة أو الكاملة.

**الملف:** `src/components/common/IRecycleLogo.tsx`

### 2. تحديث شريط الإصدار (VersionBar)
تغيير النص من "منصة iRecycle" إلى "iRecycle — Waste Management Solution Platform"

**الملف:** `src/components/VersionBar.tsx`

### 3. تحديث عنوان الصفحة (Page Title)
تغيير `BASE_TITLE` إلى "iRecycle — Waste Management Solution Platform"

**الملف:** `src/hooks/usePageTitle.ts`

### 4. تحديث ملفات الترجمة
- تحديث `systemNameAr` و `tagline` في ملفات i18n
- إضافة مفتاح `platformFullName` جديد

**الملفات:** `src/i18n/ar.ts`, `src/i18n/en.ts`, `src/i18n/ar-core.ts`

### 5. تحديث الفوتر
إضافة الاسم الكامل تحت اللوجو في قسم Brand

**الملف:** `src/components/Footer.tsx`

### 6. تحديث صفحة Auth
تغيير "Waste Management System" إلى "Waste Management Solution Platform"

**الملف:** `src/pages/Auth.tsx`

### 7. تحديث الـ Hero
إضافة سطر subtitle يعرض "Waste Management Solution Platform" تحت العنوان الرئيسي

**الملف:** `src/components/Hero.tsx`

### 8. تحديث useBranding defaults
تحديث القيم الافتراضية لتعكس الاسم الجديد

**الملف:** `src/hooks/useBranding.ts`

### 9. تحديث SharedResourceLayout و ReceiptPrintTemplate
ضمان ظهور الاسم الكامل في الصفحات المشتركة والإيصالات

**الملفات:** `src/components/sharing/SharedResourceLayout.tsx`, `src/components/receipts/ReceiptPrintTemplate.tsx`

---

## التفاصيل التقنية

| الملف | التعديل |
|---|---|
| `IRecycleLogo.tsx` | subtitle → "Waste Management Solution Platform" |
| `VersionBar.tsx` | نص الشريط → الاسم الكامل |
| `usePageTitle.ts` | BASE_TITLE → الاسم الكامل |
| `ar.ts` / `en.ts` / `ar-core.ts` | إضافة `platformFullName` + تحديث `systemNameAr` |
| `Footer.tsx` | إضافة الاسم الكامل تحت اللوجو |
| `Auth.tsx` | تحديث subtitle |
| `Hero.tsx` | إضافة subtitle badge |
| `useBranding.ts` | تحديث defaults |
| `SharedResourceLayout.tsx` | إضافة الاسم بجانب اللوجو |
| `ReceiptPrintTemplate.tsx` | تحديث النص |

