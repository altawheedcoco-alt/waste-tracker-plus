import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, ShieldAlert, Eye, EyeOff, Wrench, CheckCircle2, ExternalLink, ChevronDown, ChevronUp, Package, FileText, FileWarning, TrendingDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface OperationalAlert {
  id: string;
  type: 'overdue' | 'stale' | 'contract_expiry' | 'unpaid' | 'unverified';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  detail: string;
  timestamp: Date;
  resourceId?: string;
  resourceType?: string;
}

const SEVERITY_CONFIG = {
  critical: {
    icon: ShieldAlert,
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800',
    badge: 'destructive' as const,
    label: 'حرج',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800',
    badge: 'secondary' as const,
    label: 'تحذير',
  },
  info: {
    icon: Clock,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
    badge: 'outline' as const,
    label: 'معلومة',
  },
};

const TYPE_ICONS: Record<string, typeof Package> = {
  overdue: TrendingDown,
  stale: Package,
  contract_expiry: FileWarning,
  unpaid: FileText,
  unverified: FileWarning,
};

const TYPE_LABELS: Record<string, string> = {
  overdue: 'تأخر تسليم',
  stale: 'شحنة معلّقة',
  contract_expiry: 'انتهاء عقد',
  unpaid: 'فاتورة متأخرة',
  unverified: 'وثيقة معلّقة',
};

const OperationalAlertsWidget = () => {
  const { organization } = useAuth();
  const navigate = useNavigate();
  const orgType = organization?.organization_type;
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['operational-alerts', organization?.id],
    queryFn: async (): Promise<OperationalAlert[]> => {
      const result: OperationalAlert[] = [];
      const now = new Date();
      const orgField = orgType === 'generator' ? 'generator_id'
        : orgType === 'recycler' ? 'recycler_id'
        : 'transporter_id';

      const staleThreshold = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      const { data: staleShipments } = await supabase
        .from('shipments')
        .select('id, shipment_number, created_at')
        .eq(orgField, organization!.id)
        .in('status', ['new', 'approved'])
        .lt('created_at', staleThreshold.toISOString())
        .limit(5);

      staleShipments?.forEach(s => {
        result.push({
          id: `stale-${s.id}`, type: 'stale', severity: 'warning',
          message: `شحنة ${s.shipment_number} معلّقة منذ فترة طويلة`,
          detail: `تم إنشاؤها منذ ${formatDistanceToNow(new Date(s.created_at), { locale: ar })} ولم يتم تحريكها`,
          timestamp: new Date(s.created_at),
          resourceId: s.id, resourceType: 'shipment',
        });
      });

      const expiryThreshold = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      const { data: expiringContracts } = await supabase
        .from('contracts')
        .select('id, title, end_date')
        .eq('organization_id', organization!.id)
        .eq('status', 'active')
        .lte('end_date', expiryThreshold.toISOString())
        .gte('end_date', now.toISOString())
        .limit(5);

      expiringContracts?.forEach(c => {
        result.push({
          id: `contract-${c.id}`, type: 'contract_expiry', severity: 'critical',
          message: `عقد "${c.title}" ينتهي قريباً`,
          detail: `ينتهي ${formatDistanceToNow(new Date(c.end_date!), { locale: ar, addSuffix: true })} — يجب التجديد أو التفاوض`,
          timestamp: new Date(c.end_date!),
          resourceId: c.id, resourceType: 'contract',
        });
      });

      const { data: overdueInvoices } = await supabase
        .from('invoices')
        .select('id, invoice_number, due_date, total_amount')
        .eq('organization_id', organization!.id)
        .eq('status', 'overdue')
        .limit(5);

      overdueInvoices?.forEach(inv => {
        result.push({
          id: `invoice-${inv.id}`, type: 'unpaid', severity: 'critical',
          message: `فاتورة ${inv.invoice_number} متأخرة السداد`,
          detail: inv.due_date
            ? `استحقت ${formatDistanceToNow(new Date(inv.due_date), { locale: ar, addSuffix: true })} — المبلغ: ${inv.total_amount?.toLocaleString() || '—'} ج.م`
            : '',
          timestamp: new Date(inv.due_date || now),
          resourceId: inv.id, resourceType: 'invoice',
        });
      });

      const { data: delayedShipments } = await supabase
        .from('shipments')
        .select('id, shipment_number, expected_delivery_date, status')
        .eq(orgField, organization!.id)
        .in('status', ['new', 'approved', 'in_transit', 'confirmed'])
        .not('expected_delivery_date', 'is', null)
        .lt('expected_delivery_date', now.toISOString())
        .limit(10);

      delayedShipments?.forEach(s => {
        const expectedDate = new Date(s.expected_delivery_date!);
        const hoursLate = Math.round((now.getTime() - expectedDate.getTime()) / (1000 * 60 * 60));
        result.push({
          id: `delayed-${s.id}`, type: 'overdue',
          severity: hoursLate > 48 ? 'critical' : 'warning',
          message: `شحنة ${s.shipment_number} متأخرة عن موعد التسليم`,
          detail: `متأخرة بـ ${formatDistanceToNow(expectedDate, { locale: ar })} — الحالة الحالية: ${s.status}`,
          timestamp: expectedDate,
          resourceId: s.id, resourceType: 'shipment',
        });
      });

      const { data: unverifiedDocs } = await supabase
        .from('organization_documents')
        .select('id, document_type, created_at')
        .eq('organization_id', organization!.id)
        .eq('verification_status', 'pending')
        .limit(3);

      unverifiedDocs?.forEach(doc => {
        result.push({
          id: `doc-${doc.id}`, type: 'unverified', severity: 'info',
          message: `وثيقة "${doc.document_type}" بانتظار التحقق`,
          detail: `مرفوعة ${formatDistanceToNow(new Date(doc.created_at), { locale: ar, addSuffix: true })} — تحتاج مراجعة الإدارة`,
          timestamp: new Date(doc.created_at),
          resourceId: doc.id, resourceType: 'document',
        });
      });

      const severityOrder = { critical: 0, warning: 1, info: 2 };
      return result.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
    },
    enabled: !!organization?.id,
    refetchInterval: 120000,
  });

  const handleDismiss = useCallback((id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
    toast.success('تم إخفاء التنبيه');
  }, []);

  const handleDismissAll = useCallback(() => {
    const ids = visibleAlerts.map(a => a.id);
    setDismissedIds(prev => new Set([...prev, ...ids]));
    toast.success('تم إخفاء جميع التنبيهات');
  }, []);

  const handleResolve = useCallback((alert: OperationalAlert) => {
    setResolvedIds(prev => new Set([...prev, alert.id]));
    toast.success(`تم تحديد "${alert.message}" كمحلول`);
  }, []);

  const handleQuickAction = useCallback((alert: OperationalAlert) => {
    switch (alert.resourceType) {
      case 'shipment':
        navigate(`/dashboard/shipments/${alert.resourceId}`);
        break;
      case 'contract':
        navigate(`/dashboard/contracts`);
        break;
      case 'invoice':
        navigate(`/dashboard/invoices`);
        break;
      case 'document':
        navigate(`/dashboard/settings`);
        break;
      default:
        navigate('/dashboard');
    }
  }, [navigate]);

  const visibleAlerts = alerts.filter(a => !dismissedIds.has(a.id) && !resolvedIds.has(a.id));
  const criticalCount = visibleAlerts.filter(a => a.severity === 'critical').length;
  const warningCount = visibleAlerts.filter(a => a.severity === 'warning').length;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-14 bg-muted rounded" />
            <div className="h-14 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (visibleAlerts.length === 0) return null;

  return (
    <Card className="border-amber-200 dark:border-amber-800/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={handleDismissAll}>
              <EyeOff className="ml-1 h-3 w-3" />
              إخفاء الكل
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              تنبيهات تشغيلية
            </CardTitle>
            <div className="flex items-center gap-1.5">
              {criticalCount > 0 && (
                <Badge variant="destructive" className="text-[10px] px-1.5">{criticalCount} حرج</Badge>
              )}
              {warningCount > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5">{warningCount} تحذير</Badge>
              )}
              <Badge variant="outline" className="text-[10px] px-1.5">{visibleAlerts.length} إجمالي</Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          <AnimatePresence>
            {visibleAlerts.map((alert) => {
              const config = SEVERITY_CONFIG[alert.severity];
              const SeverityIcon = config.icon;
              const TypeIcon = TYPE_ICONS[alert.type] || Package;
              const isExpanded = expandedId === alert.id;

              return (
                <motion.div
                  key={alert.id}
                  layout
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 50, height: 0 }}
                  className={`rounded-lg border transition-all ${config.bgColor}`}
                >
                  <div
                    className="flex items-center gap-3 p-3 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                  >
                    <div className="flex-1 text-right min-w-0">
                      <p className="text-sm font-semibold truncate">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{alert.detail}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-[10px]">
                        {TYPE_LABELS[alert.type] || alert.type}
                      </Badge>
                      <Badge variant={config.badge} className="text-[10px]">
                        {config.label}
                      </Badge>
                      <SeverityIcon className={`w-4 h-4 ${config.color}`} />
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 border-t border-dashed border-current/10">
                          <div className="flex items-center gap-2 justify-end mt-2 text-xs text-muted-foreground">
                            <TypeIcon className="w-3.5 h-3.5" />
                            <span>{alert.detail}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1 text-right">
                            {alert.timestamp && `التاريخ: ${alert.timestamp.toLocaleDateString('ar-EG')} — ${formatDistanceToNow(alert.timestamp, { locale: ar, addSuffix: true })}`}
                          </p>
                          <div className="flex items-center gap-2 mt-3 justify-end flex-wrap">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-muted-foreground hover:text-destructive"
                              onClick={(e) => { e.stopPropagation(); handleDismiss(alert.id); }}
                            >
                              <EyeOff className="ml-1 h-3 w-3" />
                              إخفاء
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={(e) => { e.stopPropagation(); handleQuickAction(alert); }}
                            >
                              <ExternalLink className="ml-1 h-3 w-3" />
                              معالجة مباشرة
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                              onClick={(e) => { e.stopPropagation(); handleResolve(alert); }}
                            >
                              <CheckCircle2 className="ml-1 h-3 w-3" />
                              تم الحل
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
};

export default OperationalAlertsWidget;
