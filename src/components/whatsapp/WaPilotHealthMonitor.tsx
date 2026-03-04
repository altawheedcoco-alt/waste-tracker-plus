import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HeartPulse, AlertTriangle, CheckCircle2, XCircle, TrendingUp, Shield } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface MessageLog {
  id: string;
  status: string;
  direction: string;
  to_phone: string;
  organization_id: string;
  created_at: string;
  error_message: string | null;
}

interface OrgInfo {
  id: string;
  name: string;
  organization_type: string;
}

const ORG_TYPE_LABELS: Record<string, string> = {
  generator: 'مولّد', transporter: 'ناقل', recycler: 'مدوّر',
  disposal: 'تخلص', consultant: 'استشاري', consulting_office: 'مكتب', iso_body: 'اعتماد',
};

const WaPilotHealthMonitor = ({ messages, orgs }: { messages: MessageLog[]; orgs: OrgInfo[] }) => {
  const health = useMemo(() => {
    const orgMap = new Map(orgs.map(o => [o.id, o]));

    // Per-org delivery health
    const orgHealth: Record<string, { total: number; sent: number; failed: number; org: OrgInfo | undefined }> = {};
    messages.filter(m => m.direction === 'outbound').forEach(m => {
      if (!m.organization_id) return;
      if (!orgHealth[m.organization_id]) {
        orgHealth[m.organization_id] = { total: 0, sent: 0, failed: 0, org: orgMap.get(m.organization_id) };
      }
      orgHealth[m.organization_id].total++;
      if (m.status === 'sent' || m.status === 'delivered') orgHealth[m.organization_id].sent++;
      if (m.status === 'failed') orgHealth[m.organization_id].failed++;
    });

    // Common errors
    const errorCounts: Record<string, number> = {};
    messages.filter(m => m.error_message).forEach(m => {
      const err = m.error_message!.slice(0, 60);
      errorCounts[err] = (errorCounts[err] || 0) + 1;
    });
    const topErrors = Object.entries(errorCounts).sort(([, a], [, b]) => b - a).slice(0, 5);

    // Phone number health (repeated failures)
    const phoneFailures: Record<string, number> = {};
    messages.filter(m => m.status === 'failed' && m.to_phone).forEach(m => {
      phoneFailures[m.to_phone] = (phoneFailures[m.to_phone] || 0) + 1;
    });
    const problematicPhones = Object.entries(phoneFailures).filter(([, c]) => c >= 2).sort(([, a], [, b]) => b - a).slice(0, 10);

    // Overall health score
    const totalOutbound = messages.filter(m => m.direction === 'outbound').length;
    const totalDelivered = messages.filter(m => (m.status === 'sent' || m.status === 'delivered') && m.direction === 'outbound').length;
    const healthScore = totalOutbound > 0 ? Math.round((totalDelivered / totalOutbound) * 100) : 100;

    const sortedOrgHealth = Object.values(orgHealth).sort((a, b) => {
      const rateA = a.total > 0 ? a.failed / a.total : 0;
      const rateB = b.total > 0 ? b.failed / b.total : 0;
      return rateB - rateA;
    });

    return { orgHealth: sortedOrgHealth, topErrors, problematicPhones, healthScore };
  }, [messages, orgs]);

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-amber-600';
    return 'text-destructive';
  };

  return (
    <div className="space-y-4">
      {/* Overall Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HeartPulse className="h-5 w-5 text-primary" />
            صحة نظام الإرسال
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className={`text-5xl font-bold ${getHealthColor(health.healthScore)}`}>{health.healthScore}%</div>
              <p className="text-sm text-muted-foreground mt-1">
                {health.healthScore >= 90 ? 'ممتاز' : health.healthScore >= 70 ? 'جيد' : 'يحتاج مراجعة'}
              </p>
            </div>
            <div className="flex-1">
              <Progress value={health.healthScore} className="h-3" />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>0%</span>
                <span>نسبة التسليم الناجح</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Per-Org Health */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1"><Shield className="h-4 w-4" />صحة التسليم لكل جهة</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {health.orgHealth.map((oh, i) => {
                  const rate = oh.total > 0 ? Math.round((oh.sent / oh.total) * 100) : 100;
                  return (
                    <div key={i} className="flex items-center gap-2 p-2 rounded border text-sm">
                      {rate >= 90 ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> :
                       rate >= 70 ? <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" /> :
                       <XCircle className="h-4 w-4 text-destructive shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-xs font-medium">{oh.org?.name || 'غير معروف'}</p>
                        <p className="text-[10px] text-muted-foreground">{ORG_TYPE_LABELS[oh.org?.organization_type || ''] || ''}</p>
                      </div>
                      <div className="text-left shrink-0">
                        <span className={`text-xs font-bold ${getHealthColor(rate)}`}>{rate}%</span>
                        <p className="text-[10px] text-muted-foreground">{oh.sent}/{oh.total}</p>
                      </div>
                    </div>
                  );
                })}
                {health.orgHealth.length === 0 && <p className="text-center text-muted-foreground text-sm py-4">لا توجد بيانات</p>}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Common Errors */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1"><AlertTriangle className="h-4 w-4 text-amber-500" />الأخطاء الشائعة</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {health.topErrors.map(([err, count], i) => (
                  <div key={i} className="p-2 border rounded text-sm space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge variant="destructive" className="text-xs">{count} مرة</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono" dir="ltr">{err}</p>
                  </div>
                ))}
                {health.topErrors.length === 0 && <p className="text-center text-green-600 text-sm py-8 flex items-center justify-center gap-2"><CheckCircle2 className="h-5 w-5" />لا توجد أخطاء</p>}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Problematic Numbers */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1"><XCircle className="h-4 w-4 text-destructive" />أرقام ذات فشل متكرر</CardTitle>
            <CardDescription className="text-xs">أرقام فشل الإرسال إليها مرتين أو أكثر — قد تكون أرقام غير صالحة أو محظورة</CardDescription>
          </CardHeader>
          <CardContent>
            {health.problematicPhones.length === 0 ? (
              <p className="text-center text-green-600 text-sm py-4 flex items-center justify-center gap-2"><CheckCircle2 className="h-5 w-5" />لا توجد أرقام مشكلة</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {health.problematicPhones.map(([phone, count], i) => (
                  <Badge key={i} variant="destructive" className="text-xs font-mono gap-1">
                    <span dir="ltr">{phone}</span>
                    <span>({count} فشل)</span>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WaPilotHealthMonitor;
