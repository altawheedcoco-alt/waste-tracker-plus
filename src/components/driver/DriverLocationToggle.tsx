/**
 * زر تشغيل/إيقاف مشاركة الموقع — لجميع أنواع السائقين
 * إجباري أثناء الشحنة النشطة مع مؤشر offline buffer
 */
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, MapPinOff, Wifi, WifiOff, CloudOff, Lock, Database } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { SmartLocationStatus } from '@/hooks/useDriverSmartLocation';

interface DriverLocationToggleProps {
  status: SmartLocationStatus;
  shouldShare: boolean;
  manualOn: boolean;
  onToggle: () => void;
}

const DriverLocationToggle = ({ status, shouldShare, manualOn, onToggle }: DriverLocationToggleProps) => {
  const isForced = status.isForcedByShipment;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border transition-all',
        shouldShare
          ? 'bg-emerald-500/10 border-emerald-500/30'
          : 'bg-card border-border/50'
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
          shouldShare ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'
        )}>
          {shouldShare ? <MapPin className="w-4 h-4" /> : <MapPinOff className="w-4 h-4" />}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold truncate">
              {shouldShare ? 'موقعي مُفعّل' : 'موقعي مُعطّل'}
            </span>
            {isForced && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 gap-0.5 border-amber-500/50 text-amber-600 dark:text-amber-400">
                <Lock className="w-2.5 h-2.5" />
                إجباري
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            {shouldShare && (
              <>
                {/* Signal indicator */}
                <span className={cn(
                  'flex items-center gap-0.5',
                  status.signal === 'good' ? 'text-emerald-600 dark:text-emerald-400' :
                  status.signal === 'weak' ? 'text-amber-600 dark:text-amber-400' :
                  'text-destructive'
                )}>
                  {status.isOnline ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
                  {status.signal === 'good' ? 'قوي' : status.signal === 'weak' ? 'ضعيف' : 'منقطع'}
                </span>

                {/* Speed */}
                {status.speed !== null && status.speed > 0 && (
                  <span>{Math.round(status.speed * 3.6)} كم/س</span>
                )}

                {/* Buffered count */}
                <AnimatePresence>
                  {status.bufferedCount > 0 && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400"
                    >
                      <Database className="w-2.5 h-2.5" />
                      {status.bufferedCount} مخزن
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Offline indicator */}
                {!status.isOnline && (
                  <span className="flex items-center gap-0.5 text-destructive">
                    <CloudOff className="w-2.5 h-2.5" />
                    يحفظ محلياً
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Switch
        checked={shouldShare}
        onCheckedChange={onToggle}
        disabled={isForced}
        className="data-[state=checked]:bg-emerald-500 flex-shrink-0"
      />
    </motion.div>
  );
};

export default DriverLocationToggle;
