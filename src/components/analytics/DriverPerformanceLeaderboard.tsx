/**
 * DriverPerformanceLeaderboard — لوحة تصنيف السائقين
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Star, Truck, Clock, CheckCircle2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DriverStats {
  id: string;
  name: string;
  totalShipments: number;
  completedShipments: number;
  avgDeliveryDays: number;
  completionRate: number;
  rank: number;
}

export default function DriverPerformanceLeaderboard() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['driver-leaderboard', orgId],
    queryFn: async () => {
      if (!orgId) return [];

      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const { data: shipments } = await supabase
        .from('shipments')
        .select('driver_id, status, created_at, delivered_at')
        .eq('transporter_id', orgId)
        .gte('created_at', threeMonthsAgo.toISOString())
        .not('driver_id', 'is', null);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name');

      const profileMap = new Map((profiles || []).map(p => [p.id, p.full_name]));
      const driverMap = new Map<string, { total: number; completed: number; totalDays: number; deliveredCount: number }>();

      (shipments || []).forEach(s => {
        if (!s.driver_id) return;
        const d = driverMap.get(s.driver_id) || { total: 0, completed: 0, totalDays: 0, deliveredCount: 0 };
        d.total++;
        if (s.status === 'delivered') {
          d.completed++;
          if (s.delivered_at && s.created_at) {
            const days = (new Date(s.delivered_at).getTime() - new Date(s.created_at).getTime()) / (1000 * 60 * 60 * 24);
            d.totalDays += days;
            d.deliveredCount++;
          }
        }
        driverMap.set(s.driver_id, d);
      });

      const drivers: DriverStats[] = Array.from(driverMap.entries())
        .map(([id, stats]) => ({
          id,
          name: profileMap.get(id) || 'سائق',
          totalShipments: stats.total,
          completedShipments: stats.completed,
          avgDeliveryDays: stats.deliveredCount > 0 ? Math.round((stats.totalDays / stats.deliveredCount) * 10) / 10 : 0,
          completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
          rank: 0,
        }))
        .sort((a, b) => b.completionRate - a.completionRate || b.completedShipments - a.completedShipments)
        .map((d, i) => ({ ...d, rank: i + 1 }))
        .slice(0, 8);

      return drivers;
    },
    enabled: !!orgId,
    staleTime: 15 * 60 * 1000,
  });

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-4 w-4 text-gray-400" />;
    if (rank === 3) return <Medal className="h-4 w-4 text-amber-600" />;
    return <span className="text-xs text-muted-foreground w-4 text-center">{rank}</span>;
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="h-5 w-5 text-primary" />
          تصنيف أداء السائقين
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[280px] bg-muted/20 rounded animate-pulse" />
        ) : data?.length ? (
          <div className="space-y-2">
            {data.map(driver => (
              <div key={driver.id} className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${driver.rank <= 3 ? 'bg-primary/5' : 'hover:bg-muted/30'}`}>
                <div className="flex-shrink-0 w-6 flex justify-center">{getRankIcon(driver.rank)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{driver.name}</p>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-0.5"><Truck className="h-3 w-3" />{driver.totalShipments}</span>
                    <span className="flex items-center gap-0.5"><CheckCircle2 className="h-3 w-3" />{driver.completedShipments}</span>
                    {driver.avgDeliveryDays > 0 && (
                      <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{driver.avgDeliveryDays} يوم</span>
                    )}
                  </div>
                </div>
                <Badge variant={driver.completionRate >= 90 ? 'default' : driver.completionRate >= 70 ? 'secondary' : 'destructive'} className="text-[10px]">
                  {driver.completionRate}%
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">لا توجد بيانات كافية</div>
        )}
      </CardContent>
    </Card>
  );
}
