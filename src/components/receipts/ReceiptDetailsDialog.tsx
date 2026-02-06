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
import { generateReceiptPrintHTML } from './ReceiptPrintTemplate';

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
    const printContent = generateReceiptPrintHTML(receipt);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 500);
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

export default ReceiptDetailsDialog;
