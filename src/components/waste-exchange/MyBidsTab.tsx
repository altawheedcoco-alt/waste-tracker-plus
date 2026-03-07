import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface MyBidsTabProps {
  isRTL: boolean;
  bids: any[];
  onRefresh: () => void;
}

const getBidStatusConfig = (t: (key: string) => string) => ({
  pending: { label: t('exchange.bidPending'), color: 'bg-yellow-500/10 text-yellow-600' },
  accepted: { label: t('exchange.bidAccepted'), color: 'bg-green-500/10 text-green-600' },
  rejected: { label: t('exchange.bidRejected'), color: 'bg-red-500/10 text-red-600' },
  withdrawn: { label: t('exchange.bidWithdrawnStatus'), color: 'bg-gray-500/10 text-gray-600' },
  counter_offered: { label: t('exchange.bidCounterOffered'), color: 'bg-blue-500/10 text-blue-600' },
  expired: { label: t('exchange.bidExpired'), color: 'bg-gray-500/10 text-gray-600' },
});

export const MyBidsTab = ({ isRTL, bids, onRefresh }: MyBidsTabProps) => {
  const { t, language } = useLanguage();
  const locale = language === 'ar' ? 'ar-EG' : 'en-US';
  const BID_STATUS = getBidStatusConfig(t);

  const withdrawBid = async (id: string) => {
    const { error } = await supabase.from('waste_exchange_bids')
      .update({ status: 'withdrawn' } as any).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success(t('exchange.bidWithdrawn'));
    onRefresh();
  };

  if (bids.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          {t('exchange.noBidsYet')}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {bids.map(bid => {
        const statusInfo = BID_STATUS[bid.status as keyof typeof BID_STATUS] || BID_STATUS.pending;
        return (
          <Card key={bid.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                  </div>
                  <p className="text-sm font-medium">
                    {bid.bid_price_per_ton?.toLocaleString(locale)} {t('exchange.egpPerTon')} × {bid.bid_quantity_tons} {t('exchange.ton')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('exchange.totalLabel')} {(bid.bid_price_per_ton * bid.bid_quantity_tons)?.toLocaleString(locale)} {t('exchange.egp')}
                  </p>
                  {bid.message && <p className="text-xs text-muted-foreground mt-1">{bid.message}</p>}
                  {bid.counter_offer_price && (
                    <p className="text-xs text-blue-600 mt-1">
                      {t('exchange.counterOffer')} {bid.counter_offer_price?.toLocaleString(locale)} {t('exchange.egpPerTon')}
                    </p>
                  )}
                </div>
                {bid.status === 'pending' && (
                  <Button variant="outline" size="sm" className="text-destructive gap-1" onClick={() => withdrawBid(bid.id)}>
                    <X className="w-3 h-3" />
                    {t('exchange.withdraw')}
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
