

# خطة إصلاح: مشاكل الربط بين المحادثات والملاحظات والجهات المرتبطة

## المشاكل المكتشفة بعد البحث الشامل

### المشكلة 1: جدولان مختلفان للرسائل — تضارب البيانات
النظام يستخدم جدولين منفصلين:
- **`direct_messages`** — الرسائل المباشرة بين المنظمات (يستخدمه `useChat`, `ChatSidebar`, `useSharedMedia`)
- **`chat_messages`** — رسائل الغرف والمجموعات (يستخدمه `useGroupChat`, `useAutoChat`)

**لكن `EnhancedChatWidget.fetchLastSeenTimes`** (سطر 117) يستعلم من `chat_messages` لجلب آخر نشاط، بينما الرسائل الفعلية في `direct_messages` → النتيجة: "آخر ظهور" لا يظهر أبداً.

### المشكلة 2: قائمة الشركاء في الدردشة مبنية على الشحنات وليس الشراكات
**`EnhancedChatWidget.fetchPartners`** (سطر 132-179) يجلب الشركاء من جدول `shipments` فقط. هذا يعني:
- جهة مرتبطة عبر `verified_partnerships` لكن بدون شحنات مشتركة **لا تظهر في الدردشة**
- هذا يتعارض مع المبدأ الأساسي: الشركاء يُجلبون من `verified_partnerships`

بينما `EncryptedChatWidget` يستخدم `useLinkedPartners()` بشكل صحيح.

### المشكلة 3: `usePartners.ts` يعتمد على الشحنات أيضاً
الهوك `usePartners.ts` يجلب الشركاء بالكامل من `shipments` وليس من `verified_partnerships`. أي مكون يستخدم هذا الهوك سيفتقد الجهات المرتبطة التي ليس لها شحنات بعد.

### المشكلة 4: `useSharedShipments` مكرر بنسختين
- `src/hooks/useSharedShipments.ts` (الأصلي — يعتمد على `useAuth`)
- النسخة الجديدة أُنشئت ضمن المرحلة السابقة بنفس الاسم

### المشكلة 5: ملاحظات الشريك لا تُرسل للدردشة فعلياً
في `AddNoteDialog.tsx`، الخيار `sendToChat` موجود في الواجهة لكن `useNotes.ts` يستقبل `send_to_chat` كحقل دون تنفيذ فعلي لإرسال الملاحظة كرسالة دردشة.

### المشكلة 6: `DigitalIdentityCard` يستخدم عمود خاطئ
سطر 122 في `DigitalIdentityCard.tsx` يستخدم `target_org_id` بدلاً من `partner_org_id` في الاستعلام.

---

## خطة الإصلاح

### 1. توحيد مصدر الشركاء في `EnhancedChatWidget`
استبدال `fetchPartners` المبني على `shipments` بـ `useLinkedPartners()` من الهوك الموحد. هذا يضمن ظهور جميع الجهات المرتبطة في قائمة الدردشة.

### 2. إصلاح `fetchLastSeenTimes`
تغيير الجدول من `chat_messages` إلى `direct_messages` ليتطابق مع مصدر الرسائل الفعلي.

### 3. إصلاح `usePartners.ts`
تحويله ليستخدم `verified_partnerships` كمصدر أساسي بدلاً من `shipments`، مع الحفاظ على نفس الواجهة (generators, transporters, recyclers).

### 4. تفعيل إرسال الملاحظات للدردشة
في `useNotes.ts`، عند `send_to_chat === true`، إدراج رسالة فعلية في `direct_messages` تحتوي على محتوى الملاحظة مع `message_type: 'system'`.

### 5. إصلاح `DigitalIdentityCard`
تصحيح الاستعلام ليستخدم `partner_org_id` بدلاً من `target_org_id`.

---

## الملفات المتأثرة

| ملف | نوع التغيير |
|-----|------------|
| `src/components/chat/EnhancedChatWidget.tsx` | استبدال fetchPartners بـ useLinkedPartners + إصلاح fetchLastSeenTimes |
| `src/hooks/usePartners.ts` | إعادة بناء ليعتمد على verified_partnerships |
| `src/hooks/useNotes.ts` | تفعيل إرسال الملاحظة كرسالة دردشة |
| `src/components/dashboard/shared/DigitalIdentityCard.tsx` | تصحيح اسم العمود |

```text
الحالة الحالية (مكسورة):
  EnhancedChatWidget → shipments → شركاء ناقصين
  usePartners        → shipments → شركاء ناقصين
  fetchLastSeenTimes → chat_messages → لا بيانات
  sendToChat         → لا تنفيذ → ملاحظات لا تصل

بعد الإصلاح:
  EnhancedChatWidget → verified_partnerships → كل الشركاء ✓
  usePartners        → verified_partnerships → كل الشركاء ✓
  fetchLastSeenTimes → direct_messages → بيانات صحيحة ✓
  sendToChat         → direct_messages.insert → ملاحظات تصل ✓
```

