import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { generateDocumentIdentity } from '@/utils/documentIdentityGenerator';
import { useAuth } from '@/contexts/AuthContext';
import { usePDFExport } from '@/hooks/usePDFExport';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Send,
  Loader2,
  Printer,
  Download,
  Package,
  Building2,
  Truck,
  CheckCircle2,
  FileText,
  Scale,
  MapPin,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  Recycle,
  Hash,
  ClipboardCheck,
  User,
  Phone,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import TermsBackPage from '@/components/print/TermsBackPage';

interface Shipment {
  id: string;
  shipment_number: string;
  status: string;
  created_at?: string;
  waste_type: string;
  quantity: number;
  unit?: string;
  delivered_at?: string | null;
  confirmed_at?: string | null;
  pickup_address?: string;
  delivery_address?: string;
  generator?: { name: string; city?: string } | null;
  transporter?: { name: string; city?: string } | null;
  recycler?: { name: string; city?: string } | null;
}

interface GeneratorDeliveryCertificateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipment: Shipment;
  onSuccess?: () => void;
}

const wasteTypeLabels: Record<string, string> = {
  plastic: 'بلاستيك',
  paper: 'ورق وكرتون',
  metal: 'معادن',
  glass: 'زجاج',
  electronic: 'نفايات إلكترونية (WEEE)',
  organic: 'مخلفات عضوية',
  chemical: 'مخلفات كيميائية خطرة',
  medical: 'نفايات طبية',
  construction: 'مخلفات بناء وهدم',
  textile: 'منسوجات',
  rubber: 'مطاط وإطارات',
  wood: 'أخشاب',
  oil: 'زيوت مستعملة',
  batteries: 'بطاريات',
  other: 'أخرى',
};

const wasteHazardLevel: Record<string, { label: string; color: string }> = {
  chemical: { label: 'خطرة', color: '#dc2626' },
  medical: { label: 'خطرة', color: '#dc2626' },
  electronic: { label: 'متوسطة الخطورة', color: '#f59e0b' },
  batteries: { label: 'متوسطة الخطورة', color: '#f59e0b' },
  oil: { label: 'متوسطة الخطورة', color: '#f59e0b' },
  plastic: { label: 'غير خطرة', color: '#16a34a' },
  paper: { label: 'غير خطرة', color: '#16a34a' },
  metal: { label: 'غير خطرة', color: '#16a34a' },
  glass: { label: 'غير خطرة', color: '#16a34a' },
  organic: { label: 'غير خطرة', color: '#16a34a' },
  construction: { label: 'غير خطرة', color: '#16a34a' },
  textile: { label: 'غير خطرة', color: '#16a34a' },
  rubber: { label: 'غير خطرة', color: '#16a34a' },
  wood: { label: 'غير خطرة', color: '#16a34a' },
  other: { label: 'غير محدد', color: '#6b7280' },
};

const DECLARATION_TEXT = `أولاً — إثبات التسليم:
نُقر بأننا قد قمنا بتسليم المخلفات المذكورة أعلاه بكامل محتوياتها ومواصفاتها إلى ممثل جهة النقل المعتمدة، وأن البيانات المسجلة في النظام (النوع، الكمية، التصنيف، الحالة، درجة الخطورة) صحيحة ودقيقة وتمثل الواقع الفعلي لحظة التسليم.

ثانياً — المسؤولية عن صحة البيانات والتصنيف:
نتحمل المسؤولية المدنية والجنائية الكاملة عن صحة بيانات المخلفات المُسلّمة، بما في ذلك التصنيف وفقاً لقائمة بازل الدولية والتشريعات المصرية النافذة. وأي بيانات مغلوطة أو مضللة أو إخفاء متعمد لطبيعة المخلفات تُعد مخالفة جسيمة تستوجب المساءلة القانونية والجزائية وفقاً لأحكام قانون العقوبات المصري وقانون تنظيم إدارة المخلفات.

ثالثاً — الالتزام بالاشتراطات البيئية والصحية:
نُقر بأن المخلفات المُسلّمة قد تم فرزها وتجهيزها وتعبئتها ونقلها وفقاً للاشتراطات البيئية والصحية المعتمدة من جهاز تنظيم إدارة المخلفات (WMRA) والهيئة العامة لشؤون البيئة (EEAA)، وأنها مطابقة للوصف المسجل في النظام.

رابعاً — سلسلة الحيازة القانونية:
نُقر بأن هذا التسليم يمثل بداية سلسلة الحيازة القانونية (Chain of Custody) للشحنة، وأن أي تلاعب أو تغيير في محتويات الشحنة أو بياناتها بعد لحظة التسليم لا يقع تحت مسؤوليتنا. يلتزم كل طرف بالحفاظ على نزاهة سلسلة الحيازة وتوثيقها.

خامساً — الالتزام بشروط وسياسات المنصة:
يخضع هذا الإقرار لشروط وأحكام وسياسات منصة iRecycle المنشورة والمعتمدة. والمخالف لأي من هذه الشروط يتحمل كافة التبعات والمسؤوليات القانونية المدنية والجنائية المترتبة على ذلك دون أدنى مسؤولية على المنصة.

سادساً — المرجعية القانونية:
يخضع هذا الإقرار لأحكام قانون تنظيم إدارة المخلفات رقم 202 لسنة 2020 ولائحته التنفيذية، وقانون حماية البيئة رقم 4 لسنة 1994 المعدّل بالقانون رقم 9 لسنة 2009، وقانون حماية المستهلك رقم 181 لسنة 2018، واتفاقية بازل بشأن التحكم في نقل النفايات الخطرة والتخلص منها عبر الحدود، والقوانين واللوائح المصرية ذات الصلة.

⚠️ تحذير: أي إخلال بالالتزامات الواردة في هذا الإقرار يعرّض المخالف للمساءلة المدنية والجنائية وفقاً للقوانين المصرية النافذة.`;

const GeneratorDeliveryCertificateDialog = ({
  open,
  onOpenChange,
  shipment,
  onSuccess,
}: GeneratorDeliveryCertificateDialogProps) => {
  const { organization, user, profile } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);
  const { printContent, exportToPDF } = usePDFExport({ filename: `شهادة-تسليم-وإقرار-${shipment.shipment_number}` });
  const [notes, setNotes] = useState('');
  const [driverName, setDriverName] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [wasteCondition, setWasteCondition] = useState('سليمة ومُعبأة');
  const [agreedToDeclaration, setAgreedToDeclaration] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isIssued, setIsIssued] = useState(false);

  const certNumber = `DLV-${format(new Date(), 'yyyyMMdd')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const currentDate = format(new Date(), 'PP', { locale: ar });
  const currentTime = format(new Date(), 'hh:mm a', { locale: ar });
  const hazard = wasteHazardLevel[shipment.waste_type] || wasteHazardLevel['other'];

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 30;
    if (isBottom) setScrolledToBottom(true);
  };

  const fullDeclarationText = `شهادة تسليم وإقرار قانوني - الشحنة رقم ${shipment.shipment_number}
نُقر نحن ${organization?.name || 'الجهة المولدة'} بتسليم شحنة المخلفات رقم ${shipment.shipment_number} بكامل محتوياتها (${shipment.quantity} ${shipment.unit || 'كجم'} من ${wasteTypeLabels[shipment.waste_type] || shipment.waste_type} - درجة الخطورة: ${hazard.label}) إلى جهة النقل ${shipment.transporter?.name || '-'}${driverName ? ` بواسطة السائق ${driverName}` : ''}${vehiclePlate ? ` - مركبة رقم ${vehiclePlate}` : ''}.
حالة المخلفات عند التسليم: ${wasteCondition}.
${DECLARATION_TEXT}`;

  const handleIssue = async () => {
    if (!agreedToDeclaration) {
      toast.error('يجب الموافقة على نص الإقرار أولاً');
      return;
    }
    setIsSubmitting(true);
    try {
      // Create receipt
      const identity = generateDocumentIdentity('shipment_receipt', certNumber, {
        shipmentNumber: shipment.shipment_number,
      });
      const { error } = await supabase
        .from('shipment_receipts')
        .insert({
          shipment_id: shipment.id,
          receipt_number: certNumber,
          status: 'confirmed',
          actual_weight: shipment.quantity,
          declared_weight: shipment.quantity,
          waste_type: shipment.waste_type,
          notes: notes || `شهادة تسليم وإقرار - ${shipment.shipment_number}`,
          pickup_date: new Date().toISOString(),
          generator_id: organization?.id || null,
          unit: shipment.unit || 'كجم',
          ...identity,
        } as any);

      if (error) throw error;

      // Create delivery declaration
      const { error: declError } = await supabase
        .from('delivery_declarations')
        .insert({
          shipment_id: shipment.id,
          declared_by_user_id: user?.id,
          declared_by_organization_id: organization?.id,
          declaration_type: 'generator_delivery',
          declaration_text: fullDeclarationText,
          shipment_number: shipment.shipment_number,
          waste_type: shipment.waste_type,
          quantity: shipment.quantity,
          unit: shipment.unit || 'كجم',
          generator_name: organization?.name || shipment.generator?.name || '',
          transporter_name: shipment.transporter?.name || '',
          recycler_name: shipment.recycler?.name || '',
          driver_name: driverName || null,
          user_agent: navigator.userAgent,
          auto_generated: false,
        });

      if (declError) console.error('Declaration error:', declError);

      toast.success('تم إصدار شهادة التسليم والإقرار القانوني بنجاح');
      setIsIssued(true);
    } catch (error) {
      console.error('Error issuing certificate:', error);
      toast.error('حدث خطأ أثناء إصدار الشهادة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    if (printRef.current) printContent(printRef.current);
  };

  const handleDownload = () => {
    if (printRef.current) exportToPDF(printRef.current);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[96vw] max-h-[90vh] overflow-auto p-0" dir="rtl">
        <DialogHeader className="p-4 pb-2 border-b">
          <DialogTitle className="flex items-center gap-2 text-right">
            <ShieldCheck className="w-5 h-5 text-primary" />
            شهادة تسليم وإقرار قانوني - {shipment.shipment_number}
          </DialogTitle>
        </DialogHeader>

        {/* === FORM: Before issuing === */}
        {!isIssued && (
          <div className="p-4 space-y-4">
            {/* Shipment Summary */}
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                ملخص الشحنة
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-muted-foreground text-xs">رقم الشحنة</span>
                  <p className="font-mono font-bold">{shipment.shipment_number}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">نوع المخلفات</span>
                  <p className="font-medium">{wasteTypeLabels[shipment.waste_type] || shipment.waste_type}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">الكمية</span>
                  <p className="font-bold text-primary">{shipment.quantity} {shipment.unit || 'كجم'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">درجة الخطورة</span>
                  <p className="font-medium" style={{ color: hazard.color }}>{hazard.label}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">جهة النقل</span>
                  <p className="font-medium">{shipment.transporter?.name || '-'}</p>
                </div>
                {shipment.recycler?.name && (
                  <div>
                    <span className="text-muted-foreground text-xs">جهة التدوير/التخلص</span>
                    <p className="font-medium">{shipment.recycler.name}</p>
                  </div>
                )}
                {shipment.pickup_address && (
                  <div className="col-span-2 sm:col-span-3">
                    <span className="text-muted-foreground text-xs">موقع التحميل</span>
                    <p className="font-medium">{shipment.pickup_address}</p>
                  </div>
                )}
                {shipment.delivery_address && (
                  <div className="col-span-2 sm:col-span-3">
                    <span className="text-muted-foreground text-xs">موقع التفريغ</span>
                    <p className="font-medium">{shipment.delivery_address}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1 text-xs"><User className="w-3 h-3" /> اسم السائق المستلم</Label>
                <Input value={driverName} onChange={e => setDriverName(e.target.value)} placeholder="اسم سائق شركة النقل" />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1 text-xs"><Truck className="w-3 h-3" /> رقم لوحة المركبة</Label>
                <Input value={vehiclePlate} onChange={e => setVehiclePlate(e.target.value)} placeholder="مثال: أ ب ج 1234" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">حالة المخلفات عند التسليم</Label>
              <Input value={wasteCondition} onChange={e => setWasteCondition(e.target.value)} placeholder="سليمة ومُعبأة وفقاً للمعايير" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">ملاحظات إضافية (اختياري)</Label>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="أي ملاحظات حول ظروف التسليم أو حالة المخلفات..."
                className="min-h-[60px]"
              />
            </div>

            <Separator />

            {/* Declaration */}
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                نص الإقرار القانوني
              </h3>
              <ScrollArea className="h-[200px] border rounded-lg p-3 bg-card text-xs leading-6" onScrollCapture={handleScroll}>
                <div className="whitespace-pre-wrap font-medium">{DECLARATION_TEXT}</div>
              </ScrollArea>
              {!scrolledToBottom && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 text-center">⬇️ يرجى قراءة الإقرار بالكامل</p>
              )}
            </div>

            {/* Agreement Checkbox */}
            <div className="flex items-start gap-3 p-3 rounded-lg border border-accent bg-accent/10">
              <Checkbox
                id="cert-agree"
                checked={agreedToDeclaration}
                onCheckedChange={(c) => setAgreedToDeclaration(c === true)}
                disabled={!scrolledToBottom}
              />
              <label htmlFor="cert-agree" className="text-xs cursor-pointer leading-5">
                أُقر بصفتي ممثلاً عن <strong>{organization?.name || 'الجهة المولدة'}</strong> بأنني قرأت وفهمت جميع بنود الإقرار، وأوافق على تسليم المخلفات المذكورة وأتحمل المسؤولية الكاملة عن صحة البيانات.
              </label>
            </div>
          </div>
        )}

        {/* === PREVIEW: After issuing === */}
        {isIssued && (
          <div className="p-4">
            <div className="flex gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1">
                <Printer className="w-4 h-4" /> طباعة
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1">
                <Download className="w-4 h-4" /> تحميل PDF
              </Button>
            </div>

            <div
              ref={printRef}
              className="bg-white text-black rounded-lg border"
              dir="rtl"
              style={{ fontFamily: 'Cairo, sans-serif' }}
            >
              {/* Page 1 — Main Document */}
              <div style={{ padding: '8mm 10mm', maxWidth: '210mm', width: '100%', minHeight: '297mm', boxSizing: 'border-box', pageBreakAfter: 'always', display: 'flex', flexDirection: 'column', fontSize: '8pt', margin: '0 auto', overflow: 'hidden', wordBreak: 'break-word' as const }}>
              {/* === PRINT HEADER === */}
              <header className="flex items-start justify-between mb-2 pb-2" style={{ borderBottom: '3px double #1e40af' }}>
                <div className="text-center">
                  <QRCodeSVG
                    value={`${window.location.origin}/qr-verify?type=delivery-cert&code=${encodeURIComponent(certNumber)}`}
                    size={45}
                    level="M"
                  />
                  <p style={{ fontSize: '5pt', color: '#6b7280', marginTop: '1px' }}>امسح للتحقق</p>
                </div>
                <div className="text-center flex-1 px-3">
                  <h1 style={{ fontSize: '13pt', fontWeight: 'bold', color: '#1e40af', margin: 0 }}>
                    شهادة تسليم مخلفات وإقرار قانوني
                  </h1>
                  <p style={{ fontSize: '7pt', color: '#4b5563', margin: '1px 0' }}>Waste Delivery Certificate & Legal Declaration</p>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <div className="inline-block rounded px-1.5 py-0.5" style={{ backgroundColor: '#eff6ff', border: '1px solid #93c5fd' }}>
                      <span style={{ fontSize: '6pt' }}>رقم الشهادة: </span>
                      <span className="font-mono font-bold" style={{ color: '#1e40af', fontSize: '7pt' }}>{certNumber}</span>
                    </div>
                    <div className="inline-block rounded px-1.5 py-0.5" style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac' }}>
                      <span style={{ fontSize: '6pt' }}>رقم الشحنة: </span>
                      <span className="font-mono font-bold" style={{ color: '#15803d', fontSize: '7pt' }}>{shipment.shipment_number}</span>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <Barcode value={certNumber} width={1.3} height={38} fontSize={7} displayValue={false} margin={2} />
                  <p className="font-mono" style={{ fontSize: '6pt', color: '#374151', marginTop: '2px', fontWeight: 'bold' }}>{certNumber}</p>
                </div>
              </header>

              {/* === DATE & TIME === */}
              <div className="flex justify-between items-center mb-2 text-center" style={{ fontSize: '7pt' }}>
                <div className="flex items-center gap-1">
                  <Calendar className="w-2.5 h-2.5" style={{ color: '#6b7280' }} />
                  <span style={{ color: '#6b7280' }}>تاريخ التسليم:</span>
                  <strong>{currentDate}</strong>
                </div>
                <div className="flex items-center gap-1">
                  <span style={{ color: '#6b7280' }}>الساعة:</span>
                  <strong>{currentTime}</strong>
                </div>
              </div>

              {/* === PARTIES === */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 mb-2">
                <div className="rounded p-1.5" style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
                  <h4 className="font-bold flex items-center gap-1 mb-0.5" style={{ color: '#1e40af', fontSize: '7pt' }}>
                    <Building2 className="w-2.5 h-2.5" /> الجهة المسلّمة (المولّد)
                  </h4>
                  <p className="font-bold" style={{ fontSize: '8pt' }}>{organization?.name || shipment.generator?.name || '-'}</p>
                  {shipment.generator?.city && <p style={{ fontSize: '6pt', color: '#6b7280' }}>📍 {shipment.generator.city}</p>}
                  {profile?.full_name && <p style={{ fontSize: '6pt', color: '#6b7280' }}>👤 {profile.full_name}</p>}
                </div>
                <div className="rounded p-1.5" style={{ backgroundColor: '#fef3c7', border: '1px solid #fcd34d' }}>
                  <h4 className="font-bold flex items-center gap-1 mb-0.5" style={{ color: '#92400e', fontSize: '7pt' }}>
                    <Truck className="w-2.5 h-2.5" /> الجهة المستلمة (الناقل)
                  </h4>
                  <p className="font-bold" style={{ fontSize: '8pt' }}>{shipment.transporter?.name || '-'}</p>
                  {driverName && <p style={{ fontSize: '6pt', color: '#6b7280' }}>🚛 {driverName}</p>}
                  {vehiclePlate && <p style={{ fontSize: '6pt', color: '#6b7280' }}>🔢 {vehiclePlate}</p>}
                </div>
                <div className="rounded p-1.5" style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac' }}>
                  <h4 className="font-bold flex items-center gap-1 mb-0.5" style={{ color: '#15803d', fontSize: '7pt' }}>
                    <Recycle className="w-2.5 h-2.5" /> جهة التدوير/التخلص
                  </h4>
                  <p className="font-bold" style={{ fontSize: '8pt' }}>{shipment.recycler?.name || '-'}</p>
                </div>
              </div>

              {/* === SHIPMENT DETAILS TABLE === */}
              <div className="mb-2">
                <h3 className="font-bold mb-1 flex items-center gap-1 p-0.5 rounded" style={{ backgroundColor: '#f3f4f6', color: '#1f2937', fontSize: '8pt' }}>
                  <Scale className="w-2.5 h-2.5" style={{ color: '#2563eb' }} />
                  بيانات الشحنة التفصيلية
                </h3>
                <table className="w-full" style={{ borderCollapse: 'collapse', fontSize: '7pt' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td className="p-1 font-semibold" style={{ backgroundColor: '#f9fafb', width: '20%' }}>رقم الشحنة</td>
                      <td className="p-1 font-mono font-bold">{shipment.shipment_number}</td>
                      <td className="p-1 font-semibold" style={{ backgroundColor: '#f9fafb', width: '20%' }}>تاريخ الإنشاء</td>
                      <td className="p-1">{shipment.created_at ? format(new Date(shipment.created_at), 'PP', { locale: ar }) : '-'}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td className="p-1 font-semibold" style={{ backgroundColor: '#f9fafb' }}>نوع المخلفات</td>
                      <td className="p-1 font-medium">{wasteTypeLabels[shipment.waste_type] || shipment.waste_type}</td>
                      <td className="p-1 font-semibold" style={{ backgroundColor: '#f9fafb' }}>درجة الخطورة</td>
                      <td className="p-1 font-bold" style={{ color: hazard.color }}>{hazard.label}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td className="p-1 font-semibold" style={{ backgroundColor: '#f9fafb' }}>الكمية المُصرّح بها</td>
                      <td className="p-1 font-bold" style={{ color: '#2563eb' }}>{shipment.quantity} {shipment.unit || 'كجم'}</td>
                      <td className="p-1 font-semibold" style={{ backgroundColor: '#f9fafb' }}>حالة المخلفات</td>
                      <td className="p-1">{wasteCondition}</td>
                    </tr>
                    {shipment.pickup_address && (
                      <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td className="p-1 font-semibold" style={{ backgroundColor: '#f9fafb' }}>موقع التحميل</td>
                        <td className="p-1" colSpan={3}>{shipment.pickup_address}</td>
                      </tr>
                    )}
                    {shipment.delivery_address && (
                      <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td className="p-1 font-semibold" style={{ backgroundColor: '#f9fafb' }}>موقع التفريغ</td>
                        <td className="p-1" colSpan={3}>{shipment.delivery_address}</td>
                      </tr>
                    )}
                    {driverName && (
                      <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td className="p-1 font-semibold" style={{ backgroundColor: '#f9fafb' }}>السائق المستلم</td>
                        <td className="p-1">{driverName}</td>
                        <td className="p-1 font-semibold" style={{ backgroundColor: '#f9fafb' }}>رقم المركبة</td>
                        <td className="p-1 font-mono">{vehiclePlate || '-'}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* === LEGAL DECLARATION === */}
              <div className="rounded p-2 mb-2" style={{ backgroundColor: '#fefce8', border: '1px solid #fde68a', flex: 1 }}>
                <h2 className="font-bold mb-1 flex items-center gap-1" style={{ color: '#92400e', fontSize: '8pt' }}>
                  <ClipboardCheck className="w-3 h-3" />
                  الإقرار القانوني
                </h2>
                <p style={{ fontSize: '7pt', color: '#78350f', lineHeight: '1.4', margin: '0 0 4px 0' }}>
                  نُقر نحن <strong>{organization?.name || 'الجهة المولدة'}</strong> بتسليم الشحنة رقم{' '}
                  <strong className="font-mono">{shipment.shipment_number}</strong> بكامل محتوياتها (
                  <strong>{shipment.quantity} {shipment.unit || 'كجم'}</strong> من{' '}
                  <strong>{wasteTypeLabels[shipment.waste_type] || shipment.waste_type}</strong> - درجة الخطورة:{' '}
                  <strong style={{ color: hazard.color }}>{hazard.label}</strong>) إلى جهة النقل{' '}
                  <strong>{shipment.transporter?.name || '-'}</strong>
                  {driverName && <> بواسطة السائق <strong>{driverName}</strong></>}
                  {vehiclePlate && <> - مركبة رقم <strong>{vehiclePlate}</strong></>}.
                </p>
                <div style={{ fontSize: '6.5pt', color: '#92400e', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                  {DECLARATION_TEXT}
                </div>
              </div>

              {/* === NOTES === */}
              {notes && (
                <div className="rounded p-1.5 mb-2" style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}>
                  <h4 className="font-bold mb-0.5" style={{ fontSize: '7pt', color: '#374151' }}>ملاحظات:</h4>
                  <p style={{ fontSize: '6.5pt', color: '#4b5563' }}>{notes}</p>
                </div>
              )}

              {/* === CONFIRMATION BADGE === */}
              <div className="rounded p-1.5 mb-2" style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac' }}>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3" style={{ color: '#16a34a' }} />
                  <h3 className="font-bold" style={{ color: '#15803d', fontSize: '8pt' }}>تم التسليم والتوثيق بنجاح</h3>
                </div>
                <p style={{ fontSize: '6pt', color: '#14532d', lineHeight: '1.3', marginTop: '1px' }}>
                  تم إصدار هذه الشهادة والإقرار القانوني إلكترونياً بتاريخ {currentDate} الساعة {currentTime}. المسؤول: {profile?.full_name || '-'}.
                </p>
              </div>

              {/* === LEGAL DISCLAIMER === */}
              <div className="rounded p-1.5 mb-2" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', fontSize: '6.5pt', color: '#991b1b', lineHeight: '1.4' }}>
                <p style={{ margin: 0, fontWeight: 'bold' }}>⚖️ إخلاء مسؤولية وتحذير قانوني:</p>
                <p style={{ margin: '2px 0 0 0' }}>
                  هذا المستند ملزم قانونياً. أي مخالفة أو تلاعب يُعرّض المخالف للمساءلة المدنية والجنائية وفقاً لقانون 202/2020 وقانون العقوبات المصري. يخضع لشروط وسياسات منصة iRecycle.
                </p>
              </div>

              {/* === SIGNATURES === */}
              <div className="pt-1.5 mt-1 grid grid-cols-2 gap-3" style={{ borderTop: '1px solid #d1d5db' }}>
                <div className="text-center">
                  <p className="font-bold mb-0.5" style={{ fontSize: '7pt' }}>توقيع وختم المسلّم (المولّد)</p>
                  <p style={{ fontSize: '6pt', color: '#6b7280' }}>{organization?.name || shipment.generator?.name}</p>
                  <div style={{ height: '25px', borderBottom: '1px solid #9ca3af', width: '80%', margin: '4px auto' }} />
                  <p style={{ fontSize: '5.5pt', color: '#9ca3af' }}>الاسم: ...................... التاريخ: ............</p>
                </div>
                <div className="text-center">
                  <p className="font-bold mb-0.5" style={{ fontSize: '7pt' }}>توقيع وختم المستلم (الناقل)</p>
                  <p style={{ fontSize: '6pt', color: '#6b7280' }}>{shipment.transporter?.name}</p>
                  <div style={{ height: '25px', borderBottom: '1px solid #9ca3af', width: '80%', margin: '4px auto' }} />
                  <p style={{ fontSize: '5.5pt', color: '#9ca3af' }}>الاسم: ...................... التاريخ: ............</p>
                </div>
              </div>

              {/* === FOOTER === */}
              <footer className="mt-2 pt-1.5 text-center" style={{ borderTop: '2px solid #e5e7eb', fontSize: '6pt', color: '#6b7280' }}>
                <p style={{ margin: 0 }}>
                  مستند رسمي مؤمن وذكي | {certNumber} | {shipment.shipment_number} | {currentDate} | قانون 202/2020
                </p>
                <p style={{ margin: '2px 0 0 0', fontStyle: 'italic', color: '#16a34a', fontWeight: 'bold', fontSize: '6.5pt', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', flexWrap: 'wrap' }}>
                  {[
                    'الإنتاج عليك.. والدائرة المقفولة علينا. خليك',
                    'إدارة مخلفات بمواصفات عالمية.. سيستم مبيغلطش.',
                    'إحنا مش بنلم مخلفات، إحنا بنقفل دايرة الإنتاج صح.',
                    'من المصنع للمستقبل.. سكة واحدة مع',
                  ][Math.floor(Date.now() / 86400000) % 4]}
                  <img src="/irecycle-logo.png" alt="iRecycle" style={{ height: '14px', verticalAlign: 'middle', borderRadius: '3px' }} />
                </p>
              </footer>
              </div>

              {/* Page 2 — Terms Back Page */}
              <TermsBackPage />
            </div>
          </div>
        )}

        {/* === FOOTER ACTIONS === */}
        <DialogFooter className="p-4 pt-2 border-t gap-2">
          {!isIssued ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
              <Button onClick={handleIssue} disabled={isSubmitting || !agreedToDeclaration} className="gap-2">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                إصدار الشهادة والإقرار
              </Button>
            </>
          ) : (
            <Button onClick={() => { onSuccess?.(); onOpenChange(false); }} className="gap-2">
              <CheckCircle2 className="w-4 h-4" /> تم
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GeneratorDeliveryCertificateDialog;
