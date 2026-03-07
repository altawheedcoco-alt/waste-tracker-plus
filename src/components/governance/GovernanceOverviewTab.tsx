import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGovernanceStats, useGovernanceAudit, useGovernanceAlerts } from '@/hooks/useGovernance';
import { Shield, CheckCircle2, AlertTriangle, Clock, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

const severityColor: Record<string, string> = {
  info: 'bg-blue-100 text-blue-800',
  warning: 'bg-amber-100 text-amber-800',
  critical: 'bg-red-100 text-red-800',
};

const actionTypeLabel: Record<string, string> = {
  create: 'إنشاء',
  update: 'تعديل',
  delete: 'حذف',
  approve: 'موافقة',
  reject: 'رفض',
  login: 'تسجيل دخول',
  export: 'تصدير',
  permission_change: 'تغيير صلاحية',
};

export default function GovernanceOverviewTab() {
  const { data: stats } = useGovernanceStats();
  const { entries } = useGovernanceAudit();
  const { alerts } = useGovernanceAlerts();

  const recentEntries = entries.slice(0, 8);
  const unresolvedAlerts = alerts.filter(a => !a.is_resolved).slice(0, 5);

  const complianceScore = stats
    ? Math.max(0, 100 - (stats.unresolvedAlerts * 10) - (stats.pendingApprovals > 5 ? 15 : 0))
    : 100;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
      {/* Compliance Score */}
      <Card className="lg:col-span-2">
        <CardContent className="p-6 flex items-center gap-6">
          <div className="relative w-24 h-24">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="42" fill="none"
                stroke={complianceScore >= 80 ? 'hsl(var(--primary))' : complianceScore >= 50 ? 'hsl(45, 93%, 47%)' : 'hsl(0, 84%, 60%)'}
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${complianceScore * 2.64} ${264 - complianceScore * 2.64}`}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xl font-bold">{complianceScore}%</span>
          </div>
          <div>
            <h3 className="text-lg font-bold">مؤشر الامتثال الداخلي</h3>
            <p className="text-muted-foreground text-sm">يعتمد على عدد التنبيهات النشطة والموافقات المعلقة</p>
            <div className="flex gap-4 mt-2">
              <div className="flex items-center gap-1 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>{stats?.totalRoles || 0} أدوار</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>{stats?.pendingApprovals || 0} معلقة</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span>{stats?.unresolvedAlerts || 0} تنبيه</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Audit */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="w-5 h-5" />
            آخر الأحداث
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-80 overflow-y-auto">
          {recentEntries.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">لا توجد أحداث مسجلة</p>}
          {recentEntries.map(e => (
            <div key={e.id} className="flex items-start justify-between p-2 rounded-lg hover:bg-muted/50 text-sm">
              <div className="flex-1">
                <p className="font-medium">{e.user_name || 'مستخدم'} — {actionTypeLabel[e.action_type] || e.action_type}</p>
                <p className="text-muted-foreground text-xs">{e.resource_title || e.resource_type}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant="outline" className={severityColor[e.severity]}>{e.severity}</Badge>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(e.created_at), 'dd MMM HH:mm', { locale: ar })}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            التنبيهات النشطة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-80 overflow-y-auto">
          {unresolvedAlerts.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">لا توجد تنبيهات نشطة ✓</p>}
          {unresolvedAlerts.map(a => (
            <div key={a.id} className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={severityColor[a.severity]}>{a.severity}</Badge>
                <p className="font-medium text-sm">{a.title}</p>
              </div>
              {a.description && <p className="text-xs text-muted-foreground mt-1">{a.description}</p>}
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(a.created_at), 'dd MMM yyyy HH:mm', { locale: ar })}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
