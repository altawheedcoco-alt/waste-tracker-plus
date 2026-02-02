import { useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Printer, Download, X } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { usePDFExport } from '@/hooks/usePDFExport';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_type: string;
  issue_date: string;
  due_date: string | null;
  total_amount: number | null;
  paid_amount: number | null;
  remaining_amount: number | null;
  status: string;
  currency: string;
  notes: string | null;
  partner_name: string | null;
}

interface InvoiceDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
  partnerName: string;
}

const InvoiceDetailDialog = ({ open, onOpenChange, invoice, partnerName }: InvoiceDetailDialogProps) => {
  const printRef = useRef<HTMLDivElement>(null);
  const { exportToPDF, printContent, isExporting } = usePDFExport({
    filename: `invoice-${invoice?.invoice_number || 'document'}`,
    orientation: 'portrait',
    format: 'a4',
  });

  const { data: invoiceItems = [] } = useQuery({
    queryKey: ['invoice-items', invoice?.id],
    queryFn: async () => {
      if (!invoice?.id) return [];
      const { data, error } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoice.id);
      if (error) throw error;
      return data;
    },
    enabled: !!invoice?.id && open,
  });

  if (!invoice) return null;

  const handlePrint = () => {
    if (printRef.current) {
      printContent(printRef.current);
    }
  };

  const handleDownload = () => {
    if (printRef.current) {
      exportToPDF(printRef.current, `فاتورة-${invoice.invoice_number}`);
    }
  };

  const getStatusBadge = (status: string) => {
    const statuses: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
      draft: { label: "مسودة", variant: "secondary" },
      pending: { label: "معلقة", variant: "outline" },
      sent: { label: "مرسلة", variant: "default" },
      paid: { label: "مدفوعة", variant: "default" },
      partial: { label: "مدفوعة جزئياً", variant: "outline" },
      overdue: { label: "متأخرة", variant: "destructive" },
      cancelled: { label: "ملغاة", variant: "secondary" },
    };
    return statuses[status] || { label: status, variant: "default" };
  };

  const getInvoiceTypeBadge = (type: string) => {
    const types: Record<string, string> = {
      sales: "مبيعات",
      purchase: "مشتريات",
      service: "خدمات",
    };
    return types[type] || type;
  };

  const statusBadge = getStatusBadge(invoice.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0">
        <DialogHeader className="p-4 border-b sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-right">
              تفاصيل الفاتورة #{invoice.invoice_number}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                disabled={isExporting}
              >
                <Printer className="ml-2 h-4 w-4" />
                طباعة
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleDownload}
                disabled={isExporting}
              >
                <Download className="ml-2 h-4 w-4" />
                تحميل PDF
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-80px)]">
          {/* Print Content */}
          <div ref={printRef} className="bg-white text-black p-8" dir="rtl">
            {/* Header */}
            <div className="text-center border-b-2 border-gray-300 pb-4 mb-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">فاتورة</h1>
              <p className="text-lg font-semibold">#{invoice.invoice_number}</p>
            </div>

            {/* Invoice Info */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <h3 className="font-bold text-gray-700 border-b pb-1">بيانات الفاتورة</h3>
                <p><span className="text-gray-500">النوع:</span> {getInvoiceTypeBadge(invoice.invoice_type)}</p>
                <p><span className="text-gray-500">تاريخ الإصدار:</span> {format(new Date(invoice.issue_date), 'dd MMMM yyyy', { locale: ar })}</p>
                {invoice.due_date && (
                  <p><span className="text-gray-500">تاريخ الاستحقاق:</span> {format(new Date(invoice.due_date), 'dd MMMM yyyy', { locale: ar })}</p>
                )}
                <p><span className="text-gray-500">الحالة:</span> {statusBadge.label}</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-gray-700 border-b pb-1">بيانات الشريك</h3>
                <p><span className="text-gray-500">اسم الشريك:</span> {partnerName}</p>
              </div>
            </div>

            {/* Invoice Items */}
            {invoiceItems.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold text-gray-700 border-b pb-1 mb-3">بنود الفاتورة</h3>
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-right">#</th>
                      <th className="border p-2 text-right">الوصف</th>
                      <th className="border p-2 text-right">نوع المخلف</th>
                      <th className="border p-2 text-right">الكمية</th>
                      <th className="border p-2 text-right">الوحدة</th>
                      <th className="border p-2 text-right">سعر الوحدة</th>
                      <th className="border p-2 text-right">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceItems.map((item, index) => (
                      <tr key={item.id}>
                        <td className="border p-2">{index + 1}</td>
                        <td className="border p-2">{item.description}</td>
                        <td className="border p-2">{item.waste_type || '-'}</td>
                        <td className="border p-2">{item.quantity}</td>
                        <td className="border p-2">{item.unit || 'وحدة'}</td>
                        <td className="border p-2">{item.unit_price?.toLocaleString()}</td>
                        <td className="border p-2">{item.total_price?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Totals */}
            <div className="border-t-2 border-gray-300 pt-4">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span className="font-bold">إجمالي الفاتورة:</span>
                    <span className="font-bold">{invoice.total_amount?.toLocaleString()} {invoice.currency}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>المدفوع:</span>
                    <span>{(invoice.paid_amount || 0).toLocaleString()} {invoice.currency}</span>
                  </div>
                  <div className="flex justify-between text-orange-600 border-t pt-2">
                    <span className="font-bold">المتبقي:</span>
                    <span className="font-bold">{(invoice.remaining_amount || 0).toLocaleString()} {invoice.currency}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="mt-6 p-3 bg-gray-50 rounded">
                <h4 className="font-bold text-gray-700 mb-1">ملاحظات:</h4>
                <p className="text-sm text-gray-600">{invoice.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-4 border-t text-center text-xs text-gray-500">
              <p>تم إنشاء هذه الفاتورة من منصة I-Recycle لإدارة المخلفات الصناعية</p>
              <p className="mt-1">تاريخ الطباعة: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ar })}</p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceDetailDialog;
