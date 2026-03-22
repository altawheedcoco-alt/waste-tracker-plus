/**
 * لوحة العروض الواردة للسائق المستقل
 */
import { useDriverMissionOffers } from '@/hooks/useDriverMissionOffers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Package, CheckCircle, XCircle, Loader2, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useState } from 'react';

interface IndependentOffersPanelProps {
  driverId: string;
}

const IndependentOffersPanel = ({ driverId }: IndependentOffersPanelProps) => {
  const { offers, isLoading, acceptOffer, rejectOffer, pendingCount } = useDriverMissionOffers(driverId);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <Zap className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
          <h3 className="font-semibold text-sm mb-1">لا توجد عروض حالياً</h3>
          <p className="text-xs text-muted-foreground">
            ستصلك إشعارات فورية عند توفر شحنات في نطاق خدمتك
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          العروض الواردة
          {pendingCount > 0 && (
            <Badge variant="destructive" className="text-[10px] px-1.5">{pendingCount}</Badge>
          )}
        </h3>
      </div>

      {offers.map((offer: any) => {
        const expiresAt = new Date(offer.expires_at);
        const isExpiringSoon = expiresAt.getTime() - Date.now() < 5 * 60 * 1000;

        return (
          <Card key={offer.id} className={`border ${isExpiringSoon ? 'border-destructive/50 bg-destructive/5' : 'border-primary/20'}`}>
            <CardContent className="p-4 space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[10px]">
                  {offer.offer_type === 'smart_dispatch' ? '⚡ توزيع ذكي' : '📋 عرض مباشر'}
                </Badge>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  ينتهي {formatDistanceToNow(expiresAt, { locale: ar, addSuffix: true })}
                </div>
              </div>

              {/* Shipment Info */}
              {offer.shipment && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs">
                    <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span className="truncate">{offer.shipment.pickup_address || 'غير محدد'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                    <span className="truncate">{offer.shipment.delivery_address || 'غير محدد'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Package className="w-3 h-3" />
                    {offer.shipment.waste_type} • {offer.shipment.estimated_weight} كجم
                  </div>
                </div>
              )}

              {/* Price */}
              {offer.offered_price && (
                <div className="text-center py-2 rounded-lg bg-primary/5 border border-primary/10">
                  <span className="text-lg font-bold text-primary">{offer.offered_price} ج.م</span>
                </div>
              )}

              {/* Distance */}
              {offer.distance_km && (
                <p className="text-[10px] text-muted-foreground text-center">
                  المسافة: {offer.distance_km.toFixed(1)} كم
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 gap-1.5"
                  onClick={() => acceptOffer.mutate(offer.id)}
                  disabled={acceptOffer.isPending}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  قبول
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1.5"
                  onClick={() => rejectOffer.mutate({ offerId: offer.id })}
                  disabled={rejectOffer.isPending}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  رفض
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default IndependentOffersPanel;
