import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle, ShieldCheck, Clock, XCircle, Bell,
  FileCheck2, Building2, Loader2, ChevronLeft,
} from 'lucide-react';
import { differenceInDays, isPast, format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Alert {
  id: string;
  type: 'license_expired' | 'license_expiring' | 'risk_critical' | 'car_overdue' | 'docs_incomplete';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  orgName: string;
  orgId: string;
  date?: string;
}

const severityConfig = {
  critical: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/20', border: 'border-red-200 dark:border-red-800/40', badge: 'destructive' as const },
  warning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-200 dark:border-amber-800/40', badge: 'secondary' as const },
  info: { icon: Bell, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/20', border: 'border-blue-200 dark:border-blue-800/40', badge: 'outline' as const },
};

const ConsultantAlertsWidget = memo(({ assignments }: { assignments: any[] }) => {
  const navigate = useNavigate();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['consultant-alerts', assignments.map((a: any) => a.organization?.id).join(',')],
    queryFn: async (): Promise<Alert[]> => {
      const allAlerts: Alert[] = [];
      const now = new Date();

      for (const assignment of assignments) {
        const orgId = assignment.organization?.id;
        const orgName = assignment.organization?.name || 'جهة';
        if (!orgId) continue;

        const [licensesRes, risksRes, carsRes, docsRes] = await Promise.all([
          (supabase.from('legal_licenses') as any).select('id, expiry_date, status, license_type').eq('organization_id', orgId),
          (supabase.from('risk_register') as any).select('id, risk_level, status, title').eq('organization_id', orgId),
          (supabase.from('corrective_actions') as any).select('id, status, deadline, title').eq('organization_id', orgId),
          supabase.from('organization_documents').select('id, verification_status').eq('organization_id', orgId),
        ]);

        const licenses = licensesRes.data || [];
        const risks = risksRes.data || [];
        const cars = carsRes.data || [];
        const docs = docsRes.data || [];

        // License alerts
        licenses.forEach((l: any) => {
          if (l.expiry_date && isPast(new Date(l.expiry_date))) {
            allAlerts.push({
              id: `lic-exp-${l.id}`, type: 'license_expired', severity: 'critical',
              title: `ترخيص منتهي: ${l.license_type || 'ترخيص'}`,
              description: `انتهت صلاحية الترخيص في ${format(new Date(l.expiry_date), 'dd MMM yyyy', { locale: ar })}`,
              orgName, orgId, date: l.expiry_date,
            });
          } else if (l.expiry_date && differenceInDays(new Date(l.expiry_date), now) <= 30) {
            allAlerts.push({
              id: `lic-warn-${l.id}`, type: 'license_expiring', severity: 'warning',
              title: `ترخيص ينتهي قريباً: ${l.license_type || 'ترخيص'}`,
              description: `يتبقى ${differenceInDays(new Date(l.expiry_date), now)} يوم على الانتهاء`,
              orgName, orgId, date: l.expiry_date,
            });
          }
        });

        // Critical risk alerts
        risks.filter((r: any) => r.risk_level === 'critical' && r.status !== 'mitigated' && r.status !== 'closed').forEach((r: any) => {
          allAlerts.push({
            id: `risk-${r.id}`, type: 'risk_critical', severity: 'critical',
            title: `خطر حرج: ${r.title || 'خطر غير معالج'}`,
            description: 'يجب معالجة هذا الخطر فوراً لضمان الامتثال',
            orgName, orgId,
          });
        });

        // Overdue CARs
        cars.filter((c: any) => c.deadline && isPast(new Date(c.deadline)) && c.status !== 'closed').forEach((c: any) => {
          allAlerts.push({
            id: `car-${c.id}`, type: 'car_overdue', severity: 'warning',
            title: `تذكرة تصحيحية متأخرة: ${c.title || 'إجراء تصحيحي'}`,
            description: `تجاوزت الموعد المحدد في ${format(new Date(c.deadline), 'dd MMM yyyy', { locale: ar })}`,
            orgName, orgId, date: c.deadline,
          });
        });

        // Document gaps
        const unverified = docs.filter((d: any) => d.verification_status !== 'verified').length;
        if (unverified > 0 && docs.length > 0) {
          allAlerts.push({
            id: `doc-${orgId}`, type: 'docs_incomplete', severity: 'info',
            title: `${unverified} مستند غير موثق`,
            description: `يحتاج ${unverified} من ${docs.length} مستند إلى توثيق`,
            orgName, orgId,
          });
        }
      }

      return allAlerts.sort((a, b) => {
        const order = { critical: 0, warning: 1, info: 2 };
        return order[a.severity] - order[b.severity];
      });
    },
    enabled: assignments.length > 0,
    staleTime: 120000,
  });

  if (isLoading) {
    return <Card><CardContent className="p-4"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></CardContent></Card>;
  }

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-lg">
            <Bell className="w-5 h-5 text-amber-600" />
            التنبيهات والإنذارات
          </span>
          <div className="flex gap-1.5">
            {criticalCount > 0 && <Badge variant="destructive" className="text-[10px]">{criticalCount} حرج</Badge>}
            {warningCount > 0 && <Badge variant="secondary" className="text-[10px]">{warningCount} تحذير</Badge>}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-emerald-500 opacity-40" />
            <p className="text-sm font-medium">لا توجد تنبيهات حالياً</p>
            <p className="text-xs">جميع الجهات في حالة امتثال جيدة ✅</p>
          </div>
        ) : (
          alerts.slice(0, 10).map((alert, i) => {
            const config = severityConfig[alert.severity];
            const Icon = config.icon;
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`p-3 rounded-lg ${config.bg} border ${config.border} flex items-start gap-3`}
              >
                <Icon className={`w-5 h-5 ${config.color} shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{alert.title}</p>
                  <p className="text-[11px] text-muted-foreground">{alert.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[9px]">
                      <Building2 className="w-2.5 h-2.5 ml-0.5" />
                      {alert.orgName}
                    </Badge>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="shrink-0 h-7 w-7 p-0"
                  onClick={() => navigate(`/dashboard/organization/${alert.orgId}`)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </motion.div>
            );
          })
        )}
        {alerts.length > 10 && (
          <p className="text-center text-xs text-muted-foreground pt-2">
            و {alerts.length - 10} تنبيه آخر...
          </p>
        )}
      </CardContent>
    </Card>
  );
});

ConsultantAlertsWidget.displayName = 'ConsultantAlertsWidget';
export default ConsultantAlertsWidget;
