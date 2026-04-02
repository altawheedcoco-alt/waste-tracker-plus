/**
 * ProactiveAlertsBanner - تنبيهات استباقية ذكية
 * يعرض تنبيهات بناءً على أنماط البيانات
 */
import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Clock, FileWarning, Truck, Trash2, ChevronLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface ProactiveAlert {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: 'warning' | 'critical' | 'info';
  actionPath?: string;
  actionLabel?: string;
}

const ALERT_ICONS: Record<string, typeof AlertTriangle> = {
  overdue_shipment: Truck,
  full_container: Trash2,
  pending_invoice: Clock,
  expiring_document: FileWarning,
};

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'bg-destructive/10 border-destructive/30 text-destructive',
  warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400',
  info: 'bg-primary/10 border-primary/30 text-primary',
};

async function countRows(table: string, orgId: string, extra?: Record<string, any>): Promise<number> {
  let query = (supabase as any).from(table).select('id', { count: 'exact', head: true }).eq('organization_id', orgId);
  if (extra) {
    for (const [method, args] of Object.entries(extra)) {
      query = query[method](...(Array.isArray(args) ? args : [args]));
    }
  }
  const { count } = await query;
  return count ?? 0;
}

const ProactiveAlertsBanner = memo(() => {
  const { organization } = useAuth();
  const navigate = useNavigate();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const { data: alerts = [] } = useQuery({
    queryKey: ['proactive-alerts', organization?.id],
    queryFn: async (): Promise<ProactiveAlert[]> => {
      if (!organization?.id) return [];
      const orgId = organization.id;
      const results: ProactiveAlert[] = [];

      // 1. Overdue shipments (>7 days old, not delivered/cancelled)
      const cutoff7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const overdueCount = await countRows('shipments', orgId, {
        lt: ['created_at', cutoff7d],
        neq: ['status', 'delivered'],
      });
      if (overdueCount > 0) {
        results.push({
          id: 'overdue-shipments',
          type: 'overdue_shipment',
          title: 'شحنات متأخرة',
          message: `${overdueCount} شحنة مر عليها أكثر من 7 أيام`,
          severity: overdueCount > 5 ? 'critical' : 'warning',
          actionPath: '/dashboard/shipments',
          actionLabel: 'عرض الشحنات',
        });
      }

      // 2. Full containers (>=80%)
      const fullCount = await countRows('containers', orgId, {
        gte: ['fill_level', 80],
      });
      if (fullCount > 0) {
        results.push({
          id: 'full-containers',
          type: 'full_container',
          title: 'حاويات ممتلئة',
          message: `${fullCount} حاوية وصلت 80%+ امتلاء`,
          severity: 'warning',
          actionPath: '/dashboard/containers',
          actionLabel: 'إدارة الحاويات',
        });
      }

      // 3. Old pending invoices (>30 days)
      const cutoff30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const invoiceCount = await countRows('invoices', orgId, {
        lt: ['created_at', cutoff30d],
        eq: ['status', 'pending'],
      });
      if (invoiceCount > 0) {
        results.push({
          id: 'pending-invoices',
          type: 'pending_invoice',
          title: 'فواتير معلقة',
          message: `${invoiceCount} فاتورة معلقة لأكثر من 30 يوم`,
          severity: invoiceCount > 3 ? 'critical' : 'warning',
          actionPath: '/dashboard/accounting',
          actionLabel: 'عرض الفواتير',
        });
      }

      return results;
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    enabled: !!organization?.id,
  });

  const visibleAlerts = alerts.filter(a => !dismissedIds.has(a.id));
  if (visibleAlerts.length === 0) return null;

  return (
    <div className="space-y-1 px-2 sm:px-4 py-1" dir="rtl">
      <AnimatePresence mode="popLayout">
        {visibleAlerts.slice(0, 3).map((alert) => {
          const Icon = ALERT_ICONS[alert.type] || AlertTriangle;
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={cn(
                'flex items-center gap-2 sm:gap-3 px-3 py-2 rounded-lg border text-xs sm:text-sm',
                SEVERITY_STYLES[alert.severity]
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="font-semibold">{alert.title}: </span>
                <span className="opacity-90">{alert.message}</span>
              </div>
              {alert.actionPath && (
                <button
                  onClick={() => navigate(alert.actionPath!)}
                  className="shrink-0 flex items-center gap-1 text-xs font-medium underline underline-offset-2 hover:opacity-80"
                >
                  {alert.actionLabel}
                  <ChevronLeft className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={() => setDismissedIds(prev => new Set(prev).add(alert.id))}
                className="shrink-0 p-1 rounded-full hover:bg-foreground/10"
                aria-label="إخفاء"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
});

ProactiveAlertsBanner.displayName = 'ProactiveAlertsBanner';
export default ProactiveAlertsBanner;
