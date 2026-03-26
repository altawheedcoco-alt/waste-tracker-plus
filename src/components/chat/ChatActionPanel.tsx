import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { soundEngine } from '@/lib/soundEngine';
import { useAuth } from '@/contexts/AuthContext';
import UniversalSignatureDialog from '@/components/signatures/UniversalSignatureDialog';
import { saveDocumentSignature } from '@/components/signatures/signatureService';
import type { SignatureData } from '@/components/signatures/UniversalSignatureDialog';
import ShipmentInlineTrackingMap from '@/components/shipments/ShipmentInlineTrackingMap';

type ActionType = 'sign' | 'stamp' | 'track' | 'status' | 'approve' | null;

interface ChatActionPanelProps {
  action: ActionType;
  resourceId: string;
  resourceType: string;
  resourceData?: any;
  onClose: () => void;
  onComplete?: (action: string, id: string, result?: any) => void;
}

const STATUS_OPTIONS: { value: 'approved' | 'collecting' | 'in_transit' | 'delivered'; label: string; color: string }[] = [
  { value: 'approved', label: 'معتمدة', color: 'bg-blue-500' },
  { value: 'collecting', label: 'جاري التجميع', color: 'bg-amber-500' },
  { value: 'in_transit', label: 'قيد النقل', color: 'bg-indigo-500' },
  { value: 'delivered', label: 'تم التسليم', color: 'bg-emerald-500' },
];

const ChatActionPanel = memo(({
  action,
  resourceId,
  resourceType,
  resourceData,
  onClose,
  onComplete,
}: ChatActionPanelProps) => {
  const { user, profile, organization } = useAuth();
  const [loading, setLoading] = useState(false);
  const [signDialogOpen, setSignDialogOpen] = useState(action === 'sign' || action === 'stamp');

  if (!action) return null;

  const handleStatusChange = async (newStatus: 'approved' | 'collecting' | 'in_transit' | 'delivered') => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('shipments')
        .update({ status: newStatus })
        .eq('id', resourceId);
      if (error) throw error;
      soundEngine.play('success');
      toast.success('تم تحديث حالة الشحنة');
      onComplete?.('status_changed', resourceId, { status: newStatus });
      onClose();
    } catch {
      toast.error('فشل تحديث الحالة');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (approved: boolean) => {
    setLoading(true);
    try {
      const table = resourceType === 'invoice' ? 'invoices' : 'signing_requests';
      const newStatus = approved ? (resourceType === 'invoice' ? 'paid' : 'signed') : 'rejected';
      const { error } = await supabase
        .from(table)
        .update({ status: newStatus } as any)
        .eq('id', resourceId);
      if (error) throw error;
      soundEngine.play(approved ? 'success' : 'warning');
      toast.success(approved ? 'تم الاعتماد بنجاح' : 'تم الرفض');
      onComplete?.(approved ? 'approved' : 'rejected', resourceId);
      onClose();
    } catch {
      toast.error('فشلت العملية');
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async (data: SignatureData) => {
    if (!user?.id || !organization?.id) return;
    setLoading(true);
    try {
      const docType = (['shipment', 'contract', 'invoice', 'certificate', 'award_letter'].includes(resourceType)
        ? resourceType
        : 'other') as 'shipment' | 'contract' | 'invoice' | 'certificate' | 'award_letter' | 'other';

      await saveDocumentSignature({
        signatureData: data,
        documentType: docType,
        documentId: resourceId,
        organizationId: organization.id,
        userId: user.id,
      });

      // Update signing request status if applicable
      if (resourceType === 'signing_request') {
        await supabase
          .from('signing_requests')
          .update({ status: 'signed' })
          .eq('id', resourceId);
      }

      soundEngine.play('success');
      toast.success(action === 'stamp' ? 'تم الختم بنجاح ✓' : 'تم التوقيع بنجاح ✓');
      onComplete?.(action === 'stamp' ? 'stamped' : 'signed', resourceId, data);
      setSignDialogOpen(false);
      onClose();
    } catch {
      toast.error('فشل حفظ التوقيع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {(action === 'track' || action === 'status' || action === 'approve') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col"
          >
            <div className="flex items-center justify-between p-3 border-b">
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
              <span className="text-sm font-bold">
                {action === 'track' && '📍 تتبع مباشر'}
                {action === 'status' && '🔄 تغيير الحالة'}
                {action === 'approve' && '✅ اعتماد'}
              </span>
              <div className="w-8" />
            </div>

            <div className="flex-1 overflow-auto p-4">
              {action === 'track' && (
                <div className="rounded-xl overflow-hidden h-[300px]">
                  <ShipmentInlineTrackingMap shipmentId={resourceId} />
                </div>
              )}

              {action === 'status' && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    اختر الحالة الجديدة للشحنة
                  </p>
                  {STATUS_OPTIONS.map(opt => (
                    <Button
                      key={opt.value}
                      variant="outline"
                      className="w-full h-12 justify-start gap-3 text-sm"
                      disabled={loading}
                      onClick={() => handleStatusChange(opt.value)}
                    >
                      <div className={cn('w-3 h-3 rounded-full', opt.color)} />
                      {opt.label}
                      {loading && <Loader2 className="w-4 h-4 animate-spin mr-auto" />}
                    </Button>
                  ))}
                </div>
              )}

              {action === 'approve' && (
                <div className="space-y-4 text-center">
                  <p className="text-sm font-medium">
                    {resourceType === 'invoice' ? 'اعتماد الفاتورة' : 'اعتماد المستند'}
                  </p>
                  {resourceData?.total_amount != null && (
                    <p className="text-2xl font-bold text-primary">
                      {resourceData.total_amount.toLocaleString()} {resourceData.currency || 'EGP'}
                    </p>
                  )}
                  <div className="flex gap-3 justify-center pt-4">
                    <Button
                      className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white min-w-[120px]"
                      onClick={() => handleApprove(true)}
                      disabled={loading}
                    >
                      <CheckCircle className="w-4 h-4" /> اعتماد
                    </Button>
                    <Button
                      variant="destructive"
                      className="gap-2 min-w-[120px]"
                      onClick={() => handleApprove(false)}
                      disabled={loading}
                    >
                      <XCircle className="w-4 h-4" /> رفض
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Signature Dialog */}
      {(action === 'sign' || action === 'stamp') && (
        <UniversalSignatureDialog
          open={signDialogOpen}
          onOpenChange={(open) => {
            setSignDialogOpen(open);
            if (!open) onClose();
          }}
          onSign={handleSign}
          documentType={(['shipment', 'contract', 'invoice', 'certificate', 'award_letter'].includes(resourceType)
            ? resourceType
            : 'other') as any}
          documentId={resourceId}
          organizationId={organization?.id || ''}
          loading={loading}
          signerDefaults={{
            name: profile?.full_name || '',
            title: '',
          }}
        />
      )}
    </>
  );
});

ChatActionPanel.displayName = 'ChatActionPanel';
export default ChatActionPanel;
