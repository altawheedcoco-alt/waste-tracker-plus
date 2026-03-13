import { CheckCircle2, Clock, Truck, Package, MapPin, FileCheck } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TimelineStep {
  key: string;
  label: string;
  icon: React.ElementType;
  date: string | null;
  status: 'completed' | 'current' | 'pending';
}

interface ShipmentTimelineProps {
  shipment: {
    status: string;
    created_at: string;
    approved_at?: string | null;
    collection_started_at?: string | null;
    in_transit_at?: string | null;
    delivered_at?: string | null;
    confirmed_at?: string | null;
  };
  compact?: boolean;
}

const ShipmentTimeline = ({ shipment, compact = false }: ShipmentTimelineProps) => {
  const statusOrder = ['new', 'approved', 'collection_started', 'in_transit', 'delivered', 'confirmed'];
  const currentIndex = statusOrder.indexOf(
    shipment.status === 'collection_started' ? 'collection_started' : shipment.status
  );

  const steps: TimelineStep[] = [
    {
      key: 'new',
      label: 'تم الإنشاء',
      icon: Package,
      date: shipment.created_at,
      status: currentIndex >= 0 ? 'completed' : 'pending',
    },
    {
      key: 'approved',
      label: 'تمت الموافقة',
      icon: FileCheck,
      date: shipment.approved_at || null,
      status: currentIndex > 0 ? 'completed' : currentIndex === 0 ? 'current' : 'pending',
    },
    {
      key: 'in_transit',
      label: 'قيد النقل',
      icon: Truck,
      date: shipment.in_transit_at || null,
      status: currentIndex >= 3 ? 'completed' : currentIndex >= 2 ? 'current' : 'pending',
    },
    {
      key: 'delivered',
      label: 'تم التسليم',
      icon: MapPin,
      date: shipment.delivered_at || null,
      status: currentIndex >= 4 ? 'completed' : currentIndex === 3 ? 'current' : 'pending',
    },
    {
      key: 'confirmed',
      label: 'تم التأكيد',
      icon: CheckCircle2,
      date: shipment.confirmed_at || null,
      status: currentIndex >= 5 ? 'completed' : currentIndex === 4 ? 'current' : 'pending',
    },
  ];

  if (compact) {
    return (
      <div className="flex items-center gap-1 w-full" dir="rtl">
        {steps.map((step, i) => (
          <div key={step.key} className="flex items-center flex-1">
            <div
              className={cn(
                'w-3 h-3 rounded-full shrink-0 transition-colors',
                step.status === 'completed' && 'bg-primary',
                step.status === 'current' && 'bg-primary animate-pulse',
                step.status === 'pending' && 'bg-muted-foreground/20'
              )}
            />
            {i < steps.length - 1 && (
              <div
                className={cn(
                  'h-0.5 flex-1 mx-0.5',
                  step.status === 'completed' ? 'bg-primary' : 'bg-muted-foreground/20'
                )}
              />
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-0" dir="rtl">
      {steps.map((step, i) => {
        const Icon = step.icon;
        return (
          <div key={step.key} className="flex gap-3">
            {/* Line + Circle */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-all',
                  step.status === 'completed' && 'bg-emerald-500 border-emerald-500 text-white',
                  step.status === 'current' && 'bg-primary/10 border-primary text-primary animate-pulse',
                  step.status === 'pending' && 'bg-muted border-muted-foreground/20 text-muted-foreground/40'
                )}
              >
                <Icon className="w-4 h-4" />
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    'w-0.5 h-8',
                    step.status === 'completed' ? 'bg-emerald-500' : 'bg-muted-foreground/20'
                  )}
                />
              )}
            </div>
            {/* Label */}
            <div className="pb-6 min-w-0">
              <p
                className={cn(
                  'text-sm font-medium',
                  step.status === 'pending' && 'text-muted-foreground/50'
                )}
              >
                {step.label}
              </p>
              {step.date && (
                <p className="text-xs text-muted-foreground">
                  {format(new Date(step.date), 'dd MMM yyyy - hh:mm a', { locale: ar })}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ShipmentTimeline;
