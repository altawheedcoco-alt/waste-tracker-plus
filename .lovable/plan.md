

# خطة: مركز إدارة إشعارات Push المتكامل لمدير النظام

## الفكرة

نعم، بناء منظومة إدارة مركزية للإشعارات عند مدير النظام سيكون **أكثر فعالية بكثير** من الوضع الحالي، لأن:
- حالياً الإشعارات تُرسل تلقائياً فقط عند إدراج سجل في جدول `notifications` — لا يوجد تحكم يدوي احترافي
- تبويب "الإرسال الاختباري" الموجود بسيط جداً (عنوان + نص فقط)
- لا يوجد نظام لإدارة من يستلم ومن لا يستلم، ولا جدولة، ولا قوالب

## ما سيتم بناؤه

### 1. ترقية صفحة `PushNotificationStats.tsx` بإضافة تبويبات جديدة:

**تبويب "مركز الإرسال" (Send Center)** — يحل محل تبويب "اختبار" الحالي:
- اختيار نوع الإشعار (عام، شحنة، طوارئ، نظام، تسويقي)
- اختيار الأولوية (عادي، مهم، عاجل)
- اختيار المستلمين بـ 4 طرق:
  - جميع المشتركين
  - مستخدم/مستخدمين محددين (multi-select)
  - حسب نوع الجهة (ناقل، مولد، مدور، إلخ)
  - حسب المنظمة
- حقل عنوان + نص + رابط اختياري (URL يفتح عند الضغط)
- زر إرسال فوري + زر معاينة

**تبويب "التحكم بالمشتركين" (Subscriber Control)**:
- قائمة كل المشتركين مع toggle تفعيل/إيقاف لكل مستخدم
- إمكانية حظر مستخدم من استقبال الإشعارات
- فلتر حسب المنصة والجهة والحالة

**تبويب "سجل الإرسال" (Delivery Log)**:
- تتبع كل إشعار: مَن أرسله، لمَن، متى، هل وصل أم فشل
- إحصائيات نسبة الوصول (sent/failed)

### 2. تغييرات قاعدة البيانات:

```sql
-- جدول لتتبع الإرسال اليدوي من المدير
CREATE TABLE push_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES auth.users(id),
  title text NOT NULL,
  body text NOT NULL,
  type text DEFAULT 'general',
  priority text DEFAULT 'normal',
  target_type text DEFAULT 'all', -- all, specific, org_type, organization
  target_ids text[], -- user_ids or org_ids
  target_org_type text,
  total_sent int DEFAULT 0,
  total_failed int DEFAULT 0,
  url text,
  created_at timestamptz DEFAULT now()
);

-- جدول لحظر مستخدمين من الإشعارات
CREATE TABLE push_blacklist (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id),
  blocked_by uuid REFERENCES auth.users(id),
  reason text,
  created_at timestamptz DEFAULT now()
);
```

### 3. تعديل Edge Function `send-push`:
- إضافة action `campaign` لإرسال حملة مع فلترة المحظورين
- فلترة `push_blacklist` قبل الإرسال
- تسجيل النتائج في `push_campaigns`

### 4. الملفات المتأثرة:
- `src/pages/dashboard/PushNotificationStats.tsx` — إعادة بناء التبويبات
- `supabase/functions/send-push/index.ts` — إضافة دعم الحملات والحظر
- Migration جديد للجداول

## النتيجة
مدير النظام سيتحكم بشكل كامل في: **مَن يستلم، ماذا يستلم، متى يستلم** — مع سجل تدقيق كامل لكل عملية إرسال.

