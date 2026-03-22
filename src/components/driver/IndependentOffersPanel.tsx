/**
 * لوحة العروض الواردة المتقدمة للسائق المستقل
 * تتضمن: عداد تنازلي، تفاصيل متقدمة، إشعار صوتي
 */
import { useDriverMissionOffers } from '@/hooks/useDriverMissionOffers';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Package, CheckCircle, XCircle, Loader2, Zap, Volume2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface IndependentOffersPanelProps {
  driverId: string;
}

/** عداد تنازلي حتى انتهاء العرض */
const CountdownTimer = ({ expiresAt }: { expiresAt: string }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('انتهى');
        setIsUrgent(true);
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
      setIsUrgent(diff < 3 * 60 * 1000);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <span className={`font-mono text-sm font-bold ${isUrgent ? 'text-destructive animate-pulse' : 'text-amber-600 dark:text-amber-400'}`}>
      ⏱ {timeLeft}
    </span>
  );
};

/** تشغيل صوت إشعار */
const playNotificationSound = () => {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.value = 0.3;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.stop(ctx.currentTime + 0.5);
  } catch { /* silent */ }
};

const IndependentOffersPanel = ({ driverId }: IndependentOffersPanelProps) => {
  const { offers, isLoading, acceptOffer, rejectOffer, pendingCount } = useDriverMissionOffers(driverId);
  const [prevCount, setPrevCount] = useState(0);

  // Play sound when new offers arrive
  useEffect(() => {
    if (pendingCount > prevCount && prevCount > 0) {
      playNotificationSound();
    }
    setPrevCount(pendingCount);
  }, [pendingCount, prevCount]);

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
          <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
            <Volume2 className="w-3 h-3" />
            سيتم تنبيهك بصوت عند وصول عرض جديد
          </div>
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
            <Badge variant="destructive" className="text-[10px] px-1.5 animate-pulse">{pendingCount}</Badge>
          )}
        </h3>
      </div>

      <AnimatePresence>
        {offers.map((offer: any) => {
          const expiresAt = new Date(offer.expires_at);
          const isExpired = expiresAt.getTime() < Date.now();

          return (
            <motion.div
              key={offer.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 20 }}
            >
              <Card className={`border-2 transition-all ${
                isExpired ? 'border-muted opacity-60' : 'border-primary/30 shadow-md shadow-primary/5'
              }`}>
                <CardContent className="p-4 space-y-3">
                  {/* Header with countdown */}
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] gap-1">
                      {offer.offer_type === 'smart_dispatch' ? '⚡ توزيع ذكي' : '📋 عرض مباشر'}
                    </Badge>
                    <CountdownTimer expiresAt={offer.expires_at} />
                  </div>

                  {/* From org */}
                  {offer.offered_by_org?.name && (
                    <p className="text-xs text-muted-foreground">
                      من: <strong className="text-foreground">{offer.offered_by_org.name}</strong>
                    </p>
                  )}

                  {/* Shipment details */}
                  {offer.shipment && (
                    <div className="space-y-1.5 p-2.5 rounded-lg bg-muted/30 border border-border/30">
                      <div className="flex items-start gap-1.5 text-xs">
                        <MapPin className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] text-muted-foreground">الاستلام:</span>
                          <p className="truncate">{offer.shipment.pickup_address || 'غير محدد'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-1.5 text-xs">
                        <MapPin className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] text-muted-foreground">التسليم:</span>
                          <p className="truncate">{offer.shipment.delivery_address || 'غير محدد'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-1 border-t border-border/20">
                        <span className="flex items-center gap-1">
                          <Package className="w-3 h-3" /> {offer.shipment.waste_type}
                        </span>
                        {offer.shipment.estimated_weight && (
                          <span>{offer.shipment.estimated_weight} كجم</span>
                        )}
                        {offer.distance_km && (
                          <span>📍 {offer.distance_km.toFixed(1)} كم</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Price highlight */}
                  {offer.offered_price && (
                    <div className="text-center py-2.5 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                      <span className="text-xl font-bold text-primary">{offer.offered_price}</span>
                      <span className="text-sm text-primary/70 mr-1">ج.م</span>
                    </div>
                  )}

                  {/* Actions */}
                  {!isExpired && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 gap-1.5 shadow-sm"
                        onClick={() => acceptOffer.mutate(offer.id)}
                        disabled={acceptOffer.isPending}
                      >
                        {acceptOffer.isPending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle className="w-3.5 h-3.5" />
                        )}
                        قبول العرض
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
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default IndependentOffersPanel;
