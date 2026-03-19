

# خطة إصلاح: زر "بدء محادثة" لا يعمل

## المشكلة

في `Chat.tsx` سطر 498، الكود يجلب `id` من جدول `profiles` ويستخدمه كـ `user_id`. لكن `profiles.id` هو معرّف صف الملف الشخصي وليس `user_id` الخاص بالمصادقة. بالتالي `getOrCreateConversation` يستقبل معرّف خاطئ ولا ينشئ/يفتح المحادثة بشكل صحيح.

## الإصلاح

### ملف واحد: `src/pages/dashboard/Chat.tsx`

**سطر 497-502** — تغيير الاستعلام من:
```typescript
.select('id')
// ...
const targetUserId = members[0].id;
```

إلى:
```typescript
.select('user_id')
// ...
const targetUserId = members[0].user_id;
```

هذا يضمن أن `getOrCreateConversation` يستقبل `auth.users.id` الصحيح فتُنشأ المحادثة وتُفتح مباشرة.

## النتيجة

```text
الضغط على "بدء محادثة" في صفحة الجهة
  → الانتقال إلى /dashboard/chat?partnerId=xxx
  → جلب user_id الصحيح من profiles
  → فتح/إنشاء المحادثة المشفرة
  → عرض نافذة الدردشة مباشرة ✓
```

