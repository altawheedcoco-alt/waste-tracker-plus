

## تشخيص المشكلتين

### المشكلة 1: التأخير (~2+ دقائق)
السبب: الإشعارات تُرسل عبر **database trigger** (`trg_dispatch_channels`) الذي يستخدم `net.http_post` (pg_net). هذه الدالة غير متزامنة وتعمل بنظام طوابير داخل PostgreSQL — قد تتأخر من 30 ثانية إلى عدة دقائق حسب الحمل. هذا تأخير بنيوي في pg_net وليس في FCM نفسه.

### المشكلة 2: الضغط على الإشعار لا يفتح الصفحة المناسبة
السبب: الـ DB trigger يُرسل `data` بدون حقل `url`:
```json
{"notification_id": "...", "type": "info"}
```
وفي `sendFCMNotification` يتم تمرير `data` كما هي بدون إضافة `url`. وفي `firebase-messaging-sw.js` يقرأ `event.notification.data?.url || '/'` — فلا يجد URL فيفتح الصفحة الرئيسية دائماً.

---

## خطة الإصلاح

### 1. إصلاح التوجيه عند الضغط على الإشعار
- **في DB trigger** (`dispatch_notification_to_channels`): إضافة حقل `url` للـ push payload بناءً على نوع الإشعار (`type`). مثلاً: `shipment` → `/shipments`, `message` → `/chat`, `financial` → `/financial`.
- **في `sendFCMNotification`** (دالة send-push): تمرير `data.url` في حقل `webpush.fcm_options.link` وفي `data` لضمان وصوله للـ Service Worker.
- **في `firebase-messaging-sw.js`**: التأكد من قراءة `payload.data.url` وفتحه عند النقر (موجود بالفعل).

### 2. تقليل التأخير
- **في DB trigger**: استبدال `net.http_post` بنسخة تضيف `timeout` أقل أو إرسال مباشر من الكود (client-side) عند إنشاء الإشعارات من واجهة المستخدم.
- بديل: إضافة استدعاء مباشر لـ `send-push` من كود الـ React عند الأحداث التفاعلية (الرسائل، الشحنات) بدلاً من الاعتماد فقط على الـ trigger — وهذا مطبق جزئياً في `useChat` بالفعل.

### 3. تفاصيل تقنية

**Migration جديدة** — تحديث دالة `dispatch_notification_to_channels`:
```sql
-- إضافة url بناءً على النوع
v_url := CASE 
  WHEN NEW.type = 'shipment' THEN '/shipments'
  WHEN NEW.type = 'message' THEN '/chat'
  WHEN NEW.type = 'financial' THEN '/financial'
  WHEN NEW.type = 'system' THEN '/notifications'
  ELSE '/notifications'
END;

v_push_payload := jsonb_build_object(
  'user_id', NEW.user_id::text,
  'title', NEW.title,
  'body', NEW.message,
  'data', jsonb_build_object(
    'notification_id', NEW.id::text,
    'type', COALESCE(NEW.type, 'info'),
    'url', v_url
  )
);
```

**تحديث `sendFCMNotification`** في `send-push/index.ts`:
```typescript
webpush: {
  notification: { icon: "/favicon.png", badge: "/favicon.png", dir: "rtl", lang: "ar" },
  fcm_options: { link: payload.data?.url || "/" },
  data: payload.data || {},
},
```

**الملفات المتأثرة:**
1. `supabase/functions/send-push/index.ts` — إضافة `url` في FCM webpush options
2. Migration SQL — تحديث الـ trigger لتضمين URL
3. `public/firebase-messaging-sw.js` — لا تغيير (يدعم `data.url` بالفعل)

