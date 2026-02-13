import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Check, X, ArrowLeftRight, Loader2, Calendar, MapPin, Weight, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface WorkOrderResponseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipient: any;
  workOrder: any;
}

const WorkOrderResponseDialog = ({ open, onOpenChange, recipient, workOrder }: WorkOrderResponseDialogProps) => {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const [responseType, setResponseType] = useState<'accepted' | 'rejected' | 'counter_offer' | null>(null);
  const [notes, setNotes] = useState('');
  const [counterQty, setCounterQty] = useState('');
  const [counterDate, setCounterDate] = useState('');
  const [counterPrice, setCounterPrice] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!responseType || !profile) return;
    setLoading(true);
    try {
      await supabase.from('work_order_recipients')
        .update({
          status: responseType,
          response_notes: notes,
          counter_quantity: responseType === 'counter_offer' ? parseFloat(counterQty) || null : null,
          counter_date: responseType === 'counter_offer' && counterDate ? counterDate : null,
          counter_price: responseType === 'counter_offer' ? parseFloat(counterPrice) || null : null,
          responded_by: profile.user_id,
          responded_at: new Date().toISOString(),
        } as any)
        .eq('id', recipient.id);

      // Log activity
      await supabase.from('work_order_activity').insert({
        work_order_id: workOrder.id,
        actor_user_id: profile.user_id,
        actor_organization_id: profile.organization_id,
        action: responseType,
        details: { notes, counter_qty: counterQty, counter_date: counterDate, counter_price: counterPrice },
      } as any);

      // Check if all recipients responded -> update work order status
      const { data: allRecipients } = await supabase
        .from('work_order_recipients')
        .select('status')
        .eq('work_order_id', workOrder.id);

      if (allRecipients) {
        const allResponded = allRecipients.every((r: any) => r.status !== 'pending' && r.status !== 'viewed');
        const anyAccepted = allRecipients.some((r: any) => r.status === 'accepted');
        const allRejected = allRecipients.every((r: any) => r.status === 'rejected');

        if (allResponded) {
          let newStatus = 'partially_accepted';
          if (allRejected) newStatus = 'cancelled';
          else if (anyAccepted && allRecipients.every((r: any) => r.status === 'accepted')) newStatus = 'accepted';
          await supabase.from('work_orders').update({ status: newStatus } as any).eq('id', workOrder.id);
        }
      }

      toast.success(t('workOrder.responseSuccess'));
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message);
    }
    setLoading(false);
  };

  if (!workOrder) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {t('workOrder.submitResponse')}
            <Badge variant="outline" className="font-mono">{workOrder.order_number}</Badge>
          </DialogTitle>
          <DialogDescription>{workOrder.waste_type} — {workOrder.estimated_quantity} {workOrder.unit}</DialogDescription>
        </DialogHeader>

        {/* Order Summary */}
        <div className="p-3 rounded-lg bg-muted/50 space-y-2 text-sm">
          <div className="flex items-center gap-3 flex-wrap">
            {workOrder.is_hazardous && <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-3 h-3" />{t('workOrder.isHazardous')}</Badge>}
            {workOrder.preferred_date && <span className="flex items-center gap-1 text-muted-foreground"><Calendar className="w-3 h-3" />{workOrder.preferred_date}</span>}
            {workOrder.pickup_location && <span className="flex items-center gap-1 text-muted-foreground"><MapPin className="w-3 h-3" />{workOrder.pickup_location}</span>}
          </div>
          {workOrder.special_instructions && <p className="text-muted-foreground">{workOrder.special_instructions}</p>}
        </div>

        <Separator />

        {/* Response Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={responseType === 'accepted' ? 'default' : 'outline'}
            className={`gap-1.5 ${responseType === 'accepted' ? 'bg-green-600 hover:bg-green-700' : ''}`}
            onClick={() => setResponseType('accepted')}
          >
            <Check className="w-4 h-4" /> {t('workOrder.accept')}
          </Button>
          <Button
            variant={responseType === 'rejected' ? 'destructive' : 'outline'}
            className="gap-1.5"
            onClick={() => setResponseType('rejected')}
          >
            <X className="w-4 h-4" /> {t('workOrder.reject')}
          </Button>
          <Button
            variant={responseType === 'counter_offer' ? 'default' : 'outline'}
            className={`gap-1.5 ${responseType === 'counter_offer' ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
            onClick={() => setResponseType('counter_offer')}
          >
            <ArrowLeftRight className="w-4 h-4" /> {t('workOrder.counterOffer')}
          </Button>
        </div>

        {/* Counter Offer Fields */}
        {responseType === 'counter_offer' && (
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">{t('workOrder.counterQty')}</Label>
              <Input type="number" value={counterQty} onChange={e => setCounterQty(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('workOrder.counterDate')}</Label>
              <Input type="date" value={counterDate} onChange={e => setCounterDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('workOrder.counterPrice')}</Label>
              <Input type="number" value={counterPrice} onChange={e => setCounterPrice(e.target.value)} />
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="space-y-1.5">
          <Label>{t('workOrder.responseNotes')}</Label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
        </div>

        <Button onClick={handleSubmit} disabled={loading || !responseType} className="w-full">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
          {loading ? t('workOrder.submitting') : t('workOrder.submitResponse')}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default WorkOrderResponseDialog;
