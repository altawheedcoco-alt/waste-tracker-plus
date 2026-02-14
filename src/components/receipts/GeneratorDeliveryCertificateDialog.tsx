import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
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
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';

interface Shipment {
  id: string;
  shipment_number: string;
  status: string;
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
  paper: 'ورق',
  metal: 'معادن',
  glass: 'زجاج',
  electronic: 'إلكترونيات',
  organic: 'عضوية',
  chemical: 'كيميائية',
  medical: 'طبية',
  construction: 'مخلفات بناء',
  other: 'أخرى',
};

const GeneratorDeliveryCertificateDialog = ({
  open,
  onOpenChange,
  shipment,
  onSuccess,
}: GeneratorDeliveryCertificateDialogProps) => {
  const { organization } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);
  const { printContent, exportToPDF } = usePDFExport({ filename: `شهادة-تسليم-${shipment.shipment_number}` });
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isIssued, setIsIssued] = useState(false);

  const certNumber = `DLV-${format(new Date(), 'yyyyMMdd')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const currentDate = format(new Date(), 'PP', { locale: ar });

  const handleIssue = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('shipment_receipts')
        .insert({
          shipment_id: shipment.id,
          receipt_number: certNumber,
          status: 'confirmed',
          actual_weight: shipment.quantity,
          declared_weight: shipment.quantity,
          waste_type: shipment.waste_type,
          notes: notes || `شهادة تسليم - ${shipment.shipment_number}`,
          pickup_date: new Date().toISOString(),
          generator_id: organization?.id || null,
        } as any);

      if (error) throw error;

      // Also create a delivery declaration
      const { error: declError } = await supabase
        .from('delivery_declarations')
        .insert({
          shipment_id: shipment.id,
          declared_by_user_id: (await supabase.auth.getUser()).data.user?.id,
          declared_by_organization_id: organization?.id,
          declaration_type: 'generator_delivery',
          declaration_text: `نقر نحن ${organization?.name || 'الجهة المولدة'} بتسليم الشحنة رقم ${shipment.shipment_number} بكامل محتوياتها (${shipment.quantity} ${shipment.unit || 'كجم'} من ${wasteTypeLabels[shipment.waste_type] || shipment.waste_type}) إلى جهة النقل ${shipment.transporter?.name || ''} بحالة سليمة.`,
          shipment_number: shipment.shipment_number,
          waste_type: shipment.waste_type,
          quantity: shipment.quantity,
          unit: shipment.unit || 'كجم',
          generator_name: organization?.name || shipment.generator?.name || '',
          transporter_name: shipment.transporter?.name || '',
          auto_generated: false,
        });

      if (declError) {
        console.error('Error creating declaration:', declError);
      }

      toast.success('تم إصدار شهادة التسليم والإقرار بنجاح');
      setIsIssued(true);
    } catch (error) {
      console.error('Error issuing delivery certificate:', error);
      toast.error('حدث خطأ أثناء إصدار شهادة التسليم');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    if (printRef.current) {
      printContent(printRef.current);
    }
  };

  const handleDownload = () => {
    if (printRef.current) {
      exportToPDF(printRef.current);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            إصدار شهادة تسليم - {shipment.shipment_number}
          </DialogTitle>
        </DialogHeader>

        {/* Notes input - before issuing */}
        {!isIssued && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-muted-foreground">رقم الشحنة</p>
                <p className="font-mono font-bold">{shipment.shipment_number}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-muted-foreground">الكمية</p>
                <p className="font-bold">{shipment.quantity} {shipment.unit || 'كجم'}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-muted-foreground">نوع المخلفات</p>
                <p>{wasteTypeLabels[shipment.waste_type] || shipment.waste_type}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-muted-foreground">جهة النقل</p>
                <p>{shipment.transporter?.name || '-'}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>ملاحظات إضافية (اختياري)</Label>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="أي ملاحظات حول حالة الشحنة عند التسليم..."
                className="min-h-[80px]"
                dir="rtl"
              />
            </div>
          </div>
        )}

        {/* Certificate Preview - after issuing */}
        {isIssued && (
          <>
            <div className="flex gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1">
                <Printer className="w-4 h-4" />
                طباعة
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1">
                <Download className="w-4 h-4" />
                تحميل PDF
              </Button>
            </div>

            <div
              ref={printRef}
              className="bg-white text-black p-6 rounded-lg border"
              dir="rtl"
              style={{ fontFamily: 'Cairo, sans-serif', fontSize: '10pt' }}
            >
              {/* Header */}
              <header className="flex items-start justify-between mb-4 pb-3" style={{ borderBottom: '2px solid #2563eb' }}>
                <div className="text-center">
                  <QRCodeSVG
                    value={`${window.location.origin}/qr-verify?type=delivery&code=${encodeURIComponent(certNumber)}`}
                    size={55}
                    level="M"
                  />
                  <p style={{ fontSize: '7pt', color: '#6b7280', marginTop: '2px' }}>امسح للتحقق</p>
                </div>

                <div className="text-center flex-1 px-4">
                  <h1 style={{ fontSize: '16pt', fontWeight: 'bold', color: '#1e40af', margin: 0 }}>
                    شهادة تسليم شحنة
                  </h1>
                  <p style={{ fontSize: '9pt', color: '#4b5563', margin: '2px 0' }}>Delivery Certificate</p>
                  <div className="inline-block rounded px-3 py-1 mt-1" style={{ backgroundColor: '#eff6ff', border: '1px solid #93c5fd' }}>
                    <span style={{ fontSize: '8pt' }}>رقم الشهادة: </span>
                    <span className="font-mono font-bold" style={{ color: '#1e40af', fontSize: '9pt' }}>{certNumber}</span>
                  </div>
                </div>

                <div className="text-center">
                  <Barcode value={certNumber} width={1} height={30} fontSize={7} displayValue={false} />
                  <p className="font-mono" style={{ fontSize: '7pt', color: '#374151', marginTop: '2px' }}>{certNumber}</p>
                </div>
              </header>

              {/* Declaration */}
              <div className="rounded p-3 mb-3" style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
                <h2 className="font-bold mb-1 flex items-center gap-1" style={{ color: '#1e40af', fontSize: '10pt' }}>
                  <FileText className="w-4 h-4" />
                  إقرار تسليم رسمي
                </h2>
                <p style={{ fontSize: '9pt', color: '#1e3a8a', lineHeight: '1.5', margin: 0 }}>
                  نقر نحن <strong>{organization?.name || 'الجهة المولدة'}</strong> بتسليم الشحنة رقم{' '}
                  <strong className="font-mono">{shipment.shipment_number}</strong> بكامل محتوياتها إلى جهة النقل{' '}
                  <strong>{shipment.transporter?.name || '-'}</strong> بحالة سليمة وطبقاً للمواصفات المتفق عليها.
                </p>
              </div>

              {/* Shipment Details */}
              <div className="mb-3">
                <h3 className="font-bold mb-2 flex items-center gap-1 p-1 rounded" style={{ backgroundColor: '#f3f4f6', color: '#1f2937', fontSize: '10pt' }}>
                  <Scale className="w-4 h-4" style={{ color: '#2563eb' }} />
                  بيانات الشحنة
                </h3>
                <table className="w-full" style={{ borderCollapse: 'collapse', fontSize: '9pt' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td className="p-2 font-semibold" style={{ backgroundColor: '#f9fafb', width: '25%' }}>رقم الشحنة</td>
                      <td className="p-2 font-mono font-bold">{shipment.shipment_number}</td>
                      <td className="p-2 font-semibold" style={{ backgroundColor: '#f9fafb', width: '25%' }}>تاريخ التسليم</td>
                      <td className="p-2">{currentDate}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td className="p-2 font-semibold" style={{ backgroundColor: '#f9fafb' }}>نوع المخلفات</td>
                      <td className="p-2">{wasteTypeLabels[shipment.waste_type] || shipment.waste_type}</td>
                      <td className="p-2 font-semibold" style={{ backgroundColor: '#f9fafb' }}>الكمية</td>
                      <td className="p-2 font-bold" style={{ color: '#2563eb' }}>{shipment.quantity} {shipment.unit || 'كجم'}</td>
                    </tr>
                    {shipment.pickup_address && (
                      <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td className="p-2 font-semibold" style={{ backgroundColor: '#f9fafb' }}>موقع التسليم</td>
                        <td className="p-2" colSpan={3}>{shipment.pickup_address}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Parties */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="rounded p-3" style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
                  <h4 className="font-bold mb-1 flex items-center gap-1" style={{ color: '#2563eb', fontSize: '9pt' }}>
                    <Building2 className="w-3 h-3" />
                    الجهة المسلّمة (المولد)
                  </h4>
                  <p className="font-semibold" style={{ fontSize: '10pt' }}>{organization?.name || shipment.generator?.name || '-'}</p>
                  <p style={{ fontSize: '8pt', color: '#6b7280' }}>{shipment.generator?.city || ''}</p>
                </div>
                <div className="rounded p-3" style={{ backgroundColor: '#fef3c7', border: '1px solid #fcd34d' }}>
                  <h4 className="font-bold mb-1 flex items-center gap-1" style={{ color: '#92400e', fontSize: '9pt' }}>
                    <Truck className="w-3 h-3" />
                    الجهة المستلمة (الناقل)
                  </h4>
                  <p className="font-semibold" style={{ fontSize: '10pt' }}>{shipment.transporter?.name || '-'}</p>
                  <p style={{ fontSize: '8pt', color: '#6b7280' }}>{shipment.transporter?.city || ''}</p>
                </div>
              </div>

              {/* Notes */}
              {notes && (
                <div className="rounded p-2 mb-3" style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}>
                  <h4 className="font-bold mb-1" style={{ fontSize: '9pt', color: '#374151' }}>ملاحظات:</h4>
                  <p style={{ fontSize: '8pt', color: '#4b5563' }}>{notes}</p>
                </div>
              )}

              {/* Confirmation */}
              <div className="rounded p-3 mb-3" style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac' }}>
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4" style={{ color: '#16a34a' }} />
                  <h3 className="font-bold" style={{ color: '#15803d', fontSize: '10pt' }}>تأكيد التسليم</h3>
                </div>
                <p style={{ fontSize: '8pt', color: '#14532d', lineHeight: '1.4' }}>
                  تم تسليم الشحنة المذكورة أعلاه بكامل محتوياتها وبالكمية المصرح بها، ونتحمل كامل المسؤولية عن صحة البيانات المدونة في هذه الشهادة.
                </p>
              </div>

              {/* Signature area */}
              <div className="pt-3 mt-3 grid grid-cols-2 gap-4" style={{ borderTop: '1px solid #d1d5db' }}>
                <div className="text-center">
                  <p className="font-bold mb-1" style={{ fontSize: '9pt' }}>توقيع وختم المسلّم</p>
                  <p style={{ fontSize: '8pt', color: '#6b7280' }}>{organization?.name || shipment.generator?.name}</p>
                  <div style={{ height: '40px', borderBottom: '1px solid #9ca3af', width: '80%', margin: '8px auto' }} />
                </div>
                <div className="text-center">
                  <p className="font-bold mb-1" style={{ fontSize: '9pt' }}>توقيع وختم المستلم</p>
                  <p style={{ fontSize: '8pt', color: '#6b7280' }}>{shipment.transporter?.name}</p>
                  <div style={{ height: '40px', borderBottom: '1px solid #9ca3af', width: '80%', margin: '8px auto' }} />
                </div>
              </div>

              {/* Footer */}
              <footer className="mt-3 pt-2 text-center" style={{ borderTop: '1px solid #e5e7eb', fontSize: '7pt', color: '#9ca3af' }}>
                <p style={{ margin: 0 }}>
                  تم إصدار هذه الشهادة إلكترونياً | تاريخ الإصدار: {currentDate} | رقم المرجع: {certNumber}
                </p>
              </footer>
            </div>
          </>
        )}

        <DialogFooter className="gap-2">
          {!isIssued ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
              <Button onClick={handleIssue} disabled={isSubmitting} className="gap-2">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                إصدار شهادة التسليم والإقرار
              </Button>
            </>
          ) : (
            <Button onClick={() => { onSuccess?.(); onOpenChange(false); }} className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              تم
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GeneratorDeliveryCertificateDialog;
