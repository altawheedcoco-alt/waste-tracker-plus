

# خطة تطوير نظام الدردشة — 3 محاور رئيسية

---

## المشكلة الأولى: علامات قراءة الرسائل (نمط واتساب)

### الوضع الحالي
- النظام يدعم حالات `sending | sent | delivered | read` في `optimisticMessages.ts` و `usePrivateChat.ts`
- عند استقبال رسالة جديدة، يتم تحديثها لـ `delivered` تلقائياً (سطر 291-296 في `usePrivateChat.ts`)
- `markAsRead` يحدّث الحالة لـ `read` مع `read_at`
- **المشكلة**: واجهة العرض في `EnhancedChatMessages.tsx` تعرض فقط حالتين بصرياً:
  - `is_read = true` → ✓✓ أزرق
  - غير ذلك → ✓ رمادي واحد
  - لا تفرق بين `sent` و `delivered`

### الحل
- تعديل `getMessageStatus` في `EnhancedChatMessages.tsx` ليعرض 3 حالات:
  - **✓ واحدة رمادية** = `sent` (وصلت للسيرفر)
  - **✓✓ رمادية** = `delivered` (وصلت للمستلم)
  - **✓✓ زرقاء** = `read` (تمت القراءة)
- تعديل `ChatSidebar.tsx` بنفس المنطق (حالياً يعرض حالتين فقط)
- إضافة حالة `sending` بصرياً (ساعة/loader) للرسالة أثناء الإرسال

---

## المشكلة الثانية: بطء إرسال الرسائل

### الوضع الحالي
- `handleSend` في `EncryptedChatWidget.tsx` ينتظر `sendMessage` ثم يعيد جلب كل الرسائل (`fetchMessages`) قبل تحديث الواجهة
- `sendMessage` في `usePrivateChat.ts` يرسل `emitChatSync` تفاؤلياً لكن الواجهة الفعلية لا تستخدمه — تنتظر الـ re-fetch الكامل

### الحل
- تعديل `handleSend` في `EncryptedChatWidget.tsx`:
  1. إضافة الرسالة مباشرة لقائمة `messages` المحلية (optimistic) قبل انتظار السيرفر
  2. بعد نجاح الإرسال: تحديث الـ `id` والحالة للرسالة الحقيقية
  3. عند الفشل: إظهار علامة خطأ مع زر إعادة المحاولة
- تطبيق نفس النمط في `EnhancedChatWidget.tsx`

---

## المشكلة الثالثة: تفعيل @mention داخل الدردشة والملاحظات

### الوضع الحالي
- نظام `MentionableField` موجود ويعمل كحقل إدخال مستقل
- `useMentionableEntities` يجلب المستخدمين والشركاء المرتبطين
- حقل الإدخال في الدردشة (`EnhancedChatInput.tsx`) هو `textarea` عادي بدون دعم mentions

### الحل
- تعديل `EnhancedChatInput.tsx` لإضافة منطق الـ @mention:
  1. كشف كتابة `@` في الـ textarea
  2. عرض قائمة منسدلة بالجهات والأعضاء المرتبطين (من `useMentionableEntities`)
  3. عند الاختيار: إدراج اسم الشخص/الجهة في النص مع تنسيق مميز
  4. عند الإرسال: إرسال إشعار للشخص/الجهة المذكورة
- تطبيق نفس المنطق في حقل إدخال الملاحظات

---

## ملخص الملفات المتأثرة

| الملف | التعديل |
|---|---|
| `EnhancedChatMessages.tsx` | 3 حالات بصرية لعلامات القراءة |
| `ChatSidebar.tsx` | 3 حالات في قائمة المحادثات |
| `EncryptedChatWidget.tsx` | إرسال تفاؤلي فوري |
| `EnhancedChatWidget.tsx` | إرسال تفاؤلي فوري |
| `EnhancedChatInput.tsx` | دعم @mention داخل textarea |
| `usePrivateChat.ts` | إرجاع الرسالة المؤقتة فوراً |
| ملف ملاحظات (notes input) | دعم @mention |

