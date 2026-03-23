/**
 * شاشة مراحل تحميل وتسليم الشحنة — Didi Loading Mode
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Navigation, MapPin, Camera, Package, CheckCircle,
  Truck, Loader2, Phone, Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import PricingBreakdown from './PricingBreakdown';
import { cn } from '@/lib/utils';

type Stage = 'heading_pickup' | 'at_pickup' | 'in_transit' | 'at_delivery';

interface ShipmentLoadingModeProps {
  shipmentId: string;
  shipmentNumber: string;
  pickupAddress: string;
  deliveryAddress: string;
  wasteType?: string;
  distanceKm?: number;
  offeredPrice?: number;
  onComplete?: () => void;
  onCancel?: () => void;
}

const STAGES: { key: Stage; label: string; icon: typeof Navigation; color: string }[] = [
  { key: 'heading_pickup', label: 'متجه للاستلام', icon: Navigation, color: 'text-blue-500' },
  { key: 'at_pickup', label: 'في موقع الاستلام', icon: Package, color: 'text-amber-500' },
  { key: 'in_transit', label: 'في الطريق', icon: Truck, color: 'text-primary' },
  { key: 'at_delivery', label: 'في موقع التسليم', icon: CheckCircle, color: 'text-emerald-500' },
];

const ShipmentLoadingMode = ({
  shipmentId, shipmentNumber, pickupAddress, deliveryAddress,
  wasteType, distanceKm = 0, offeredPrice, onComplete, onCancel,
}: ShipmentLoadingModeProps) => {
  const [currentStage, setCurrentStage] = useState<Stage>('heading_pickup');
  const [loading, setLoading] = useState(false);
  const stageIndex = STAGES.findIndex(s => s.key === currentStage);

  const updateShipmentStatus = async (status: string) => {
    setLoading(true);
    try {
      const updateFields: Record<string, any> = { status };
      if (status === 'collecting') updateFields.collection_started_at = new Date().toISOString();
      if (status === 'in_transit') updateFields.in_transit_at = new Date().toISOString();
      if (status === 'delivered') updateFields.delivered_at = new Date().toISOString();

      const { error } = await supabase
        .from('shipments')
        .update(updateFields)
        .eq('id', shipmentId);
      if (error) throw error;
    } catch {
      toast.error('فشل تحديث حالة الشحنة');
    } finally {
      setLoading(false);
    }
  };

  const advanceStage = async () => {
    switch (currentStage) {
      case 'heading_pickup':
        setCurrentStage('at_pickup');
        toast.success('وصلت لموقع الاستلام');
        break;
      case 'at_pickup':
        await updateShipmentStatus('collecting');
        setCurrentStage('in_transit');
        toast.success('بدأ التحميل — في الطريق');
        await updateShipmentStatus('in_transit');
        break;
      case 'in_transit':
        setCurrentStage('at_delivery');
        toast.success('وصلت لموقع التسليم');
        break;
      case 'at_delivery':
        await updateShipmentStatus('delivered');
        toast.success('✅ تم التسليم بنجاح!');
        onComplete?.();
        break;
    }
  };

  const navigateTo = (address: string) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`, '_blank');
  };

  const currentInfo = STAGES[stageIndex];
  const Icon = currentInfo.icon;

  const actionLabels: Record<Stage, string> = {
    heading_pickup: 'وصلت للاستلام',
    at_pickup: 'بدء التحميل',
    in_transit: 'وصلت للتسليم',
    at_delivery: 'تأكيد التسليم',
  };

  return (
    <Card className="border-2 border-primary/30 shadow-lg overflow-hidden">
      {/* Progress bar */}
      <div className="h-1.5 bg-muted flex">
        {STAGES.map((_, i) => (
          <div
            key={i}
            className={cn('flex-1 transition-colors', i <= stageIndex ? 'bg-primary' : 'bg-transparent')}
          />
        ))}
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10', currentInfo.color)}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">{currentInfo.label}</h3>
              <p className="text-[10px] text-muted-foreground">شحنة #{shipmentNumber}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px]">
            {stageIndex + 1}/{STAGES.length}
          </Badge>
        </div>

        {/* Stages dots */}
        <div className="flex items-center justify-center gap-2">
          {STAGES.map((stage, i) => (
            <div key={stage.key} className="flex items-center gap-2">
              <div className={cn(
                'w-3 h-3 rounded-full border-2 transition-all',
                i < stageIndex ? 'bg-primary border-primary' :
                i === stageIndex ? 'bg-primary/20 border-primary scale-125' :
                'bg-muted border-border'
              )} />
              {i < STAGES.length - 1 && (
                <div className={cn('w-8 h-0.5', i < stageIndex ? 'bg-primary' : 'bg-border')} />
              )}
            </div>
          ))}
        </div>

        {/* Addresses */}
        <div className="space-y-2 p-3 rounded-xl bg-muted/30 border border-border/30">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground">الاستلام</p>
              <p className="text-xs truncate">{pickupAddress}</p>
            </div>
            {(currentStage === 'heading_pickup') && (
              <Button size="sm" variant="ghost" className="h-7 gap-1 text-[10px]" onClick={() => navigateTo(pickupAddress)}>
                <Navigation className="w-3 h-3" /> تنقل
              </Button>
            )}
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground">التسليم</p>
              <p className="text-xs truncate">{deliveryAddress}</p>
            </div>
            {(currentStage === 'in_transit') && (
              <Button size="sm" variant="ghost" className="h-7 gap-1 text-[10px]" onClick={() => navigateTo(deliveryAddress)}>
                <Navigation className="w-3 h-3" /> تنقل
              </Button>
            )}
          </div>
        </div>

        {/* Pricing */}
        {distanceKm > 0 && (
          <PricingBreakdown
            distanceKm={distanceKm}
            wasteType={wasteType}
            totalOverride={offeredPrice}
            compact
          />
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            className="flex-1 gap-2"
            size="lg"
            onClick={advanceStage}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
            {actionLabels[currentStage]}
          </Button>
          {currentStage === 'at_pickup' && (
            <Button variant="outline" size="lg" className="gap-1">
              <Camera className="w-4 h-4" /> توثيق
            </Button>
          )}
        </div>

        {/* Cancel */}
        {currentStage === 'heading_pickup' && (
          <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={onCancel}>
            إلغاء المهمة
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ShipmentLoadingMode;
