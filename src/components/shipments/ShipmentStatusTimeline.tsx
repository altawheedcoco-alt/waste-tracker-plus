import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  PackageCheck,
  ArrowDown,
  Layers
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface StatusStep {
  key: string;
  label: string;
  arabicLabel: string;
  icon: React.ElementType;
  timestamp?: string | null;
  isActive: boolean;
  isCompleted: boolean;
}

interface ShipmentStatusTimelineProps {
  shipment: {
    status: string;
    created_at: string;
    approved_at?: string | null;
    collection_started_at?: string | null;
    in_transit_at?: string | null;
    delivered_at?: string | null;
    confirmed_at?: string | null;
  };
  showCard?: boolean;
}

const statusOrder = ['new', 'approved', 'in_transit', 'delivered', 'confirmed'];

const statusConfig: Record<string, { label: string; icon: React.ElementType; colorClass: string }> = {
  new: { label: 'جديدة', icon: Package, colorClass: 'text-blue-500 bg-blue-100 dark:bg-blue-900/50' },
  approved: { label: 'معتمدة', icon: CheckCircle2, colorClass: 'text-green-500 bg-green-100 dark:bg-green-900/50' },
  in_transit: { label: 'قيد النقل', icon: Truck, colorClass: 'text-purple-500 bg-purple-100 dark:bg-purple-900/50' },
  delivered: { label: 'قيد التسليم', icon: ArrowDown, colorClass: 'text-teal-500 bg-teal-100 dark:bg-teal-900/50' },
  confirmed: { label: 'مكتمل', icon: Layers, colorClass: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/50' },
};

const ShipmentStatusTimeline = ({ shipment, showCard = true }: ShipmentStatusTimelineProps) => {
  const currentStatusIndex = statusOrder.indexOf(shipment.status);

  const getTimestamp = (status: string): string | null => {
    switch (status) {
      case 'new':
        return shipment.created_at;
      case 'approved':
        return shipment.approved_at || null;
      case 'in_transit':
        return shipment.in_transit_at || null;
      case 'delivered':
        return shipment.delivered_at || null;
      case 'confirmed':
        return shipment.confirmed_at || null;
      default:
        return null;
    }
  };

  const steps: StatusStep[] = statusOrder.map((status, index) => ({
    key: status,
    label: status,
    arabicLabel: statusConfig[status]?.label || status,
    icon: statusConfig[status]?.icon || Package,
    timestamp: getTimestamp(status),
    isActive: index === currentStatusIndex,
    isCompleted: index < currentStatusIndex,
  }));

  const currentStatus = statusConfig[shipment.status] || statusConfig.new;
  const CurrentIcon = currentStatus.icon;

  const content = (
    <div className="space-y-6">
      {/* Current Status Display */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
        <Badge className={cn("text-sm px-4 py-1.5", currentStatus.colorClass)}>
          {currentStatus.label}
        </Badge>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">الحالة الحالية:</span>
          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", currentStatus.colorClass)}>
            <CurrentIcon className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute right-5 top-0 bottom-0 w-0.5 bg-border" />

        <div className="space-y-1">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const config = statusConfig[step.key];
            
            return (
              <motion.div
                key={step.key}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "relative flex items-center gap-4 p-3 rounded-lg transition-all",
                  step.isActive && "bg-primary/5 border border-primary/20",
                  step.isCompleted && "opacity-90",
                  !step.isActive && !step.isCompleted && "opacity-50"
                )}
              >
                {/* Status Icon */}
                <div
                  className={cn(
                    "relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                    step.isActive && "border-primary bg-primary text-primary-foreground scale-110 shadow-lg",
                    step.isCompleted && cn("border-transparent", config.colorClass),
                    !step.isActive && !step.isCompleted && "border-muted-foreground/30 bg-muted text-muted-foreground"
                  )}
                >
                  {step.isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <StepIcon className="w-5 h-5" />
                  )}
                </div>

                {/* Status Info */}
                <div className="flex-1 text-right">
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      {step.timestamp && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(step.timestamp), 'PPp', { locale: ar })}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className={cn(
                        "font-medium",
                        step.isActive && "text-primary",
                        step.isCompleted && "text-foreground",
                        !step.isActive && !step.isCompleted && "text-muted-foreground"
                      )}>
                        {step.arabicLabel}
                      </p>
                      {step.isActive && (
                        <Badge variant="outline" className="mt-1 text-xs border-primary text-primary">
                          الحالة الحالية
                        </Badge>
                      )}
                      {step.isCompleted && (
                        <span className="text-xs text-green-600 dark:text-green-400">مكتمل ✓</span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="pt-4 border-t">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">
            {currentStatusIndex + 1} من {statusOrder.length}
          </span>
          <span className="font-medium">تقدم الشحنة</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((currentStatusIndex + 1) / statusOrder.length) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full bg-gradient-to-l from-primary to-green-500 rounded-full"
          />
        </div>
      </div>
    </div>
  );

  if (!showCard) {
    return content;
  }

  return (
    <Card>
      <CardHeader className="text-right">
        <CardTitle className="flex items-center gap-2 justify-end">
          <Clock className="w-5 h-5 text-primary" />
          سجل تتبع حالة الشحنة
        </CardTitle>
        <CardDescription>السجل الزمني لتغييرات حالة الشحنة</CardDescription>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
};

export default ShipmentStatusTimeline;
