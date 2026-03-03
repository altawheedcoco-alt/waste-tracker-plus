import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Route, MapPin, Clock, Fuel, TrendingDown, Loader2,
  ArrowDown, CheckCircle2, Navigation, Truck
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

interface OptimizedStop {
  shipment_id: string;
  shipment_number: string;
  address: string;
  lat: number;
  lng: number;
  waste_type: string;
  quantity: number;
  originalOrder: number;
  optimizedOrder: number;
  distanceFromPrev?: number;
}

const SmartRouteOptimizerPanel = () => {
  const { organization } = useAuth();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedStop[] | null>(null);

  const { data: pendingShipments } = useQuery({
    queryKey: ['pending-shipments-for-route', organization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipments')
        .select('id, shipment_number, pickup_address, pickup_latitude, pickup_longitude, waste_type, quantity, delivery_address')
        .eq('transporter_id', organization!.id)
        .in('status', ['approved', 'collecting', 'in_transit'])
        .not('pickup_latitude', 'is', null)
        .not('pickup_longitude', 'is', null)
        .order('created_at')
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id,
  });

  // Simple nearest-neighbor route optimization
  const optimizeRoute = () => {
    if (!pendingShipments || pendingShipments.length < 2) {
      toast.info('تحتاج شحنتين على الأقل لتحسين المسار');
      return;
    }

    setIsOptimizing(true);

    setTimeout(() => {
      const stops: OptimizedStop[] = pendingShipments.map((s, i) => ({
        shipment_id: s.id,
        shipment_number: s.shipment_number || `SHP-${i}`,
        address: s.pickup_address || 'غير محدد',
        lat: s.pickup_latitude!,
        lng: s.pickup_longitude!,
        waste_type: s.waste_type || '',
        quantity: s.quantity || 0,
        originalOrder: i,
        optimizedOrder: 0,
      }));

      // Nearest neighbor algorithm
      const visited = new Set<number>();
      const route: OptimizedStop[] = [];
      let current = 0;
      visited.add(0);
      route.push({ ...stops[0], optimizedOrder: 0 });

      while (route.length < stops.length) {
        let nearest = -1;
        let nearestDist = Infinity;

        for (let i = 0; i < stops.length; i++) {
          if (visited.has(i)) continue;
          const dist = haversine(stops[current].lat, stops[current].lng, stops[i].lat, stops[i].lng);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearest = i;
          }
        }

        if (nearest >= 0) {
          visited.add(nearest);
          route.push({
            ...stops[nearest],
            optimizedOrder: route.length,
            distanceFromPrev: Math.round(nearestDist * 10) / 10,
          });
          current = nearest;
        }
      }

      setOptimizedRoute(route);
      setIsOptimizing(false);

      const originalDist = calcTotalDistance(stops);
      const optimizedDist = calcTotalDistance(route);
      const savings = Math.round(((originalDist - optimizedDist) / originalDist) * 100);

      if (savings > 0) {
        toast.success(`تحسين المسار وفر ${savings}% من المسافة 🎯`);
      }
    }, 1500);
  };

  const haversine = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const calcTotalDistance = (stops: OptimizedStop[]): number => {
    let total = 0;
    for (let i = 1; i < stops.length; i++) {
      total += haversine(stops[i - 1].lat, stops[i - 1].lng, stops[i].lat, stops[i].lng);
    }
    return total;
  };

  const originalDist = pendingShipments && pendingShipments.length > 1
    ? calcTotalDistance(pendingShipments.filter(s => s.pickup_latitude && s.pickup_longitude).map((s, i) => ({
        shipment_id: s.id, shipment_number: '', address: '', lat: s.pickup_latitude!, lng: s.pickup_longitude!,
        waste_type: '', quantity: 0, originalOrder: i, optimizedOrder: i,
      })))
    : 0;

  const optimizedDist = optimizedRoute ? calcTotalDistance(optimizedRoute) : 0;
  const savingsPercent = originalDist > 0 ? Math.round(((originalDist - optimizedDist) / originalDist) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Route className="w-5 h-5 text-primary" />
            تحسين المسارات الذكي
          </h3>
          <p className="text-sm text-muted-foreground">تجميع الشحنات المتقاربة جغرافياً لتقليل المسافة والوقود</p>
        </div>
        <Button onClick={optimizeRoute} disabled={isOptimizing || !pendingShipments?.length} className="gap-2">
          {isOptimizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Route className="w-4 h-4" />}
          {isOptimizing ? 'جاري التحسين...' : 'تحسين المسار'}
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 text-center">
            <Truck className="w-5 h-5 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold">{pendingShipments?.length || 0}</p>
            <p className="text-xs text-muted-foreground">شحنات معلقة</p>
          </CardContent>
        </Card>
        {optimizedRoute && (
          <>
            <Card>
              <CardContent className="pt-4 text-center">
                <TrendingDown className="w-5 h-5 mx-auto text-emerald-500 mb-1" />
                <p className="text-2xl font-bold text-emerald-600">{savingsPercent}%</p>
                <p className="text-xs text-muted-foreground">توفير بالمسافة</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <Fuel className="w-5 h-5 mx-auto text-amber-500 mb-1" />
                <p className="text-2xl font-bold">{Math.round(optimizedDist)} كم</p>
                <p className="text-xs text-muted-foreground">المسافة المحسنة</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Optimized Route Display */}
      {optimizedRoute && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Navigation className="w-4 h-4 text-primary" />
              ترتيب الجمع المحسن
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {optimizedRoute.map((stop, i) => (
                <div key={stop.shipment_id} className="flex items-start gap-3 relative">
                  {/* Timeline */}
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      {i + 1}
                    </div>
                    {i < optimizedRoute.length - 1 && (
                      <div className="w-px h-10 bg-border" />
                    )}
                  </div>

                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{stop.shipment_number}</p>
                      {stop.distanceFromPrev && (
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <MapPin className="w-2.5 h-2.5" /> {stop.distanceFromPrev} كم
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{stop.address}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="secondary" className="text-[10px]">{stop.waste_type}</Badge>
                      <span className="text-[10px] text-muted-foreground">{stop.quantity} طن</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              className="w-full mt-2 gap-2"
              onClick={() => {
                if (optimizedRoute.length > 0) {
                  const { lat, lng } = optimizedRoute[0];
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`, '_blank');
                }
              }}
            >
              <Navigation className="w-4 h-4" />
              بدء الملاحة بالترتيب المحسن
            </Button>
          </CardContent>
        </Card>
      )}

      {!optimizedRoute && pendingShipments && pendingShipments.length > 0 && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Route className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">اضغط "تحسين المسار" لحساب أفضل ترتيب للجمع</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SmartRouteOptimizerPanel;
