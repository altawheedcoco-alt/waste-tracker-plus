import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, FileWarning, TrendingDown, ShieldAlert } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface OperationalAlert {
  id: string;
  type: 'overdue' | 'stale' | 'contract_expiry' | 'unpaid' | 'unverified';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  detail: string;
  timestamp: Date;
}

const OperationalAlertsWidget = () => {
  const { organization } = useAuth();
  const orgType = organization?.organization_type;

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['operational-alerts', organization?.id],
    queryFn: async (): Promise<OperationalAlert[]> => {
      const result: OperationalAlert[] = [];
      const now = new Date();
      const orgField = orgType === 'generator' ? 'generator_id'
        : orgType === 'recycler' ? 'recycler_id'
        : 'transporter_id';

      // 1. Stale shipments (pending > 48h)
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
          id: `stale-${s.id}`,
          type: 'stale',
          severity: 'warning',
          message: `شحنة ${s.shipment_number} معلّقة`,
          detail: `منذ ${formatDistanceToNow(new Date(s.created_at), { locale: ar })}`,
          timestamp: new Date(s.created_at),
        });
      });

      // 2. Contracts expiring soon (within 14 days)
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
          id: `contract-${c.id}`,
          type: 'contract_expiry',
          severity: 'critical',
          message: `عقد "${c.title}" ينتهي قريباً`,
          detail: `ينتهي ${formatDistanceToNow(new Date(c.end_date!), { locale: ar, addSuffix: true })}`,
          timestamp: new Date(c.end_date!),
        });
      });

      // 3. Overdue invoices
      const { data: overdueInvoices } = await supabase
        .from('invoices')
        .select('id, invoice_number, due_date')
        .eq('organization_id', organization!.id)
        .eq('status', 'overdue')
        .limit(5);

      overdueInvoices?.forEach(inv => {
        result.push({
          id: `invoice-${inv.id}`,
          type: 'unpaid',
          severity: 'critical',
          message: `فاتورة ${inv.invoice_number} متأخرة`,
          detail: inv.due_date ? `استحقت ${formatDistanceToNow(new Date(inv.due_date), { locale: ar, addSuffix: true })}` : '',
          timestamp: new Date(inv.due_date || now),
        });
      });

      // 4. Delayed shipments (past expected delivery date)
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
          id: `delayed-${s.id}`,
          type: 'overdue',
          severity: hoursLate > 48 ? 'critical' : 'warning',
          message: `شحنة ${s.shipment_number} متأخرة عن موعد التسليم`,
          detail: `متأخرة بـ ${formatDistanceToNow(expectedDate, { locale: ar })} (الحالة: ${s.status})`,
          timestamp: expectedDate,
        });
      });

      // 5. Unverified documents
      const { data: unverifiedDocs } = await supabase
        .from('organization_documents')
        .select('id, document_type, created_at')
        .eq('organization_id', organization!.id)
        .eq('verification_status', 'pending')
        .limit(3);

      unverifiedDocs?.forEach(doc => {
        result.push({
          id: `doc-${doc.id}`,
          type: 'unverified',
          severity: 'info',
          message: `وثيقة "${doc.document_type}" بانتظار التحقق`,
          detail: `مرفوعة ${formatDistanceToNow(new Date(doc.created_at), { locale: ar, addSuffix: true })}`,
          timestamp: new Date(doc.created_at),
        });
      });

      // Sort by severity then timestamp
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      return result.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
    },
    enabled: !!organization?.id,
    refetchInterval: 120000,
  });

  const severityIcon = {
    critical: <ShieldAlert className="w-4 h-4 text-red-600" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-600" />,
    info: <Clock className="w-4 h-4 text-blue-600" />,
  };

  const severityBadge = {
    critical: 'destructive' as const,
    warning: 'secondary' as const,
    info: 'outline' as const,
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-12 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0) return null;

  return (
    <Card className="border-amber-200 dark:border-amber-800/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <Badge variant="destructive" className="text-xs">{alerts.length}</Badge>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            تنبيهات تشغيلية
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1 text-right min-w-0">
                <p className="text-sm font-medium truncate">{alert.message}</p>
                <p className="text-xs text-muted-foreground">{alert.detail}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={severityBadge[alert.severity]} className="text-xs">
                  {alert.severity === 'critical' ? 'حرج' : alert.severity === 'warning' ? 'تحذير' : 'معلومة'}
                </Badge>
                {severityIcon[alert.severity]}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default OperationalAlertsWidget;
