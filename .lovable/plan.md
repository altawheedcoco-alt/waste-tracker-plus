

# خطة: تطوير نظام المحادثات المشفرة — دعم الوسائط والملفات

## الوضع الحالي

1. **`EncryptedChatWidget`** (المحادثة المشفرة الفعلية المستخدمة في `DashboardLayout`) — يدعم **النصوص فقط**. لا يوجد زر إرفاق أو إرسال ملفات أو صور. حقل إدخال بسيط `<Textarea>` بدون أي خيارات وسائط.

2. **`EnhancedChatWidget`** (الدردشة العامة غير المشفرة) — يدعم الصور والفيديو والصوت والملفات عبر `EnhancedChatInput` و `sendFileMessage` في `useChat.ts`.

3. **`usePrivateChat.ts`** — الهوك المشفر يدعم حقول `file_url` و `file_name` و `message_type` في `sendMessage`، لكن لا أحد يستخدمها لأن الواجهة لا تدعم الإرفاق.

4. **حدود الملفات الحالية**: صور 10MB، فيديو 50MB، ملف واحد فقط في كل مرة.

## المشاكل المطلوب حلها

| المشكلة | التفاصيل |
|---------|----------|
| لا يمكن إرسال صور/فيديو/ملفات في المحادثة المشفرة | الواجهة لا تحتوي أزرار إرفاق |
| لا يمكن إرسال أكثر من ملف واحد | `handleFileSelect` يقبل ملف واحد فقط |
| حجم الملفات محدود | 10MB للصور و50MB للفيديو |
| الصور لا تُعرض بـ Lightbox/zoom في المحادثة المشفرة | `MiniMessageBubble` يعرض النص فقط |
| لا يوجد عرض للملفات/الفيديو في الفقاعات | نفس السبب |

## خطة الإصلاح

### 1. استبدال حقل الإدخال البسيط في `EncryptedChatWidget` بـ `EnhancedChatInput`

بدلاً من `<Textarea>` البسيط (سطر 470-487)، سيتم استخدام `EnhancedChatInput` الموجود بالفعل والذي يدعم:
- إرسال صور، فيديو، مستندات
- تسجيل صوتي
- إيموجي
- معاينة قبل الإرسال

### 2. إضافة `sendFileMessage` إلى `usePrivateChat.ts`

دالة جديدة تقوم بـ:
- رفع الملف إلى Storage (bucket: `organization-documents`)
- تشفير اسم الملف ونصه كـ JSON
- إرسال الرسالة المشفرة مع `file_url` و `file_name` و `message_type`

### 3. ترقية `MiniMessageBubble` لعرض الوسائط

تحويله من عرض نص فقط إلى عرض:
- **صور**: مع `onClick` لفتح `ImageLightbox` + zoom
- **فيديو**: مشغل فيديو مدمج
- **ملفات**: أيقونة + اسم الملف + رابط تحميل
- **صوت**: `VoiceMessagePlayer`

### 4. رفع حدود الملفات وتفعيل الإرسال المتعدد

- إزالة حدود الحجم (أو رفعها إلى 500MB)
- تعديل `EnhancedChatInput` لقبول `multiple` files
- إرسال كل ملف كرسالة مستقلة (حلقة)
- عرض شريط تقدم لكل ملف

### 5. تكامل `ImageLightbox` مع صور المحادثة المشفرة

جمع كل صور المحادثة وتمريرها كـ gallery للـ lightbox لتمكين التمرير يمين/يسار.

## الملفات المتأثرة

| ملف | التغيير |
|-----|--------|
| `src/components/chat/EncryptedChatWidget.tsx` | استبدال الإدخال البسيط بـ `EnhancedChatInput` + ترقية `MiniMessageBubble` |
| `src/hooks/usePrivateChat.ts` | إضافة `sendFileMessage` للمحادثات المشفرة |
| `src/components/chat/EnhancedChatInput.tsx` | دعم `multiple` files + رفع حدود الحجم |

## النتيجة

```text
قبل:
  EncryptedChatWidget → نصوص فقط، لا صور، لا ملفات
  حد الملف: 10MB، ملف واحد فقط

بعد:
  EncryptedChatWidget → نصوص + صور + فيديو + صوت + ملفات ✓
  الصور تُفتح بـ Lightbox مع zoom وتمرير ✓
  إرسال متعدد الملفات ✓
  حجم غير محدود ✓
```

