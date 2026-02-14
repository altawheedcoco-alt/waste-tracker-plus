import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PlaceBidDialogProps {
  isRTL: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: string;
  organizationId: string;
  currentPrice?: number;
  onBidPlaced: () => void;
}

export const PlaceBidDialog = ({ isRTL, open, onOpenChange, listingId, organizationId, currentPrice, onBidPlaced }: PlaceBidDialogProps) => {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    bid_price_per_ton: currentPrice?.toString() || '',
    bid_quantity_tons: '',
    message: '',
    delivery_terms: '',
    valid_until: '',
  });

  const handleSubmit = async () => {
    if (!form.bid_price_per_ton || !form.bid_quantity_tons) {
      toast.error(isRTL ? 'يرجى ملء السعر والكمية' : 'Please fill price and quantity');
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('waste_exchange_bids').insert({
        listing_id: listingId,
        bidder_organization_id: organizationId,
        bid_price_per_ton: parseFloat(form.bid_price_per_ton),
        bid_quantity_tons: parseFloat(form.bid_quantity_tons),
        message: form.message || null,
        delivery_terms: form.delivery_terms || null,
        valid_until: form.valid_until || null,
        created_by: user?.id,
      } as any);
      if (error) throw error;
      toast.success(isRTL ? 'تم إرسال العرض بنجاح' : 'Bid placed successfully');
      onOpenChange(false);
      onBidPlaced();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isRTL ? 'تقديم عرض سعر' : 'Place a Bid'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{isRTL ? 'السعر/طن (ج.م) *' : 'Price/Ton (EGP) *'}</Label>
              <Input type="number" value={form.bid_price_per_ton}
                onChange={e => setForm(p => ({ ...p, bid_price_per_ton: e.target.value }))} />
            </div>
            <div>
              <Label>{isRTL ? 'الكمية (طن) *' : 'Quantity (tons) *'}</Label>
              <Input type="number" value={form.bid_quantity_tons}
                onChange={e => setForm(p => ({ ...p, bid_quantity_tons: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label>{isRTL ? 'رسالة' : 'Message'}</Label>
            <Textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
              placeholder={isRTL ? 'تفاصيل إضافية...' : 'Additional details...'} rows={3} />
          </div>
          <div>
            <Label>{isRTL ? 'شروط التوصيل' : 'Delivery Terms'}</Label>
            <Input value={form.delivery_terms} onChange={e => setForm(p => ({ ...p, delivery_terms: e.target.value }))} />
          </div>
          <div>
            <Label>{isRTL ? 'صالح حتى' : 'Valid Until'}</Label>
            <Input type="date" value={form.valid_until} onChange={e => setForm(p => ({ ...p, valid_until: e.target.value }))} />
          </div>
          <Button onClick={handleSubmit} disabled={saving} className="w-full gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isRTL ? 'إرسال العرض' : 'Submit Bid'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
