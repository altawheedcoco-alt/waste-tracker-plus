import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { getTabChannelName } from '@/lib/tabSession';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  PackageCheck,
  ArrowDown,
  Layers,
  Route,
  Milestone,
  Flag
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

interface ProgressMilestone {
  id: string;
  notes: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

interface ShipmentStatusTimelineProps {
  shipment: {
    id?: string;
    status: string;
    created_at: string;
    approved_at?: string | null;
    collection_started_at?: string | null;
    in_transit_at?: string | null;
    delivered_at?: string | null;
    confirmed_at?: string | null;
  };
  showCard?: boolean;
  showProgressMilestones?: boolean;
}

const statusOrder = ['new', 'approved', 'in_transit', 'delivered', 'confirmed'];

const statusConfig: Record<string, { label: string; icon: React.ElementType; colorClass: string }> = {
  new: { label: 'جديدة', icon: Package, colorClass: 'text-blue-500 bg-blue-100 dark:bg-blue-900/50' },
  approved: { label: 'معتمدة', icon: CheckCircle2, colorClass: 'text-green-500 bg-green-100 dark:bg-green-900/50' },
  in_transit: { label: 'قيد النقل', icon: Truck, colorClass: 'text-purple-500 bg-purple-100 dark:bg-purple-900/50' },
  delivered: { label: 'قيد التسليم', icon: ArrowDown, colorClass: 'text-teal-500 bg-teal-100 dark:bg-teal-900/50' },
  confirmed: { label: 'مكتمل', icon: Layers, colorClass: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/50' },
};

const ShipmentStatusTimeline = ({ shipment, showCard = true, showProgressMilestones = true }: ShipmentStatusTimelineProps) => {
  const currentStatusIndex = statusOrder.indexOf(shipment.status);
  const [progressMilestones, setProgressMilestones] = useState<ProgressMilestone[]>([]);

  // Fetch progress milestones from logs
  useEffect(() => {
    if (!shipment.id || !showProgressMilestones) return;

    const fetchMilestones = async () => {
      const { data } = await supabase
        .from('shipment_logs')
        .select('id, notes, latitude, longitude, created_at')
        .eq('shipment_id', shipment.id)
        .like('notes', '%تقدم تلقائي%')
        .order('created_at', { ascending: true });

      if (data) {
        setProgressMilestones(data as ProgressMilestone[]);
      }
    };

    fetchMilestones();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(getTabChannelName(`timeline-logs-${shipment.id}`))
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'shipment_logs',
          filter: `shipment_id=eq.${shipment.id}`,
        },
        () => {
          fetchMilestones();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shipment.id, showProgressMilestones]);

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

  const getMilestoneIcon = (notes: string) => {
    if (notes.includes('منتصف') || notes.includes('50%')) return Flag;
    if (notes.includes('كم')) return Route;
    return Milestone;
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

  // Get milestones for in_transit phase
  const inTransitMilestones = progressMilestones.filter(m => {
    const inTransitTime = shipment.in_transit_at ? new Date(shipment.in_transit_at).getTime() : 0;
    const deliveredTime = shipment.delivered_at ? new Date(shipment.delivered_at).getTime() : Date.now();
    const milestoneTime = new Date(m.created_at).getTime();
    return milestoneTime >= inTransitTime && milestoneTime <= deliveredTime;
  });

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
            const isInTransit = step.key === 'in_transit';
            const showMilestones = isInTransit && inTransitMilestones.length > 0 && showProgressMilestones;
            
            return (
              <div key={step.key}>
                <motion.div
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

                {/* Inline Milestones for in_transit */}
                {showMilestones && (
                  <div className="mr-8 border-r-2 border-dashed border-primary/30 pr-4 py-2 space-y-2">
                    {inTransitMilestones.map((milestone, mIndex) => {
                      const MilestoneIcon = getMilestoneIcon(milestone.notes);
                      const isHalfway = milestone.notes.includes('منتصف') || milestone.notes.includes('50%');
                      
                      return (
                        <motion.div
                          key={milestone.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3 + mIndex * 0.05 }}
                          className={cn(
                            "flex items-center gap-3 p-2 rounded-md text-sm",
                            isHalfway ? "bg-amber-50 dark:bg-amber-900/20" : "bg-muted/30"
                          )}
                        >
                          <div className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center",
                            isHalfway ? "bg-amber-100 text-amber-600" : "bg-primary/10 text-primary"
                          )}>
                            <MilestoneIcon className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 text-right">
                            <p className="text-xs font-medium">
                              {milestone.notes.replace('تقدم تلقائي: ', '')}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(milestone.created_at), 'HH:mm', { locale: ar })}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
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
