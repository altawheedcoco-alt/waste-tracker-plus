

# خطة: منظومة Mention متكاملة في الملاحظات والردود

## المشكلة الحالية
- حقل الرد في `NoteItem.tsx` (سطر 189) يستخدم `Textarea` عادي بدون دعم @mention أو #shipment
- لوحة الملاحظات في صفحة الدردشة `Chat.tsx` (سطر 445) تستخدم `Input` عادي أيضاً
- حقل التعديل في `NoteItem.tsx` (سطر 156) أيضاً بدون mention

## التغييرات المطلوبة

### 1. تطوير NoteItem.tsx - الردود والتعديل
- استبدال `Textarea` في حقل الرد (سطر 189) بـ `MentionInput` مع دعم `@users` و `#shipments`
- استبدال `Textarea` في حقل التعديل (سطر 156) بـ `MentionInput`
- إضافة hooks: `useMentionableUsers` و `useShipmentMentions`
- استخراج `mentioned_user_ids` من محتوى الرد وإرسالها مع `createNote.mutate`
- عرض المنشن بشكل مُنسق (تحويل `@[اسم](id)` إلى badge ملونة) في محتوى الملاحظة بدلاً من النص الخام

### 2. تطوير عرض المحتوى - Mention Rendering
- إنشاء مكون `MentionRenderer` يحوّل نص الملاحظة من markup (`@[name](id)` و `#[SHP-001](id)`) إلى عناصر تفاعلية:
  - @mention → badge بلون أخضر مع أيقونة مستخدم، قابل للنقر
  - #shipment → badge بلون أزرق مع أيقونة شحنة، يفتح بطاقة الشحنة عند النقر

### 3. إرسال إشعارات Mention من الردود
- ربط `useMentionNotifier` في الردود لإرسال إشعارات مزدوجة (داخلي + واتساب) عند ذكر مستخدم في رد
- تمرير السياق: "رد على ملاحظة في [اسم المورد]"

### 4. تحديث NotesPanel في Chat.tsx
- استبدال `Input` العادي بـ `MentionInput` مصغّر في لوحة الملاحظات بصفحة الدردشة

### 5. عرض المنشن في جميع الأماكن
- تطبيق `MentionRenderer` على محتوى الملاحظات في `NoteItem.tsx` (سطر 163) بدلاً من النص العادي
- تطبيقه أيضاً في لوحة ملاحظات الدردشة

## التفاصيل التقنية

**ملف جديد:**
- `src/components/notes/MentionRenderer.tsx` - مكون لتحويل markup المنشن إلى عناصر React تفاعلية

**ملفات معدّلة:**
- `src/components/notes/NoteItem.tsx` - استبدال Textarea بـ MentionInput + إضافة MentionRenderer + إشعارات
- `src/pages/dashboard/Chat.tsx` - تحديث حقل إدخال الملاحظات

