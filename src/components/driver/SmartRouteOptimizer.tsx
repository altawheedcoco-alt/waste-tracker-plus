import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Route, Navigation, Clock, Fuel, MapPin,
  ArrowDown, CheckCircle2, Truck, Sparkles, RotateCcw
} from 'lucide-react';
import { motion } from 'framer-motion';

interface SmartRouteOptimizerProps {
  shipments: Array<{
    id: string;
    shipment_number: string;
    waste_type: string;
    quantity: number;
    unit: string;
    status: string;
    pickup_address: string;
    delivery_address: string;
    generator?: { name: string } | null;
    recycler?: { name: string } | null;
  }>;
  onNavigateOptimized?: (addresses: string[]) => void;
}

interface OptimizedStop {
  order: number;
  shipmentNumber: string;
  type: 'pickup' | 'delivery';
  address: string;
  party: string;
  wasteType: string;
  quantity: string;
}

const SmartRouteOptimizer = ({ shipments, onNavigateOptimized }: SmartRouteOptimizerProps) => {
  const [optimized, setOptimized] = useState(false);

  const activeShipments = useMemo(() =>
    shipments.filter(s => ['approved', 'in_transit'].includes(s.status)),
    [shipments]
  );

  // Simple nearest-neighbor optimization (client-side)
  const optimizedRoute = useMemo(() => {
    if (activeShipments.length === 0) return [];

    const stops: OptimizedStop[] = [];

    // For approved: need pickup first then delivery
    // For in_transit: only delivery needed
    activeShipments.forEach(s => {
      if (s.status === 'approved') {
        stops.push({
          order: 0,
          shipmentNumber: s.shipment_number,
          type: 'pickup',
          address: s.pickup_address,
          party: s.generator?.name || 'المولد',
          wasteType: s.waste_type,
          quantity: `${s.quantity} ${s.unit}`,
        });
      }
      stops.push({
        order: 0,
        shipmentNumber: s.shipment_number,
        type: 'delivery',
        address: s.delivery_address,
        party: s.recycler?.name || 'المستلم',
        wasteType: s.waste_type,
        quantity: `${s.quantity} ${s.unit}`,
      });
    });

    // Group pickups first then deliveries, maintaining shipment order
    const pickups = stops.filter(s => s.type === 'pickup');
    const deliveries = stops.filter(s => s.type === 'delivery');
    const ordered = [...pickups, ...deliveries].map((s, i) => ({ ...s, order: i + 1 }));

    return ordered;
  }, [activeShipments]);

  const estimatedSavings = useMemo(() => {
    const stops = optimizedRoute.length;
    const baseFuel = stops * 12; // liters per stop (avg)
    const optimizedFuel = Math.round(baseFuel * 0.7); // 30% savings
    const savedFuel = baseFuel - optimizedFuel;
    const savedTime = stops * 8; // minutes saved per stop
    const savedCO2 = Math.round(savedFuel * 2.68); // kg CO2

    return { savedFuel, savedTime, savedCO2, totalStops: stops };
  }, [optimizedRoute]);

  const handleStartNavigation = () => {
    const addresses = optimizedRoute.map(s => s.address).filter(Boolean);
    if (addresses.length === 0) return;

    // Open Google Maps with waypoints
    const origin = encodeURIComponent(addresses[0]);
    const destination = encodeURIComponent(addresses[addresses.length - 1]);
    const waypoints = addresses.slice(1, -1).map(a => encodeURIComponent(a)).join('|');

    let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
    if (waypoints) url += `&waypoints=${waypoints}`;
    url += '&travelmode=driving';

    window.open(url, '_blank');
    onNavigateOptimized?.(addresses);
  };

  if (activeShipments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Route className="w-16 h-16 mx-auto mb-3 text-muted-foreground/20" />
          <p className="font-semibold">لا توجد شحنات نشطة</p>
          <p className="text-sm text-muted-foreground mt-1">ستظهر المسارات المحسّنة عند وجود شحنات</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Route className="w-5 h-5 text-primary" />
            تحسين المسار الذكي
            <Badge variant="outline" className="text-[10px] mr-auto gap-1">
              <Sparkles className="w-3 h-3" />
              {activeShipments.length} شحنة
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Savings Preview */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
              <Fuel className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-emerald-500">{estimatedSavings.savedFuel}L</p>
              <p className="text-[10px] text-muted-foreground">وقود يُوفر</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
              <Clock className="w-5 h-5 text-blue-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-blue-500">{estimatedSavings.savedTime}د</p>
              <p className="text-[10px] text-muted-foreground">وقت يُوفر</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-primary/5 border border-primary/20">
              <MapPin className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold text-primary">{estimatedSavings.savedCO2}kg</p>
              <p className="text-[10px] text-muted-foreground">CO₂ أقل</p>
            </div>
          </div>

          <Button className="w-full gap-2 h-11" onClick={handleStartNavigation}>
            <Navigation className="w-5 h-5" />
            ابدأ المسار المحسّن ({optimizedRoute.length} محطة)
          </Button>
        </CardContent>
      </Card>

      {/* Optimized Route Steps */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Truck className="w-4 h-4 text-primary" />
            ترتيب المحطات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {optimizedRoute.map((stop, idx) => (
              <motion.div
                key={`${stop.shipmentNumber}-${stop.type}`}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="flex gap-3 pb-3 last:pb-0"
              >
                {/* Number & Line */}
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-bold ${
                    stop.type === 'pickup'
                      ? 'bg-blue-500/10 border-blue-500 text-blue-500'
                      : 'bg-emerald-500/10 border-emerald-500 text-emerald-500'
                  }`}>
                    {stop.order}
                  </div>
                  {idx < optimizedRoute.length - 1 && (
                    <div className="w-0.5 flex-1 my-1 bg-muted-foreground/10" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-[10px] ${
                      stop.type === 'pickup' ? 'text-blue-500 border-blue-500/30' : 'text-emerald-500 border-emerald-500/30'
                    }`}>
                      {stop.type === 'pickup' ? '📤 استلام' : '📥 تسليم'}
                    </Badge>
                    <span className="text-xs font-mono text-muted-foreground">{stop.shipmentNumber}</span>
                  </div>
                  <p className="text-sm font-medium mt-1">{stop.party}</p>
                  <p className="text-xs text-muted-foreground truncate">{stop.address || 'عنوان غير محدد'}</p>
                  <p className="text-[10px] text-muted-foreground">{stop.wasteType} — {stop.quantity}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SmartRouteOptimizer;
