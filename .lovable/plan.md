

# خطة: تفعيل عرض الصور عند النقر في كل أنحاء المشروع

## المشكلة

الصور الشخصية (Avatar)، صور الشعار (Logo)، وصور الغلاف (Cover) لا تفتح عند الضغط عليها. مكون `SecureImage` و`ImageLightbox` موجودان لكنهما مستخدمان فقط في أماكن محدودة (صور الشحنات ورسائل الدردشة).

## الحل

### 1. إنشاء مكون `ClickableImage` عام وخفيف

ملف جديد: `src/components/ui/ClickableImage.tsx`

مكون بسيط يلف أي صورة (سواء `<img>` عادي أو `AvatarImage`) ويضيف:
- عند النقر: يفتح lightbox بالصورة بالحجم الكامل
- دعم معرض صور (gallery) مع تمرير يمين/يسار
- يعيد استخدام نفس تصميم lightbox الموجود في `SecureImage`
- لا يحتاج bucket أو signed URLs — يعمل مع أي رابط مباشر

### 2. تطبيقه على `ProfileHeader.tsx` (صورة الشعار + الغلاف)

- صورة الغلاف: لف `<img>` بـ `ClickableImage` — النقر يفتحها كاملة
- صورة الشعار (Avatar): إضافة onClick يفتح lightbox (بدون تعارض مع زر التعديل)
- إذا كلا الصورتين موجودتين، يُدمجان كمعرض واحد (gallery) للتمرير بينهما

### 3. تطبيقه على `ChatPartnerInfo.tsx`

- Avatar الشريك (w-20 h-20): إضافة onClick لفتح الصورة

### 4. تطبيقه على `ChatHeader.tsx`

- Avatar الشريك في هيدر المحادثة: فصل بين النقر لعرض الصورة (نقر على الصورة نفسها) وعرض معلومات الشريك (نقر على الاسم)
- أو: نقرة واحدة = معلومات الشريك (الحالي)، نقرة طويلة/مزدوجة = عرض الصورة

### 5. تطبيقه على باقي الأماكن الرئيسية

- `BusinessPagePreview.tsx` — صورة الغلاف والشعار
- `DigitalIdentityCard.tsx` — الشعار والغلاف
- `PartnersView.tsx` — صور الشركاء
- `DriverDashboard.tsx` — صورة السائق
- `SharedOrganizationView.tsx` — الغلاف والشعار
- `StoryViewer.tsx` / `StoryCircles.tsx` — صور القصص

## الملفات المتأثرة

| ملف | التغيير |
|-----|--------|
| `src/components/ui/ClickableImage.tsx` | **جديد** — مكون lightbox عام |
| `src/components/organization/ProfileHeader.tsx` | إضافة onClick على الغلاف والشعار |
| `src/components/chat/ChatPartnerInfo.tsx` | إضافة onClick على Avatar |
| `src/components/chat/ChatHeader.tsx` | تعديل سلوك النقر |
| `src/components/organization/BusinessPagePreview.tsx` | إضافة onClick |
| `src/components/dashboard/shared/DigitalIdentityCard.tsx` | إضافة onClick |
| `src/components/dashboard/PartnersView.tsx` | إضافة onClick |
| `src/components/sharing/renderers/SharedOrganizationView.tsx` | إضافة onClick |

## النتيجة

```text
أي صورة في المشروع:
  النقر → Lightbox بملء الشاشة
  إذا يوجد صور مجاورة → تمرير يمين/يسار
  أزرار: تنزيل + إغلاق + عداد
```

