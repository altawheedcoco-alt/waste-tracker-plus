

# اصلاح مشكلة عرض النسخة القديمة على الموبايل

## المشكلة
التطبيق عالق على شاشة اللوجو (splash screen) ولا يحمّل آخر نسخة. السبب الجذري: `cacheBuster.ts` يعمل **قبل** تحميل التطبيق ويستدعي `window.location.reload()` مما يسبب دورة إعادة تحميل لا نهائية أو تعليق. بالإضافة لأن الـ Service Worker القديم المخزن على جهاز المستخدم يقدم ملفات قديمة قبل أن يتمكن الكود الجديد من العمل.

## الحل (3 تغييرات بسيطة)

### 1. حذف cacheBuster من main.tsx
إزالة استدعاء `bustStaleCaches()` من `main.tsx` لأنه يسبب reload loops ويمنع التطبيق من التحميل. التطبيق يجب أن يعمل مباشرة بدون انتظار تنظيف الكاش.

### 2. تبسيط cacheBuster.ts
تحويله لوظيفة خفيفة تعمل **بعد** تحميل التطبيق (غير blocking)، بدون أي `window.location.reload()`. فقط تنظف الكاش القديم في الخلفية.

### 3. إضافة no-cache meta tags في index.html
إضافة `Cache-Control` meta tag لـ `index.html` لمنع المتصفح من تخزين الصفحة الرئيسية، وإضافة `navigateFallbackDenylist` لمسار `/~oauth` في إعدادات PWA.

## النتيجة
- التطبيق يفتح فوراً بدون تعليق
- الـ Service Worker الموجود أصلاً (NetworkFirst + skipWaiting) يضمن جلب أحدث الملفات
- لا reload loops

## التفاصيل التقنية

| الملف | التغيير |
|-------|---------|
| `src/main.tsx` | إزالة import واستدعاء `bustStaleCaches` - التطبيق يحمّل مباشرة |
| `src/lib/cacheBuster.ts` | تبسيط: تنظيف خلفي بدون reload، يُستدعى بعد التحميل |
| `index.html` | إضافة `<meta http-equiv="Cache-Control" content="no-cache">` |
| `vite.config.ts` | إضافة `navigateFallbackDenylist: [/^\/~oauth/]` لإعدادات PWA |
| `src/App.tsx` | استدعاء cacheBuster بشكل غير blocking بعد تحميل التطبيق |

