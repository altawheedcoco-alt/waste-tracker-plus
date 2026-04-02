

# خطة استبدال نظام Jitsi بنظام WebRTC الداخلي

## ملخص

حذف منظومة Jitsi Meet القديمة بالكامل واستبدالها بنظام WebRTC الداخلي الموجود (`useWebRTCCall` + `CallScreen`). النظام الجديد يعمل P2P بدون أي خدمة خارجية.

---

## ما سيتم حذفه

- **`src/components/meetings/JitsiMeetingRoom.tsx`** — المكون الذي يفتح نافذة Jitsi خارجية

## ما سيتم تعديله

### 1. `MeetingsPanel.tsx` — استبدال JitsiMeetingRoom بـ WebRTC
- إزالة استيراد `JitsiMeetingRoom`
- عند الانضمام لاجتماع نشط، استخدام `useWebRTCCall` hook لبدء المكالمة
- عرض `CallScreen` بدلاً من `JitsiMeetingRoom` أثناء الاجتماع
- الحفاظ على كل الوظائف الحالية (قائمة الاجتماعات، الجدولة، الملخصات)

### 2. `ChatVideoCallButton.tsx` — استبدال Jitsi بـ WebRTC
- إزالة استيراد `JitsiMeetingRoom`
- استخدام `useWebRTCCall` hook بدلاً من فتح Dialog مع Jitsi
- عند الضغط على زر المكالمة: بدء مكالمة WebRTC مباشرة عبر `startCall`
- عرض `CallScreen` ملء الشاشة أثناء المكالمة
- الاحتفاظ بإنشاء سجل `video_meetings` + إرسال إشعار للطرف الآخر

### 3. إنشاء `WebRTCMeetingRoom.tsx` — بديل Jitsi للاجتماعات
- مكون جديد يغلف `useWebRTCCall` + `CallScreen`
- يقبل نفس props القديمة (`roomId`, `meetingId`, `displayName`, `isHost`, `meetingType`, `onLeave`)
- يبدأ المكالمة تلقائياً عند التحميل
- يدعم: كتم الصوت، إيقاف الفيديو، مشاركة الشاشة، التسجيل، الدردشة أثناء المكالمة

---

## النتيجة

| قبل | بعد |
|------|------|
| نافذة خارجية meet.jit.si | شاشة مكالمة داخلية بالكامل |
| يعتمد على سيرفر Jitsi | P2P مباشر بـ WebRTC |
| لا تحكم في التصميم | تصميم موحد مع المنصة |
| لا تسجيل داخلي | تسجيل + حفظ في Storage |
| لا دردشة متكاملة | دردشة أثناء المكالمة |

