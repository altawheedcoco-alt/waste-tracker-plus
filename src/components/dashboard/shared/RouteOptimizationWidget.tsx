import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Route, Fuel, Clock, Leaf, ChevronLeft, MapPin, Truck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const RouteOptimizationWidget: React.FC = () => {
  const { organization } = useAuth();
  const navigate = useNavigate();

  const { data: stats } = useQuery({
    queryKey: ['route-stats', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;

      // Get active shipments with driver assigned
      const { data: activeShipments } = await (supabase
        .from('shipments' as any)
        .select('id, driver_id, status, pickup_latitude, pickup_longitude, delivery_latitude, delivery_longitude')
        .eq('organization_id', organization.id)
        .in('status', ['approved', 'collecting', 'in_transit']) as any)
        .not('driver_id', 'is', null)
        .limit(100);

      if (!activeShipments) return { activeRoutes: 0, totalKm: 0, driversOnRoad: 0, potentialSavings: 0 };

      const uniqueDrivers = new Set(activeShipments.map(s => s.driver_id).filter(Boolean));
      
      // Estimate distances
      let totalKm = 0;
      for (const s of activeShipments) {
        if (s.pickup_latitude && s.delivery_latitude) {
          const R = 6371;
          const dLat = ((s.delivery_latitude - s.pickup_latitude) * Math.PI) / 180;
          const dLon = ((s.delivery_longitude! - s.pickup_longitude!) * Math.PI) / 180;
          const a = Math.sin(dLat / 2) ** 2 +
            Math.cos((s.pickup_latitude * Math.PI) / 180) *
            Math.cos((s.delivery_latitude * Math.PI) / 180) *
            Math.sin(dLon / 2) ** 2;
          totalKm += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1.3;
        } else {
          totalKm += 30; // default
        }
      }

      // Estimate 15-25% savings potential
      const potentialSavings = Math.round(totalKm * 0.2);

      return {
        activeRoutes: activeShipments.length,
        totalKm: Math.round(totalKm),
        driversOnRoad: uniqueDrivers.size,
        potentialSavings,
      };
    },
    enabled: !!organization?.id,
  });

  if (!stats) return null;

  return (
    <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/30 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/20">
      <CardHeader className="pb-2 px-4 pt-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <Badge variant="outline" className="text-[9px] h-4 px-1.5 text-blue-700 border-blue-300">
            {stats.driversOnRoad} سائق نشط
          </Badge>
          <div className="flex items-center gap-1.5">
            <span>تحسين المسارات</span>
            <Route className="h-4 w-4 text-blue-600" />
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="px-4 pb-3 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-background/60 rounded-lg p-2 border border-blue-100 dark:border-blue-900/50 text-center">
            <Truck className="w-4 h-4 text-blue-500 mx-auto mb-0.5" />
            <div className="text-sm font-bold">{stats.activeRoutes}</div>
            <p className="text-[8px] text-muted-foreground">مسار نشط</p>
          </div>
          <div className="bg-background/60 rounded-lg p-2 border border-blue-100 dark:border-blue-900/50 text-center">
            <MapPin className="w-4 h-4 text-indigo-500 mx-auto mb-0.5" />
            <div className="text-sm font-bold">{stats.totalKm} كم</div>
            <p className="text-[8px] text-muted-foreground">إجمالي المسافة</p>
          </div>
        </div>

        {stats.potentialSavings > 0 && (
          <div className="bg-emerald-50/60 dark:bg-emerald-950/20 rounded-lg p-2.5 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Leaf className="w-4 h-4 text-emerald-600" />
                <div>
                  <p className="text-[10px] font-semibold text-emerald-700">وفورات محتملة</p>
                  <p className="text-xs font-bold text-emerald-800">~{stats.potentialSavings} كم</p>
                </div>
              </div>
              <div className="text-left">
                <p className="text-[10px] text-emerald-600">≈ {Math.round(stats.potentialSavings * 0.12)} لتر وقود</p>
                <p className="text-[10px] text-emerald-600">≈ {(stats.potentialSavings * 0.000062 * 20).toFixed(1)} كجم CO₂</p>
              </div>
            </div>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full text-[10px] h-7 border-blue-300 text-blue-700 hover:bg-blue-50"
          onClick={() => navigate('/dashboard/fleet-tracking')}
        >
          <ChevronLeft className="h-3 w-3 ml-1" />
          تتبع الأسطول والمسارات
        </Button>
      </CardContent>
    </Card>
  );
};

export default RouteOptimizationWidget;
