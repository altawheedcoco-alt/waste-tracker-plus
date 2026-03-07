import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, ShieldAlert, EyeOff, ExternalLink, CheckCircle2, ChevronDown, ChevronUp, Package, FileText, FileWarning, TrendingDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

interface OperationalAlert {
  id: string;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  detail: string;
  orgName?: string;
  resourceId?: string;
  resourceType?: string;
  timestamp?: Date;
}

const getSeverityConfig = (t: (key: string) => string) => ({
  critical: {
    icon: ShieldAlert,
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800',
    badge: 'destructive' as const,
    label: t('adminAlerts.critical'),
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800',
    badge: 'secondary' as const,
    label: t('adminAlerts.warning'),
  },
  info: {
    icon: Clock,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
    badge: 'outline' as const,
    label: t('adminAlerts.info'),
  },
});

const TYPE_ICONS: Record<string, typeof Package> = {
  overdue: TrendingDown,
  stale: Package,
  contract_expiry: FileWarning,
  unpaid: FileText,
  unverified: FileWarning,
};

const getTypeLabels = (t: (key: string) => string): Record<string, string> => ({
  overdue: t('adminAlerts.deliveryDelay'),
  stale: t('adminAlerts.staleShipment'),
  contract_expiry: t('adminAlerts.contractExpiry'),
  unpaid: t('adminAlerts.unpaidInvoice'),
  unverified: t('adminAlerts.unverifiedDoc'),
});

const AdminOperationalAlerts = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const SEVERITY_CONFIG = getSeverityConfig(t);
  const TYPE_LABELS = getTypeLabels(t);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['admin-operational-alerts'],
    queryFn: async (): Promise<OperationalAlert[]> => {
      const result: OperationalAlert[] = [];
      const now = new Date();

      const staleThreshold = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      const { data: staleShipments } = await supabase
        .from('shipments')
        .select('id, shipment_number, created_at, transporter_id')
        .in('status', ['new', 'approved'])
        .lt('created_at', staleThreshold.toISOString())
        .limit(10);

      const expiryThreshold = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      const { data: expiringContracts } = await supabase
        .from('contracts')
        .select('id, title, end_date, organization_id')
        .eq('status', 'active')
        .lte('end_date', expiryThreshold.toISOString())
        .gte('end_date', now.toISOString())
        .limit(10);

      const { data: overdueInvoices } = await supabase
        .from('invoices')
        .select('id, invoice_number, due_date, organization_id, total_amount')
        .eq('status', 'overdue')
        .limit(10);

      const { data: delayedShipments } = await supabase
        .from('shipments')
        .select('id, shipment_number, expected_delivery_date, status, transporter_id')
        .in('status', ['new', 'approved', 'in_transit', 'confirmed'])
        .not('expected_delivery_date', 'is', null)
        .lt('expected_delivery_date', now.toISOString())
        .limit(10);

      const { data: unverifiedDocs } = await supabase
        .from('organization_documents')
        .select('id, document_type, created_at, organization_id')
        .eq('verification_status', 'pending')
        .limit(5);

      const orgIds = new Set<string>();
      staleShipments?.forEach(s => s.transporter_id && orgIds.add(s.transporter_id));
      expiringContracts?.forEach(c => c.organization_id && orgIds.add(c.organization_id));
      overdueInvoices?.forEach(i => i.organization_id && orgIds.add(i.organization_id));
      delayedShipments?.forEach(s => s.transporter_id && orgIds.add(s.transporter_id));
      unverifiedDocs?.forEach(d => d.organization_id && orgIds.add(d.organization_id));

      const orgMap = new Map<string, string>();
      if (orgIds.size > 0) {
        const { data: orgs } = await supabase
          .from('organizations')
          .select('id, name')
          .in('id', Array.from(orgIds));
        orgs?.forEach(o => orgMap.set(o.id, o.name));
      }

      staleShipments?.forEach(s => {
        result.push({
          id: `stale-${s.id}`, type: 'stale', severity: 'warning',
          message: `شحنة ${s.shipment_number} معلّقة`,
          detail: `منذ ${formatDistanceToNow(new Date(s.created_at), { locale: ar })} — لم يتم تحريكها`,
          orgName: s.transporter_id ? orgMap.get(s.transporter_id) : undefined,
          resourceId: s.id, resourceType: 'shipment',
          timestamp: new Date(s.created_at),
        });
      });

      expiringContracts?.forEach(c => {
        result.push({
          id: `contract-${c.id}`, type: 'contract_expiry', severity: 'critical',
          message: `عقد "${c.title}" ينتهي قريباً`,
          detail: `ينتهي ${formatDistanceToNow(new Date(c.end_date!), { locale: ar, addSuffix: true })}`,
          orgName: c.organization_id ? orgMap.get(c.organization_id) : undefined,
          resourceId: c.id, resourceType: 'contract',
          timestamp: new Date(c.end_date!),
        });
      });

      overdueInvoices?.forEach(inv => {
        result.push({
          id: `invoice-${inv.id}`, type: 'unpaid', severity: 'critical',
          message: `فاتورة ${inv.invoice_number} متأخرة`,
          detail: inv.due_date
            ? `استحقت ${formatDistanceToNow(new Date(inv.due_date), { locale: ar, addSuffix: true })} — ${inv.total_amount?.toLocaleString() || '—'} ج.م`
            : '',
          orgName: inv.organization_id ? orgMap.get(inv.organization_id) : undefined,
          resourceId: inv.id, resourceType: 'invoice',
          timestamp: inv.due_date ? new Date(inv.due_date) : now,
        });
      });

      delayedShipments?.forEach(s => {
        const expectedDate = new Date(s.expected_delivery_date!);
        const hoursLate = Math.round((now.getTime() - expectedDate.getTime()) / (1000 * 60 * 60));
        result.push({
          id: `delayed-${s.id}`, type: 'overdue', severity: hoursLate > 48 ? 'critical' : 'warning',
          message: `شحنة ${s.shipment_number} متأخرة عن موعد التسليم`,
          detail: `متأخرة بـ ${formatDistanceToNow(expectedDate, { locale: ar })} — الحالة: ${s.status}`,
          orgName: s.transporter_id ? orgMap.get(s.transporter_id) : undefined,
          resourceId: s.id, resourceType: 'shipment',
          timestamp: expectedDate,
        });
      });

      unverifiedDocs?.forEach(doc => {
        result.push({
          id: `doc-${doc.id}`, type: 'unverified', severity: 'info',
          message: `وثيقة "${doc.document_type}" بانتظار التحقق`,
          detail: `مرفوعة ${formatDistanceToNow(new Date(doc.created_at), { locale: ar, addSuffix: true })}`,
          orgName: doc.organization_id ? orgMap.get(doc.organization_id) : undefined,
          resourceId: doc.id, resourceType: 'document',
          timestamp: new Date(doc.created_at),
        });
      });

      const severityOrder = { critical: 0, warning: 1, info: 2 };
      return result.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
    },
    refetchInterval: 120000,
  });

  const handleDismiss = useCallback((id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
    toast.success('تم إخفاء التنبيه');
  }, []);

  const handleDismissAll = useCallback(() => {
    setDismissedIds(prev => {
      const next = new Set(prev);
      alerts.forEach(a => next.add(a.id));
      return next;
    });
    toast.success('تم إخفاء جميع التنبيهات');
  }, [alerts]);

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
              تنبيهات تشغيلية — جميع الجهات
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
                      <div className="flex items-center gap-2 justify-end mt-0.5">
                        {alert.orgName && (
                          <Badge variant="outline" className="text-[10px]">{alert.orgName}</Badge>
                        )}
                        <p className="text-xs text-muted-foreground line-clamp-1">{alert.detail}</p>
                      </div>
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
                          {alert.timestamp && (
                            <p className="text-[11px] text-muted-foreground mt-1 text-right">
                              التاريخ: {alert.timestamp.toLocaleDateString('ar-EG')} — {formatDistanceToNow(alert.timestamp, { locale: ar, addSuffix: true })}
                            </p>
                          )}
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

export default AdminOperationalAlerts;
