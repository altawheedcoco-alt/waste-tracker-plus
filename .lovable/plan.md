

# خطة: ترقية عارض الصور + حماية الملف الشخصي (Profile Photo Protection)

## كيف يعمل النظام في WhatsApp و Facebook؟

| التقنية | WhatsApp | Facebook |
|---------|----------|----------|
| منع Screenshot | نعم (FLAG_SECURE على Android) | لا |
| منع Right-click Save | غير متاح (تطبيق أصلي) | نعم (CSS + JS) |
| منع Drag & Drop | غير متاح | نعم |
| إخفاء URL المباشر | نعم (لا يوجد رابط مباشر) | نعم (Canvas rendering) |
| التحكم بمن يرى الصورة | نعم (الجميع/جهات الاتصال/لا أحد) | نعم (عام/أصدقاء/خاص) |

**الواقع التقني**: في تطبيق ويب، لا يمكن منع Screenshot فعلياً (هذه ميزة نظام تشغيل). لكن يمكن إضافة **احتكاك كبير** يمنع 99% من المستخدمين العاديين.

## ما سنطبقه

### 1. حماية الصورة في Lightbox (لغير صاحب الحساب)

إضافة prop `protected` إلى `ImageLightbox` و `ClickableImage`:
- **منع Right-click**: `onContextMenu={e => e.preventDefault()}`
- **منع Drag**: `draggable={false}` (موجود) + `user-select: none` + `-webkit-touch-callout: none`
- **إخفاء زر التنزيل والمشاركة**: عندما `protected=true`
- **رسم على Canvas**: بدلاً من `<img>` مباشر، يُرسم على Canvas مما يمنع "Save Image As" ويخفي URL من DevTools
- **طبقة شفافة (Overlay)**: div شفاف فوق الصورة يمنع التفاعل المباشر معها

### 2. إعداد خصوصية الصورة الشخصية (Privacy Setting)

إضافة عمود `profile_photo_privacy` في جدول `profiles`:
- `everyone` — الجميع يرى الصورة (الافتراضي)
- `partners` — الشركاء المرتبطون فقط
- `nobody` — لا أحد (تظهر أيقونة افتراضية)

### 3. ترقية تجربة Lightbox

- إضافة **Pinch-to-zoom** للموبايل (touch gestures)
- إضافة **سحب للإغلاق** (drag down to close)
- تحسين الانتقال بين الصور (swipe animation)

## الملفات المتأثرة

| ملف | التغيير |
|-----|--------|
| `src/components/chat/ImageLightbox.tsx` | إضافة وضع protected: Canvas rendering + منع تنزيل + pinch zoom + swipe |
| `src/components/ui/ClickableImage.tsx` | إضافة prop `protected` وتمريره لـ Lightbox |
| `src/components/organization/ProfileHeader.tsx` | تمرير `protected={!isOwner}` |
| `src/components/chat/ChatHeader.tsx` | تمرير `protected` |
| `src/components/chat/ChatPartnerInfo.tsx` | تمرير `protected` |
| باقي الأماكن المستخدمة لـ ClickableImage | تمرير `protected` حسب السياق |
| **Migration** | إضافة `profile_photo_privacy` إلى profiles |

## النتيجة

```text
صاحب الحساب يرى صوره:
  → زر تنزيل ✓، مشاركة ✓، right-click عادي ✓

أي شخص آخر يرى الصورة:
  → Canvas rendering (لا يوجد <img> في DOM)
  → لا زر تنزيل ✗
  → لا right-click save ✗
  → لا drag & drop ✗
  → طبقة حماية شفافة ✓
  → Zoom فقط للمعاينة ✓
```

