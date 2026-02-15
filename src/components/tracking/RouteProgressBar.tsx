import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  MapPin, 
  Navigation,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface RouteProgressBarProps {
  status: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  pickupDate?: string | null;
  deliveredAt?: string | null;
  progress?: number; // 0-100
  remainingDistance?: number | null; // in km
  estimatedArrival?: Date | null;
  compact?: boolean;
}

const statusStages = [
  { key: 'new', label: 'جديدة', icon: Package },
  { key: 'approved', label: 'معتمدة', icon: CheckCircle2 },
  { key: 'in_transit', label: 'نقل', icon: Truck },
  { key: 'delivered', label: 'تسليم', icon: Navigation },
  { key: 'confirmed', label: 'مؤكدة', icon: CheckCircle2 },
];

const RouteProgressBar = ({
  status,
  pickupAddress,
  deliveryAddress,
  pickupDate,
  deliveredAt,
  progress,
  remainingDistance,
  estimatedArrival,
  compact = false,
}: RouteProgressBarProps) => {
  // Calculate progress based on status if not provided
  const calculatedProgress = useMemo(() => {
    if (progress !== undefined) return progress;
    
    const statusIndex = statusStages.findIndex(s => s.key === status);
    if (statusIndex === -1) return 0;
    return Math.round(((statusIndex + 1) / statusStages.length) * 100);
  }, [status, progress]);

  const currentStageIndex = useMemo(() => {
    return statusStages.findIndex(s => s.key === status);
  }, [status]);

  if (compact) {
    return (
      <div className="w-full space-y-2">
        {/* Simple progress bar */}
        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-green-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${calculatedProgress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        
        {/* Progress info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-green-500" />
            <span className="truncate max-w-[100px]">{pickupAddress || 'نقطة الاستلام'}</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {calculatedProgress}%
          </Badge>
          <div className="flex items-center gap-1">
            <Navigation className="h-3 w-3 text-red-500" />
            <span className="truncate max-w-[100px]">{deliveryAddress || 'نقطة التسليم'}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Full progress visualization */}
      <div className="relative">
        {/* Background line */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-muted rounded-full" />
        
        {/* Progress line */}
        <motion.div
          className="absolute top-5 left-0 h-1 bg-gradient-to-r from-primary via-green-500 to-emerald-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${calculatedProgress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />

        {/* Stage indicators */}
        <div className="relative flex justify-between">
          {statusStages.map((stage, index) => {
            const isCompleted = index <= currentStageIndex;
            const isCurrent = index === currentStageIndex;
            const StageIcon = stage.icon;

            return (
              <div key={stage.key} className="flex flex-col items-center">
                <motion.div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all z-10",
                    isCompleted 
                      ? "bg-primary border-primary text-primary-foreground" 
                      : "bg-background border-muted-foreground/30 text-muted-foreground",
                    isCurrent && "ring-4 ring-primary/20"
                  )}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: isCurrent ? 1.1 : 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <StageIcon className="w-5 h-5" />
                </motion.div>
                <span className={cn(
                  "text-xs mt-2 font-medium",
                  isCompleted ? "text-foreground" : "text-muted-foreground"
                )}>
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Additional info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Pickup info */}
        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-green-600">الاستلام</span>
          </div>
          <p className="text-sm truncate font-medium">{pickupAddress || '--'}</p>
          {pickupDate && (
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(pickupDate), 'dd MMM', { locale: ar })}
            </p>
          )}
        </div>

        {/* Progress percentage */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 mb-1">
            <Truck className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-primary">التقدم</span>
          </div>
          <p className="text-2xl font-bold text-primary">{calculatedProgress}%</p>
        </div>

        {/* Remaining distance */}
        {remainingDistance !== null && remainingDistance !== undefined && (
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-1">
              <Navigation className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-medium text-amber-600">المتبقي</span>
            </div>
            <p className="text-lg font-bold">
              {remainingDistance >= 1 
                ? `${remainingDistance.toFixed(1)} كم` 
                : `${Math.round(remainingDistance * 1000)} م`}
            </p>
          </div>
        )}

        {/* Delivery info */}
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 mb-1">
            <Navigation className="h-4 w-4 text-red-600" />
            <span className="text-xs font-medium text-red-600">التسليم</span>
          </div>
          <p className="text-sm truncate font-medium">{deliveryAddress || '--'}</p>
          {deliveredAt && (
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(deliveredAt), 'dd MMM', { locale: ar })}
            </p>
          )}
          {estimatedArrival && !deliveredAt && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              متوقع: {format(estimatedArrival, 'hh:mm a', { locale: ar })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RouteProgressBar;
