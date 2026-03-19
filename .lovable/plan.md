

# تنفيذ: إضافة الرسائل الصوتية لصفحة المحادثة الرئيسية

## الهدف
استبدال حقل الإدخال البسيط (Textarea + زر إرسال) في `Chat.tsx` بمكون `EnhancedChatInput` الموجود والمُختبر — والذي يدعم بالفعل تسجيل صوتي + معاينة + حذف + إرسال (مثل WhatsApp).

## التغييرات

### ملف واحد: `src/pages/dashboard/Chat.tsx`

1. **إضافة استيراد** `EnhancedChatInput` من `@/components/chat/EnhancedChatInput`

2. **استبدال منطقة الإدخال** (السطور 1276-1313) — حذف الـ `<div>` الذي يحتوي على `fileInput` + `Textarea` + أزرار الإرسال والإرفاق، واستبداله بـ:
```tsx
<div className="p-2 border-t border-border bg-card shrink-0">
  <EnhancedChatInput
    onSendMessage={async (text) => {
      await sendMessage(selectedConvoId!, text, 'text', undefined, undefined, replyTo?.id);
      setReplyTo(null);
      const updated = await fetchMessages(selectedConvoId!);
      setMessages(updated);
    }}
    onSendFile={async (file) => {
      await sendFileMessage(selectedConvoId!, file);
      const updated = await fetchMessages(selectedConvoId!);
      setMessages(updated);
    }}
    sending={sending}
    disabled={!selectedConvoId}
  />
</div>
```

3. **تنظيف**: إزالة المتغيرات والدوال التي لم تعد مستخدمة:
   - `inputText` / `setInputText`
   - `inputRef` / `fileInputRef`
   - `handleSend` / `handleKeyDown` / `handleAttachClick` / `handleFileSelected`

هذا يُوحّد تجربة الإدخال بين الزر العائم والصفحة الرئيسية بدون كتابة كود جديد.

