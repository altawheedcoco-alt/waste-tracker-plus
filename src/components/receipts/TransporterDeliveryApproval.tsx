import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Package,
  Send,
  Loader2,
  Timer,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';

const TransporterDeliveryApproval = () => {
  const { organization, profile } = useAuth();
  const queryClient = useQueryClient();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: pendingReceipts = [], isLoading } = useQuery({
    queryKey: ['pending-delivery-approvals', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      // Get shipments where this org is the transporter
      const { data: shipments } = await supabase
        .from('shipments')
        .select('id')
        .eq('transporter_id', organization.id);

      if (!shipments?.length) return [];

      const shipmentIds = shipments.map(s => s.id);

      const { data, error } = await supabase
        .from('shipment_receipts')
        .select('*')
        .in('shipment_id', shipmentIds)
        .eq('transporter_approval_status', 'pending')
        .not('generator_id', 'is', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending approvals:', error);
        return [];
      }

      // Enrich with shipment details
      const enrichedData = await Promise.all(
        (data || []).map(async (receipt: any) => {
          const { data: shipment } = await supabase
            .from('shipments')
            .select('shipment_number, waste_type, quantity, unit, generator_id, pickup_address, delivery_address')
            .eq('id', receipt.shipment_id)
            .maybeSingle();

          let generatorName = '';
          if (shipment?.generator_id) {
            const { data: gen } = await supabase
              .from('organizations')
              .select('name')
              .eq('id', shipment.generator_id)
              .maybeSingle();
            generatorName = gen?.name || '';
          }

          return {
            ...receipt,
            shipment,
            generator_name: generatorName,
          };
        })
      );

      return enrichedData;
    },
    enabled: !!organization?.id,
    staleTime: 1000 * 60 * 2,
  });

  const handleApprove = async (receipt: any) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('shipment_receipts')
        .update({
          transporter_approval_status: 'approved',
          transporter_approved_at: new Date().toISOString(),
          status: 'confirmed',
        } as any)
        .eq('id', receipt.id);

      if (error) throw error;
      toast.success('تم قبول شهادة التسليم بنجاح');
      queryClient.invalidateQueries({ queryKey: ['pending-delivery-approvals'] });
    } catch (error) {
      console.error('Error approving:', error);
      toast.error('حدث خطأ أثناء القبول');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('يجب ذكر سبب الرفض');
      return;
    }

    setIsSubmitting(true);
    try {
      // Update receipt status
      const { error: receiptError } = await supabase
        .from('shipment_receipts')
        .update({
          transporter_approval_status: 'rejected',
          transporter_rejection_reason: rejectionReason,
          status: 'rejected',
        } as any)
        .eq('id', selectedReceipt.id);

      if (receiptError) throw receiptError;

      // Log in rejection registry
      const { error: logError } = await supabase
        .from('shipment_rejection_log')
        .insert({
          shipment_id: selectedReceipt.shipment_id,
          receipt_id: selectedReceipt.id,
          rejected_by_organization_id: organization?.id,
          rejected_by_user_id: profile?.id,
          rejection_reason: rejectionReason,
          rejection_type: 'transporter_delivery_rejection',
          shipment_status_before: selectedReceipt.shipment?.status || 'unknown',
        } as any);

      if (logError) console.error('Error logging rejection:', logError);

      toast.success('تم رفض شهادة التسليم وتسجيلها في سجل المرفوضات');
      setRejectDialogOpen(false);
      setRejectionReason('');
      setSelectedReceipt(null);
      queryClient.invalidateQueries({ queryKey: ['pending-delivery-approvals'] });
    } catch (error) {
      console.error('Error rejecting:', error);
      toast.error('حدث خطأ أثناء الرفض');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent><Skeleton className="h-20 w-full" /></CardContent>
      </Card>
    );
  }

  if (pendingReceipts.length === 0) return null;

  return (
    <>
      <Card className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Timer className="w-5 h-5 text-amber-600" />
            شهادات تسليم بانتظار موافقتك
            <Badge variant="destructive">{pendingReceipts.length}</Badge>
          </CardTitle>
          <CardDescription>
            شهادات تسليم صادرة من المولدين تحتاج موافقتك - ستتم الموافقة تلقائياً عند انقضاء المهلة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingReceipts.map((receipt: any) => {
            const deadline = receipt.transporter_approval_deadline
              ? new Date(receipt.transporter_approval_deadline)
              : null;
            const timeLeft = deadline
              ? formatDistanceToNow(deadline, { locale: ar, addSuffix: true })
              : '';

            return (
              <Card key={receipt.id} className="border-amber-200 dark:border-amber-800">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(receipt)}
                        disabled={isSubmitting}
                        className="gap-1"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        قبول
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedReceipt(receipt);
                          setRejectDialogOpen(true);
                        }}
                        disabled={isSubmitting}
                        className="gap-1"
                      >
                        <XCircle className="w-4 h-4" />
                        رفض
                      </Button>
                    </div>

                    {/* Details */}
                    <div className="flex-1 text-right space-y-1.5">
                      <div className="flex items-center gap-2 justify-end flex-wrap">
                        <Badge variant="outline" className="font-mono text-xs">
                          {receipt.receipt_number}
                        </Badge>
                        {receipt.shipment?.shipment_number && (
                          <Badge variant="secondary" className="text-xs">
                            {receipt.shipment.shipment_number}
                          </Badge>
                        )}
                        <span className="font-semibold text-sm">
                          {receipt.generator_name || 'مولد غير محدد'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap justify-end">
                        {receipt.waste_type && <span>النوع: {receipt.waste_type}</span>}
                        {receipt.actual_weight && <span>الكمية: {receipt.actual_weight} كجم</span>}
                        <span>
                          التاريخ: {format(new Date(receipt.created_at), 'dd/MM/yyyy hh:mm a', { locale: ar })}
                        </span>
                      </div>

                      {deadline && (
                        <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 justify-end">
                          <Clock className="w-3 h-3" />
                          <span>الموافقة التلقائية {timeLeft}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </CardContent>
      </Card>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-destructive" />
              رفض شهادة التسليم
            </DialogTitle>
            <DialogDescription>
              سيتم تسجيل الرفض في سجل المرفوضات وتجنيب الشحنة من السجل الفعال
            </DialogDescription>
          </DialogHeader>

          {selectedReceipt && (
            <div className="space-y-4">
              <Card className="bg-muted/50">
                <CardContent className="p-3 text-sm text-right space-y-1">
                  <div className="flex justify-between">
                    <Badge variant="outline">{selectedReceipt.receipt_number}</Badge>
                    <span className="font-medium">{selectedReceipt.generator_name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    الكمية: {selectedReceipt.actual_weight} كجم | النوع: {selectedReceipt.waste_type || '-'}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <label className="text-sm font-medium text-right block">
                  سبب الرفض <span className="text-destructive">*</span>
                </label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="مثال: تم تحميل الشحنة وإفراغها في نفس الموقع، لم تتم عملية النقل فعلياً..."
                  dir="rtl"
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)} disabled={isSubmitting}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isSubmitting || !rejectionReason.trim()}
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 ml-2 animate-spin" />جاري الرفض...</>
              ) : (
                <><XCircle className="w-4 h-4 ml-2" />تأكيد الرفض وتجنيب الشحنة</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TransporterDeliveryApproval;
