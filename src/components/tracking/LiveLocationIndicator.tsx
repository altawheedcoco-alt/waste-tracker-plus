import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Signal, 
  SignalLow, 
  SignalMedium, 
  SignalHigh, 
  Wifi, 
  WifiOff,
  Navigation,
  MapPin
} from 'lucide-react';

interface LiveLocationIndicatorProps {
  isTracking: boolean;
  accuracy?: number;
  lastUpdate?: Date | null;
  signalStrength?: 'excellent' | 'good' | 'fair' | 'poor' | 'offline';
}

const LiveLocationIndicator = ({ 
  isTracking, 
  accuracy, 
  lastUpdate,
  signalStrength 
}: LiveLocationIndicatorProps) => {
  const [pulseKey, setPulseKey] = useState(0);

  // Trigger pulse animation on location update
  useEffect(() => {
    if (lastUpdate) {
      setPulseKey(prev => prev + 1);
    }
  }, [lastUpdate]);

  const getSignalIcon = () => {
    if (!isTracking) return <WifiOff className="h-4 w-4 text-muted-foreground" />;
    
    if (accuracy !== undefined) {
      if (accuracy <= 10) return <SignalHigh className="h-4 w-4 text-primary" />;
      if (accuracy <= 30) return <SignalMedium className="h-4 w-4 text-amber-500" />;
      if (accuracy <= 100) return <SignalLow className="h-4 w-4 text-orange-500" />;
      return <Signal className="h-4 w-4 text-destructive" />;
    }

    switch (signalStrength) {
      case 'excellent': return <SignalHigh className="h-4 w-4 text-primary" />;
      case 'good': return <SignalMedium className="h-4 w-4 text-primary" />;
      case 'fair': return <SignalLow className="h-4 w-4 text-amber-500" />;
      case 'poor': return <Signal className="h-4 w-4 text-destructive" />;
      default: return <Wifi className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getAccuracyLabel = () => {
    if (!accuracy) return 'غير معروف';
    if (accuracy <= 10) return 'دقة ممتازة';
    if (accuracy <= 30) return 'دقة جيدة';
    if (accuracy <= 100) return 'دقة متوسطة';
    return 'دقة منخفضة';
  };

  const getTimeSinceUpdate = () => {
    if (!lastUpdate) return 'لم يتم التحديث';
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastUpdate.getTime()) / 1000);
    
    if (diff < 10) return 'الآن';
    if (diff < 60) return `منذ ${diff} ثانية`;
    if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
    return `منذ ${Math.floor(diff / 3600)} ساعة`;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <AnimatePresence mode="wait">
              {isTracking ? (
                <motion.div
                  key={`tracking-${pulseKey}`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="relative"
                >
                  {/* Pulse ring */}
                  <motion.div
                    className="absolute inset-0 rounded-full bg-primary/30"
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  
                  {/* Center dot */}
                  <div className="relative w-3 h-3 rounded-full bg-primary shadow-lg shadow-primary/50">
                    <motion.div
                      className="absolute inset-0 rounded-full bg-primary"
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-3 h-3 rounded-full bg-muted-foreground/50"
                />
              )}
            </AnimatePresence>

            <Badge 
              variant={isTracking ? 'default' : 'secondary'}
              className="flex items-center gap-1.5 text-xs"
            >
              {getSignalIcon()}
              <span>{isTracking ? 'متصل' : 'غير متصل'}</span>
            </Badge>

            {isTracking && accuracy && (
              <Badge variant="outline" className="text-xs">
                ± {Math.round(accuracy)} م
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-right" dir="rtl">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Navigation className="h-3 w-3" />
              <span className="font-medium">{getAccuracyLabel()}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{getTimeSinceUpdate()}</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default LiveLocationIndicator;
