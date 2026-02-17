import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, AlertTriangle, Clock, ShieldAlert, FileWarning, CalendarClock, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { differenceInDays, isPast, format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ComplianceAlert {
  id: string;
  type: 'license_expired' | 'license_expiring' | 'car_overdue' | 'risk_critical' | 'audit_upcoming' | 'document_missing';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  daysLeft?: number;
  relatedId?: string;
}

const severityConfig = {
  critical: { color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800/40', icon: ShieldAlert, iconColor: 'text-red-600' },
  warning: { color: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/40', icon: AlertTriangle, iconColor: 'text-amber-600' },
  info: { color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800/40', icon: Bell, iconColor: 'text-blue-600' },
};

const ComplianceAlertsWidget = () => {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['compliance-alerts', orgId],
    queryFn: async (): Promise<ComplianceAlert[]> => {
      if (!orgId) return [];

      const result: ComplianceAlert[] = [];
      const now = new Date();

      // 1. Check Licenses
      const { data: licenses } = await (supabase.from('legal_licenses') as any)
        .select('id, license_name, expiry_date').eq('organization_id', orgId);

      (licenses || []).forEach((l: any) => {
        if (!l.expiry_date) return;
        const days = differenceInDays(new Date(l.expiry_date), now);
        if (days < 0) {
          result.push({ id: `lic-exp-${l.id}`, type: 'license_expired', severity: 'critical', title: `ترخيص منتهي: ${l.license_name}`, description: `انتهت الصلاحية منذ ${Math.abs(days)} يوم`, daysLeft: days, relatedId: l.id });
        } else if (days <= 30) {
          result.push({ id: `lic-warn-${l.id}`, type: 'license_expiring', severity: days <= 7 ? 'critical' : 'warning', title: `ترخيص ينتهي قريباً: ${l.license_name}`, description: `ينتهي خلال ${days} يوم (${format(new Date(l.expiry_date), 'dd MMM yyyy', { locale: ar })})`, daysLeft: days, relatedId: l.id });
        }
      });

      // 2. Check Overdue CARs
      const { data: cars } = await (supabase.from('corrective_actions') as any)
        .select('id, title, ticket_number, deadline, status').eq('organization_id', orgId).neq('status', 'closed');

      (cars || []).forEach((c: any) => {
        if (c.deadline && isPast(new Date(c.deadline))) {
          const overdueDays = Math.abs(differenceInDays(new Date(c.deadline), now));
          result.push({ id: `car-${c.id}`, type: 'car_overdue', severity: overdueDays > 14 ? 'critical' : 'warning', title: `تذكرة تصحيحية متأخرة: ${c.ticket_number}`, description: `${c.title} - متأخرة ${overdueDays} يوم`, daysLeft: -overdueDays, relatedId: c.id });
        }
      });

      // 3. Check Critical Risks
      const { data: risks } = await (supabase.from('risk_register') as any)
        .select('id, risk_title, risk_level').eq('organization_id', orgId).eq('status', 'open').in('risk_level', ['critical', 'high']);

      (risks || []).forEach((r: any) => {
        result.push({ id: `risk-${r.id}`, type: 'risk_critical', severity: r.risk_level === 'critical' ? 'critical' : 'warning', title: `خطر ${r.risk_level === 'critical' ? 'حرج' : 'عالي'}: ${r.risk_title}`, description: 'يتطلب معالجة عاجلة لضمان الامتثال', relatedId: r.id });
      });

      // 4. Check Upcoming Audits
      const { data: audits } = await (supabase.from('audit_sessions') as any)
        .select('id, audit_date, auditor_name, status').eq('organization_id', orgId).eq('status', 'scheduled');

      (audits || []).forEach((a: any) => {
        const days = differenceInDays(new Date(a.audit_date), now);
        if (days >= 0 && days <= 14) {
          result.push({ id: `audit-${a.id}`, type: 'audit_upcoming', severity: days <= 3 ? 'warning' : 'info', title: `مراجعة قادمة: ${a.auditor_name}`, description: `بعد ${days} يوم (${format(new Date(a.audit_date), 'dd MMM yyyy', { locale: ar })})`, daysLeft: days, relatedId: a.id });
        }
      });

      // 5. Check Document Gaps
      const { data: docs } = await (supabase.from('organization_documents') as any)
        .select('id', { count: 'exact', head: true }).eq('organization_id', orgId);

      if ((docs as any)?.length === 0 || !docs) {
        result.push({ id: 'doc-gap', type: 'document_missing', severity: 'warning', title: 'لا توجد مستندات مرفوعة', description: 'يجب رفع المستندات الأساسية قبل المراجعة (سياسات، إجراءات، سجلات)' });
      }

      // Sort by severity
      const order = { critical: 0, warning: 1, info: 2 };
      return result.sort((a, b) => order[a.severity] - order[b.severity]);
    },
    enabled: !!orgId,
    staleTime: 60000,
  });

  if (isLoading) return <Card><CardHeader><CardTitle className="flex items-center gap-2 justify-end"><Bell className="w-5 h-5" /> الإنذارات الذكية</CardTitle></CardHeader><CardContent><Skeleton className="h-32 w-full" /></CardContent></Card>;

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;

  return (
    <Card className={criticalCount > 0 ? 'border-red-300 dark:border-red-800/50' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex gap-1.5">
            {criticalCount > 0 && <Badge variant="destructive" className="text-[10px]">{criticalCount} حرج</Badge>}
            {warningCount > 0 && <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 text-[10px]">{warningCount} تحذير</Badge>}
            {alerts.length === 0 && <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 text-[10px]">لا توجد تنبيهات</Badge>}
          </div>
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Bell className={`w-5 h-5 ${criticalCount > 0 ? 'text-red-600 animate-pulse' : 'text-blue-600'}`} /> الإنذارات الذكية للامتثال
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.length === 0 && (
          <div className="text-center py-6">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">لا توجد تنبيهات حالياً</p>
            <p className="text-xs text-muted-foreground">جميع المؤشرات ضمن النطاق الآمن ✅</p>
          </div>
        )}

        {alerts.map((alert, i) => {
          const cfg = severityConfig[alert.severity];
          const AlertIcon = cfg.icon;
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`p-3 rounded-lg border ${cfg.color}`}
            >
              <div className="flex items-start gap-2">
                <AlertIcon className={`w-4 h-4 shrink-0 mt-0.5 ${cfg.iconColor}`} />
                <div className="flex-1 text-right">
                  <p className="text-xs font-semibold">{alert.title}</p>
                  <p className="text-[10px] mt-0.5 opacity-80">{alert.description}</p>
                </div>
                {alert.daysLeft !== undefined && (
                  <Badge variant="outline" className="text-[9px] shrink-0">
                    {alert.daysLeft > 0 ? `${alert.daysLeft} يوم` : `متأخر ${Math.abs(alert.daysLeft)} يوم`}
                  </Badge>
                )}
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default ComplianceAlertsWidget;
