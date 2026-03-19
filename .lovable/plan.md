

# خطة: نظام الربط التكاملي بين الشحنات والملاحظات والدردشة

## الفكرة المُعاد صياغتها

بناء طبقة ربط (Linking Layer) تجعل الشحنات والملاحظات والمحادثات كيانات مترابطة:

1. **الإشارة للشحنة (#) في الملاحظات والدردشة** — كتابة `#SHP-001` تحول النص لبطاقة شحنة تفاعلية قابلة للنقر
2. **تبويب محادثات مباشرة داخل بطاقة الشحنة** — محادثة مع الناقل، المدور، السائق مباشرة من صفحة الشحنة
3. **تبويب ملاحظات داخل بطاقة الشحنة** — ملاحظات مرتبطة بالشحنة تظهر أيضاً في دردشة الطرف المعني
4. **@mention محسّن** — إشارة للأعضاء والجهات داخل الدردشة والملاحظات معاً

---

## المراحل التقنية

### المرحلة 1: إشارة الشحنة (#mention) في الملاحظات والدردشة

**ملفات جديدة:**
- `src/hooks/useShipmentMentions.ts` — هوك للبحث عن الشحنات بالرقم أثناء الكتابة (يجلب من جدول `shipments` بفلتر `organization_id`)
- `src/components/ui/shipment-mention-chip.tsx` — بطاقة مصغرة (Chip) تعرض رقم الشحنة + الحالة + نوع المخلف، قابلة للنقر لفتح التفاصيل

**ملفات معدلة:**
- `src/components/ui/mention-input.tsx` — إضافة دعم `#` بجانب `@` لتفعيل قائمة الشحنات
- `src/components/ui/mentionable-field.tsx` — نفس التعديل
- `src/components/notes/AddNoteDialog.tsx` — استبدال `Textarea` بـ `MentionInput` المحسّن لدعم `@` و `#`
- `src/components/chat/EnhancedChatInput.tsx` — إضافة دعم `#shipment` في حقل الدردشة
- `src/components/chat/EnhancedChatMessages.tsx` — عرض بطاقة الشحنة المصغرة داخل فقاعة الرسالة

### المرحلة 2: تبويب المحادثات داخل بطاقة الشحنة

**ملفات جديدة:**
- `src/components/shipments/ShipmentChatTab.tsx` — تبويب يعرض قائمة الأطراف المرتبطة (ناقل، مدور، سائق) مع زر فتح محادثة مباشرة لكل طرف. يستخدم `useChat` الموجود مع تمرير `partnerId` المناسب

**ملفات معدلة:**
- `src/components/shipments/ShipmentCard.tsx` — إضافة تبويب "المحادثات" ضمن التبويبات الموجودة في بطاقة الشحنة المفصلة

### المرحلة 3: تبويب الملاحظات المتكامل في بطاقة الشحنة

**ملفات معدلة:**
- `src/components/shipments/ShipmentCard.tsx` — إضافة تبويب "الملاحظات" يستخدم `NotesPanel` الموجود مع `resourceType="shipment"` و `resourceId={shipment.id}`
- `src/components/notes/AddNoteDialog.tsx` — إضافة حقل اختياري `linked_shipment_id` لربط الملاحظة بشحنة محددة
- `src/hooks/useNotes.ts` — تمرير `linked_shipment_id` عند الإنشاء

**ترحيل قاعدة بيانات:**
- إضافة عمود `linked_shipment_id uuid REFERENCES shipments(id)` لجدول `notes` — يسمح بربط أي ملاحظة بشحنة بغض النظر عن `resource_type`

### المرحلة 4: مزامنة الملاحظات مع الدردشة (Cross-posting)

**ملفات جديدة:**
- `src/components/notes/NoteInChatBubble.tsx` — مكون يعرض الملاحظة داخل فقاعة الدردشة بتصميم مميز (خلفية صفراء + أيقونة ملاحظة) عند إرسالها كـ "ملاحظة مشتركة"

**ملفات معدلة:**
- `src/components/notes/AddNoteDialog.tsx` — عند اختيار visibility = "partner"، خيار إضافي "أرسل كرسالة دردشة أيضاً" يقوم بإرسال نسخة من الملاحظة كرسالة في المحادثة المباشرة مع الطرف المعني
- `src/components/chat/EnhancedChatMessages.tsx` — عرض الرسائل من نوع `note_share` بتصميم بطاقة ملاحظة

---

## ملخص التأثير

```text
┌──────────────┐     #SHP-001     ┌──────────────┐
│   الملاحظات   │ ◄──────────────► │   الشحنات    │
│  (Notes)     │                  │ (Shipments)  │
└──────┬───────┘                  └──────┬───────┘
       │  cross-post                     │  chat tab
       ▼                                 ▼
┌──────────────┐     @mention     ┌──────────────┐
│   الدردشة    │ ◄──────────────► │   الأطراف    │
│   (Chat)     │                  │ (Partners)   │
└──────────────┘                  └──────────────┘
```

- ترحيل واحد لقاعدة البيانات (عمود `linked_shipment_id`)
- ~6 ملفات جديدة، ~7 ملفات معدلة
- يعتمد بالكامل على البنية الموجودة (`useNotes`, `useChat`, `MentionInput`, `NotesPanel`)

