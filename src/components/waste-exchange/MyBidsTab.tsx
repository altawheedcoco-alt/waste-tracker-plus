import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MyBidsTabProps {
  isRTL: boolean;
  bids: any[];
  onRefresh: () => void;
}

const BID_STATUS: Record<string, { ar: string; en: string; color: string }> = {
  pending: { ar: 'قيد المراجعة', en: 'Pending', color: 'bg-yellow-500/10 text-yellow-600' },
  accepted: { ar: 'مقبول', en: 'Accepted', color: 'bg-green-500/10 text-green-600' },
  rejected: { ar: 'مرفوض', en: 'Rejected', color: 'bg-red-500/10 text-red-600' },
  withdrawn: { ar: 'تم السحب', en: 'Withdrawn', color: 'bg-gray-500/10 text-gray-600' },
  counter_offered: { ar: 'عرض مقابل', en: 'Counter Offer', color: 'bg-blue-500/10 text-blue-600' },
  expired: { ar: 'منتهي', en: 'Expired', color: 'bg-gray-500/10 text-gray-600' },
};

export const MyBidsTab = ({ isRTL, bids, onRefresh }: MyBidsTabProps) => {
  const withdrawBid = async (id: string) => {
    const { error } = await supabase.from('waste_exchange_bids')
      .update({ status: 'withdrawn' } as any).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success(isRTL ? 'تم سحب العرض' : 'Bid withdrawn');
    onRefresh();
  };

  if (bids.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          {isRTL ? 'لم تقدم أي عروض بعد' : 'No bids placed yet'}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {bids.map(bid => {
        const statusInfo = BID_STATUS[bid.status] || BID_STATUS.pending;
        return (
          <Card key={bid.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={statusInfo.color}>{isRTL ? statusInfo.ar : statusInfo.en}</Badge>
                  </div>
                  <p className="text-sm font-medium">
                    {bid.bid_price_per_ton?.toLocaleString('ar-EG')} ج.م/طن × {bid.bid_quantity_tons} {isRTL ? 'طن' : 'T'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isRTL ? 'الإجمالي:' : 'Total:'} {(bid.bid_price_per_ton * bid.bid_quantity_tons)?.toLocaleString('ar-EG')} ج.م
                  </p>
                  {bid.message && <p className="text-xs text-muted-foreground mt-1">{bid.message}</p>}
                  {bid.counter_offer_price && (
                    <p className="text-xs text-blue-600 mt-1">
                      {isRTL ? 'عرض مقابل:' : 'Counter:'} {bid.counter_offer_price?.toLocaleString('ar-EG')} ج.م/طن
                    </p>
                  )}
                </div>
                {bid.status === 'pending' && (
                  <Button variant="outline" size="sm" className="text-destructive gap-1" onClick={() => withdrawBid(bid.id)}>
                    <X className="w-3 h-3" />
                    {isRTL ? 'سحب' : 'Withdraw'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
