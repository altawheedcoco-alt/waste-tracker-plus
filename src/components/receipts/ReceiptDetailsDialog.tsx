import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { sendBulkDualNotification } from '@/services/unifiedNotifier';
import { usePDFExport } from '@/hooks/usePDFExport';
import PrintThemeSelector from '@/components/print/PrintThemeSelector';
import { type PrintThemeId } from '@/lib/printThemes';
import { useAuth } from '@/contexts/AuthContext';
import { useShipmentDeclarations } from '@/hooks/useDeliveryDeclaration';
import { QRCodeSVG } from 'qrcode.react';
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
  ExternalLink,
  ShieldCheck,
  QrCode,
  FileSignature,
} from 'lucide-react';
import { generateReceiptPrintHTML } from './ReceiptPrintTemplate';
import ShareDocumentButton from '@/components/documents/ShareDocumentButton';
import SignDocumentButton from '@/components/signature/SignDocumentButton';
import AddNoteButton from '@/components/notes/AddNoteButton';
import { withTagline } from '@/utils/platformTaglines';

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
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const { printWithTheme, exportToPDF, isExporting } = usePDFExport({
    filename: `receipt-${receipt?.receipt_number || 'doc'}`,
    orientation: 'portrait',
  });

  // Fetch linked delivery declarations (both generator handover + transporter delivery)
  const shipmentId = receipt?.shipment?.id;
  const { data: declarations = [] } = useShipmentDeclarations(shipmentId);
  const generatorDeclaration = declarations.find((d: any) => d.declaration_type === 'generator_handover');
  const transporterDeclaration = declarations.find((d: any) => d.declaration_type === 'transporter_delivery' || !d.declaration_type);
  const declarationData = transporterDeclaration || generatorDeclaration;

  if (!receipt) return null;

  const qrVerifyUrl = `${window.location.origin}/qr-verify?type=receipt&code=${encodeURIComponent(receipt.receipt_number)}`;

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
    if (!profile?.user_id) return;
    
    setConfirming(true);
    try {
      const { error } = await supabase
        .from('shipment_receipts')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          confirmed_by: profile.user_id,
        })
        .eq('id', receipt.id);

      if (error) throw error;

      // Send notification to transporter about confirmation
      if (receipt.transporter?.id) {
        try {
          const { data: transporterUsers } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('organization_id', receipt.transporter.id)
            .limit(10);

          if (transporterUsers && transporterUsers.length > 0) {
            await sendBulkDualNotification({
              user_ids: transporterUsers.map((u: any) => u.user_id),
              title: '✅ تأكيد شهادة الاستلام',
              message: withTagline(`تم تأكيد شهادة الاستلام ${receipt.receipt_number} من قبل الجهة المولدة`),
              type: 'receipt_confirmed',
              reference_id: receipt.shipment?.id || undefined,
              reference_type: 'shipment',
            });
          }
        } catch (e) {
          console.error('Failed to notify transporter:', e);
        }
      }

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
    setThemeOpen(true);
  };

  const handleThemedPrint = (themeId: PrintThemeId) => {
    if (printRef.current) {
      printWithTheme(printRef.current, themeId);
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

        <div ref={printRef} className="space-y-6">
          {/* Receipt Header */}
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">رقم شهادة الاستلام</p>
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
              <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{receipt.shipment.shipment_number}</p>
                </div>
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

          {/* QR Verification & Linked Documents */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* QR Code */}
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-muted/30">
              <QrCode className="w-4 h-4 text-primary" />
              <QRCodeSVG
                value={qrVerifyUrl}
                size={120}
                level="M"
                includeMargin
              />
              <p className="text-xs text-muted-foreground text-center">
                امسح للتحقق من صلاحية الشهادة
              </p>
              <Badge variant="outline" className="text-[10px]">
                <ShieldCheck className="w-3 h-3 ml-1" />
                محمية بنظام التحقق الموحد
              </Badge>
            </div>

            {/* Linked Documents */}
            <div className="space-y-3">
              {/* Link to Shipment */}
              {receipt.shipment?.id && (
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    onOpenChange(false);
                    navigate(`/dashboard/shipments/${receipt.shipment.id}`);
                  }}
                >
                  <Package className="w-4 h-4 text-primary" />
                  عرض الشحنة: {receipt.shipment.shipment_number}
                  <ExternalLink className="w-3 h-3 mr-auto" />
                </Button>
              )}

              {/* Generator Handover Declaration */}
              {generatorDeclaration && (
                <div className="p-3 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                  <div className="flex items-center gap-2 mb-1">
                    <FileSignature className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                      إقرار تسليم المولّد للناقل
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 mr-auto" />
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    موقّع بواسطة: {(generatorDeclaration as any).driver_name || (generatorDeclaration as any).generator_name || 'مُوقّع'}
                    {(generatorDeclaration as any).declared_at && (
                      <> — {format(new Date((generatorDeclaration as any).declared_at), 'dd/MM/yyyy hh:mm a')}</>
                    )}
                  </p>
                  <p className="text-[10px] text-blue-600 dark:text-blue-500 mt-1">
                    المولد: {(generatorDeclaration as any).generator_name || 'غير محدد'} | النفايات: {(generatorDeclaration as any).waste_type} ({(generatorDeclaration as any).quantity} {(generatorDeclaration as any).unit || 'طن'})
                  </p>
                </div>
              )}

              {/* Transporter Delivery Declaration */}
              {transporterDeclaration && (
                <div className="p-3 rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                  <div className="flex items-center gap-2 mb-1">
                    <FileSignature className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-800 dark:text-green-300">
                      إقرار تسليم الناقل للمدوّر
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600 mr-auto" />
                  </div>
                  <p className="text-xs text-green-700 dark:text-green-400">
                    موقّع بواسطة: {(transporterDeclaration as any).driver_name || 'مُوقّع'} 
                    {(transporterDeclaration as any).declared_at && (
                      <> — {format(new Date((transporterDeclaration as any).declared_at), 'dd/MM/yyyy hh:mm a')}</>
                    )}
                  </p>
                  <p className="text-[10px] text-green-600 dark:text-green-500 mt-1">
                    الناقل: {(transporterDeclaration as any).transporter_name || 'غير محدد'} | هوية السائق: {(transporterDeclaration as any).driver_national_id || 'غير محدد'}
                  </p>
                </div>
              )}

              {!generatorDeclaration && !transporterDeclaration && receipt.shipment?.id && (
                <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span className="text-xs text-amber-700 dark:text-amber-400">
                      لم يتم توقيع أي إقرار تسليم بعد
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-2 flex-wrap no-print">
            <Button onClick={handlePrint} variant="outline" size="sm" className="flex-1 min-w-[100px]">
              <Printer className="w-4 h-4 ml-2" />
              طباعة
            </Button>
            <Button
              onClick={() => {
                if (printRef.current) {
                  exportToPDF(printRef.current, `شهادة-استلام-${receipt.receipt_number}`);
                }
              }}
              variant="default"
              size="sm"
              className="flex-1 min-w-[100px]"
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 ml-2" />
              )}
              تحميل PDF
            </Button>
            <AddNoteButton resourceType="receipt" resourceId={receipt.id || receipt.receipt_number} />
            <ShareDocumentButton
              referenceId={receipt.receipt_number}
              referenceType="receipt"
              documentTitle={`شهادة استلام ${receipt.receipt_number}`}
              size="sm"
              className="flex-1 min-w-[100px]"
            />
            <SignDocumentButton
              documentType="receipt"
              documentId={receipt.id || receipt.receipt_number}
              documentTitle={`شهادة استلام ${receipt.receipt_number}`}
              variant="outline"
              size="sm"
            />
            {isGenerator && receipt.status === 'pending' && (
              <Button onClick={handleConfirm} size="sm" className="flex-1 min-w-[100px]" disabled={confirming}>
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

      <PrintThemeSelector
        open={themeOpen}
        onOpenChange={setThemeOpen}
        onSelect={handleThemedPrint}
        documentTitle="شهادة استلام شحنة"
      />
    </Dialog>
  );
};

export default ReceiptDetailsDialog;
