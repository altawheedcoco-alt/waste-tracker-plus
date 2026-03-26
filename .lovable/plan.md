

# خطة: تطوير منظومة إشعارات Push - المستوى التالي

## التحليل - ما ينقص حالياً

بعد فحص الكود بالكامل، هناك **8 تطويرات جوهرية** مفقودة:

### 1. قوالب الإشعارات الجاهزة (Notification Templates)
لا يوجد نظام قوالب — المدير يكتب كل مرة من الصفر. الحل: جدول `push_templates` يحفظ قوالب شائعة (ترحيب، تحديث شحنة، صيانة، عروض) مع إمكانية استخدام متغيرات مثل `{user_name}` و `{shipment_id}`.

### 2. جدولة الإرسال (Scheduled Campaigns)
حالياً الإرسال فوري فقط. الحل: إضافة خيار جدولة (تاريخ + وقت) مع عمود `scheduled_at` و `status` (draft/scheduled/sent/failed) في جدول `push_campaigns`.

### 3. إحصائيات الحملة التفصيلية (Campaign Analytics)
حالياً فقط `total_sent` و `total_failed`. ينقص:
- جدول `push_campaign_recipients` لتتبع كل مستلم بشكل فردي (هل وصل؟ هل قرأ؟)
- نسبة الفتح (Click-Through Rate) عبر تتبع الروابط
- رسم بياني لأداء الحملات عبر الزمن

### 4. إعادة الإرسال للحملات الفاشلة (Retry Failed)
لا يوجد زر "أعد الإرسال" للحملات التي فشلت جزئياً — مهم جداً.

### 5. تصدير البيانات (Export)
لا يوجد تصدير CSV للمشتركين أو سجل الحملات — مطلوب للتقارير.

### 6. إشعارات مجدولة ذكية (Smart Triggers)
إضافة قواعد تلقائية مثل: "أرسل إشعار ترحيب بعد أول اشتراك" أو "ذكّر المستخدم الذي لم يزر منذ 7 أيام".

### 7. معاينة على الجهاز (Device Preview)
معاينة شكل الإشعار الحالية بسيطة جداً — تحسينها لتحاكي شكل إشعار الهاتف الفعلي.

### 8. فلتر متقدم لسجل الإشعارات
لا يوجد فلتر بالنوع أو التاريخ أو حالة القراءة في تبويب "سجل الإشعارات".

---

## ما سيتم تنفيذه

### تغييرات قاعدة البيانات (Migration)

```sql
-- قوالب الإشعارات
CREATE TABLE push_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  type text DEFAULT 'general',
  priority text DEFAULT 'normal',
  url text,
  icon text, -- emoji أو أيقونة
  created_by uuid,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- تتبع كل مستلم لكل حملة
CREATE TABLE push_campaign_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES push_campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text DEFAULT 'pending', -- pending, sent, failed, expired
  error_message text,
  delivered_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- إضافة أعمدة للجدولة في push_campaigns
ALTER TABLE push_campaigns ADD COLUMN status text DEFAULT 'sent';
ALTER TABLE push_campaigns ADD COLUMN scheduled_at timestamptz;
ALTER TABLE push_campaigns ADD COLUMN template_id uuid;
```

### تطوير واجهة PushNotificationStats.tsx

1. **تبويب جديد "القوالب"**: عرض/إنشاء/تعديل/حذف قوالب، مع زر "استخدم القالب" ينقل البيانات لمركز الإرسال
2. **الجدولة**: إضافة DateTimePicker في مركز الإرسال مع خيار "إرسال فوري / جدولة"
3. **تفاصيل الحملة**: عند الضغط على حملة تظهر قائمة المستلمين مع حالة كل واحد + زر "أعد الإرسال للفاشلة"
4. **فلتر السجل**: فلتر بالنوع والتاريخ وحالة القراءة
5. **زر تصدير CSV**: في تبويبي المشتركين وسجل الحملات
6. **معاينة هاتف**: تحويل المعاينة لشكل يحاكي إشعار Android/iOS الحقيقي
7. **رسم بياني زمني**: خط بياني يوضح عدد الحملات المرسلة يومياً/أسبوعياً

### تطوير Edge Function

- دعم `action: "retry_failed"` لإعادة إرسال الفاشلة
- حفظ تفاصيل كل مستلم في `push_campaign_recipients`
- دعم `action: "scheduled"` (يُستخدم مع cron أو manual trigger)

### الملفات المتأثرة
- `src/pages/dashboard/PushNotificationStats.tsx` — إضافة التبويبات والميزات الجديدة
- `supabase/functions/send-push/index.ts` — دعم Retry والتتبع التفصيلي
- Migration جديد للجداول

## النتيجة
مركز إدارة إشعارات **احترافي بالكامل** مع: قوالب جاهزة، جدولة، تتبع تفصيلي لكل مستلم، إعادة إرسال، تصدير، وتحليلات بصرية.

