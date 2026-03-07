import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useGovernanceAlerts } from '@/hooks/useGovernance';
import { Loader2, AlertTriangle, CheckCircle2, Shield, Lock, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const ALERT_TYPE_LABELS: Record<string, { label: string; icon: any }> = {
  unauthorized_access: { label: 'وصول غير مصرح', icon: Lock },
  policy_violation: { label: 'مخالفة سياسة', icon: Shield },
  segregation_breach: { label: 'خرق فصل المهام', icon: AlertTriangle },
  approval_timeout: { label: 'تجاوز مهلة الموافقة', icon: Clock },
};

const SEVERITY_STYLES: Record<string, string> = {
  info: 'border-blue-200 bg-blue-50/50 dark:bg-blue-950/20',
  warning: 'border-amber-200 bg-amber-50/50 dark:bg-amber-950/20',
  critical: 'border-red-300 bg-red-50/50 dark:bg-red-950/20',
};

export default function GovernanceAlertsTab() {
  const { alerts, isLoading, resolveAlert } = useGovernanceAlerts();

  const unresolved = alerts.filter(a => !a.is_resolved);
  const resolved = alerts.filter(a => a.is_resolved);

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="space-y-6 mt-4">
      <div>
        <h3 className="text-lg font-bold flex items-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          تنبيهات نشطة ({unresolved.length})
        </h3>
        {unresolved.length === 0 && (
          <Card><CardContent className="py-8 text-center text-muted-foreground flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" /> لا توجد تنبيهات نشطة
          </CardContent></Card>
        )}
        <div className="space-y-2">
          {unresolved.map(alert => {
            const typeInfo = ALERT_TYPE_LABELS[alert.alert_type] || { label: alert.alert_type, icon: AlertTriangle };
            const Icon = typeInfo.icon;
            return (
              <Card key={alert.id} className={`border ${SEVERITY_STYLES[alert.severity] || ''}`}>
                <CardContent className="p-4 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Icon className="w-5 h-5 mt-0.5 text-amber-600" />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{alert.title}</span>
                        <Badge variant="outline" className="text-xs">{typeInfo.label}</Badge>
                        <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'} className="text-xs">
                          {alert.severity === 'critical' ? 'حرج' : alert.severity === 'warning' ? 'تحذير' : 'معلوماتي'}
                        </Badge>
                      </div>
                      {alert.description && <p className="text-xs text-muted-foreground">{alert.description}</p>}
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(alert.created_at), 'dd MMM yyyy HH:mm', { locale: ar })}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => resolveAlert.mutate(alert.id)}
                    disabled={resolveAlert.isPending}
                  >
                    {resolveAlert.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'حل'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {resolved.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-muted-foreground mb-2">تنبيهات محلولة ({resolved.length})</h3>
          <div className="space-y-1">
            {resolved.slice(0, 10).map(alert => (
              <div key={alert.id} className="flex items-center gap-2 p-2 rounded text-sm text-muted-foreground opacity-60">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>{alert.title}</span>
                <span className="text-xs mr-auto">{format(new Date(alert.created_at), 'dd/MM/yyyy', { locale: ar })}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
