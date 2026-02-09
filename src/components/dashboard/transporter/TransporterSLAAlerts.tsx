import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TransporterShipment } from '@/hooks/useTransporterDashboard';
import { formatDistanceToNow, differenceInHours } from 'date-fns';
import { ar } from 'date-fns/locale';

interface TransporterSLAAlertsProps {
  shipments: TransporterShipment[];
}

interface SLAAlert {
  shipment: TransporterShipment;
  type: 'overdue' | 'warning';
  message: string;
  hoursRemaining: number;
}

const TransporterSLAAlerts = ({ shipments }: TransporterSLAAlertsProps) => {
  const navigate = useNavigate();

  const alerts = useMemo<SLAAlert[]>(() => {
    const now = new Date();
    const result: SLAAlert[] = [];
    const activeStatuses = ['new', 'approved', 'in_transit'];

    shipments.forEach(s => {
      if (!activeStatuses.includes(s.status) || !s.expected_delivery_date) return;

      const deadline = new Date(s.expected_delivery_date);
      const hoursRemaining = differenceInHours(deadline, now);

      if (hoursRemaining < 0) {
        result.push({
          shipment: s,
          type: 'overdue',
          message: `متأخرة بـ ${formatDistanceToNow(deadline, { locale: ar })}`,
          hoursRemaining,
        });
      } else if (hoursRemaining <= 24) {
        result.push({
          shipment: s,
          type: 'warning',
          message: `متبقي ${formatDistanceToNow(deadline, { locale: ar, addSuffix: false })}`,
          hoursRemaining,
        });
      }
    });

    return result.sort((a, b) => a.hoursRemaining - b.hoursRemaining);
  }, [shipments]);

  if (alerts.length === 0) return null;

  const overdueCount = alerts.filter(a => a.type === 'overdue').length;
  const warningCount = alerts.filter(a => a.type === 'warning').length;

  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {overdueCount > 0 && (
              <Badge variant="destructive" className="text-xs">{overdueCount} متأخرة</Badge>
            )}
            {warningCount > 0 && (
              <Badge className="bg-amber-500 text-white text-xs">{warningCount} تحذير</Badge>
            )}
          </div>
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            تنبيهات مواعيد التسليم
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.slice(0, 5).map((alert) => (
          <motion.div
            key={alert.shipment.id}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              alert.type === 'overdue'
                ? 'bg-destructive/10 border-destructive/30'
                : 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
            }`}
          >
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => navigate(`/dashboard/shipments/${alert.shipment.id}`)}
            >
              <ExternalLink className="ml-1 h-3 w-3" />
              عرض
            </Button>
            <div className="flex items-center gap-3 text-right">
              <div>
                <div className="flex items-center gap-2 justify-end">
                  <span className="font-medium text-sm">{alert.shipment.shipment_number}</span>
                  {alert.type === 'overdue' ? (
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-600" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {alert.message} • {alert.shipment.generator?.name || '-'} → {alert.shipment.recycler?.name || '-'}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
        {alerts.length > 5 && (
          <p className="text-xs text-center text-muted-foreground pt-1">
            و {alerts.length - 5} تنبيهات أخرى
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default TransporterSLAAlerts;
