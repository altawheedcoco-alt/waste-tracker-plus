import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Cpu, Eye, BarChart3, Zap, BookOpen, MessageSquare, FileText, Image, Search } from 'lucide-react';

const AICapabilitiesInfoDialog = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <Brain className="h-4 w-4" />
        قدرات AI
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Brain className="w-6 h-6 text-primary" />
              قدرات الذكاء الاصطناعي — Gemini 2.5 Flash
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 text-sm">
            {/* Limits Table */}
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <h3 className="font-bold flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                حدود الاستخدام اليومي
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'طلبات/دقيقة (RPM)', value: '15' },
                  { label: 'طلبات/يوم (RPD)', value: '1,500' },
                  { label: 'Tokens/دقيقة', value: '1,000,000' },
                  { label: 'نافذة السياق', value: '1,048,576 token' },
                ].map(item => (
                  <div key={item.label} className="bg-background rounded-md p-2.5 text-center border">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="font-bold text-primary mt-1">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* What are Tokens */}
            <div className="rounded-lg border p-4 space-y-2">
              <h3 className="font-bold flex items-center gap-2">
                <Cpu className="w-4 h-4 text-primary" />
                ما هي الـ Tokens (الرموز)؟
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                الـ Token هو أصغر وحدة يفهمها الذكاء الاصطناعي — ليست حرفاً وليست كلمة بالضبط:
              </p>
              <ul className="space-y-1 text-muted-foreground mr-4 list-disc">
                <li>كلمة عربية واحدة ≈ <Badge variant="secondary">2-4 tokens</Badge></li>
                <li>كلمة إنجليزية ≈ <Badge variant="secondary">1-2 tokens</Badge></li>
                <li>جملة "أريد تصنيف مخلفات البناء" ≈ <Badge variant="secondary">~12 token</Badge></li>
              </ul>
              <p className="text-muted-foreground text-xs mt-2">
                <strong>1,000,000 token/دقيقة</strong> = تقدر ترسل نصوص ضخمة جداً (مثل تحليل مستند من 200 صفحة دفعة واحدة).
              </p>
            </div>

            {/* What is Context */}
            <div className="rounded-lg border p-4 space-y-2">
              <h3 className="font-bold flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                ما هو السياق (Context Window)؟
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                السياق هو <strong>ذاكرة المحادثة</strong> — أقصى حجم نص يقدر الذكاء الاصطناعي "يتذكره" في طلب واحد:
              </p>
              <div className="bg-muted/50 rounded-md p-3 text-center">
                <p className="text-lg font-bold text-primary">1,048,576 token</p>
                <p className="text-xs text-muted-foreground mt-1">≈ 750,000 كلمة ≈ كتاب من 1,500 صفحة</p>
              </div>
              <p className="text-muted-foreground text-xs">
                يعني تقدر ترسل مستند ضخم كامل + تسأله أسئلة عنه في نفس الطلب.
              </p>
            </div>

            {/* Capabilities */}
            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="font-bold flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" />
                الإمكانيات المتاحة
              </h3>
              <div className="grid gap-2">
                {[
                  { icon: MessageSquare, title: 'معالجة النصوص', desc: 'محادثات، تلخيص، تحليل، توليد محتوى بالعربية والإنجليزية' },
                  { icon: Eye, title: 'الرؤية الحاسوبية', desc: 'قراءة صور الميزان، الفواتير، التراخيص، OCR ذكي' },
                  { icon: Search, title: 'استخراج بيانات منظمة', desc: 'Tool Calling لاستخراج JSON من نصوص حرة + تصنيف WMIS' },
                  { icon: BarChart3, title: 'تحليل وتنبؤ', desc: 'اكتشاف اتجاهات في الشحنات وتوقع أحجام مستقبلية' },
                  { icon: Image, title: 'تحليل الصور', desc: 'تصنيف المخلفات بالصور + فحص جودة المواد' },
                  { icon: FileText, title: 'تحليل المستندات', desc: 'استخراج بيانات كاملة من وثائق مصورة (سجلات، تراخيص)' },
                ].map(item => (
                  <div key={item.title} className="flex items-start gap-3 bg-muted/30 rounded-md p-2.5">
                    <item.icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-xs">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-xs text-muted-foreground space-y-1">
              <p><strong>💡 باختصار:</strong></p>
              <p>• <strong>Tokens</strong> = وحدة قياس حجم النص</p>
              <p>• <strong>السياق</strong> = حجم "الذاكرة" في المحادثة الواحدة</p>
              <p>• <strong>RPM/RPD</strong> = عدد المرات اللي تقدر تطلب فيها في الدقيقة/اليوم</p>
              <p>• عند تجاوز الحد → يتم التبديل تلقائياً إلى Lovable AI كنظام احتياطي</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AICapabilitiesInfoDialog;
