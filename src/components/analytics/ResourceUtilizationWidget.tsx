/**
 * ResourceUtilizationWidget — استغلال الموارد
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Cpu, Users, Truck, Package } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function ResourceUtilizationWidget() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['resource-utilization', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [membersRes, driversRes, shipmentsRes, positionsRes] = await Promise.all([
        supabase.from('user_organizations').select('id', { count: 'exact', head: true }).eq('organization_id', orgId!),
        supabase.from('shipments').select('driver_id').or(`transporter_id.eq.${orgId}`).not('driver_id', 'is', null)
          .gte('created_at', thirtyDaysAgo.toISOString()),
        supabase.from('shipments').select('id', { count: 'exact', head: true })
          .or(`generator_id.eq.${orgId},recycler_id.eq.${orgId},transporter_id.eq.${orgId}`)
          .gte('created_at', thirtyDaysAgo.toISOString()),
        supabase.from('organization_positions').select('id', { count: 'exact', head: true }).eq('organization_id', orgId!),
      ]);

      const activeDrivers = new Set((driversRes.data || []).map(d => d.driver_id)).size;
      return {
        totalMembers: membersRes.count || 0,
        activeDrivers,
        monthlyShipments: shipmentsRes.count || 0,
        totalVehicles: positionsRes.count || 0,
      };
    },
  });

  const metrics = useMemo(() => {
    if (!data) return [];
    return [
      {
        label: 'أعضاء الفريق',
        icon: Users,
        value: data.totalMembers,
        capacity: Math.max(data.totalMembers, 10),
        usage: Math.min(100, Math.round((data.totalMembers / Math.max(data.totalMembers, 10)) * 100)),
      },
      {
        label: 'السائقون النشطون',
        icon: Truck,
        value: data.activeDrivers,
        capacity: Math.max(data.totalMembers, 5),
        usage: data.totalMembers > 0 ? Math.min(100, Math.round((data.activeDrivers / data.totalMembers) * 100)) : 0,
      },
      {
        label: 'الشحنات/شهر',
        icon: Package,
        value: data.monthlyShipments,
        capacity: Math.max(data.monthlyShipments, 50),
        usage: Math.min(100, Math.round((data.monthlyShipments / Math.max(data.monthlyShipments, 50)) * 100)),
      },
      {
        label: 'المركبات',
        icon: Cpu,
        value: data.totalVehicles,
        capacity: Math.max(data.totalVehicles, 5),
        usage: Math.min(100, Math.round((data.totalVehicles / Math.max(data.totalVehicles, 5)) * 100)),
      },
    ];
  }, [data]);

  if (isLoading) return <Skeleton className="h-[280px] w-full rounded-xl" />;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Cpu className="h-5 w-5 text-primary" />
          استغلال الموارد
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {metrics.map((m, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <m.icon className="h-3.5 w-3.5 text-primary" />
                  <span>{m.label}</span>
                </div>
                <span className="font-medium">{m.value}</span>
              </div>
              <Progress value={m.usage} className="h-1.5" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
