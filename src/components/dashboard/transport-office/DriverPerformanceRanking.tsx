/**
 * ودجة ترتيب أداء السائقين — خاص بمكتب النقل
 * يعرض أفضل السائقين حسب الأداء
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Trophy, Star, TrendingUp, Medal } from 'lucide-react';
import { useTransportOfficeData } from '@/hooks/useTransportOfficeData';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const DriverPerformanceRanking = () => {
  const { organization } = useAuth();

  const { data: drivers } = useQuery({
    queryKey: ['driver-ranking', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      // جلب الشحنات المرتبطة بالمنظمة لتحليل أداء السائقين
      const { data: shipments } = await supabase
        .from('shipments')
        .select('driver_id, status, created_at')
        .eq('transporter_id', organization.id)
        .not('driver_id', 'is', null)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .limit(500);

      if (!shipments?.length) return [];

      // تجميع أداء السائقين
      const driverMap = new Map<string, { total: number; completed: number }>();
      shipments.forEach((s: any) => {
        if (!s.driver_id) return;
        const d = driverMap.get(s.driver_id) || { total: 0, completed: 0 };
        d.total++;
        if (['delivered', 'confirmed'].includes(s.status)) d.completed++;
        driverMap.set(s.driver_id, d);
      });

      // جلب أسماء السائقين
      const driverIds = Array.from(driverMap.keys());
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', driverIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p.full_name]));

      return Array.from(driverMap.entries())
        .map(([id, stats]) => ({
          id,
          name: profileMap.get(id) || 'سائق',
          trips: stats.total,
          completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
        }))
        .sort((a, b) => b.completionRate - a.completionRate || b.trips - a.trips)
        .slice(0, 5);
    },
    enabled: !!organization?.id,
    staleTime: 1000 * 60 * 10,
  });

  const medalColors = ['text-yellow-500', 'text-muted-foreground', 'text-amber-600'];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          ترتيب أداء السائقين
          <Badge variant="secondary" className="text-[9px] mr-auto">آخر 30 يوم</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!drivers?.length ? (
          <div className="text-center py-4">
            <Users className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">لا توجد بيانات سائقين</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {drivers.map((driver, i) => (
              <div key={driver.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                {i < 3 ? (
                  <Medal className={`h-4 w-4 ${medalColors[i]}`} />
                ) : (
                  <span className="text-xs text-muted-foreground w-4 text-center">{i + 1}</span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{driver.name}</p>
                  <p className="text-[9px] text-muted-foreground">{driver.trips} رحلة</p>
                </div>
                <Badge variant="outline" className={`text-[9px] border-0 ${
                  driver.completionRate >= 90 ? 'bg-green-500/10 text-green-700 dark:text-green-300' :
                  driver.completionRate >= 70 ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300' :
                  'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                }`}>
                  {driver.completionRate}%
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DriverPerformanceRanking;
