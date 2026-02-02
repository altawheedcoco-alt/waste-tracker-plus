import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface CancelShipmentDialogProps {
  shipmentId: string;
  shipmentNumber: string;
  currentStatus: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
  disabled?: boolean;
}

export default function CancelShipmentDialog({
  shipmentId,
  shipmentNumber,
  currentStatus,
  onSuccess,
  trigger,
  disabled = false,
}: CancelShipmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const { user, organization, roles } = useAuth();

  // Check if user can cancel (transporter or admin)
  const isAdmin = roles.includes('admin');
  const canCancel = isAdmin || organization?.organization_type === 'transporter';

  // Check if shipment can be cancelled (not already cancelled or completed)
  const cancelledStatuses = ['cancelled', 'confirmed', 'rejected', 'completed'];
  const isCancellable = !cancelledStatuses.includes(currentStatus);

  const handleCancel = async () => {
    if (!reason.trim()) {
      toast.error('يرجى إدخال سبب الإلغاء');
      return;
    }

    setIsLoading(true);
    try {
      // We use a raw update since 'cancelled' is not in the enum
      // First update status fields that exist
      const { error } = await supabase
        .from('shipments')
        .update({
          cancelled_at: new Date().toISOString(),
          cancelled_by: user?.id,
          cancellation_reason: reason.trim(),
          notes: `[ملغاة] ${reason.trim()}`,
        } as any)
        .eq('id', shipmentId);

      if (error) throw error;

      toast.success('تم إلغاء الشحنة بنجاح');
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['partner-shipments'] });
      queryClient.invalidateQueries({ queryKey: ['shipment', shipmentId] });
      
      setOpen(false);
      setReason('');
      onSuccess?.();
    } catch (error) {
      console.error('Error cancelling shipment:', error);
      toast.error('حدث خطأ أثناء إلغاء الشحنة');
    } finally {
      setIsLoading(false);
    }
  };

  if (!canCancel || !isCancellable) {
    return null;
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button 
            variant="destructive" 
            size="sm" 
            className="gap-2"
            disabled={disabled}
          >
            <XCircle className="h-4 w-4" />
            إلغاء الشحنة
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent dir="rtl" className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            إلغاء الشحنة
          </AlertDialogTitle>
          <AlertDialogDescription className="text-right">
            هل أنت متأكد من إلغاء الشحنة رقم{' '}
            <span className="font-mono font-bold text-foreground">{shipmentNumber}</span>؟
            <br />
            <span className="text-destructive">
              سيتم إلغاء قيمة الشحنة من كشوف الحسابات تلقائياً.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 py-4">
          <Label htmlFor="reason" className="text-right block">
            سبب الإلغاء <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="reason"
            placeholder="اكتب سبب إلغاء الشحنة..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[100px] text-right"
            dir="rtl"
          />
        </div>

        <AlertDialogFooter className="flex-row-reverse gap-2">
          <AlertDialogCancel disabled={isLoading}>
            تراجع
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isLoading || !reason.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
                جاري الإلغاء...
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 ml-2" />
                تأكيد الإلغاء
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
