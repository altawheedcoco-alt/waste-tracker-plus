import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ShieldAlert, Activity, CheckCircle2, Clock, Zap, TrendingDown, Database, Heart } from 'lucide-react';
import { useSovereignGovernance } from '@/hooks/useSovereignGovernance';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  info: { color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/30', label: 'معلومة' },
  warning: { color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/30', label: 'تحذير' },
  critical: { color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/30', label: 'حرج' },
  emergency: { color: 'text-red-700', bg: 'bg-red-700/10 border-red-700/30 animate-pulse', label: 'طوارئ' },
};

const CATEGORY_CONFIG: Record<string, { icon: any; label: string }> = {
  compliance_breach: { icon: ShieldAlert, label: 'خرق امتثال' },
  financial_anomaly: { icon: TrendingDown, label: 'شذوذ مالي' },
  security_threat: { icon: AlertTriangle, label: 'تهديد أمني' },
  operational_risk: { icon: Activity, label: 'مخاطر تشغيلية' },
  license_expiry: { icon: Clock, label: 'انتهاء ترخيص' },
  performance_decline: { icon: TrendingDown, label: 'تراجع أداء' },
  data_integrity: { icon: Database, label: 'سلامة البيانات' },
  system_health: { icon: Heart, label: 'صحة النظام' },
};

const EarlyWarningPanel = () => {
  const { alerts, unresolvedAlerts, criticalAlerts, resolveAlert } = useSovereignGovernance();
  const [resolveNotes, setResolveNotes] = useState('');
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);

  const severityCounts = {
    emergency: unresolvedAlerts.filter(a => a.severity === 'emergency').length,
    critical: unresolvedAlerts.filter(a => a.severity === 'critical').length,
    warning: unresolvedAlerts.filter(a => a.severity === 'warning').length,
    info: unresolvedAlerts.filter(a => a.severity === 'info').length,
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center gap-2">
        <Zap className="w-5 h-5 text-red-500" />
        <h3 className="text-lg font-bold">لوحة الإنذار المبكر</h3>
        {criticalAlerts.length > 0 && (
          <Badge variant="destructive" className="animate-pulse">{criticalAlerts.length} حرج</Badge>
        )}
      </div>

      {/* Severity KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(severityCounts).map(([severity, count]) => {
          const cfg = SEVERITY_CONFIG[severity];
          return (
            <Card key={severity} className={`border ${cfg.bg}`}>
              <CardContent className="p-3 text-center">
                <div className={`text-2xl font-bold ${cfg.color}`}>{count}</div>
                <p className="text-xs text-muted-foreground">{cfg.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Alerts List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <span>التنبيهات غير المعالجة ({unresolvedAlerts.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {unresolvedAlerts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-2" />
              <p className="text-sm text-muted-foreground">لا توجد تنبيهات نشطة — النظام سليم ✅</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {unresolvedAlerts.map(alert => {
                const sev = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info;
                const cat = CATEGORY_CONFIG[alert.category];
                const CatIcon = cat?.icon || AlertTriangle;
                return (
                  <div key={alert.id} className={`p-3 rounded-lg border ${sev.bg} space-y-1`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1">
                        <CatIcon className={`w-4 h-4 mt-0.5 ${sev.color} flex-shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{alert.title}</p>
                          {alert.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{alert.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px]">{cat?.label}</Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {format(new Date(alert.created_at), 'dd/MM HH:mm', { locale: ar })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="text-xs flex-shrink-0"
                            onClick={() => setSelectedAlert(alert.id)}>
                            معالجة
                          </Button>
                        </DialogTrigger>
                        <DialogContent dir="rtl">
                          <DialogHeader><DialogTitle>معالجة التنبيه</DialogTitle></DialogHeader>
                          <p className="text-sm">{alert.title}</p>
                          {alert.suggested_actions && Array.isArray(alert.suggested_actions) && (
                            <div className="bg-muted/50 p-3 rounded-lg">
                              <p className="text-xs font-medium mb-1">إجراءات مقترحة:</p>
                              <ul className="text-xs space-y-1">
                                {(alert.suggested_actions as string[]).map((a, i) => (
                                  <li key={i} className="flex items-start gap-1">
                                    <span className="text-primary">•</span> {a}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <Textarea
                            placeholder="ملاحظات المعالجة..."
                            value={resolveNotes}
                            onChange={e => setResolveNotes(e.target.value)}
                          />
                          <Button onClick={() => {
                            resolveAlert.mutate({ id: alert.id, notes: resolveNotes });
                            setResolveNotes('');
                          }} disabled={resolveAlert.isPending}>
                            {resolveAlert.isPending ? 'جاري المعالجة...' : 'تأكيد المعالجة'}
                          </Button>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resolved History */}
      {alerts.filter(a => a.is_resolved).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              آخر التنبيهات المعالجة ({alerts.filter(a => a.is_resolved).length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {alerts.filter(a => a.is_resolved).slice(0, 5).map(a => (
                <div key={a.id} className="flex items-center justify-between p-2 rounded bg-muted/20 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>{a.title}</span>
                  </div>
                  <span className="text-muted-foreground">
                    {a.resolved_at && format(new Date(a.resolved_at), 'dd/MM', { locale: ar })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EarlyWarningPanel;
