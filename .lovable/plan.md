

# خطة تطوير الهوية البصرية لـ iRecycle

## الوضع الحالي

- اللوجو الحالي: صورة PNG ثابتة (`src/assets/logo.png`) بدون مرونة في الألوان أو الأحجام
- الاسم منتشر في 144+ ملف كنص ثابت "iRecycle" و"آي ريسايكل"
- الألوان الأساسية: أخضر `#16a34a` / teal `#0d9488` — غير موحدة
- لا يوجد لوجو SVG قابل للتكبير بجودة عالية

---

## ما سيتم تطويره

### 1. لوجو SVG احترافي جديد (مكون React)

إنشاء مكون `IRecycleLogo.tsx` كـ SVG متجه يتضمن:
- **أيقونة**: رمز ♻ مدمج مع حرف "i" بتصميم عصري دائري
- **النص**: "iRecycle" بخط عصري + "آي ريسايكل" تحته
- قابل للتحكم بالحجم واللون (فاتح/داكن/أبيض)
- يعمل في كل الأحجام: favicon صغير ← hero كبير ← طباعة

### 2. تحديث `PlatformLogo.tsx`

- استبدال صورة PNG باللوجو SVG الجديد
- دعم أوضاع: `icon-only` | `full` | `stacked`
- تحسين الأداء (SVG inline بدل تحميل صورة)

### 3. توحيد لوحة الألوان

تحديث `tokens.css`:
- توحيد اللون الأساسي على `160 68% 40%` (الأخضر الحالي)
- تحديث `theme-color` في `index.html` ليتوافق
- توحيد ألوان العلامة التجارية في مكان واحد

### 4. تحديث Favicon

- إنشاء favicon جديد من اللوجو SVG
- تحديث `favicon.ico` و `favicon.png`

### 5. تحديث المراجع في المشروع

- `manifest.json`: تحديث الاسم والأيقونات
- `index.html`: تحديث العناوين والوصف و theme-color
- `usePageTitle.ts`: توحيد اسم التبويب
- `useBranding.ts`: تحديث القيم الافتراضية
- `SharedResourceLayout.tsx`: استخدام اللوجو الجديد
- `Footer.tsx` / `Header.tsx`: اللوجو الجديد

### 6. تحديث صفحة Auth

- تطوير شكل اللوجو في صفحة تسجيل الدخول

---

## الملفات المتأثرة

| ملف | التعديل |
|---|---|
| **جديد** `src/components/common/IRecycleLogo.tsx` | مكون SVG اللوجو الجديد |
| `src/components/common/PlatformLogo.tsx` | استخدام SVG بدل PNG |
| `src/styles/tokens.css` | توحيد ألوان العلامة |
| `index.html` | عنوان + meta + favicon |
| `public/manifest.json` | اسم وأيقونات |
| `src/hooks/useBranding.ts` | القيم الافتراضية |
| `src/hooks/usePageTitle.ts` | عنوان التبويب |
| `src/components/sharing/SharedResourceLayout.tsx` | اللوجو |
| `src/utils/platformTaglines.ts` | شعارات محدثة |

---

## التصميم المقترح للوجو

```text
  ┌─────────────────────────┐
  │                         │
  │     ╭──────────╮        │
  │     │  ♻️  i   │        │
  │     ╰──────────╯        │
  │                         │
  │     i R e c y c l e     │
  │     آ ي  ر ي س ا ي ك ل │
  │                         │
  │  Waste Management System│
  └─────────────────────────┘

  الأيقونة: دائرة خضراء بداخلها
  رمز إعادة التدوير مدمج مع "i"
  
  الألوان:
  - أخضر رئيسي: #22996E (160° 68% 40%)
  - أخضر داكن: #1A7A54
  - تيل مكمل: #2B8A8A
```

اللوجو سيكون SVG Vector — يعني جودة مثالية في كل الأحجام من 16px favicon لحد banner كبير، بدون أي تشويش.

