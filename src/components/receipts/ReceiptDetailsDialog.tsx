import { useState } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  FileCheck,
  Printer,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Building2,
  Truck,
  Package,
  Calendar,
  Scale,
  MapPin,
  User,
  Loader2,
} from 'lucide-react';

interface ReceiptDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: any;
  onConfirm?: () => void;
  isGenerator?: boolean;
}

const ReceiptDetailsDialog = ({ 
  open, 
  onOpenChange, 
  receipt,
  onConfirm,
  isGenerator = false 
}: ReceiptDetailsDialogProps) => {
  const { profile } = useAuth();
  const [confirming, setConfirming] = useState(false);

  if (!receipt) return null;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { label: 'مؤكدة', icon: CheckCircle2, className: 'bg-green-100 text-green-800' };
      case 'pending':
        return { label: 'بانتظار التأكيد', icon: Clock, className: 'bg-yellow-100 text-yellow-800' };
      case 'disputed':
        return { label: 'متنازع عليها', icon: AlertCircle, className: 'bg-red-100 text-red-800' };
      case 'cancelled':
        return { label: 'ملغية', icon: XCircle, className: 'bg-gray-100 text-gray-800' };
      default:
        return { label: status, icon: Clock, className: 'bg-gray-100 text-gray-800' };
    }
  };

  const handleConfirm = async () => {
    if (!profile?.id) return;
    
    setConfirming(true);
    try {
      const { error } = await supabase
        .from('shipment_receipts')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          confirmed_by: profile.id,
        })
        .eq('id', receipt.id);

      if (error) throw error;

      toast.success('تم تأكيد شهادة الاستلام');
      onConfirm?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error confirming receipt:', error);
      toast.error('فشل في تأكيد الشهادة');
    } finally {
      setConfirming(false);
    }
  };

  const handlePrint = () => {
    const printContent = generatePrintContent(receipt);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const statusConfig = getStatusConfig(receipt.status);
  const StatusIcon = statusConfig.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-primary" />
              شهادة استلام شحنة
            </DialogTitle>
            <Badge className={statusConfig.className}>
              <StatusIcon className="w-3 h-3 ml-1" />
              {statusConfig.label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Receipt Header */}
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">رقم الشهادة</p>
                <p className="text-2xl font-bold text-primary">{receipt.receipt_number}</p>
              </div>
              <div className="text-left">
                <p className="text-sm text-muted-foreground">تاريخ الاستلام</p>
                <p className="text-lg font-semibold">
                  {format(new Date(receipt.pickup_date), 'dd MMMM yyyy', { locale: ar })}
                </p>
              </div>
            </div>
          </div>

          {/* Shipment Info */}
          {receipt.shipment && (
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                معلومات الشحنة
              </h3>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="font-medium">{receipt.shipment.shipment_number}</p>
              </div>
            </div>
          )}

          <Separator />

          {/* Parties */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                الجهة المولدة
              </h3>
              <p className="text-muted-foreground">{receipt.generator?.name || '-'}</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-600" />
                الجهة الناقلة
              </h3>
              <p className="text-muted-foreground">{receipt.transporter?.name || '-'}</p>
            </div>
          </div>

          {/* Driver */}
          {receipt.driver?.profile?.full_name && (
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="w-4 h-4 text-green-600" />
                السائق
              </h3>
              <p className="text-muted-foreground">{receipt.driver.profile.full_name}</p>
            </div>
          )}

          <Separator />

          {/* Waste Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold">نوع النفايات</h3>
              <p className="text-muted-foreground">{receipt.waste_type || '-'}</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Scale className="w-4 h-4" />
                الوزن
              </h3>
              <div className="flex gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">المصرح</p>
                  <p>{receipt.declared_weight || '-'} {receipt.unit}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">الفعلي</p>
                  <p className="font-semibold">{receipt.actual_weight || '-'} {receipt.unit}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          {receipt.pickup_location && (
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-600" />
                موقع الاستلام
              </h3>
              <p className="text-muted-foreground">{receipt.pickup_location}</p>
            </div>
          )}

          {/* Notes */}
          {receipt.notes && (
            <div className="space-y-2">
              <h3 className="font-semibold">ملاحظات</h3>
              <p className="text-muted-foreground p-3 rounded-lg bg-muted/50">{receipt.notes}</p>
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={handlePrint} variant="outline" className="flex-1">
              <Printer className="w-4 h-4 ml-2" />
              طباعة
            </Button>
            {isGenerator && receipt.status === 'pending' && (
              <Button onClick={handleConfirm} className="flex-1" disabled={confirming}>
                {confirming ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    جاري التأكيد...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 ml-2" />
                    تأكيد الاستلام
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const generatePrintContent = (receipt: any) => {
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>شهادة استلام شحنة - ${receipt.receipt_number}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Tajawal', Arial, sans-serif; 
          padding: 40px; 
          background: white;
          color: #333;
        }
        .header { 
          text-align: center; 
          border-bottom: 3px solid #10b981; 
          padding-bottom: 20px; 
          margin-bottom: 30px; 
        }
        .header h1 { color: #10b981; font-size: 28px; margin-bottom: 10px; }
        .receipt-number { 
          font-size: 24px; 
          font-weight: bold; 
          color: #059669;
          background: #ecfdf5;
          padding: 10px 20px;
          border-radius: 8px;
          display: inline-block;
          margin-top: 10px;
        }
        .section { margin-bottom: 25px; }
        .section-title { 
          font-size: 16px; 
          font-weight: bold; 
          color: #374151;
          margin-bottom: 10px;
          padding-bottom: 5px;
          border-bottom: 1px solid #e5e7eb;
        }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .field { margin-bottom: 15px; }
        .field-label { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
        .field-value { font-size: 14px; font-weight: 500; }
        .footer { 
          margin-top: 40px; 
          padding-top: 20px; 
          border-top: 2px solid #e5e7eb;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
        }
        .signature { text-align: center; }
        .signature-line { 
          border-bottom: 1px dashed #9ca3af; 
          height: 60px; 
          margin-bottom: 10px; 
        }
        .stamp { 
          text-align: center;
          margin-top: 30px;
          padding: 20px;
          border: 2px dashed #d1d5db;
          border-radius: 8px;
        }
        @media print {
          body { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🔄 نظام آي ريسايكل لإدارة المخلفات</h1>
        <h2>شهادة استلام شحنة</h2>
        <div class="receipt-number">${receipt.receipt_number}</div>
      </div>

      <div class="section">
        <div class="grid">
          <div class="field">
            <div class="field-label">تاريخ الاستلام</div>
            <div class="field-value">${new Date(receipt.pickup_date).toLocaleDateString('ar-EG', { 
              year: 'numeric', month: 'long', day: 'numeric' 
            })}</div>
          </div>
          <div class="field">
            <div class="field-label">رقم الشحنة</div>
            <div class="field-value">${receipt.shipment?.shipment_number || '-'}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">الأطراف</div>
        <div class="grid">
          <div class="field">
            <div class="field-label">الجهة المولدة</div>
            <div class="field-value">${receipt.generator?.name || '-'}</div>
          </div>
          <div class="field">
            <div class="field-label">الجهة الناقلة</div>
            <div class="field-value">${receipt.transporter?.name || '-'}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">تفاصيل النفايات</div>
        <div class="grid">
          <div class="field">
            <div class="field-label">نوع النفايات</div>
            <div class="field-value">${receipt.waste_type || '-'}</div>
          </div>
          <div class="field">
            <div class="field-label">الوزن الفعلي</div>
            <div class="field-value">${receipt.actual_weight || receipt.declared_weight || '-'} ${receipt.unit}</div>
          </div>
        </div>
      </div>

      ${receipt.pickup_location ? `
      <div class="section">
        <div class="section-title">موقع الاستلام</div>
        <div class="field-value">${receipt.pickup_location}</div>
      </div>
      ` : ''}

      ${receipt.notes ? `
      <div class="section">
        <div class="section-title">ملاحظات</div>
        <div class="field-value">${receipt.notes}</div>
      </div>
      ` : ''}

      <div class="footer">
        <div class="signature">
          <div class="signature-line"></div>
          <div>توقيع المستلم (السائق)</div>
          <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">
            ${receipt.driver?.profile?.full_name || ''}
          </div>
        </div>
        <div class="signature">
          <div class="signature-line"></div>
          <div>توقيع المسلّم (الجهة المولدة)</div>
        </div>
      </div>

      <div class="stamp">
        <p>الختم الرسمي</p>
      </div>
    </body>
    </html>
  `;
};

export default ReceiptDetailsDialog;
