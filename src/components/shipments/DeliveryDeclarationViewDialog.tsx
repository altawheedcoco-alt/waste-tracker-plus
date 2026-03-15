import { useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Printer, Download, X, FileCheck } from 'lucide-react';
import MemberNameLink from '@/components/org-structure/MemberNameLink';
import TermsBackPage from '@/components/print/TermsBackPage';
import { usePDFExport } from '@/hooks/usePDFExport';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface DeclarationData {
  id: string;
  shipment_number: string | null;
  waste_type: string | null;
  quantity: number | null;
  unit: string | null;
  declaration_type?: string | null;
  declaration_text: string;
  declared_at: string;
  driver_name: string | null;
  driver_national_id: string | null;
  generator_name: string | null;
  transporter_name: string | null;
  recycler_name: string | null;
  disposal_name: string | null;
  user_agent: string | null;
}

interface DeliveryDeclarationViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  declaration: DeclarationData | null;
}

const DeliveryDeclarationViewDialog = ({
  open,
  onOpenChange,
  declaration,
}: DeliveryDeclarationViewDialogProps) => {
  const printRef = useRef<HTMLDivElement>(null);
  const { exportToPDF, printContent, isExporting } = usePDFExport({
    filename: `delivery-declaration-${declaration?.shipment_number || 'doc'}`,
    orientation: 'portrait',
    format: 'a4',
  });

  if (!declaration) return null;

  const handleDownload = () => {
    if (printRef.current) {
      exportToPDF(printRef.current, `إقرار-تسليم-${declaration.shipment_number}`);
    }
  };

  const handlePrint = () => {
    if (printRef.current) {
      printContent(printRef.current);
    }
  };

  const declaredDate = declaration.declared_at 
    ? format(new Date(declaration.declared_at), 'dd MMMM yyyy - hh:mm a', { locale: ar })
    : '';

  const declarationTitle = declaration.declaration_type === 'generator_handover' 
    ? 'إقرار تسليم مخلفات من المولّد' 
    : declaration.declaration_type === 'recycler_receipt' 
    ? 'إقرار استلام مخلفات — المدوّر/جهة التخلص' 
    : 'إقرار تسليم واستلام شحنة مخلفات';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[96vw] max-h-[90vh] p-0 overflow-hidden" dir="rtl">
        <DialogHeader className="p-3 border-b sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="flex items-center gap-2 text-right text-sm sm:text-base truncate">
              <FileCheck className="w-5 h-5 text-primary flex-shrink-0" />
              إقرار تسليم الشحنة
            </DialogTitle>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Button variant="outline" size="icon" onClick={handlePrint} disabled={isExporting} className="h-9 w-9">
                <Printer className="h-4 w-4" />
              </Button>
              <Button variant="default" size="icon" onClick={handleDownload} disabled={isExporting} className="h-9 w-9">
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-9 w-9">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-70px)]">
          <div ref={printRef} dir="rtl" className="print-document w-full overflow-hidden" style={{ fontFamily: "'Cairo', 'Segoe UI', Tahoma, sans-serif" }}>
            {/* Page 1 — Main Document */}
            <div style={{ padding: '12px', boxSizing: 'border-box', pageBreakAfter: 'always', display: 'flex', flexDirection: 'column', width: '100%', overflow: 'hidden', wordBreak: 'break-word' }}>
              {/* Header */}
              <div style={{ textAlign: 'center', borderBottom: '3px double #16a34a', paddingBottom: '12px', marginBottom: '12px' }}>
                <h1 style={{ color: '#16a34a', fontSize: '15px', margin: '0 0 2px', fontWeight: 'bold', wordWrap: 'break-word' }}>
                  {declarationTitle}
                </h1>
                <p style={{ color: '#374151', fontSize: '10px', margin: '2px 0', fontWeight: '600' }}>Waste Delivery & Receipt Declaration</p>
                <p style={{ color: '#6b7280', fontSize: '9px', margin: 0 }}>مستند رسمي مؤمن ومسجل إلكترونياً — محمي ببصمة رقمية SHA-256</p>
              </div>

              {/* Shipment Info - responsive grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 8px', margin: '8px 0', padding: '8px', background: '#f0fdf4', borderRadius: '6px', fontSize: '10px', border: '1px solid #86efac', wordBreak: 'break-word', overflow: 'hidden' }}>
                <div><span style={{ color: '#6b7280' }}>رقم الشحنة: </span><strong>{declaration.shipment_number}</strong></div>
                <div><span style={{ color: '#6b7280' }}>تاريخ الإقرار: </span><strong style={{ fontSize: '10px' }}>{declaredDate}</strong></div>
                <div><span style={{ color: '#6b7280' }}>نوع النفايات: </span><strong>{declaration.waste_type}</strong></div>
                <div><span style={{ color: '#6b7280' }}>الكمية: </span><strong>{declaration.quantity} {declaration.unit || 'طن'}</strong></div>
                {declaration.driver_name && <div><span style={{ color: '#6b7280' }}>اسم السائق/المسلّم: </span><strong><MemberNameLink name={declaration.driver_name} /></strong></div>}
                {declaration.driver_national_id && <div><span style={{ color: '#6b7280' }}>رقم الهوية: </span><strong>{declaration.driver_national_id}</strong></div>}
                {declaration.generator_name && <div><span style={{ color: '#6b7280' }}>المولد: </span><strong>{declaration.generator_name}</strong></div>}
                {declaration.transporter_name && <div><span style={{ color: '#6b7280' }}>الناقل: </span><strong>{declaration.transporter_name}</strong></div>}
                {declaration.recycler_name && <div><span style={{ color: '#6b7280' }}>المدوّر: </span><strong>{declaration.recycler_name}</strong></div>}
                {declaration.disposal_name && <div><span style={{ color: '#6b7280' }}>جهة التخلص: </span><strong>{declaration.disposal_name}</strong></div>}
              </div>

              {/* Declaration Text */}
              <div style={{ whiteSpace: 'pre-line', lineHeight: '1.6', fontSize: '9px', margin: '8px 0', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '6px', background: '#fffbeb', flex: 1, wordBreak: 'break-word', overflowWrap: 'break-word', overflow: 'hidden' }}>
                {declaration.declaration_text}
              </div>

              {/* Legal Disclaimer */}
              <div style={{ padding: '8px 10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', margin: '8px 0', fontSize: '9px', color: '#991b1b', lineHeight: '1.5', wordBreak: 'break-word' }}>
                <p style={{ margin: 0, fontWeight: 'bold' }}>⚖️ إخلاء مسؤولية وتحذير قانوني:</p>
                <p style={{ margin: '3px 0 0 0' }}>
                  هذا المستند ملزم قانونياً لجميع الأطراف الموقعة والمسجلة. أي مخالفة للبيانات المذكورة أو تلاعب بمحتويات الشحنة أو إخفاء معلومات جوهرية يُعرّض المخالف للمساءلة المدنية والجنائية وفقاً لقانون تنظيم إدارة المخلفات رقم 202 لسنة 2020 وقانون حماية البيئة رقم 4 لسنة 1994 وقانون العقوبات المصري. يخضع هذا المستند لشروط وأحكام وسياسات منصة iRecycle المعتمدة.
                </p>
              </div>

              {/* Signature Area */}
              <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: '12px', marginTop: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '9px', color: '#6b7280' }}>
                  <div>
                    <p><strong>المُقِر:</strong> {declaration.driver_name || 'غير محدد'}</p>
                    <p><strong>رقم الهوية:</strong> {declaration.driver_national_id || 'غير محدد'}</p>
                    <p><strong>جهة النقل:</strong> {declaration.transporter_name || 'غير محدد'}</p>
                  </div>
                  <div>
                    <p><strong>تاريخ الإقرار:</strong> {declaredDate}</p>
                    <p><strong>رقم المستند:</strong> DEC-{declaration.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                </div>
                <div style={{ border: '1px dashed #d1d5db', padding: '15px', textAlign: 'center', marginTop: '10px', borderRadius: '6px', color: '#9ca3af' }}>
                  <p style={{ fontSize: '10px', margin: 0 }}>التوقيع الإلكتروني — تم التأكيد رقمياً عبر المنصة</p>
                  <p style={{ fontSize: '8px', marginTop: '3px', margin: '3px 0 0' }}>هذا الإقرار مسجل ومحمي ببصمة رقمية SHA-256 ولا يجوز تعديله أو التلاعب به</p>
                </div>
              </div>

              {/* Footer */}
              <div style={{ borderTop: '2px solid #e5e7eb', marginTop: '10px', paddingTop: '8px', textAlign: 'center', fontSize: '8px', color: '#6b7280' }}>
                <p style={{ margin: 0, wordBreak: 'break-word' }}>مستند رسمي مؤمن وذكي | رقم المستند: DEC-{declaration.id.slice(0, 8).toUpperCase()} | الشحنة: {declaration.shipment_number} | يخضع لقانون 202/2020</p>
                <p style={{ margin: '4px 0 0 0', fontStyle: 'italic', color: '#16a34a', fontWeight: 'bold', fontSize: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', flexWrap: 'wrap' }}>
                  {[
                    'الإنتاج عليك.. والدائرة المقفولة علينا. خليك',
                    'إدارة مخلفات بمواصفات عالمية.. سيستم مبيغلطش.',
                    'إحنا مش بنلم مخلفات، إحنا بنقفل دايرة الإنتاج صح.',
                    'من المصنع للمستقبل.. سكة واحدة مع',
                  ][Math.floor(Date.now() / 86400000) % 4]}
                  <img src="/irecycle-logo.png" alt="iRecycle" style={{ height: '14px', verticalAlign: 'middle', borderRadius: '3px' }} />
                </p>
              </div>
            </div>

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default DeliveryDeclarationViewDialog;
