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

      // جلب السائقين المرتبطين بالمكتب
      const { data: links } = await supabase
        .from('driver_organization_links')
        .select('driver_id, profiles!driver_organization_links_driver_id_fkey(id, full_name, avatar_url)')
        .eq('organization_id', organization.id)
        .eq('status', 'active')
        .limit(10);

      if (!links?.length) return [];

      // حساب أداء كل سائق
      const rankings = await Promise.all(
        links.map(async (link: any) => {
          const { count: totalTrips } = await supabase
            .from('shipments')
            .select('*', { count: 'exact', head: true })
            .eq('driver_id', link.driver_id)
            .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

          const { count: completedTrips } = await supabase
            .from('shipments')
            .select('*', { count: 'exact', head: true })
            .eq('driver_id', link.driver_id)
            .in('status', ['delivered', 'confirmed'])
            .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

          const rate = (totalTrips || 0) > 0 ? Math.round(((completedTrips || 0) / (totalTrips || 1)) * 100) : 0;

          return {
            id: link.driver_id,
            name: (link.profiles as any)?.full_name || 'سائق',
            trips: totalTrips || 0,
            completionRate: rate,
          };
        })
      );

      return rankings.sort((a, b) => b.completionRate - a.completionRate || b.trips - a.trips).slice(0, 5);
    },
    enabled: !!organization?.id,
    staleTime: 1000 * 60 * 10,
  });

  const medalColors = ['text-yellow-500', 'text-gray-400', 'text-amber-600'];

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
