import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock, Bell, TrendingUp, FileWarning } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface SmartAlert {
  id: string;
  type: 'warning' | 'info' | 'success' | 'critical';
  title: string;
  description: string;
  time: string;
}

const ALERT_STYLES = {
  critical: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800' },
  warning: { icon: FileWarning, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800' },
  info: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800' },
  success: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800' },
};

const SmartAlertsWidget = () => {
  const { user, organization } = useAuth();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['smart-alerts', organization?.id],
    enabled: !!organization?.id,
    queryFn: async (): Promise<SmartAlert[]> => {
      const results: SmartAlert[] = [];

      // 1) Pending shipments (waiting too long)
      const { data: pendingShipments } = await supabase
        .from('shipments')
        .select('id, created_at, status')
        .eq('generator_id', organization!.id)
        .in('status', ['new', 'approved'])
        .order('created_at', { ascending: true })
        .limit(3);

      (pendingShipments || []).forEach(s => {
        const hours = (Date.now() - new Date(s.created_at).getTime()) / (1000 * 60 * 60);
        if (hours > 48) {
          results.push({
            id: `pending-${s.id}`,
            type: 'warning',
            title: 'شحنة معلقة',
            description: `شحنة في حالة "${s.status === 'new' ? 'جديدة' : 'معتمدة'}" منذ ${Math.round(hours)} ساعة`,
            time: s.created_at,
          });
        }
      });

      // 2) Recent completed shipments
      const { data: completedRecent } = await supabase
        .from('shipments')
        .select('id, updated_at, quantity')
        .eq('generator_id', organization!.id)
        .eq('status', 'confirmed')
        .order('updated_at', { ascending: false })
        .limit(2);

      (completedRecent || []).forEach(s => {
        results.push({
          id: `done-${s.id}`,
          type: 'success',
          title: 'شحنة مكتملة',
          description: `تم تأكيد شحنة بكمية ${s.quantity || 0} طن`,
          time: s.updated_at,
        });
      });

      // 3) Unread notifications
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('is_read', false);

      if ((count || 0) > 5) {
        results.push({
          id: 'unread-notifs',
          type: 'info',
          title: 'إشعارات غير مقروءة',
          description: `لديك ${count} إشعار غير مقروء`,
          time: new Date().toISOString(),
        });
      }

      return results.sort((a, b) => {
        const priority = { critical: 0, warning: 1, info: 2, success: 3 };
        return priority[a.type] - priority[b.type];
      }).slice(0, 5);
    },
    staleTime: 2 * 60 * 1000,
  });

  if (isLoading) {
    return <Card><CardContent className="p-4"><Skeleton className="h-32" /></CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          التنبيهات الذكية
          {alerts.length > 0 && (
            <Badge variant="destructive" className="text-[10px] h-5">{alerts.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.length === 0 ? (
          <div className="text-center py-4">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">كل شيء على ما يرام! لا توجد تنبيهات</p>
          </div>
        ) : (
          alerts.map(alert => {
            const style = ALERT_STYLES[alert.type];
            const Icon = style.icon;
            return (
              <div key={alert.id} className={`flex items-start gap-2.5 p-2.5 rounded-lg border ${style.bg} ${style.border}`}>
                <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${style.color}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold">{alert.title}</p>
                  <p className="text-[11px] text-muted-foreground">{alert.description}</p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {formatDistanceToNow(new Date(alert.time), { addSuffix: true, locale: ar })}
                </span>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};

export default SmartAlertsWidget;
