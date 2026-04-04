import React, { useState, useCallback, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Send, Users, AlertTriangle, Loader2, Paperclip, Video, Mic, File, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { OrgInfo } from './WaPilotTypes';

interface Props {
  instanceStatus: 'connected' | 'disconnected' | 'loading';
  orgs: OrgInfo[];
  onRefresh: () => void;
}

const QUICK_TEMPLATES = [
  { cat: '🚛 شحنات', messages: [
    { label: 'تأكيد شحنة', text: 'مرحباً، نود إبلاغكم بأنه تم تسجيل شحنة جديدة وسيتم التواصل معكم لتحديد موعد الاستلام. شكراً لثقتكم بمنصة آي ريسايكل.' },
    { label: 'موعد استلام', text: 'السلام عليكم، نود تأكيد موعد استلام الشحنة. يرجى التواصل معنا لتنسيق الوقت المناسب.' },
    { label: 'تم التسليم', text: 'تم تسليم الشحنة بنجاح ✅ شكراً لتعاونكم. يمكنكم مراجعة التفاصيل عبر المنصة.' },
  ]},
  { cat: '💰 مالية', messages: [
    { label: 'فاتورة جديدة', text: 'تم إصدار فاتورة جديدة لحسابكم. يرجى مراجعتها عبر المنصة واتخاذ اللازم.' },
    { label: 'تأكيد دفع', text: 'تم استلام الدفعة المالية بنجاح ✅ شكراً لالتزامكم.' },
    { label: 'تذكير سداد', text: 'تذكير ودي: لديكم مستحقات مالية معلقة. يرجى السداد في أقرب وقت لتجنب التأخير.' },
  ]},
  { cat: '👋 ترحيب', messages: [
    { label: 'عميل جديد', text: 'مرحباً بك في منصة آي ريسايكل! 🌱 نحن سعداء بانضمامك. فريقنا جاهز لمساعدتك في إدارة النفايات بكفاءة واستدامة.' },
    { label: 'شريك جديد', text: 'أهلاً وسهلاً بكم كشريك في منصة آي ريسايكل. نتطلع لتعاون مثمر ومستدام 🤝' },
  ]},
  { cat: '⚠️ تنبيهات', messages: [
    { label: 'تجديد رخصة', text: 'تنبيه: رخصتكم البيئية تقترب من تاريخ الانتهاء. يرجى المبادرة بالتجديد لتجنب توقف الخدمة.' },
    { label: 'صيانة النظام', text: 'إشعار: سيتم إجراء صيانة مجدولة للنظام. قد تتأثر بعض الخدمات مؤقتاً. نعتذر عن أي إزعاج.' },
    { label: 'تحديث بيانات', text: 'يرجى تحديث بيانات منشأتكم على المنصة لضمان استمرارية الخدمة وتوافقها مع الاشتراطات.' },
  ]},
  { cat: '♻️ بيئية', messages: [
    { label: 'تقرير بيئي', text: 'تقريركم البيئي الشهري جاهز للمراجعة على المنصة. يتضمن ملخص الكميات المعاد تدويرها والأثر البيئي.' },
    { label: 'شهادة تدوير', text: 'تم إصدار شهادة إعادة التدوير الخاصة بمنشأتكم ✅ يمكنكم تحميلها من المنصة.' },
  ]},
];

const WaPilotQuickSend = memo(({ instanceStatus, orgs, onRefresh }: Props) => {
  const [quickPhone, setQuickPhone] = useState('');
  const [quickMessage, setQuickMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [quickAttachment, setQuickAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [sendProgress, setSendProgress] = useState<{ current: number; total: number } | null>(null);

  const handleAttachmentChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 16 * 1024 * 1024) { toast.error('حجم الملف يتجاوز 16 ميجا'); return; }
    setQuickAttachment(file);
    if (file.type.startsWith('image/')) {
      setAttachmentPreview(URL.createObjectURL(file));
    } else {
      setAttachmentPreview(null);
    }
  }, []);

  const clearAttachment = useCallback(() => {
    setQuickAttachment(null);
    if (attachmentPreview) URL.revokeObjectURL(attachmentPreview);
    setAttachmentPreview(null);
  }, [attachmentPreview]);

  const handleQuickSend = useCallback(async () => {
    if (!quickPhone.trim() || (!quickMessage.trim() && !quickAttachment)) {
      toast.error('يرجى إدخال رقم الهاتف ونص الرسالة أو إرفاق ملف');
      return;
    }
    const phones = quickPhone.split(/[,;\n]+/).map(p => p.replace(/[\s\-\+]/g, '').replace(/^0+/, '')).filter(p => p.length >= 8);
    if (phones.length === 0) { toast.error('يرجى إدخال رقم هاتف صحيح'); return; }

    setSendingMessage(true);
    setSendProgress({ current: 0, total: phones.length });

    let mediaUrl: string | null = null;
    let mediaFilename: string | null = null;

    if (quickAttachment) {
      try {
        const ext = quickAttachment.name.split('.').pop() || 'bin';
        const path = `wapilot-media/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from('documents').upload(path, quickAttachment, { contentType: quickAttachment.type });
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path);
        mediaUrl = urlData.publicUrl;
        mediaFilename = quickAttachment.name;
      } catch (err: any) {
        toast.error(`فشل رفع الملف: ${err.message}`);
        setSendingMessage(false);
        setSendProgress(null);
        return;
      }
    }

    let successCount = 0, failCount = 0;
    for (let i = 0; i < phones.length; i++) {
      const phone = phones[i];
      const chatId = phone.includes('@') ? phone : `${phone}@c.us`;
      setSendProgress({ current: i + 1, total: phones.length });
      try {
        if (mediaUrl) {
          const { data, error } = await supabase.functions.invoke('wapilot-proxy', {
            body: { action: 'send-media', chat_id: chatId, media_url: mediaUrl, filename: mediaFilename, caption: quickMessage || undefined },
          });
          if (error) throw error;
          if (data?.error) throw new Error(data.error);
        } else {
          const { data, error } = await supabase.functions.invoke('wapilot-proxy', {
            body: { action: 'send-message', chat_id: chatId, text: quickMessage },
          });
          if (error) throw error;
          if (data?.error) throw new Error(data.error);
        }
        successCount++;
        await supabase.from('whatsapp_messages').insert({
          to_phone: phone, content: quickMessage || `[${quickAttachment?.type?.split('/')[0] || 'ملف'}]`,
          message_type: mediaUrl ? 'media' : 'text', status: 'sent', direction: 'outbound',
          organization_id: orgs[0]?.id || '', attachment_url: mediaUrl,
          metadata: { source: 'wapilot_dashboard_quick_send', filename: mediaFilename },
        });
      } catch (err: any) {
        failCount++;
        console.error(`Failed to send to ${phone}:`, err);
      }
      if (phones.length > 1 && i < phones.length - 1) await new Promise(r => setTimeout(r, 500));
    }

    if (successCount > 0) {
      toast.success(`تم إرسال ${successCount} رسالة بنجاح ✓${failCount > 0 ? ` (فشل ${failCount})` : ''}`);
      setQuickMessage('');
      clearAttachment();
    } else {
      toast.error('فشل إرسال جميع الرسائل');
    }
    setSendingMessage(false);
    setSendProgress(null);
    onRefresh();
  }, [quickPhone, quickMessage, quickAttachment, orgs, onRefresh, clearAttachment]);

  const disabled = sendingMessage || instanceStatus !== 'connected';

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Send className="h-4 w-4 text-primary" />
          إرسال رسالة سريعة
          {instanceStatus === 'connected' && <Badge variant="default" className="text-[10px] mr-auto">الجهاز متصل ✓</Badge>}
        </CardTitle>
        <CardDescription className="text-xs">اختر رسالة جاهزة أو اكتب رسالة مخصصة • أرسل واتساب مباشرة من لوحة التحكم</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Quick Templates */}
        <div>
          <label className="text-[11px] text-muted-foreground mb-1.5 block">رسائل جاهزة حسب التصنيف</label>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_TEMPLATES.map(cat => (
              <div key={cat.cat} className="flex items-center gap-1">
                <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">{cat.cat}</span>
                {cat.messages.map(msg => (
                  <Button key={msg.label} variant={quickMessage === msg.text ? 'default' : 'outline'} size="sm" className="h-6 text-[10px] px-2" onClick={() => setQuickMessage(msg.text)} disabled={disabled}>
                    {msg.label}
                  </Button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Phone + Message */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-shrink-0 sm:w-64">
              <label className="text-[11px] text-muted-foreground mb-1 block">أرقام الواتساب (مع كود الدولة)</label>
              <Textarea dir="ltr" placeholder={"201XXXXXXXXX\n201YYYYYYYYY"} value={quickPhone} onChange={e => setQuickPhone(e.target.value)} className="font-mono text-sm min-h-[60px] max-h-[120px] resize-none" disabled={disabled} rows={2} />
              {quickPhone.split(/[,;\n]+/).filter(p => p.replace(/[\s\-\+]/g, '').replace(/^0+/, '').length >= 8).length > 1 && (
                <p className="text-[10px] text-primary mt-1 flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  سيتم الإرسال لـ {quickPhone.split(/[,;\n]+/).filter(p => p.replace(/[\s\-\+]/g, '').replace(/^0+/, '').length >= 8).length} أرقام
                </p>
              )}
            </div>
            <div className="flex-1">
              <label className="text-[11px] text-muted-foreground mb-1 block">نص الرسالة</label>
              <div className="flex gap-2">
                <div className="flex-1 space-y-2">
                  <Textarea placeholder={quickAttachment ? "أضف تعليقاً على المرفق (اختياري)..." : "اكتب رسالتك هنا..."} value={quickMessage} onChange={e => setQuickMessage(e.target.value)} className="min-h-[60px] max-h-[120px] text-sm resize-none" disabled={disabled} rows={2} />
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <input type="file" id="wapilot-attach" className="hidden" accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx" onChange={handleAttachmentChange} disabled={disabled} />
                    <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => document.getElementById('wapilot-attach')?.click()} disabled={disabled}>
                      <Paperclip className="h-3 w-3" />إرفاق ملف
                    </Button>
                    <span className="text-[9px] text-muted-foreground">PDF, صور, فيديو, صوت (حد أقصى 16MB)</span>
                  </div>
                  {quickAttachment && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border">
                      {attachmentPreview ? <img src={attachmentPreview} alt="preview" className="h-10 w-10 rounded object-cover" /> :
                       quickAttachment.type.startsWith('video/') ? <Video className="h-5 w-5 text-primary" /> :
                       quickAttachment.type.startsWith('audio/') ? <Mic className="h-5 w-5 text-primary" /> :
                       <File className="h-5 w-5 text-primary" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{quickAttachment.name}</p>
                        <p className="text-[10px] text-muted-foreground">{(quickAttachment.size / 1024).toFixed(0)} KB</p>
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={clearAttachment}><X className="h-3.5 w-3.5" /></Button>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 self-end">
                  <Button onClick={handleQuickSend} disabled={disabled || !quickPhone.trim() || (!quickMessage.trim() && !quickAttachment)} className="gap-1.5">
                    {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}إرسال
                  </Button>
                  {(quickMessage || quickAttachment) && !sendingMessage && (
                    <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => { setQuickMessage(''); clearAttachment(); }}>مسح الكل</Button>
                  )}
                </div>
              </div>
            </div>
          </div>
          {sendProgress && (
            <div className="flex items-center gap-2">
              <Progress value={(sendProgress.current / sendProgress.total) * 100} className="flex-1 h-2" />
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">{sendProgress.current}/{sendProgress.total}</span>
            </div>
          )}
        </div>
        {instanceStatus !== 'connected' && (
          <p className="text-xs text-destructive mt-2 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />يجب أن يكون الجهاز متصلاً لإرسال الرسائل
          </p>
        )}
      </CardContent>
    </Card>
  );
});

WaPilotQuickSend.displayName = 'WaPilotQuickSend';
export default WaPilotQuickSend;
