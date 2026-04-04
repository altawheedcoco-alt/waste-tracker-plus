import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { FraudAlert } from '@/hooks/useFuelCalculations';

interface Props {
  alerts: FraudAlert[];
}

const SEVERITY_CONFIG = {
  red: { icon: AlertCircle, color: 'bg-destructive/10 text-destructive border-destructive/20', badge: 'destructive' as const, label: 'حرج' },
  yellow: { icon: AlertTriangle, color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20', badge: 'secondary' as const, label: 'تحذير' },
  green: { icon: CheckCircle2, color: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20', badge: 'outline' as const, label: 'طبيعي' },
};

const TYPE_LABELS: Record<string, string> = {
  overconsumption: 'استهلاك زائد',
  duplicate_fill: 'تعبئة مكررة',
  location_mismatch: 'موقع مشبوه',
  odometer_rollback: 'تلاعب بالعداد',
};

const FuelFraudDetector = ({ alerts }: Props) => {
  const redCount = alerts.filter(a => a.severity === 'red').length;
  const yellowCount = alerts.filter(a => a.severity === 'yellow').length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          كشف التلاعب والاحتيال
          {redCount > 0 && <Badge variant="destructive" className="text-[10px]">{redCount} حرج</Badge>}
          {yellowCount > 0 && <Badge variant="secondary" className="text-[10px]">{yellowCount} تحذير</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-green-700 dark:text-green-400">لا توجد تنبيهات — كل شيء طبيعي</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {alerts.slice(0, 20).map((alert, i) => {
              const config = SEVERITY_CONFIG[alert.severity];
              const Icon = config.icon;
              return (
                <div key={i} className={`p-2.5 rounded-lg border ${config.color} flex items-start gap-2`}>
                  <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant={config.badge} className="text-[9px]">{TYPE_LABELS[alert.type] || alert.type}</Badge>
                      <Badge variant={config.badge} className="text-[9px]">{config.label}</Badge>
                    </div>
                    <p className="text-xs mt-1">{alert.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FuelFraudDetector;
