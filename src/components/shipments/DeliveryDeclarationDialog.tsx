import { useState, useRef } from 'react';
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

interface DeliveryDeclarationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipment: {
    id: string;
    shipment_number: string;
    waste_type: string;
    quantity: number;
    unit?: string;
    generator_name?: string;
    transporter_name?: string;
    recycler_name?: string;
    disposal_name?: string;
  };
  onConfirmed: () => void;
}

const DECLARATION_TEXT = `إقرار تسليم شحنة نفايات

أقر أنا الموقع أدناه، بصفتي ممثلاً عن جهة النقل / السائق المسؤول، بما يلي:

أولاً - إثبات التسليم:
أُقر بأنني قد قمت بتسليم الشحنة المذكورة أعلاه إلى الجهة المستلمة (جهة التدوير / جهة التخلص النهائي) في الموقع المحدد وفي التاريخ والوقت المسجلين آلياً بالنظام، وأن الشحنة قد تم تسليمها بحالتها كاملة دون نقص أو تلاعب.

ثانياً - المسؤولية الكاملة:
أتحمل المسؤولية الكاملة عن صحة البيانات المدخلة في هذا الإقرار، بما في ذلك نوع النفايات والكمية وحالة الشحنة عند التسليم. وأي بيانات مغلوطة أو مضللة تُعد مخالفة تستوجب المساءلة القانونية.

ثالثاً - الالتزام البيئي:
أُقر بأن عملية النقل قد تمت وفقاً للاشتراطات البيئية والصحية المعتمدة، وأن المركبة المستخدمة مرخصة ومطابقة لنقل هذا النوع من النفايات.

رابعاً - سلسلة الحيازة:
أُقر بأن سلسلة الحيازة (Chain of Custody) للشحنة لم تُنتهك في أي مرحلة من مراحل النقل، وأن الشحنة لم تتعرض لأي تحويل أو إضافة أو تفريغ غير مصرح به.

خامساً - العواقب القانونية:
أُدرك أن أي مخالفة لما ورد في هذا الإقرار قد تترتب عليها العواقب التالية:
• تعليق حساب الناقل / السائق فوراً من المنصة
• إبلاغ الجهات الرقابية المختصة (جهاز تنظيم إدارة المخلفات WMRA)
• المسؤولية المدنية والجنائية وفقاً لقانون تنظيم إدارة المخلفات رقم 202 لسنة 2020
• تحمل كافة الأضرار والتعويضات الناتجة عن أي مخالفة

سادساً - التوثيق الرقمي:
أُقر بأن هذا الإقرار يُعد وثيقة رسمية مسجلة إلكترونياً بالنظام، وتحمل بصمة رقمية (Digital Signature) تتضمن عنوان IP الخاص بي، والطابع الزمني، ومعلومات الجهاز المستخدم، وهي غير قابلة للتعديل أو الحذف.`;

const DeliveryDeclarationDialog = ({
  open,
  onOpenChange,
  shipment,
  onConfirmed,
}: DeliveryDeclarationDialogProps) => {
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
          declaration_text: DECLARATION_TEXT,
          ip_address: null, // Will be captured server-side if needed
          user_agent: navigator.userAgent,
          driver_name: profile?.full_name || null,
          driver_national_id: null,
          shipment_number: shipment.shipment_number,
          waste_type: shipment.waste_type,
          quantity: shipment.quantity,
          unit: shipment.unit || 'طن',
          generator_name: shipment.generator_name || null,
          transporter_name: shipment.transporter_name || organization.name || null,
          recycler_name: shipment.recycler_name || null,
          disposal_name: shipment.disposal_name || null,
        } as any);

      if (error) throw error;

      toast.success('تم تسجيل إقرار التسليم بنجاح');
      setAgreed(false);
      setScrolledToBottom(false);
      onConfirmed();
      onOpenChange(false);
    } catch (err: any) {
      console.error('Declaration error:', err);
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
            إقرار تسليم الشحنة - {shipment.shipment_number}
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 pt-2">
          <div className="p-3 rounded-lg bg-muted/50 text-sm grid grid-cols-2 gap-2">
            <div><span className="text-muted-foreground">نوع النفايات:</span> <strong>{shipment.waste_type}</strong></div>
            <div><span className="text-muted-foreground">الكمية:</span> <strong>{shipment.quantity} {shipment.unit || 'طن'}</strong></div>
            {shipment.generator_name && <div><span className="text-muted-foreground">المولد:</span> <strong>{shipment.generator_name}</strong></div>}
            {shipment.recycler_name && <div><span className="text-muted-foreground">المدوّر:</span> <strong>{shipment.recycler_name}</strong></div>}
            {shipment.disposal_name && <div><span className="text-muted-foreground">جهة التخلص:</span> <strong>{shipment.disposal_name}</strong></div>}
          </div>
        </div>

        {/* Declaration Text */}
        <div className="px-4">
          <ScrollArea className="h-[300px] border rounded-lg p-4 bg-card" onScrollCapture={handleScroll}>
            <div className="whitespace-pre-wrap text-sm leading-7 text-right font-medium">
              {DECLARATION_TEXT}
            </div>
          </ScrollArea>
          {!scrolledToBottom && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 text-center">⬇️ يرجى قراءة الإقرار بالكامل قبل الموافقة</p>
          )}
        </div>

        {/* Agreement */}
        <div className="px-4 pb-4 space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg border border-accent bg-accent/10">
            <Checkbox
              id="declaration-agree"
              checked={agreed}
              onCheckedChange={(c) => setAgreed(c === true)}
              disabled={!scrolledToBottom}
            />
            <label htmlFor="declaration-agree" className="text-sm cursor-pointer leading-6">
              أُقر بأنني قد قرأت وفهمت جميع الشروط والعواقب المذكورة أعلاه، وأوافق عليها بالكامل وأتحمل المسؤولية الكاملة عن تسليم هذه الشحنة.
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
                <><CheckCircle2 className="ml-2 h-4 w-4" /> تأكيد التسليم والإقرار</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeliveryDeclarationDialog;
