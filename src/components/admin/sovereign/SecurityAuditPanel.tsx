/**
 * لوحة الفحص الأمني السيادي — تعرض نتائج آخر فحص وتتيح تشغيل فحص جديد
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, ShieldCheck, ShieldAlert, ShieldX, RefreshCw, Clock, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { useLatestSecurityAudit, useRunSecurityAudit, statusConfig, checkNameLabels } from '@/hooks/useSecurityAudit';
import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

const SEVERITY_ICON: Record<string, { icon: any; color: string }> = {
  passed: { icon: CheckCircle2, color: 'text-emerald-500' },
  warning: { icon: AlertTriangle, color: 'text-amber-500' },
  failed: { icon: XCircle, color: 'text-red-500' },
  error: { icon: ShieldX, color: 'text-muted-foreground' },
};

const SecurityAuditPanel = () => {
  const { data: audit, isLoading } = useLatestSecurityAudit();
  const runAudit = useRunSecurityAudit();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-muted/30 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold">الفحص الأمني</h3>
          {audit && (
            <Badge variant="outline" className="text-[10px]">
              آخر فحص: {formatDistanceToNow(new Date(audit.created_at), { addSuffix: true, locale: ar })}
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          onClick={() => runAudit.mutate()}
          disabled={runAudit.isPending}
          variant="outline"
        >
          <RefreshCw className={`w-4 h-4 ml-1 ${runAudit.isPending ? 'animate-spin' : ''}`} />
          {runAudit.isPending ? 'جاري الفحص...' : 'فحص جديد'}
        </Button>
      </div>

      {/* Summary Cards */}
      {audit && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-emerald-500/5 border-emerald-500/20">
            <CardContent className="p-3 text-center">
              <ShieldCheck className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
              <div className="text-xl font-bold text-emerald-500">{audit.checks_passed}</div>
              <p className="text-[10px] text-muted-foreground">ناجح</p>
            </CardContent>
          </Card>
          <Card className={`${audit.checks_warning > 0 ? 'bg-amber-500/5 border-amber-500/20' : 'bg-muted/5'}`}>
            <CardContent className="p-3 text-center">
              <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-amber-500" />
              <div className="text-xl font-bold text-amber-500">{audit.checks_warning}</div>
              <p className="text-[10px] text-muted-foreground">تحذير</p>
            </CardContent>
          </Card>
          <Card className={`${audit.checks_failed > 0 ? 'bg-red-500/5 border-red-500/20' : 'bg-muted/5'}`}>
            <CardContent className="p-3 text-center">
              <ShieldX className="w-5 h-5 mx-auto mb-1 text-red-500" />
              <div className="text-xl font-bold text-red-500">{audit.checks_failed}</div>
              <p className="text-[10px] text-muted-foreground">فشل</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Overall Status */}
      {audit && (
        <Card className={`border ${
          audit.status === 'passed' ? 'border-emerald-500/30 bg-emerald-500/5' :
          audit.status === 'warning' ? 'border-amber-500/30 bg-amber-500/5' :
          'border-red-500/30 bg-red-500/5'
        }`}>
          <CardContent className="p-4 flex items-center gap-3">
            {audit.status === 'passed' ? (
              <ShieldCheck className="w-8 h-8 text-emerald-500" />
            ) : audit.status === 'warning' ? (
              <ShieldAlert className="w-8 h-8 text-amber-500" />
            ) : (
              <ShieldX className="w-8 h-8 text-red-500" />
            )}
            <div>
              <p className="text-sm font-bold">
                {audit.status === 'passed' ? 'النظام آمن ✅' :
                 audit.status === 'warning' ? 'تحذيرات أمنية ⚠️' :
                 'مشاكل أمنية حرجة 🚨'}
              </p>
              {audit.summary && <p className="text-xs text-muted-foreground mt-0.5">{audit.summary}</p>}
              {audit.run_duration_ms && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  <Clock className="w-3 h-3 inline ml-0.5" />
                  مدة الفحص: {audit.run_duration_ms}ms
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Findings */}
      {audit?.findings && audit.findings.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">تفاصيل الفحوصات ({audit.findings.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {audit.findings.map((finding, i) => {
                const sevCfg = SEVERITY_ICON[finding.status] || SEVERITY_ICON.error;
                const Icon = sevCfg.icon;
                return (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20 border border-border/30">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${sevCfg.color} flex-shrink-0`} />
                      <span className="text-xs font-medium">
                        {checkNameLabels[finding.check] || finding.check}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {finding.count !== undefined && finding.count > 0 && (
                        <Badge variant="outline" className="text-[10px]">{finding.count}</Badge>
                      )}
                      {finding.adoption_rate !== undefined && (
                        <Badge variant="outline" className="text-[10px]">{finding.adoption_rate}%</Badge>
                      )}
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          finding.status === 'passed' ? 'text-emerald-500' :
                          finding.status === 'warning' ? 'text-amber-500' :
                          'text-red-500'
                        }`}
                      >
                        {statusConfig[finding.status]?.label || finding.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No audit yet */}
      {!audit && (
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">لم يتم إجراء أي فحص أمني بعد</p>
            <p className="text-xs text-muted-foreground mt-1">اضغط "فحص جديد" لبدء أول فحص أمني شامل</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SecurityAuditPanel;
