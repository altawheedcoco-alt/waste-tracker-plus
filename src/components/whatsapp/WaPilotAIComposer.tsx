import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bot, Sparkles, Copy, Loader2, RefreshCw, Languages, Wand2 } from 'lucide-react';

const TONE_OPTIONS = [
  { value: 'formal', label: 'رسمي' },
  { value: 'friendly', label: 'ودّي' },
  { value: 'urgent', label: 'عاجل' },
  { value: 'marketing', label: 'تسويقي' },
  { value: 'reminder', label: 'تذكيري' },
];

const PURPOSE_OPTIONS = [
  { value: 'shipment_update', label: 'تحديث شحنة' },
  { value: 'payment_reminder', label: 'تذكير بالدفع' },
  { value: 'welcome', label: 'رسالة ترحيبية' },
  { value: 'survey', label: 'استطلاع رأي' },
  { value: 'promotion', label: 'عرض ترويجي' },
  { value: 'license_expiry', label: 'انتهاء ترخيص' },
  { value: 'safety_alert', label: 'تنبيه سلامة' },
  { value: 'general', label: 'عام' },
];

const WaPilotAIComposer = ({ onUseMessage }: { onUseMessage: (text: string) => void }) => {
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState('formal');
  const [purpose, setPurpose] = useState('general');
  const [language, setLanguage] = useState('ar');
  const [generating, setGenerating] = useState(false);
  const [generatedMessages, setGeneratedMessages] = useState<string[]>([]);
  const [includeButtons, setIncludeButtons] = useState(false);

  const generateMessage = async () => {
    if (!prompt) {
      toast.error('يرجى وصف الرسالة المطلوبة');
      return;
    }

    setGenerating(true);
    try {
      const systemPrompt = `أنت مساعد متخصص في كتابة رسائل واتساب احترافية لمنصة إدارة النفايات والتدوير (iRecycle).
القواعد:
- اكتب 3 نسخ مختلفة من الرسالة
- النبرة: ${TONE_OPTIONS.find(t => t.value === tone)?.label}
- الغرض: ${PURPOSE_OPTIONS.find(p => p.value === purpose)?.label}
- اللغة: ${language === 'ar' ? 'العربية' : language === 'en' ? 'الإنجليزية' : 'العربية والإنجليزية معاً'}
- استخدم {{1}} للاسم و{{2}} لرقم الشحنة و{{3}} للتفاصيل الإضافية
- الرسالة يجب أن تكون مختصرة ومباشرة (أقل من 200 كلمة)
- ابدأ كل نسخة بـ "---" كفاصل
${includeButtons ? '- اقترح أزرار تفاعلية مناسبة في نهاية كل رسالة بصيغة [زر: العنوان]' : ''}
- لا تستخدم الإيموجي بإفراط`;

      const { data, error } = await supabase.functions.invoke('ai-operations-assistant', {
        body: {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          model: 'google/gemini-2.5-flash',
        },
      });

      if (error) throw error;

      const responseText = data?.response || data?.choices?.[0]?.message?.content || '';
      const msgs = responseText.split('---').filter((m: string) => m.trim().length > 10).map((m: string) => m.trim());
      setGeneratedMessages(msgs.length > 0 ? msgs : [responseText]);
    } catch (e: any) {
      toast.error('فشل في توليد الرسالة');
      console.error(e);
    }
    setGenerating(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('تم نسخ الرسالة');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            مُولّد الرسائل الذكي
          </CardTitle>
          <CardDescription>استخدم الذكاء الاصطناعي لإنشاء رسائل واتساب احترافية مخصصة لمنظومة إدارة المخلفات</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>الغرض</Label>
              <Select value={purpose} onValueChange={setPurpose}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PURPOSE_OPTIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>النبرة</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TONE_OPTIONS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>اللغة</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ar">العربية</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="both">عربي + English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>وصف الرسالة المطلوبة</Label>
            <Textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="مثال: رسالة لإبلاغ المولّد بوصول شاحنة النقل لاستلام النفايات مع تأكيد الموعد وطلب تجهيز الحمولة"
              rows={3}
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={includeButtons} onChange={e => setIncludeButtons(e.target.checked)} className="rounded" />
              تضمين أزرار تفاعلية
            </label>
          </div>

          <Button onClick={generateMessage} disabled={generating} className="w-full">
            {generating ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Sparkles className="h-4 w-4 ml-2" />}
            توليد الرسائل
          </Button>
        </CardContent>
      </Card>

      {/* Generated Messages */}
      {generatedMessages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              الرسائل المُولّدة
              <Badge variant="outline">{generatedMessages.length} نسخة</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {generatedMessages.map((msg, i) => (
              <div key={i} className="border rounded-lg p-4 space-y-2 hover:border-primary/50 transition-colors">
                <div className="flex items-center justify-between">
                  <Badge className="text-xs">النسخة {i + 1}</Badge>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(msg)}>
                      <Copy className="h-3.5 w-3.5 ml-1" />نسخ
                    </Button>
                    <Button variant="default" size="sm" onClick={() => onUseMessage(msg)}>
                      استخدام
                    </Button>
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3 text-sm whitespace-pre-wrap border-r-4 border-green-500">
                  {msg}
                </div>
              </div>
            ))}

            <Button variant="outline" className="w-full" onClick={generateMessage} disabled={generating}>
              <RefreshCw className={`h-4 w-4 ml-1 ${generating ? 'animate-spin' : ''}`} />
              إعادة التوليد
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WaPilotAIComposer;
