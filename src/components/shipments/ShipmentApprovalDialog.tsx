import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Truck,
  Recycle,
  Package,
  MapPin,
  Calendar,
  AlertTriangle,
  Timer,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { notifyAdmins } from '@/services/unifiedNotifier';
import { toast } from 'sonner';
import { format, formatDistanceToNow, differenceInMinutes } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { wasteTypeLabels } from '@/lib/shipmentStatusConfig';

interface ShipmentApprovalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: {
    id: string;
    shipment_number: string;
    waste_type: string;
    quantity: number;
    unit?: string;
    pickup_address?: string;
    delivery_address?: string;
    created_at: string;
    generator_auto_approve_deadline?: string;
    recycler_auto_approve_deadline?: string;
    generator?: { name: string } | null;
    transporter?: { name: string } | null;
    recycler?: { name: string } | null;
  };
  approvalType: 'generator' | 'recycler';
  onApprovalComplete?: () => void;
}

export default function ShipmentApprovalDialog({
  isOpen,
  onClose,
  shipment,
  approvalType,
  onApprovalComplete,
}: ShipmentApprovalDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  const deadline = approvalType === 'generator' 
    ? shipment.generator_auto_approve_deadline 
    : shipment.recycler_auto_approve_deadline;

  // Update time remaining every second
  useEffect(() => {
    if (!deadline || !isOpen) return;

    const updateTimer = () => {
      const remaining = differenceInMinutes(new Date(deadline), new Date());
      setTimeRemaining(Math.max(0, remaining));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [deadline, isOpen]);

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      const updateData: Record<string, any> = {
        [`${approvalType}_approval_status`]: 'approved',
        [`${approvalType}_approval_at`]: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('shipments')
        .update(updateData)
        .eq('id', shipment.id);

      if (error) throw error;

      // Fetch transporter_id to notify them
      const { data: shipmentData } = await supabase
        .from('shipments')
        .select('transporter_id')
        .eq('id', shipment.id)
        .single();

      const transporterOrgId = shipmentData?.transporter_id;

      // Send notification to transporter
      if (transporterOrgId) {
        await supabase.functions.invoke('smart-notifications', {
          body: {
            action: 'send',
            title: '✅ تمت الموافقة على الشحنة',
            message: `الشحنة ${shipment.shipment_number} تمت الموافقة عليها من قبل ${approvalType === 'generator' ? 'المولد' : 'المدور'}`,
            type: 'shipment_approved',
            shipment_id: shipment.id,
            organization_id: transporterOrgId,
          },
        });
      }

      // Notify all admins (dual: in-app + WhatsApp)
      await notifyAdmins(
        '✅ موافقة على شحنة',
        `الشحنة ${shipment.shipment_number} تمت الموافقة عليها من قبل ${approvalType === 'generator' ? 'المولد' : 'المدور'}`,
        { type: 'shipment_approved', reference_id: shipment.id, reference_type: 'shipment' }
      );

      toast.success('تمت الموافقة على الشحنة بنجاح');
      onApprovalComplete?.();
      onClose();
    } catch (error) {
      console.error('Error approving shipment:', error);
      toast.error('حدث خطأ أثناء الموافقة على الشحنة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('يرجى إدخال سبب الرفض');
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData: Record<string, any> = {
        [`${approvalType}_approval_status`]: 'rejected',
        [`${approvalType}_approval_at`]: new Date().toISOString(),
        [`${approvalType}_rejection_reason`]: rejectionReason.trim(),
      };

      const { error } = await supabase
        .from('shipments')
        .update(updateData)
        .eq('id', shipment.id);

      if (error) throw error;

      // Fetch transporter_id to notify them
      const { data: shipmentData } = await supabase
        .from('shipments')
        .select('transporter_id')
        .eq('id', shipment.id)
        .single();

      const transporterOrgId = shipmentData?.transporter_id;

      // Send notification to transporter about rejection
      if (transporterOrgId) {
        await supabase.functions.invoke('smart-notifications', {
          body: {
            action: 'send',
            title: '❌ تم رفض الشحنة',
            message: `الشحنة ${shipment.shipment_number} تم رفضها من قبل ${approvalType === 'generator' ? 'المولد' : 'المدور'}. السبب: ${rejectionReason}`,
            type: 'shipment_rejected',
            shipment_id: shipment.id,
            organization_id: transporterOrgId,
          },
        });
      }

      // Notify all admins about rejection (dual: in-app + WhatsApp)
      await notifyAdmins(
        '❌ رفض شحنة',
        `الشحنة ${shipment.shipment_number} تم رفضها من قبل ${approvalType === 'generator' ? 'المولد' : 'المدور'}. السبب: ${rejectionReason}`,
        { type: 'shipment_rejected', reference_id: shipment.id, reference_type: 'shipment' }
      );

      toast.success('تم رفض الشحنة');
      onApprovalComplete?.();
      onClose();
    } catch (error) {
      console.error('Error rejecting shipment:', error);
      toast.error('حدث خطأ أثناء رفض الشحنة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressPercentage = deadline
    ? Math.max(0, Math.min(100, (timeRemaining / 15) * 100))
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-right">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            طلب موافقة على الشحنة
          </DialogTitle>
          <DialogDescription className="text-right">
            {approvalType === 'generator' 
              ? 'تم إصدار شحنة من الناقل وتحتاج موافقتك'
              : 'تم تسليم شحنة وتحتاج موافقتك للتأكيد'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Auto-approval Timer */}
          {deadline && timeRemaining > 0 && (
            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Timer className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                    الموافقة التلقائية بعد
                  </span>
                  <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
                    {timeRemaining} دقيقة متبقية
                  </Badge>
                </div>
                <Progress value={progressPercentage} className="h-2 bg-amber-200" />
                <p className="text-xs text-amber-600 mt-1 text-right">
                  إذا لم يتم الرد خلال 15 دقيقة، سيتم الموافقة تلقائياً
                </p>
              </CardContent>
            </Card>
          )}

          {/* Shipment Details */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="font-mono">
                  {shipment.shipment_number}
                </Badge>
                <span className="text-sm text-muted-foreground">رقم الشحنة</span>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-right justify-end">
                  <span>{wasteTypeLabels[shipment.waste_type] || shipment.waste_type}</span>
                  <Package className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex items-center gap-2 text-right justify-end">
                  <span>{shipment.quantity} {shipment.unit || 'كجم'}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                {shipment.generator && (
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-muted-foreground">{shipment.generator.name}</span>
                    <Building2 className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">المولد:</span>
                  </div>
                )}
                {shipment.transporter && (
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-muted-foreground">{shipment.transporter.name}</span>
                    <Truck className="w-4 h-4 text-orange-500" />
                    <span className="font-medium">الناقل:</span>
                  </div>
                )}
                {shipment.recycler && (
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-muted-foreground">{shipment.recycler.name}</span>
                    <Recycle className="w-4 h-4 text-green-500" />
                    <span className="font-medium">المدور:</span>
                  </div>
                )}
              </div>

              <Separator />

              {shipment.pickup_address && (
                <div className="flex items-center gap-2 text-sm justify-end">
                  <span className="text-muted-foreground text-right truncate max-w-[200px]">
                    {shipment.pickup_address}
                  </span>
                  <MapPin className="w-4 h-4 text-red-500" />
                  <span className="font-medium">الاستلام:</span>
                </div>
              )}
              {shipment.delivery_address && (
                <div className="flex items-center gap-2 text-sm justify-end">
                  <span className="text-muted-foreground text-right truncate max-w-[200px]">
                    {shipment.delivery_address}
                  </span>
                  <MapPin className="w-4 h-4 text-green-500" />
                  <span className="font-medium">التسليم:</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm justify-end">
                <span className="text-muted-foreground">
                  {format(new Date(shipment.created_at), 'PPP', { locale: ar })}
                </span>
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">التاريخ:</span>
              </div>
            </CardContent>
          </Card>

          {/* Rejection Form */}
          {showRejectionForm && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-right block">
                سبب الرفض <span className="text-destructive">*</span>
              </label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="يرجى توضيح سبب رفض الشحنة..."
                className="min-h-[100px] text-right"
                dir="rtl"
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {!showRejectionForm ? (
            <>
              <Button
                variant="outline"
                onClick={() => setShowRejectionForm(true)}
                disabled={isSubmitting}
                className="gap-2"
              >
                <XCircle className="w-4 h-4" />
                رفض
              </Button>
              <Button
                onClick={handleApprove}
                disabled={isSubmitting}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                موافقة
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowRejectionForm(false);
                  setRejectionReason('');
                }}
                disabled={isSubmitting}
              >
                إلغاء
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isSubmitting || !rejectionReason.trim()}
                className="gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                تأكيد الرفض
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
