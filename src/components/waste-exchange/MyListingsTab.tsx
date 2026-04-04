import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Pause, Play, Eye, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MyListingsTabProps {
  isRTL: boolean;
  listings: any[];
  onRefresh: () => void;
  onViewBids: (listingId: string) => void;
}

const STATUS_MAP: Record<string, { ar: string; en: string; color: string }> = {
  active: { ar: 'نشط', en: 'Active', color: 'bg-green-500/10 text-green-600' },
  paused: { ar: 'متوقف', en: 'Paused', color: 'bg-yellow-500/10 text-yellow-600' },
  sold: { ar: 'تم البيع', en: 'Sold', color: 'bg-blue-500/10 text-blue-600' },
  expired: { ar: 'منتهي', en: 'Expired', color: 'bg-muted-foreground/10 text-muted-foreground' },
  draft: { ar: 'مسودة', en: 'Draft', color: 'bg-muted-foreground/10 text-muted-foreground' },
  cancelled: { ar: 'ملغي', en: 'Cancelled', color: 'bg-red-500/10 text-red-600' },
};

export const MyListingsTab = ({ isRTL, listings, onRefresh, onViewBids }: MyListingsTabProps) => {
  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    const { error } = await supabase.from('waste_exchange_listings')
      .update({ status: newStatus } as any).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success(isRTL ? 'تم تحديث الحالة' : 'Status updated');
    onRefresh();
  };

  const deleteListing = async (id: string) => {
    const { error } = await supabase.from('waste_exchange_listings').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success(isRTL ? 'تم حذف العرض' : 'Listing deleted');
    onRefresh();
  };

  if (listings.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          {isRTL ? 'لم تنشر أي عروض بعد' : 'No listings published yet'}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {listings.map(listing => {
        const statusInfo = STATUS_MAP[listing.status] || STATUS_MAP.draft;
        return (
          <Card key={listing.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={statusInfo.color}>{isRTL ? statusInfo.ar : statusInfo.en}</Badge>
                    <Badge variant="outline">
                      {listing.listing_type === 'sell' ? (isRTL ? 'بيع' : 'Sell') : (isRTL ? 'شراء' : 'Buy')}
                    </Badge>
                  </div>
                  <h3 className="font-semibold truncate">{listing.title}</h3>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                    <span>{listing.quantity_tons} {isRTL ? 'طن' : 'T'}</span>
                    {listing.price_per_ton && <span>{listing.price_per_ton.toLocaleString('ar-EG')} ج.م/طن</span>}
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {listing.views_count}</span>
                    <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {listing.bids_count}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onViewBids(listing.id)}>
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8"
                    onClick={() => toggleStatus(listing.id, listing.status)}>
                    {listing.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 text-destructive"
                    onClick={() => deleteListing(listing.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
