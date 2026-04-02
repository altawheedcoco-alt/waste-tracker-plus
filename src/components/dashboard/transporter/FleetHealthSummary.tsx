import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, CheckCircle2, AlertTriangle, Wrench, Fuel, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

interface VehicleStatus {
  total: number;
  active: number;
  maintenance: number;
  idle: number;
  avgFuelEfficiency: number;
}

const FleetHealthSummary = () => {
  const { organization } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['fleet-health-summary', organization?.id],
    queryFn: async () => {
      const orgId = organization!.id;

      // Get drivers (each driver = a vehicle in the fleet)
      const { data: drivers } = await supabase
        .from('drivers')
        .select('id, vehicle_type, vehicle_plate, is_available, is_verified')
        .eq('organization_id', orgId);

      const allDrivers = drivers || [];
      const active = allDrivers.filter(d => d.is_available === true).length;
      const maintenance = allDrivers.filter(d => d.is_available === false && d.is_verified === false).length;

      // Get today's active shipments for fleet utilization
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: activeTrips } = await supabase
        .from('shipments')
        .select('id', { count: 'exact', head: true })
        .eq('transporter_id', orgId)
        .in('status', ['collecting', 'in_transit'] as any)
        .gte('created_at', today.toISOString());

      return {
        total: allDrivers.length,
        active,
        maintenance,
        idle: allDrivers.length - active - maintenance,
        activeTrips: activeTrips || 0,
        utilization: allDrivers.length > 0 ? Math.round((active / allDrivers.length) * 100) : 0,
      };
    },
    enabled: !!organization?.id,
    staleTime: 120000,
  });

  if (isLoading) {
    return <Skeleton className="h-32 w-full rounded-xl" />;
  }

  if (!data || data.total === 0) return null;

  const items = [
    { label: 'إجمالي الأسطول', value: data.total, icon: Truck, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'نشط', value: data.active, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
    { label: 'في الصيانة', value: data.maintenance, icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-500/10' },
    { label: 'خامل', value: data.idle, icon: AlertTriangle, color: 'text-muted-foreground', bg: 'bg-muted/50' },
  ];

  return (
    <Card className="border-border/50 shadow-sm overflow-hidden">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-sm font-semibold">صحة الأسطول</h3>
          </div>
          <Badge variant="outline" className="text-[10px]">
            استخدام {data.utilization}%
          </Badge>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate('/dashboard/drivers')}
                className={`${item.bg} rounded-lg p-2 text-center hover:scale-[1.02] transition-transform`}
              >
                <Icon className={`w-4 h-4 ${item.color} mx-auto mb-1`} />
                <div className={`text-lg font-bold ${item.color}`}>{item.value}</div>
                <div className="text-[9px] text-muted-foreground leading-tight">{item.label}</div>
              </motion.button>
            );
          })}
        </div>

        {/* Utilization bar */}
        <div className="mt-3">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>معدل التشغيل</span>
            <span>{data.activeTrips} رحلة نشطة</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${data.utilization}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FleetHealthSummary;
