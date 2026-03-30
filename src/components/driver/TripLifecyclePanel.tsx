/**
 * لوحة دورة حياة الرحلة — DiDi/Uber style
 * خطوات: قبول → متجه للاستلام → في الموقع → تحميل → في الطريق → وصل → تسليم
 */
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Navigation, MapPin, Package, Truck, CheckCircle2,
  Loader2, Phone, Clock, ArrowLeft, Camera,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TripLifecyclePanelProps {
  shipment: {
    id: string;
    shipment_number: string;
    status: string;
    waste_type: string;
    quantity: number;
    unit: string;
    pickup_address: string;
    delivery_address: string;
    generator?: { name: string } | null;
    transporter?: { name: string } | null;
  };
  onStatusChange?: () => void;
}

const STEPS = [
  {
    status: 'approved',
    label: 'تم القبول',
    nextLabel: 'ابدأ التوجه للاستلام',
    nextStatus: 'collecting',
    icon: CheckCircle2,
    color: 'emerald',
    instruction: 'اضغط لبدء التوجه لموقع الاستلام',
  },
  {
    status: 'collecting',
    label: 'متجه للاستلام',
    nextLabel: 'وصلت لموقع التحميل',
    nextStatus: 'in_transit',
    icon: Navigation,
    color: 'blue',
    instruction: 'توجه لموقع الاستلام، اضغط عند الوصول',
  },
  {
    status: 'in_transit',
    label: 'في الطريق',
    nextLabel: 'تم التسليم',
    nextStatus: 'delivered',
    icon: Truck,
    color: 'primary',
    instruction: 'أنت في الطريق لموقع التسليم',
  },
  {
    status: 'delivered',
    label: 'تم التسليم',
    nextLabel: null,
    nextStatus: null,
    icon: CheckCircle2,
    color: 'emerald',
    instruction: 'تم إكمال الرحلة بنجاح!',
  },
];

const TripLifecyclePanel = ({ shipment, onStatusChange }: TripLifecyclePanelProps) => {
  const qc = useQueryClient();
  const currentStepIndex = STEPS.findIndex(s => s.status === shipment.status);
  const currentStep = STEPS[currentStepIndex] || STEPS[0];

  const advanceStatusMutation = useMutation({
    mutationFn: async (nextStatus: string) => {
      const updateData: any = { status: nextStatus };
      
      if (nextStatus === 'collecting') {
        updateData.collection_started_at = new Date().toISOString();
      } else if (nextStatus === 'in_transit') {
        updateData.in_transit_at = new Date().toISOString();
      } else if (nextStatus === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('shipments')
        .update(updateData)
        .eq('id', shipment.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم تحديث حالة الرحلة');
      qc.invalidateQueries({ queryKey: ['driver-shipments'] });
      onStatusChange?.();
    },
    onError: () => toast.error('فشل في تحديث الحالة'),
  });

  const navigateToAddress = (address: string) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`, '_blank');
  };

  const isCompleted = shipment.status === 'delivered' || shipment.status === 'confirmed';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className={cn(
        'overflow-hidden border-2',
        isCompleted ? 'border-emerald-500/30' : 'border-primary/30'
      )}>
        {/* Progress bar */}
        <div className="h-1.5 bg-muted">
          <motion.div
            className={cn('h-full', isCompleted ? 'bg-emerald-500' : 'bg-primary')}
            animate={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <CardContent className="p-4 space-y-4">
          {/* Current status hero */}
          <div className="text-center space-y-2">
            <motion.div
              key={currentStep.status}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                'w-16 h-16 rounded-full mx-auto flex items-center justify-center',
                isCompleted ? 'bg-emerald-500/10' : 'bg-primary/10'
              )}
            >
              <currentStep.icon className={cn(
                'w-8 h-8',
                isCompleted ? 'text-emerald-500' : 'text-primary'
              )} />
            </motion.div>
            <div>
              <h3 className="text-lg font-bold">{currentStep.label}</h3>
              <p className="text-xs text-muted-foreground">{currentStep.instruction}</p>
            </div>
          </div>

          {/* Steps indicator */}
          <div className="flex items-center justify-center gap-1.5">
            {STEPS.map((step, i) => (
              <div
                key={step.status}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i <= currentStepIndex ? 'bg-primary w-8' : 'bg-muted w-4'
                )}
              />
            ))}
          </div>

          {/* Shipment info */}
          <div className="p-3 rounded-xl bg-muted/50 space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">{shipment.waste_type}</Badge>
              <span className="text-sm font-bold">{shipment.shipment_number}</span>
            </div>
            <div className="space-y-1.5">
              <button
                onClick={() => navigateToAddress(shipment.pickup_address)}
                className="flex items-center gap-2 text-xs w-full text-right hover:text-primary transition-colors"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate flex-1">{shipment.pickup_address}</span>
                <Navigation className="w-3 h-3 text-muted-foreground" />
              </button>
              <button
                onClick={() => navigateToAddress(shipment.delivery_address)}
                className="flex items-center gap-2 text-xs w-full text-right hover:text-primary transition-colors"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                <span className="truncate flex-1">{shipment.delivery_address}</span>
                <Navigation className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-1 border-t border-border/30">
              <span>{shipment.quantity} {shipment.unit}</span>
              {shipment.generator?.name && <span>المولد: {shipment.generator.name}</span>}
              {shipment.transporter?.name && <span>الناقل: {shipment.transporter.name}</span>}
            </div>
          </div>

          {/* Action button */}
          {currentStep.nextLabel && currentStep.nextStatus && (
            <Button
              size="lg"
              className="w-full gap-2 text-base font-bold h-14 rounded-xl shadow-lg"
              onClick={() => advanceStatusMutation.mutate(currentStep.nextStatus!)}
              disabled={advanceStatusMutation.isPending}
            >
              {advanceStatusMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {currentStep.nextStatus === 'collecting' && <Navigation className="w-5 h-5" />}
                  {currentStep.nextStatus === 'in_transit' && <Truck className="w-5 h-5" />}
                  {currentStep.nextStatus === 'delivered' && <CheckCircle2 className="w-5 h-5" />}
                  {currentStep.nextLabel}
                </>
              )}
            </Button>
          )}

          {/* Quick navigation to current destination */}
          {!isCompleted && (
            <Button
              variant="outline"
              className="w-full gap-2 text-sm"
              onClick={() => {
                const addr = shipment.status === 'approved' || shipment.status === 'collecting'
                  ? shipment.pickup_address
                  : shipment.delivery_address;
                navigateToAddress(addr);
              }}
            >
              <MapPin className="w-4 h-4" />
              فتح الملاحة
            </Button>
          )}

          {isCompleted && (
            <div className="text-center p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                تم إكمال الرحلة بنجاح! 🎉
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TripLifecyclePanel;
