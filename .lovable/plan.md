

# خطة: تفعيل التشغيل الذكي الشامل للوسائط (Universal Media Playback)

## المشكلة

الوسائط متناثرة بدون معالجة موحدة:
- **الفيديو**: مجرد `<video>` خام بدون وضع مسرحي (Theater Mode)
- **الصوت**: `VoiceMessagePlayer` يعمل في الدردشة فقط ويحتاج `isOwn`
- **الصور**: `ClickableImage` + `ImageLightbox` يعملان — لكن لا يُستخدمان في كل مكان
- **PDF**: `GoogleDocsPdfViewer` موجود — لكن بعض الأماكن تفتح PDF في تبويب جديد فقط

## الحل: مكون `UniversalMediaViewer` مركزي

```text
┌──────────────────────────────────────────┐
│  UniversalMediaViewer                    │
│  ┌─────────────┐ ┌─────────────────────┐ │
│  │ detectType()│→│ image → ImageLightbox│ │
│  │ from URL/   │ │ video → VideoTheater │ │
│  │ mime/ext    │ │ audio → AudioPlayer  │ │
│  │             │ │ pdf   → PdfViewer    │ │
│  └─────────────┘ └─────────────────────┘ │
│                                          │
│  + MediaThumbnail (wrapper for any media)│
│    Click → opens appropriate viewer      │
└──────────────────────────────────────────┘
```

## الملفات الجديدة

### 1. `src/components/media/UniversalMediaViewer.tsx`
- Dialog/overlay يكتشف نوع الملف تلقائياً من URL أو mime type
- **صورة**: يعرض `ImageLightbox` الموجود (zoom, rotate, gallery)
- **فيديو**: وضع مسرحي fullscreen مع controls + تقديم/تأخير + PiP
- **صوت**: مشغل بموجة صوتية (waveform) مستقل عن الدردشة (بدون `isOwn`)
- **PDF**: يعرض `GoogleDocsPdfViewer` داخل dialog مع أزرار تحميل/طباعة

### 2. `src/components/media/MediaThumbnail.tsx`
- Wrapper بسيط: يعطيه URL → يعرض thumbnail مناسب + overlay play/eye
- Click → يفتح `UniversalMediaViewer`
- يُستخدم في أي مكان بدل الكود المكرر

### 3. `src/components/media/VideoTheater.tsx`
- مشغل فيديو بوضع مسرحي (Theater/Fullscreen)
- controls: play/pause, seek, volume, speed (1x/1.5x/2x), PiP, fullscreen
- Swipe للإغلاق على الموبايل

### 4. `src/components/media/StandaloneAudioPlayer.tsx`
- نسخة من `VoiceMessagePlayer` لكن مستقلة عن الدردشة
- لا تحتاج `isOwn` — تعمل في أي مكان
- تصميم محايد يناسب كل الصفحات

### 5. `src/lib/mediaUtils.ts`
- `detectMediaType(url)` → `'image' | 'video' | 'audio' | 'pdf' | 'file'`
- `getMediaThumbnail(url, type)` → thumbnail URL أو أيقونة

## التطبيق في الأماكن الموجودة

### الملفات المعدّلة:

| الملف | التغيير |
|-------|---------|
| `SocialFeedPage.tsx` | استبدال `<video>` الخام بـ `MediaThumbnail` |
| `MemberSocialProfile.tsx` | نفس الشيء — `MediaThumbnail` بدل `<video>` |
| `PartnersTimeline.tsx` | `MediaThumbnail` بدل نظام `videoRefs` المعقد |
| `PublicOrgProfile.tsx` | `MediaThumbnail` للصور والفيديو |
| `Chat.tsx` | `MediaThumbnail` للفيديو + `StandaloneAudioPlayer` |
| `BroadcastChannelView.tsx` | استبدال `AutoPlayVideo` + `InlinePdfViewer` بـ `MediaThumbnail` |
| `ChatPartnerInfo.tsx` | Shared media grid تستخدم `MediaThumbnail` |
| `NotificationDetailDialog.tsx` | PDF يفتح في `UniversalMediaViewer` بدل `window.open` |

## التفاصيل الفنية

- `detectMediaType` يفحص: الامتداد (`.mp4`, `.pdf`, `.jpg`) + mime type إن توفر
- `VideoTheater` يستخدم HTML5 `<video>` مع custom controls (لا مكتبات إضافية)
- كل المكونات تدعم RTL + الوضع الليلي + الموبايل
- `MediaThumbnail` يعرض overlay مناسب: ▶️ للفيديو، 🔊 للصوت، 📄 لـ PDF، 🔍 للصور

### لا تغييرات في قاعدة البيانات

