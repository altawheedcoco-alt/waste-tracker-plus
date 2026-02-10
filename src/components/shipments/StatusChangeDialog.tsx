import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { autoCreateReceipt } from '@/utils/autoReceiptCreator';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getStatusConfig,
  getAvailableNextStatuses,
  canChangeStatus,
  allStatuses,
  StatusConfig,
  mapToDbStatus,
  ShipmentStatus,
} from '@/lib/shipmentStatusConfig';

interface StatusChangeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: {
    id: string;
    shipment_number: string;
    status: string;
  };
  onStatusChanged?: () => void;
}

const StatusChangeDialog = ({ isOpen, onClose, shipment, onStatusChanged }: StatusChangeDialogProps) => {
  const { profile, organization } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const currentStatusConfig = getStatusConfig(shipment.status);
  const organizationType = (organization?.organization_type || 'generator') as 'generator' | 'transporter' | 'recycler' | 'disposal' | 'admin';
  const availableStatuses = getAvailableNextStatuses(shipment.status, organizationType);
  const canChange = canChangeStatus(shipment.status, organizationType);

  const handleStatusChange = async () => {
    if (!selectedStatus) {
      toast.error('يرجى اختيار الحالة الجديدة');
      return;
    }

    setLoading(true);
    try {
      // Map UI status to DB status
      const dbStatus = mapToDbStatus(selectedStatus as ShipmentStatus);
      console.log('Updating shipment status:', { selectedStatus, dbStatus, shipmentId: shipment.id });
      
      // Build update object based on status
      const updateData: Record<string, any> = {
        status: dbStatus,
      };

      // Set timestamp fields based on new status
      const now = new Date().toISOString();
      const timestampFields: Record<string, string> = {
        'approved': 'approved_at',
        'in_transit': 'in_transit_at',
        'delivered': 'delivered_at',
        'confirmed': 'confirmed_at',
      };

      if (timestampFields[dbStatus]) {
        updateData[timestampFields[dbStatus]] = now;
      }

      // Update shipment
      const { error: updateError } = await supabase
        .from('shipments')
        .update(updateData)
        .eq('id', shipment.id);

      if (updateError) throw updateError;

      // Log the status change
      const statusConfig = getStatusConfig(selectedStatus);
      const { error: logError } = await supabase
        .from('shipment_logs')
        .insert([{
          shipment_id: shipment.id,
          status: dbStatus as any,
          notes: notes || `تم تغيير الحالة إلى ${statusConfig?.labelAr || selectedStatus}`,
          changed_by: profile?.id,
        }]);

      if (logError) {
        console.error('Error logging status change:', logError);
      }

      // Auto-create receipt when transporter delivers/receives shipment
      if (['delivered', 'in_transit'].includes(dbStatus) && organization?.organization_type === 'transporter') {
        try {
          await autoCreateReceipt(shipment.id, organization.id, profile?.id);
        } catch (receiptError) {
          console.error('Auto receipt creation failed:', receiptError);
          // Don't block the status change if receipt creation fails
        }
      }

      toast.success(`تم تحديث الحالة إلى "${statusConfig?.labelAr || selectedStatus}"`);
      onStatusChanged?.();
      handleClose();
    } catch (error: any) {
      console.error('Error updating shipment status:', error);
      console.error('Error details:', error?.message, error?.details, error?.code);
      toast.error(`حدث خطأ أثناء تحديث الحالة: ${error?.message || 'خطأ غير معروف'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedStatus(null);
    setNotes('');
    onClose();
  };

  const getPhaseLabel = (phase: 'transporter' | 'recycler' | 'disposal') => {
    if (phase === 'transporter') return 'مرحلة النقل';
    if (phase === 'disposal') return 'مرحلة التخلص النهائي';
    return 'مرحلة التدوير';
  };

  const renderStatusButton = (status: StatusConfig, isAvailable: boolean) => {
    const StatusIcon = status.icon;
    const isSelected = selectedStatus === status.key;
    const isCurrent = status.key === shipment.status;

    return (
      <button
        key={status.key}
        onClick={() => isAvailable && !isCurrent && setSelectedStatus(status.key)}
        disabled={!isAvailable || isCurrent}
        className={cn(
          "w-full p-3 rounded-lg border-2 transition-all flex items-center justify-between",
          isSelected 
            ? "border-primary bg-primary/10" 
            : isCurrent
            ? "border-muted bg-muted/50 cursor-not-allowed"
            : isAvailable
            ? "border-border hover:border-primary/50 hover:bg-muted/50 cursor-pointer"
            : "border-muted bg-muted/30 cursor-not-allowed opacity-50"
        )}
      >
        <div className="flex items-center gap-2">
          {isSelected && <CheckCircle2 className="w-5 h-5 text-primary" />}
          {isCurrent && <Badge variant="outline" className="text-xs">الحالية</Badge>}
          {!isAvailable && !isCurrent && <Lock className="w-4 h-4 text-muted-foreground" />}
        </div>
        <div className="flex items-center gap-3">
          <span className={cn(
            "font-medium",
            isSelected && "text-primary",
            isCurrent && "text-muted-foreground"
          )}>
            {status.labelAr}
          </span>
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            status.bgClass,
            status.textClass,
            status.borderClass,
            "border"
          )}>
            <StatusIcon className="w-4 h-4" />
          </div>
        </div>
      </button>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle>تغيير حالة الشحنة</DialogTitle>
          <DialogDescription>
            شحنة رقم: <span className="font-mono font-bold">{shipment.shipment_number}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Status */}
          <div className="text-right">
            <Label className="text-sm text-muted-foreground">الحالة الحالية</Label>
            <div className="mt-2 flex items-center gap-2 justify-end">
              {currentStatusConfig && (
                <>
                  <Badge className={cn(currentStatusConfig.bgClass, currentStatusConfig.textClass, currentStatusConfig.borderClass, "border gap-1")}>
                    <currentStatusConfig.icon className="w-3 h-3" />
                    {currentStatusConfig.labelAr}
                  </Badge>
                  <Badge variant="outline">{getPhaseLabel(currentStatusConfig.phase)}</Badge>
                </>
              )}
            </div>
          </div>

          {/* Organization Type Info */}
          <div className="p-3 bg-muted/50 rounded-lg text-right">
            <div className="flex items-center gap-2 justify-end text-sm text-muted-foreground">
              <AlertCircle className="w-4 h-4" />
              <span>
                أنت تعمل كـ <strong>{organizationType === 'transporter' ? 'جهة نقل' : organizationType === 'recycler' ? 'جهة تدوير' : organizationType === 'disposal' ? 'جهة تخلص نهائي' : 'جهة مولدة'}</strong>
              </span>
            </div>
            {!canChange && (
              <p className="text-sm text-muted-foreground mt-2">
                {organizationType === 'generator' 
                  ? 'الجهات المولدة لا يمكنها تغيير حالات الشحنات'
                  : organizationType === 'transporter' && (currentStatusConfig?.phase === 'recycler' || currentStatusConfig?.phase === 'disposal')
                  ? 'هذه الشحنة في مرحلة الوجهة - فقط جهة الاستلام يمكنها تغيير الحالة'
                  : organizationType === 'recycler' && currentStatusConfig?.phase === 'transporter'
                  ? 'هذه الشحنة في مرحلة النقل - فقط جهة النقل يمكنها تغيير الحالة'
                  : organizationType === 'disposal' && currentStatusConfig?.phase === 'transporter'
                  ? 'هذه الشحنة في مرحلة النقل - فقط جهة النقل يمكنها تغيير الحالة'
                  : 'لا توجد حالات متاحة للتغيير'
                }
              </p>
            )}
          </div>

          {/* Available Statuses */}
          {canChange && availableStatuses.length > 0 ? (
            <div className="text-right">
              <Label className="text-sm text-muted-foreground mb-3 block">اختر الحالة الجديدة</Label>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {availableStatuses.map((status) => renderStatusButton(status, true))}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              {currentStatusConfig?.key === 'completed' ? (
                <>
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-emerald-500" />
                  <p>هذه الشحنة مكتملة ولا يمكن تغيير حالتها</p>
                </>
              ) : (
                <>
                  <Lock className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                  <p>ليس لديك صلاحية لتغيير حالة هذه الشحنة</p>
                </>
              )}
            </div>
          )}

          {/* Notes */}
          {canChange && availableStatuses.length > 0 && (
            <div className="text-right">
              <Label htmlFor="notes">ملاحظات (اختياري)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أضف ملاحظات حول تغيير الحالة..."
                className="mt-2"
                dir="rtl"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={handleClose}>
              إلغاء
            </Button>
            {canChange && availableStatuses.length > 0 && (
              <Button 
                variant="eco" 
                onClick={handleStatusChange}
                disabled={!selectedStatus || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري التحديث...
                  </>
                ) : (
                  <>
                    <ArrowRight className="ml-2 h-4 w-4" />
                    تأكيد التغيير
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

export default StatusChangeDialog;
