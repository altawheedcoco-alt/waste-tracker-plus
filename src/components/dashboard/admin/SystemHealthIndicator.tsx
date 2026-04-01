/**
 * مؤشر صحة النظام الحي — يعرض حالة النظام والمستخدمين النشطين وآخر نشاط
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Activity, Users, Clock, Wifi } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

const SystemHealthIndicator = () => {
  const { isRTL } = useLanguage();

  const { data } = useQuery({
    queryKey: ['system-health-indicator'],
    queryFn: async () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const [recentActivity, activeUsers, lastShipment] = await Promise.all([
        supabase
          .from('activity_logs')
          .select('created_at')
          .order('created_at', { ascending: false })
          .limit(1),
        supabase
          .from('activity_logs')
          .select('user_id', { count: 'exact', head: true })
          .gte('created_at', fiveMinAgo),
        supabase
          .from('shipments')
          .select('created_at')
          .order('created_at', { ascending: false })
          .limit(1),
      ]);

      const lastActivityTime = recentActivity.data?.[0]?.created_at;
      const isHealthy = lastActivityTime && (Date.now() - new Date(lastActivityTime).getTime()) < 10 * 60 * 1000;

      return {
        isHealthy,
        activeUsersCount: activeUsers.count ?? 0,
        lastActivity: lastActivityTime,
        lastShipment: lastShipment.data?.[0]?.created_at,
      };
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  if (!data) return null;

  const formatTime = (isoStr: string | null | undefined) => {
    if (!isoStr) return isRTL ? 'لا يوجد' : 'N/A';
    return formatDistanceToNow(new Date(isoStr), { addSuffix: true, locale: isRTL ? ar : undefined });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap text-[11px]">
      {/* حالة النظام */}
      <Badge variant={data.isHealthy ? 'default' : 'destructive'} className="gap-1 text-[10px] h-5">
        <Wifi className="w-3 h-3" />
        {data.isHealthy ? (isRTL ? 'النظام يعمل' : 'System OK') : (isRTL ? 'بطيء' : 'Slow')}
      </Badge>

      {/* المستخدمون النشطون */}
      <span className="flex items-center gap-1 text-muted-foreground">
        <Users className="w-3 h-3" />
        <span className="font-medium text-foreground">{data.activeUsersCount}</span>
        {isRTL ? 'نشط' : 'active'}
      </span>

      {/* آخر نشاط */}
      <span className="flex items-center gap-1 text-muted-foreground">
        <Clock className="w-3 h-3" />
        {formatTime(data.lastActivity)}
      </span>
    </div>
  );
};

export default SystemHealthIndicator;
