/**
 * الخط الزمني لسجل العمليات الرقابية
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, ShieldCheck, Package, UserCheck, AlertTriangle, FileText, Settings, Eye } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

const ACTION_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  create: { icon: Package, color: 'text-emerald-500', label: 'إنشاء' },
  update: { icon: Settings, color: 'text-blue-500', label: 'تحديث' },
  delete: { icon: AlertTriangle, color: 'text-red-500', label: 'حذف' },
  approve: { icon: ShieldCheck, color: 'text-emerald-600', label: 'اعتماد' },
  reject: { icon: AlertTriangle, color: 'text-red-500', label: 'رفض' },
  verify: { icon: UserCheck, color: 'text-blue-600', label: 'توثيق' },
  view: { icon: Eye, color: 'text-muted-foreground', label: 'عرض' },
  login: { icon: UserCheck, color: 'text-purple-500', label: 'دخول' },
  export: { icon: FileText, color: 'text-amber-500', label: 'تصدير' },
};

const SovereignAuditTimeline = () => {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['sovereign-audit-timeline'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('id, action, action_type, resource_type, created_at, details')
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 15_000,
  });

  if (isLoading) {
    return <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="h-12 rounded-lg bg-muted/30 animate-pulse" />
    ))}</div>;
  }

  // Group by day
  const grouped: Record<string, typeof logs> = {};
  (logs || []).forEach(log => {
    const day = format(new Date(log.created_at), 'yyyy-MM-dd');
    if (!grouped[day]) grouped[day] = [];
    grouped[day]!.push(log);
  });

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center gap-2">
        <History className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-bold">سجل العمليات الرقابية</h3>
        <Badge variant="secondary" className="text-[10px]">{logs?.length || 0} عملية</Badge>
      </div>

      <ScrollArea className="h-[500px]">
        <div className="space-y-4">
          {Object.entries(grouped).map(([day, dayLogs]) => (
            <div key={day}>
              <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-1 mb-2">
                <Badge variant="outline" className="text-[10px]">
                  {format(new Date(day), 'EEEE dd MMMM', { locale: ar })}
                </Badge>
              </div>
              <div className="relative pr-4 border-r-2 border-border/50 space-y-1">
                {(dayLogs || []).map(log => {
                  const actionCfg = ACTION_CONFIG[log.action_type] || ACTION_CONFIG.update;
                  const Icon = actionCfg.icon;
                  return (
                    <div key={log.id} className="relative flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                      {/* Timeline dot */}
                      <div className={`absolute -right-[1.35rem] top-3 w-2.5 h-2.5 rounded-full border-2 border-background ${actionCfg.color.replace('text-', 'bg-')}`} />
                      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${actionCfg.color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{log.action}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {log.resource_type && (
                            <Badge variant="outline" className="text-[9px] h-4">{log.resource_type}</Badge>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ar })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {(!logs || logs.length === 0) && (
            <Card>
              <CardContent className="p-6 text-center">
                <History className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">لا توجد عمليات مسجلة حتى الآن</p>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default SovereignAuditTimeline;
