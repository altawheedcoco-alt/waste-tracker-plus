

# خطة تنفيذ باقي عناصر واتساب (Status/Stories + 14 عنصر)

## ما سيتم تنفيذه

### 1. إضافة StoryCircles أعلى قائمة المحادثات في الـ Widget
- إضافة `StoryCircles` في `EnhancedChatWidget.tsx` فوق قسم المجموعات مباشرة في view === 'sidebar'
- المكون موجود بالفعل ويعمل - فقط يحتاج ربط بالـ Chat Widget

### 2. ربط Long Press بـ ChatBottomSheet (عنصر #1)
- `ChatBottomSheet` موجود ومربوط بالفعل في `EnhancedChatMessages.tsx` (سطر 159: `bottomSheetMsg` state + سطر 296-308: `handleTouchStart`)
- التأكد من أن الربط يعمل بشكل صحيح وإضافة `onTouchStart`/`onTouchEnd` على كل فقاعة رسالة

### 3. ربط Emoji Reactions بالـ Bottom Sheet (عنصر #2)
- إضافة `onReact` callback في `ChatBottomSheet` لاستدعاء `toggleReaction` من `useChatReactions`

### 4. أصوات الإرسال والاستقبال (عنصر #7)
- `soundEngine` مستورد بالفعل في `EnhancedChatWidget.tsx` (سطر 19)
- إضافة `soundEngine.play('messageSent')` عند الإرسال و `soundEngine.play('messageReceived')` عند الاستقبال

### 5. Waveform حي أثناء التسجيل (عنصر #14)
- إضافة `AnalyserNode` من Web Audio API أثناء التسجيل في `EnhancedChatInput.tsx`
- رسم أشرطة متحركة (24 بار) تتفاعل مع الصوت الحقيقي

### 6. "تم التحويل" Label (عنصر #12)
- إضافة كشف تلقائي للرسائل التي تبدأ بـ `⤵️` وعرض label "تم التحويل" أعلى الفقاعة

### 7. أيقونات نوع الرسالة في Sidebar (عنصر #5)
- `getMessagePreview` موجود بالفعل ويُرجع أيقونات - التأكد من عرضها في واجهة الـ Sidebar

### 8. تحسين Unread Count (عنصر #11)
- إضافة `invalidateQueries` أو تحديث فوري عند فتح محادثة

---

## التفاصيل الفنية

### الملفات المتأثرة:
1. **`EnhancedChatWidget.tsx`** - إضافة StoryCircles + أصوات إرسال/استقبال
2. **`EnhancedChatMessages.tsx`** - تأكيد ربط long press + forwarded label + emoji reactions من Bottom Sheet
3. **`EnhancedChatInput.tsx`** - Waveform حي أثناء التسجيل
4. **`ChatSidebar.tsx`** - عرض أيقونات نوع الرسالة الأخيرة

### لا تغييرات في قاعدة البيانات

