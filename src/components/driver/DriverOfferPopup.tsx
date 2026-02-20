import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Package, MapPin, Navigation, DollarSign, Clock, 
  Check, X, ArrowLeftRight, Truck 
} from 'lucide-react';
import { DriverOffer } from '@/hooks/useDriverOffers';
import { cn } from '@/lib/utils';

interface DriverOfferPopupProps {
  offer: DriverOffer;
  onAccept: (id: string) => Promise<boolean>;
  onReject: (id: string, reason?: string) => Promise<boolean>;
  onCounter: (id: string, price: number, notes?: string) => Promise<boolean>;
}

const WASTE_TYPE_LABELS: Record<string, string> = {
  general: 'عامة',
  hazardous: 'خطرة',
  medical: 'طبية',
  construction: 'إنشائية',
  organic: 'عضوية',
  electronic: 'إلكترونية',
  industrial: 'صناعية',
  recyclable: 'قابلة للتدوير',
};

const DriverOfferPopup = ({ offer, onAccept, onReject, onCounter }: DriverOfferPopupProps) => {
  const [timeLeft, setTimeLeft] = useState(30);
  const [showCounter, setShowCounter] = useState(false);
  const [counterPrice, setCounterPrice] = useState('');
  const [counterNotes, setCounterNotes] = useState('');
  const [isActing, setIsActing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Countdown timer
  useEffect(() => {
    const expiresAt = new Date(offer.expires_at).getTime();
    
    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((expiresAt - now) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 100);

    return () => clearInterval(interval);
  }, [offer.expires_at]);

  // Play notification sound on mount
  useEffect(() => {
    try {
      // Use Web Audio API for a simple notification beep
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.value = 0.3;
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.value = 1100;
        gain2.gain.value = 0.3;
        osc2.start();
        osc2.stop(ctx.currentTime + 0.3);
      }, 250);
    } catch (e) {
      // Audio not available
    }
  }, []);

  const handleAccept = async () => {
    setIsActing(true);
    await onAccept(offer.id);
    setIsActing(false);
  };

  const handleReject = async () => {
    setIsActing(true);
    await onReject(offer.id);
    setIsActing(false);
  };

  const handleCounter = async () => {
    if (!counterPrice) return;
    setIsActing(true);
    await onCounter(offer.id, parseFloat(counterPrice), counterNotes);
    setIsActing(false);
  };

  const progress = (timeLeft / 30) * 100;
  const shipment = offer.shipment;
  const isUrgent = timeLeft <= 10;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.9 }}
        className="fixed inset-x-0 bottom-20 z-[100] mx-auto max-w-md px-4"
        dir="rtl"
      >
        <Card className={cn(
          'rounded-2xl shadow-2xl border-2 overflow-hidden transition-colors',
          isUrgent ? 'border-destructive' : 'border-primary'
        )}>
          {/* Progress bar */}
          <div className="h-1.5 bg-muted w-full">
            <motion.div
              className={cn(
                'h-full transition-colors',
                isUrgent ? 'bg-destructive' : 'bg-primary'
              )}
              initial={{ width: '100%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>

          <CardContent className="p-4 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center',
                  isUrgent ? 'bg-destructive/10' : 'bg-primary/10'
                )}>
                  <Truck className={cn('w-5 h-5', isUrgent ? 'text-destructive' : 'text-primary')} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">طلب شحنة جديد</h3>
                  <p className="text-xs text-muted-foreground">
                    {shipment?.shipment_number || 'شحنة'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className={cn('w-4 h-4', isUrgent ? 'text-destructive animate-pulse' : 'text-muted-foreground')} />
                <span className={cn(
                  'text-lg font-bold tabular-nums',
                  isUrgent ? 'text-destructive' : 'text-foreground'
                )}>
                  {timeLeft}s
                </span>
              </div>
            </div>

            {/* Shipment Details */}
            <div className="bg-muted/50 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs gap-1">
                  <Package className="w-3 h-3" />
                  {WASTE_TYPE_LABELS[shipment?.waste_type || ''] || shipment?.waste_type}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {shipment?.quantity} {shipment?.unit || 'طن'}
                </Badge>
              </div>
              
              <div className="space-y-1.5">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-xs line-clamp-1">{shipment?.pickup_address || 'غير محدد'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Navigation className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span className="text-xs line-clamp-1">{shipment?.delivery_address || 'غير محدد'}</span>
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center justify-center gap-2 bg-primary/5 rounded-xl py-3">
              <DollarSign className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold text-primary">
                {offer.offered_price?.toLocaleString('ar-EG')}
              </span>
              <span className="text-sm text-muted-foreground">ج.م</span>
            </div>

            {/* Counter Offer Section */}
            {showCounter ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2"
              >
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="السعر المقترح (ج.م)"
                    value={counterPrice}
                    onChange={(e) => setCounterPrice(e.target.value)}
                    className="text-center font-bold"
                    autoFocus
                  />
                </div>
                <Input
                  placeholder="ملاحظات (اختياري)"
                  value={counterNotes}
                  onChange={(e) => setCounterNotes(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleCounter}
                    disabled={!counterPrice || isActing}
                    className="flex-1 gap-2"
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                    إرسال العرض
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowCounter(false)}
                    disabled={isActing}
                  >
                    إلغاء
                  </Button>
                </div>
              </motion.div>
            ) : (
              /* Action Buttons */
              <div className="flex gap-2">
                <Button
                  onClick={handleAccept}
                  disabled={isActing}
                  className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  <Check className="w-5 h-5" />
                  قبول
                </Button>
                <Button
                  onClick={() => setShowCounter(true)}
                  disabled={isActing}
                  variant="outline"
                  className="flex-1 gap-2"
                  size="lg"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  عرض مقابل
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={isActing}
                  variant="destructive"
                  size="lg"
                  className="gap-2"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default DriverOfferPopup;
