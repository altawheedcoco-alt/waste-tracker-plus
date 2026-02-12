import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface GeneratorHandoverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipment: {
    id: string;
    shipment_number: string;
    waste_type: string;
    quantity: number;
    unit?: string;
    transporter_name?: string;
    recycler_name?: string;
    disposal_name?: string;
  };
  onConfirmed: () => void;
}

const GENERATOR_DECLARATION_TEXT = `إقرار تسليم مخلفات من المولّد إلى الناقل

أقر أنا الموقع أدناه، بصفتي ممثلاً عن الجهة المولّدة للمخلفات، بما يلي:

أولاً - إثبات التسليم للناقل:
أُقر بأنني قد قمت بتسليم المخلفات المذكورة أعلاه إلى ممثل شركة النقل المعتمدة، وأن البيانات المسجلة (نوع النفايات، الكمية، الحالة) صحيحة ودقيقة وتمثل الواقع الفعلي لحظة التسليم.

ثانياً - صحة البيانات:
أتحمل المسؤولية الكاملة عن صحة بيانات المخلفات المُسلّمة، بما في ذلك التصنيف والكمية ودرجة الخطورة. وأي بيانات مغلوطة أو مضللة تُعد مخالفة تستوجب المساءلة القانونية.

ثالثاً - الالتزام بالاشتراطات:
أُقر بأن المخلفات المُسلّمة قد تم تجهيزها وتعبئتها وفقاً للاشتراطات البيئية والصحية المعتمدة، وأنها مطابقة للوصف المسجل في النظام.

رابعاً - سلسلة الحيازة:
أُقر بأن هذا التسليم يمثل بداية سلسلة الحيازة (Chain of Custody) للشحنة، وأن أي تلاعب أو تغيير في محتويات الشحنة بعد هذا التسليم لا يقع تحت مسؤوليتي.

خامساً - العواقب القانونية:
أُدرك أن أي مخالفة لما ورد في هذا الإقرار قد تترتب عليها العواقب التالية:
• المسؤولية المدنية والجنائية وفقاً لقانون تنظيم إدارة المخلفات رقم 202 لسنة 2020
• تحمل كافة الأضرار والتعويضات الناتجة عن أي بيانات مغلوطة
• إبلاغ الجهات الرقابية المختصة (جهاز تنظيم إدارة المخلفات WMRA)

سادساً - التوثيق الرقمي:
أُقر بأن هذا الإقرار يُعد وثيقة رسمية مسجلة إلكترونياً بالنظام، وتحمل بصمة رقمية تتضمن عنوان IP الخاص بي، والطابع الزمني، ومعلومات الجهاز المستخدم، وهي غير قابلة للتعديل أو الحذف.`;

const GeneratorHandoverDialog = ({
  open,
  onOpenChange,
  shipment,
  onConfirmed,
}: GeneratorHandoverDialogProps) => {
  const { user, profile, organization } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 30;
    if (isBottom) setScrolledToBottom(true);
  };

  const handleConfirm = async () => {
    if (!agreed || !user || !organization) return;
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('delivery_declarations')
        .insert({
          shipment_id: shipment.id,
          declared_by_user_id: user.id,
          declared_by_organization_id: organization.id,
          declaration_type: 'generator_handover',
          declaration_text: GENERATOR_DECLARATION_TEXT,
          ip_address: null,
          user_agent: navigator.userAgent,
          driver_name: profile?.full_name || null,
          driver_national_id: null,
          shipment_number: shipment.shipment_number,
          waste_type: shipment.waste_type,
          quantity: shipment.quantity,
          unit: shipment.unit || 'طن',
          generator_name: organization.name || null,
          transporter_name: shipment.transporter_name || null,
          recycler_name: shipment.recycler_name || null,
          disposal_name: shipment.disposal_name || null,
        } as any);

      if (error) throw error;

      toast.success('تم تسجيل إقرار تسليم المخلفات للناقل بنجاح');
      setAgreed(false);
      setScrolledToBottom(false);
      onConfirmed();
      onOpenChange(false);
    } catch (err: any) {
      console.error('Generator handover declaration error:', err);
      toast.error('حدث خطأ أثناء تسجيل الإقرار');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0" dir="rtl">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-right">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            إقرار تسليم المخلفات للناقل - {shipment.shipment_number}
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 pt-2">
          <div className="p-3 rounded-lg bg-muted/50 text-sm grid grid-cols-2 gap-2">
            <div><span className="text-muted-foreground">نوع النفايات:</span> <strong>{shipment.waste_type}</strong></div>
            <div><span className="text-muted-foreground">الكمية:</span> <strong>{shipment.quantity} {shipment.unit || 'طن'}</strong></div>
            {shipment.transporter_name && <div><span className="text-muted-foreground">الناقل:</span> <strong>{shipment.transporter_name}</strong></div>}
            {shipment.recycler_name && <div><span className="text-muted-foreground">المدوّر:</span> <strong>{shipment.recycler_name}</strong></div>}
            {shipment.disposal_name && <div><span className="text-muted-foreground">جهة التخلص:</span> <strong>{shipment.disposal_name}</strong></div>}
          </div>
        </div>

        <div className="px-4">
          <ScrollArea className="h-[300px] border rounded-lg p-4 bg-card" onScrollCapture={handleScroll}>
            <div className="whitespace-pre-wrap text-sm leading-7 text-right font-medium">
              {GENERATOR_DECLARATION_TEXT}
            </div>
          </ScrollArea>
          {!scrolledToBottom && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 text-center">⬇️ يرجى قراءة الإقرار بالكامل قبل الموافقة</p>
          )}
        </div>

        <div className="px-4 pb-4 space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg border border-accent bg-accent/10">
            <Checkbox
              id="generator-declaration-agree"
              checked={agreed}
              onCheckedChange={(c) => setAgreed(c === true)}
              disabled={!scrolledToBottom}
            />
            <label htmlFor="generator-declaration-agree" className="text-sm cursor-pointer leading-6">
              أُقر بأنني قد قرأت وفهمت جميع الشروط المذكورة أعلاه، وأوافق على تسليم المخلفات المذكورة لشركة النقل وأتحمل المسؤولية الكاملة عن صحة البيانات.
            </label>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1" disabled={submitting}>
              إلغاء
            </Button>
            <Button
              variant="eco"
              onClick={handleConfirm}
              className="flex-1"
              disabled={!agreed || submitting}
            >
              {submitting ? (
                <><Loader2 className="ml-2 h-4 w-4 animate-spin" /> جاري التسجيل...</>
              ) : (
                <><CheckCircle2 className="ml-2 h-4 w-4" /> تأكيد التسليم للناقل</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GeneratorHandoverDialog;
