

# خطة إصلاح 3 مشاكل في الدردشة

## المشكلة 1: أوامر Slash لا تجلب بيانات فعلية
**السبب**: عند اختيار أمر مثل `/shipment`، يفتح `ChatResourcePicker` الذي يجلب البيانات من Supabase — هذا يعمل فعلاً. لكن المشكلة أن `ChatResourcePicker` يستخدم `ScrollArea` الذي قد لا يعمل جيداً، والنتائج محدودة بـ 30 عنصراً بدون شريط تمرير واضح.

**الحل**: استبدال `ScrollArea` بـ `overflow-y-auto` أصلي مع ارتفاع ثابت في `ChatResourcePicker`، وإضافة عدّاد النتائج.

## المشكلة 2: @mention يعرض جميع الجهات وليس فقط أطراف المحادثة الحالية
**السبب**: `EnhancedChatInput` يستخدم `useMentionableEntities()` الذي يجلب **كل** الشركاء والأعضاء بدون تصفية. لا يعرف من هو الطرف الآخر في المحادثة.

**الحل**:
- إضافة prop جديد `chatPartnerOrgId?: string` لـ `EnhancedChatInput`
- تمريره من `EncryptedChatWidget` (من `selectedConvo?.partner?.organization_id`) ومن `EnhancedChatWidget` (من `selectedPartner?.id`)
- تصفية `filteredMentions` ليعرض فقط: أعضاء جهتي + الجهة المحادَثة وأعضاؤها

## المشكلة 3: لا يوجد شريط تمرير في قوائم Slash و @mention
**السبب**: `ScrollArea` المستخدم في القوائم المنسدلة لا يعرض شريط تمرير مرئي.

**الحل**: استبدال `ScrollArea` بـ `div` مع `overflow-y-auto` وشريط تمرير مرئي عبر CSS class مخصص، في:
- `SlashCommandMenu.tsx`
- قائمة @mention في `EnhancedChatInput.tsx`
- `ChatResourcePicker.tsx`

## الملفات المتأثرة

| الملف | التعديل |
|---|---|
| `EnhancedChatInput.tsx` | إضافة prop `chatPartnerOrgId` + تصفية mentions حسب المحادثة + استبدال ScrollArea |
| `EncryptedChatWidget.tsx` | تمرير `chatPartnerOrgId` من `selectedConvo` |
| `EnhancedChatWidget.tsx` | تمرير `chatPartnerOrgId` من `selectedPartner` |
| `SlashCommandMenu.tsx` | استبدال ScrollArea بتمرير أصلي مع شريط مرئي |
| `ChatResourcePicker.tsx` | استبدال ScrollArea بتمرير أصلي مع شريط مرئي |

