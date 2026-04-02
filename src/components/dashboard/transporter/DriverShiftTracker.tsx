import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, UserCheck, UserX, Clock, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

interface DriverOnDuty {
  id: string;
  name: string;
  status: string;
  vehiclePlate: string;
  activeShipments: number;
}

const DriverShiftTracker = () => {
  const { organization } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['driver-shift-tracker', organization?.id],
    queryFn: async () => {
      const orgId = organization!.id;

      // Get all drivers with profiles
      const { data: drivers } = await supabase
        .from('drivers')
        .select('id, is_available, status, vehicle_plate, vehicle_type, profile:profiles(full_name)')
        .eq('organization_id', orgId)
        .limit(50);

      const allDrivers = drivers || [];

      // Get active shipment counts per driver
      const driverIds = allDrivers.map(d => d.id);
      let shipmentCounts: Record<string, number> = {};

      if (driverIds.length > 0) {
        const { data: activeShipments } = await supabase
          .from('shipments')
          .select('driver_id')
          .eq('transporter_id', orgId)
          .in('status', ['collecting', 'in_transit'] as any)
          .in('driver_id', driverIds);

        (activeShipments || []).forEach(s => {
          if (s.driver_id) {
            shipmentCounts[s.driver_id] = (shipmentCounts[s.driver_id] || 0) + 1;
          }
        });
      }

      const onDuty: DriverOnDuty[] = [];
      const offDuty: DriverOnDuty[] = [];

      allDrivers.forEach(d => {
        const profile = Array.isArray(d.profile) ? d.profile[0] : d.profile;
        const driver: DriverOnDuty = {
          id: d.id,
          name: profile?.full_name || 'سائق',
          status: d.is_available ? 'on_duty' : 'off_duty',
          vehiclePlate: d.vehicle_plate || '',
          activeShipments: shipmentCounts[d.id] || 0,
        };

        if (d.is_available) {
          onDuty.push(driver);
        } else {
          offDuty.push(driver);
        }
      });

      return { onDuty, offDuty, total: allDrivers.length };
    },
    enabled: !!organization?.id,
    staleTime: 60000,
  });

  if (isLoading) {
    return <Skeleton className="h-36 w-full rounded-xl" />;
  }

  if (!data || data.total === 0) return null;

  return (
    <Card className="border-border/50 shadow-sm overflow-hidden">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10">
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="text-sm font-semibold">السائقون الآن</h3>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="default" className="text-[10px] bg-emerald-500/90">
              <UserCheck className="w-3 h-3 ml-0.5" />
              {data.onDuty.length} متاح
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              <UserX className="w-3 h-3 ml-0.5" />
              {data.offDuty.length} غير متاح
            </Badge>
          </div>
        </div>

        {/* On-duty drivers list */}
        {data.onDuty.length > 0 ? (
          <div className="space-y-1.5 max-h-40 overflow-y-auto scrollbar-hide">
            {data.onDuty.slice(0, 6).map((driver, i) => (
              <motion.button
                key={driver.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => navigate(`/dashboard/drivers/${driver.id}`)}
                className="w-full flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors text-right"
              >
                <Avatar className="w-7 h-7">
                  <AvatarFallback className="text-[10px] bg-emerald-500/20 text-emerald-700">
                    {driver.name.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{driver.name}</div>
                  {driver.vehiclePlate && (
                    <div className="text-[10px] text-muted-foreground">{driver.vehiclePlate}</div>
                  )}
                </div>
                {driver.activeShipments > 0 && (
                  <Badge variant="outline" className="text-[9px] shrink-0">
                    <MapPin className="w-2.5 h-2.5 ml-0.5" />
                    {driver.activeShipments} رحلة
                  </Badge>
                )}
                <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
              </motion.button>
            ))}
            {data.onDuty.length > 6 && (
              <button
                onClick={() => navigate('/dashboard/transporter-drivers')}
                className="w-full text-center text-[10px] text-primary hover:underline py-1"
              >
                عرض الكل ({data.onDuty.length} سائق)
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground text-xs">
            <Clock className="w-5 h-5 mx-auto mb-1 opacity-50" />
            لا يوجد سائقون متاحون حالياً
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DriverShiftTracker;
