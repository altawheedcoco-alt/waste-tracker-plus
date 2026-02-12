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
import { usePDFExport } from '@/hooks/usePDFExport';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface DeclarationData {
  id: string;
  shipment_number: string | null;
  waste_type: string | null;
  quantity: number | null;
  unit: string | null;
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
  const { exportToPDF, isExporting } = usePDFExport({
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
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;
      printWindow.document.write(`
        <html dir="rtl"><head><title>إقرار تسليم - ${declaration.shipment_number}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 40px; direction: rtl; }
          .header { text-align: center; border-bottom: 3px solid #16a34a; padding-bottom: 20px; margin-bottom: 20px; }
          .header h1 { color: #16a34a; font-size: 24px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0; padding: 15px; background: #f0fdf4; border-radius: 8px; }
          .info-item { font-size: 14px; }
          .info-item span { color: #6b7280; }
          .declaration-text { white-space: pre-wrap; line-height: 2; font-size: 14px; margin: 20px 0; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 12px; color: #6b7280; }
          .signature-box { border: 1px dashed #d1d5db; padding: 20px; text-align: center; margin-top: 40px; border-radius: 8px; }
          @media print { body { padding: 20px; } }
        </style></head><body>
        ${printRef.current.innerHTML}
        </body></html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const declaredDate = declaration.declared_at 
    ? format(new Date(declaration.declared_at), 'dd MMMM yyyy - HH:mm', { locale: ar })
    : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-4 border-b sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-right">
              <FileCheck className="w-5 h-5 text-primary" />
              إقرار تسليم الشحنة
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint} disabled={isExporting}>
                <Printer className="ml-2 h-4 w-4" />
                طباعة
              </Button>
              <Button variant="default" size="sm" onClick={handleDownload} disabled={isExporting}>
                <Download className="ml-2 h-4 w-4" />
                تحميل PDF
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-80px)]">
          <div ref={printRef} dir="rtl" style={{ padding: '40px', fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>
            {/* Header */}
            <div style={{ textAlign: 'center', borderBottom: '3px solid #16a34a', paddingBottom: '20px', marginBottom: '20px' }}>
              <h1 style={{ color: '#16a34a', fontSize: '24px', margin: '0 0 8px' }}>إقرار تسليم شحنة نفايات</h1>
              <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>وثيقة رسمية مسجلة إلكترونياً</p>
            </div>

            {/* Shipment Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '20px 0', padding: '15px', background: '#f0fdf4', borderRadius: '8px', fontSize: '14px' }}>
              <div><span style={{ color: '#6b7280' }}>رقم الشحنة: </span><strong>{declaration.shipment_number}</strong></div>
              <div><span style={{ color: '#6b7280' }}>تاريخ الإقرار: </span><strong>{declaredDate}</strong></div>
              <div><span style={{ color: '#6b7280' }}>نوع النفايات: </span><strong>{declaration.waste_type}</strong></div>
              <div><span style={{ color: '#6b7280' }}>الكمية: </span><strong>{declaration.quantity} {declaration.unit || 'طن'}</strong></div>
              {declaration.driver_name && <div><span style={{ color: '#6b7280' }}>اسم السائق/المسلّم: </span><strong>{declaration.driver_name}</strong></div>}
              {declaration.driver_national_id && <div><span style={{ color: '#6b7280' }}>رقم الهوية: </span><strong>{declaration.driver_national_id}</strong></div>}
              {declaration.generator_name && <div><span style={{ color: '#6b7280' }}>المولد: </span><strong>{declaration.generator_name}</strong></div>}
              {declaration.transporter_name && <div><span style={{ color: '#6b7280' }}>الناقل: </span><strong>{declaration.transporter_name}</strong></div>}
              {declaration.recycler_name && <div><span style={{ color: '#6b7280' }}>المدوّر: </span><strong>{declaration.recycler_name}</strong></div>}
              {declaration.disposal_name && <div><span style={{ color: '#6b7280' }}>جهة التخلص: </span><strong>{declaration.disposal_name}</strong></div>}
            </div>

            {/* Declaration Text */}
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: '2', fontSize: '14px', margin: '20px 0', padding: '20px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
              {declaration.declaration_text}
            </div>

            {/* Signature Area */}
            <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: '20px', marginTop: '30px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '12px', color: '#6b7280' }}>
                <div>
                  <p><strong>المُقِر:</strong> {declaration.driver_name || 'غير محدد'}</p>
                  <p><strong>رقم الهوية:</strong> {declaration.driver_national_id || 'غير محدد'}</p>
                  <p><strong>جهة النقل:</strong> {declaration.transporter_name || 'غير محدد'}</p>
                </div>
                <div>
                  <p><strong>تاريخ الإقرار:</strong> {declaredDate}</p>
                  <p><strong>رقم الوثيقة:</strong> DEC-{declaration.id.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>
              <div style={{ border: '1px dashed #d1d5db', padding: '30px', textAlign: 'center', marginTop: '30px', borderRadius: '8px', color: '#9ca3af' }}>
                <p>التوقيع الإلكتروني - تم التأكيد رقمياً عبر المنصة</p>
                <p style={{ fontSize: '11px', marginTop: '5px' }}>هذا الإقرار مسجل ومحمي رقمياً ولا يحتاج لتوقيع يدوي</p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default DeliveryDeclarationViewDialog;
