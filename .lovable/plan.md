

# خطة تنسيق الوضع النهاري والليلي — الصفحة الرئيسية وملحقاتها

## المشاكل المكتشفة

### 1. DocumentAIShowcase.tsx — 4 مشاكل
- **سطر 113**: `bg-gradient-to-b from-[hsl(200,30%,96%)] to-white` — خلفية بيضاء ثابتة لا تتغير في الوضع الليلي
- **سطر 378**: نفس المشكلة بالضبط
- **سطر 462**: `bg-gradient-to-l from-[hsl(200,30%,96%)] to-white` — نفس المشكلة
- **سطر 721**: `border-[hsl(200,30%,90%)]` — حد ثابت لا يتكيف

### 2. PostDetail.tsx — مشكلة واحدة
- **سطر 270**: `prose-stone` ينتج نصوص رمادية داكنة لا تظهر على خلفية الوضع الليلي

### 3. WhatsAppShowcase.tsx — مشكلة طفيفة
- **سطر 281**: `bg-white text-green-700` — زر ثابت بخلفية بيضاء (مقبول لأنه زر CTA على خلفية خضراء، لكن يمكن تحسينه)

### 4. PlatformPosts.tsx — ✅ سليمة (تستخدم tokens صحيحة)
### 5. باقي صفحات Landing — ✅ سليمة

---

## خطة الإصلاح

### الملف 1: `src/components/landing/DocumentAIShowcase.tsx`
| السطر | الحالي | الجديد |
|-------|--------|--------|
| 113 | `from-[hsl(200,30%,96%)] to-white` | `from-muted/50 to-background` |
| 378 | `from-[hsl(200,30%,96%)] to-white` | `from-muted/50 to-background` |
| 462 | `from-[hsl(200,30%,96%)] to-white` | `from-muted/50 to-background` |
| 721 | `border-[hsl(200,30%,90%)]` | `border-border` |

### الملف 2: `src/pages/PostDetail.tsx`
| السطر | الحالي | الجديد |
|-------|--------|--------|
| 270 | `prose prose-lg prose-stone dark:prose-invert` | `prose prose-lg dark:prose-invert` |

### النتيجة المتوقعة
- الوضع النهاري: خلفيات فاتحة طبيعية مع نصوص داكنة واضحة
- الوضع الليلي: خلفيات داكنة تتبع `--background` و `--muted` مع نصوص فاتحة واضحة
- لا تأثير على أي مكونات أخرى — التغييرات محصورة في الأماكن المحددة

