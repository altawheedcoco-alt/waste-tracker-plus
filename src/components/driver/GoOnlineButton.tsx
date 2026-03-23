/**
 * زر التوفر الرئيسي — Go Online (Didi-style)
 */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Power, Wifi, WifiOff, MapPin, Clock, TrendingUp, Star, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useDriverLiveLocation } from '@/hooks/useDriverLiveLocation';
import { cn } from '@/lib/utils';

interface GoOnlineButtonProps {
  driverId: string;
  isAvailable: boolean;
  onToggle: (newState: boolean) => void;
  rating?: number;
  totalTrips?: number;
}

const GoOnlineButton = ({ driverId, isAvailable, onToggle, rating = 0, totalTrips = 0 }: GoOnlineButtonProps) => {
  const [toggling, setToggling] = useState(false);
  const [onlineSince, setOnlineSince] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState('00:00');
  const gps = useDriverLiveLocation(driverId, isAvailable);

  // Track online duration
  useEffect(() => {
    if (isAvailable && !onlineSince) setOnlineSince(new Date());
    if (!isAvailable) setOnlineSince(null);
  }, [isAvailable]);

  useEffect(() => {
    if (!onlineSince) { setElapsed('00:00'); return; }
    const iv = setInterval(() => {
      const diff = Math.floor((Date.now() - onlineSince.getTime()) / 1000);
      const m = Math.floor(diff / 60).toString().padStart(2, '0');
      const s = (diff % 60).toString().padStart(2, '0');
      setElapsed(`${m}:${s}`);
    }, 1000);
    return () => clearInterval(iv);
  }, [onlineSince]);

  const handleToggle = async () => {
    setToggling(true);
    try {
      const newState = !isAvailable;
      const { error } = await supabase
        .from('drivers')
        .update({ is_available: newState })
        .eq('id', driverId);
      if (error) throw error;
      onToggle(newState);
      toast.success(newState ? '🟢 أنت متاح الآن — جاري تتبع موقعك' : '⚫ تم إيقاف التوفر');
    } catch {
      toast.error('فشل تحديث الحالة');
    } finally {
      setToggling(false);
    }
  };

  const gpsColor = gps.signal === 'good' ? 'text-emerald-500' : gps.signal === 'weak' ? 'text-amber-500' : 'text-muted-foreground';

  return (
    <div className="space-y-4">
      {/* Main Go Button */}
      <div className="flex flex-col items-center gap-4">
        <motion.button
          onClick={handleToggle}
          disabled={toggling}
          whileTap={{ scale: 0.92 }}
          className={cn(
            'relative w-36 h-36 rounded-full flex flex-col items-center justify-center gap-1 border-4 transition-all duration-500 shadow-xl',
            isAvailable
              ? 'bg-emerald-500 border-emerald-400 text-white shadow-emerald-500/30'
              : 'bg-card border-border text-muted-foreground hover:border-primary/50'
          )}
        >
          {/* Pulse rings when online */}
          {isAvailable && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-emerald-400/50"
                animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeOut' }}
              />
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-emerald-400/30"
                animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
                transition={{ repeat: Infinity, duration: 2, delay: 0.5, ease: 'easeOut' }}
              />
            </>
          )}
          <Power className={cn('w-10 h-10', isAvailable && 'drop-shadow-lg')} />
          <span className="text-sm font-bold">
            {toggling ? '...' : isAvailable ? 'متاح' : 'غير متاح'}
          </span>
        </motion.button>

        {/* Status text */}
        <AnimatePresence mode="wait">
          {isAvailable ? (
            <motion.div
              key="online"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-1"
            >
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                أنت متاح لاستقبال الطلبات
              </p>
              <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {elapsed}
                </span>
                <span className={cn('flex items-center gap-1', gpsColor)}>
                  {gps.signal === 'offline' ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
                  {gps.signal === 'good' ? 'GPS قوي' : gps.signal === 'weak' ? 'GPS ضعيف' : 'لا GPS'}
                </span>
                {gps.speed !== null && gps.speed > 0 && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {Math.round(gps.speed * 3.6)} كم/س
                  </span>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.p
              key="offline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-muted-foreground"
            >
              اضغط للبدء في استقبال الطلبات
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-3 rounded-xl bg-card border border-border/50">
          <Star className="w-4 h-4 mx-auto mb-1 text-amber-500" />
          <p className="text-lg font-bold">{rating.toFixed(1)}</p>
          <p className="text-[10px] text-muted-foreground">التقييم</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-card border border-border/50">
          <TrendingUp className="w-4 h-4 mx-auto mb-1 text-primary" />
          <p className="text-lg font-bold">{totalTrips}</p>
          <p className="text-[10px] text-muted-foreground">الرحلات</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-card border border-border/50">
          <Zap className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
          <p className="text-lg font-bold">85%</p>
          <p className="text-[10px] text-muted-foreground">معدل القبول</p>
        </div>
      </div>
    </div>
  );
};

export default GoOnlineButton;
