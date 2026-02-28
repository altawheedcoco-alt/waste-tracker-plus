import { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Bell, AlertTriangle, Clock, ShieldCheck, Calendar,
  CheckCircle2, XCircle, FileText, Building2, Loader2,
  Zap, TrendingDown, Award,
} from 'lucide-react';
import { differenceInDays, parseISO, format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

interface SmartAlert {
  id: string;
  type: 'license_expiry' | 'pending_approval' | 'field_overdue' | 'compliance_risk' | 'assignment_new';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  actionLabel?: string;
  actionTab?: string;
  date?: string;
}

interface ConsultantSmartAlertsProps {
  consultantId?: string;
  officeId?: string;
  mode: 'individual' | 'office';
  onNavigate?: (tab: string) => void;
}

const severityConfig = {
  critical: { color: 'border-destructive/50 bg-destructive/5', badge: 'destructive' as const, icon: AlertTriangle },
  warning: { color: 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20', badge: 'secondary' as const, icon: Clock },
  info: { color: 'border-primary/30 bg-primary/5', badge: 'default' as const, icon: Bell },
};

const ConsultantSmartAlerts = memo(({ consultantId, officeId, mode, onNavigate }: ConsultantSmartAlertsProps) => {
  const { profile } = useAuth();

  // Fetch consultant credentials for expiry alerts
  const { data: credentials = [] } = useQuery({
    queryKey: ['smart-alerts-credentials', consultantId],
    queryFn: async () => {
      if (!consultantId) return [];
      const { data } = await supabase
        .from('consultant_credentials')
        .select('*')
        .eq('consultant_id', consultantId);
      return data || [];
    },
    enabled: !!consultantId && mode === 'individual',
  });

  // Fetch consultant profile for main license expiry
  const { data: consultantProfile } = useQuery({
    queryKey: ['smart-alerts-profile', profile?.user_id],
    queryFn: async () => {
      if (!profile?.user_id) return null;
      const { data } = await supabase
        .from('environmental_consultants')
        .select('id, license_expiry, full_name, license_number')
        .eq('user_id', profile.user_id)
        .maybeSingle();
      return data;
    },
    enabled: !!profile?.user_id && mode === 'individual',
  });

  // Fetch pending approvals
  const { data: pendingSigs = [] } = useQuery({
    queryKey: ['smart-alerts-pending', consultantId, officeId, mode],
    queryFn: async () => {
      let q = supabase
        .from('consultant_document_signatures')
        .select('id, document_type, signed_at')
        .eq('director_approval_status', 'pending');

      if (mode === 'individual' && consultantId) {
        q = q.eq('consultant_id', consultantId);
      } else if (mode === 'office' && officeId) {
        q = q.eq('office_id', officeId);
      }
      const { data } = await q.limit(20);
      return data || [];
    },
    enabled: !!(consultantId || officeId),
  });

  // Build smart alerts
  const alerts: SmartAlert[] = useMemo(() => {
    const result: SmartAlert[] = [];

    // License expiry alerts
    if (consultantProfile?.license_expiry) {
      const days = differenceInDays(parseISO(consultantProfile.license_expiry), new Date());
      if (days < 0) {
        result.push({
          id: 'main-license-expired',
          type: 'license_expiry',
          severity: 'critical',
          title: 'الترخيص الرئيسي منتهي!',
          description: `انتهى ترخيصك رقم ${consultantProfile.license_number || ''} منذ ${Math.abs(days)} يوم — لا يمكنك التوقيع حتى التجديد`,
          actionLabel: 'إدارة التراخيص',
          actionTab: 'licenses',
        });
      } else if (days <= 30) {
        result.push({
          id: 'main-license-expiring',
          type: 'license_expiry',
          severity: 'critical',
          title: `ترخيصك ينتهي خلال ${days} يوم`,
          description: 'بادر بالتجديد لتفادي تعليق صلاحيات التوقيع',
          actionLabel: 'إدارة التراخيص',
          actionTab: 'licenses',
        });
      } else if (days <= 90) {
        result.push({
          id: 'main-license-warning',
          type: 'license_expiry',
          severity: 'warning',
          title: `ترخيصك ينتهي خلال ${days} يوم`,
          description: 'تنبيه مبكر — يُنصح ببدء إجراءات التجديد',
          actionLabel: 'إدارة التراخيص',
          actionTab: 'licenses',
        });
      }
    }

    // Credential expiry alerts
    credentials.forEach((cred: any) => {
      if (!cred.expiry_date) return;
      const days = differenceInDays(parseISO(cred.expiry_date), new Date());
      if (days < 0) {
        result.push({
          id: `cred-expired-${cred.id}`,
          type: 'license_expiry',
          severity: 'critical',
          title: `${cred.document_name} منتهي`,
          description: `انتهت صلاحية هذا المستند منذ ${Math.abs(days)} يوم`,
          actionLabel: 'إدارة التراخيص',
          actionTab: 'licenses',
        });
      } else if (days <= 30) {
        result.push({
          id: `cred-expiring-${cred.id}`,
          type: 'license_expiry',
          severity: 'warning',
          title: `${cred.document_name} ينتهي قريباً`,
          description: `متبقي ${days} يوم على انتهاء الصلاحية`,
          actionLabel: 'إدارة التراخيص',
          actionTab: 'licenses',
        });
      }
    });

    // Pending approvals
    if (pendingSigs.length > 0) {
      result.push({
        id: 'pending-approvals',
        type: 'pending_approval',
        severity: pendingSigs.length > 5 ? 'warning' : 'info',
        title: `${pendingSigs.length} مستند بانتظار الاعتماد`,
        description: mode === 'office'
          ? 'مستندات تنتظر موافقتك كمدير مكتب'
          : 'توقيعاتك بانتظار اعتماد مدير المكتب',
        actionLabel: mode === 'office' ? 'طلبات الاعتماد' : 'مركز التوقيع',
        actionTab: mode === 'office' ? 'approvals' : 'signing-center',
      });
    }

    // Sort: critical first, then warning, then info
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    result.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return result;
  }, [consultantProfile, credentials, pendingSigs, mode]);

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;

  return (
    <Card className={criticalCount > 0 ? 'border-destructive/30' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className={`w-5 h-5 ${criticalCount > 0 ? 'text-destructive animate-pulse' : 'text-primary'}`} />
            التنبيهات الذكية
          </CardTitle>
          <div className="flex items-center gap-1.5">
            {criticalCount > 0 && <Badge variant="destructive" className="text-[10px]">{criticalCount} حرج</Badge>}
            {warningCount > 0 && <Badge variant="secondary" className="text-[10px]">{warningCount} تحذير</Badge>}
            {alerts.length === 0 && <Badge variant="default" className="text-[10px]">✅ لا تنبيهات</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">كل شيء على ما يرام!</p>
            <p className="text-sm mt-1">لا توجد تنبيهات تحتاج انتباهك</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {alerts.map((alert, i) => {
                const config = severityConfig[alert.severity];
                const Icon = config.icon;
                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${config.color}`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${alert.severity === 'critical' ? 'text-destructive' : alert.severity === 'warning' ? 'text-amber-600' : 'text-primary'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{alert.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{alert.description}</p>
                    </div>
                    {alert.actionLabel && onNavigate && (
                      <Button variant="outline" size="sm" className="text-[10px] h-7 shrink-0" onClick={() => onNavigate(alert.actionTab!)}>
                        {alert.actionLabel}
                      </Button>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

ConsultantSmartAlerts.displayName = 'ConsultantSmartAlerts';
export default ConsultantSmartAlerts;
