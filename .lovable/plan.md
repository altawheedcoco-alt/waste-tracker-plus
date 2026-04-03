

# خطة بناء منظومة الاتصال الكاملة (WhatsApp-Style)

## المشكلة الحالية

النظام الموجود فيه الأجزاء التالية تعمل:
- WebRTC hook (`useWebRTCCall`) يدعم الاتصال P2P + تسجيل + دردشة
- `CallScreen` يعرض شاشة المكالمة النشطة (WhatsApp style)
- Listener للمكالمات الواردة (postgres_changes على `call_records`)
- `CallScreen` يظهر كـ overlay فوق الدردشة

**ما ينقص:**
1. لا توجد شاشة مكالمة واردة مستقلة (fullscreen popup) تظهر في أي مكان بالتطبيق
2. لا يوجد زر "مشغول" مع رسائل جاهزة عند رفض المكالمة
3. لا يوجد سجل مكالمات (واردة/صادرة/فائتة) داخل المحادثة أو كصفحة مركزية
4. المكالمات تعمل فقط جهة-لجهة، لا مستخدم-لمستخدم
5. الإشعار يوجه للدردشة فقط بدون فتح شاشة القبول/الرفض

---

## الخطة

### 1. مكون شاشة المكالمة الواردة العالمي (`IncomingCallOverlay`)
**ملف جديد:** `src/components/chat/IncomingCallOverlay.tsx`
- شاشة fullscreen z-[200] تظهر فوق كل شيء عند وصول مكالمة واردة
- تعرض: اسم المتصل + صورته + نوع المكالمة (صوت/فيديو)
- أزرار: **قبول** (أخضر)، **رفض** (أحمر)، **مشغول** (رسالة جاهزة)
- زر "مشغول" يفتح قائمة رسائل: "مشغول الآن"، "سأتصل بك لاحقاً"، "في اجتماع"
- الرفض مع رسالة يرسل رسالة مباشرة للمتصل عبر `direct_messages`
- انيميشن pulse + صوت رنين

### 2. نقل Listener المكالمات الواردة لمستوى عالمي (`GlobalCallProvider`)
**ملف جديد:** `src/providers/GlobalCallProvider.tsx`
- Context provider يغلف التطبيق بالكامل (في `App.tsx` أو `Dashboard`)
- يستخدم `useWebRTCCall` hook داخلياً
- يستمع للمكالمات الواردة من أي مكان (ليس فقط داخل الدردشة)
- يعرض `IncomingCallOverlay` عند ورود مكالمة
- يعرض `CallScreen` عند قبول المكالمة
- يوفر `startCall()` عبر Context لأي مكون يحتاجه

### 3. تعديل `EnhancedChatWidget` و `ChatVideoCallButton`
- إزالة `useWebRTCCall` المحلي من `EnhancedChatWidget`
- استخدام `GlobalCallProvider` context بدلاً منه
- `ChatVideoCallButton` يستخدم نفس الـ context

### 4. دعم المكالمات مستخدم-لمستخدم (بالإضافة لجهة-لجهة)
**تعديل `useWebRTCCall`:**
- إضافة حقل `receiver_user_id` اختياري في `startCall`
- الـ listener يراقب أيضاً `call_records` حيث `receiver_user_id = user.id`

**Migration:** إضافة عمود `receiver_user_id` (nullable) لجدول `call_records`

### 5. سجل المكالمات داخل المحادثة
**ملف جديد:** `src/components/chat/CallHistoryPanel.tsx`
- يظهر كـ panel داخل المحادثة (زر في ChatHeader → dropdown)
- يعرض: صادرة ↗️ / واردة ↙️ / فائتة ❌ مع الوقت والمدة
- استعلام `call_records` مفلتر بالجهة الحالية

### 6. صفحة سجل المكالمات المركزية
**ملف جديد:** `src/pages/dashboard/CallHistory.tsx`
- صفحة مستقلة `/dashboard/call-history`
- تبويبات: الكل | صادرة | واردة | فائتة
- كل سجل يعرض: الاسم، النوع (صوت/فيديو)، الحالة، المدة، التاريخ
- زر إعادة الاتصال
- إضافة رابط في sidebar

### 7. تحديث توجيه الإشعارات
**تعديل `notificationRouting.ts`:**
- `video_call_incoming` و `call_missed` يوجهان بشكل صحيح
- الإشعار الوارد يفتح `IncomingCallOverlay` مباشرة عبر الـ context

---

## الملفات المتأثرة

| ملف | عملية |
|------|--------|
| `src/providers/GlobalCallProvider.tsx` | جديد |
| `src/components/chat/IncomingCallOverlay.tsx` | جديد |
| `src/components/chat/CallHistoryPanel.tsx` | جديد |
| `src/pages/dashboard/CallHistory.tsx` | جديد |
| `src/hooks/useWebRTCCall.ts` | تعديل (receiver_user_id) |
| `src/components/chat/EnhancedChatWidget.tsx` | تعديل (استخدام context) |
| `src/components/meetings/ChatVideoCallButton.tsx` | تعديل (استخدام context) |
| `src/pages/Dashboard.tsx` | تعديل (إضافة GlobalCallProvider) |
| `supabase/migrations/` | جديد (receiver_user_id column) |

---

## التفاصيل التقنية

**شاشة المكالمة الواردة:**
```text
┌─────────────────────────────┐
│      [pulse animations]      │
│                              │
│         👤 صورة المتصل        │
│       "عبدالله المولد"        │
│     📞 مكالمة صوتية واردة     │
│                              │
│  ┌─────┐  ┌─────┐  ┌──────┐ │
│  │ رفض │  │مشغول│  │ قبول │ │
│  │  🔴  │  │  💬  │  │  🟢  │ │
│  └─────┘  └─────┘  └──────┘ │
└─────────────────────────────┘
```

**رسائل "مشغول" الجاهزة:**
- مشغول الآن
- سأتصل بك لاحقاً
- في اجتماع
- أرسل لي رسالة

**Migration SQL:**
```sql
ALTER TABLE call_records
ADD COLUMN receiver_user_id uuid REFERENCES auth.users(id);

CREATE INDEX idx_call_records_receiver_user
ON call_records(receiver_user_id) WHERE receiver_user_id IS NOT NULL;
```

