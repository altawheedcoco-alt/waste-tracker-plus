/**
 * LiveAlertsDashboard — لوحة التنبيهات الحية
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, AlertTriangle, Info, CheckCircle2, X, Filter } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

type AlertLevel = 'critical' | 'warning' | 'info' | 'success';

interface LiveAlert {
  id: string;
  level: AlertLevel;
  title: string;
  description: string;
  time: string;
  category: string;
}

const LEVEL_STYLES: Record<AlertLevel, { icon: typeof AlertTriangle; color: string; bg: string }> = {
  critical: { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
  warning: { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-500/10' },
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  success: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
};

export default function LiveAlertsDashboard() {
  const { user, organization } = useAuth();
  const [filter, setFilter] = useState<AlertLevel | 'all'>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['live-alerts', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: notifs } = await supabase
        .from('notifications')
        .select('id, title, message, type, priority, created_at, is_read')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      return (notifs || []).map(n => {
        let level: AlertLevel = 'info';
        if (n.priority === 'urgent' || n.type?.includes('alert') || n.type?.includes('overdue')) level = 'critical';
        else if (n.priority === 'high' || n.type?.includes('warning') || n.type?.includes('expir')) level = 'warning';
        else if (n.type?.includes('success') || n.type?.includes('complete') || n.type?.includes('confirm')) level = 'success';

        const timeAgo = getTimeAgo(new Date(n.created_at));

        return {
          id: n.id,
          level,
          title: n.title || 'تنبيه',
          description: n.message || '',
          time: timeAgo,
          category: n.type || 'عام',
        } as LiveAlert;
      });
    },
    enabled: !!user,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  const filtered = data?.filter(a => filter === 'all' || a.level === filter) || [];
  const counts = {
    critical: data?.filter(a => a.level === 'critical').length || 0,
    warning: data?.filter(a => a.level === 'warning').length || 0,
    info: data?.filter(a => a.level === 'info').length || 0,
    success: data?.filter(a => a.level === 'success').length || 0,
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-5 w-5 text-primary" />
            التنبيهات الحية
          </CardTitle>
          {counts.critical > 0 && (
            <Badge variant="destructive" className="animate-pulse text-xs">{counts.critical} عاجل</Badge>
          )}
        </div>
        {/* Filters */}
        <div className="flex items-center gap-1 mt-2">
          {(['all', 'critical', 'warning', 'info', 'success'] as const).map(f => (
            <Button key={f} variant={filter === f ? 'default' : 'ghost'} size="sm"
              className="h-6 text-[10px] px-2" onClick={() => setFilter(f)}>
              {f === 'all' ? 'الكل' : f === 'critical' ? `حرج (${counts.critical})` :
               f === 'warning' ? `تحذير (${counts.warning})` : f === 'info' ? `معلومات` : `نجاح`}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[200px] bg-muted/20 rounded animate-pulse" />
        ) : filtered.length ? (
          <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
            {filtered.map(alert => {
              const style = LEVEL_STYLES[alert.level];
              const Icon = style.icon;
              return (
                <div key={alert.id} className={`flex items-start gap-2 p-2 rounded-lg ${style.bg} transition-colors`}>
                  <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${style.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{alert.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{alert.description}</p>
                  </div>
                  <span className="text-[9px] text-muted-foreground flex-shrink-0">{alert.time}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
            <p className="text-sm text-muted-foreground">لا توجد تنبيهات</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `${mins} د`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} س`;
  const days = Math.floor(hours / 24);
  return `${days} ي`;
}
