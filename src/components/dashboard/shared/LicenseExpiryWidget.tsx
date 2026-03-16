import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Shield, ShieldAlert, ShieldX, Clock, AlertTriangle,
  CheckCircle2, ChevronLeft, FileText
} from 'lucide-react';
import { useLicenseExpiryAlerts, useLicenseAlertsSummary, type AlertSeverity } from '@/hooks/useLicenseExpiryAlerts';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ar as arLocale } from 'date-fns/locale';

const severityConfig: Record<AlertSeverity, { icon: React.ReactNode; bg: string; text: string; label: string }> = {
  expired: {
    icon: <ShieldX className="h-3.5 w-3.5" />,
    bg: 'bg-red-100 dark:bg-red-950/30 border-red-300 dark:border-red-800',
    text: 'text-red-800 dark:text-red-400',
    label: 'منتهي',
  },
  critical: {
    icon: <ShieldAlert className="h-3.5 w-3.5" />,
    bg: 'bg-orange-100 dark:bg-orange-950/30 border-orange-300 dark:border-orange-800',
    text: 'text-orange-800 dark:text-orange-400',
    label: 'حرج',
  },
  warning: {
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    bg: 'bg-amber-100 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800',
    text: 'text-amber-800 dark:text-amber-400',
    label: 'تحذير',
  },
  info: {
    icon: <Clock className="h-3.5 w-3.5" />,
    bg: 'bg-blue-100 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800',
    text: 'text-blue-800 dark:text-blue-400',
    label: 'متابعة',
  },
};

const LicenseExpiryWidget = () => {
  const { data: alerts = [], isLoading } = useLicenseExpiryAlerts();
  const summary = useLicenseAlertsSummary();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 space-y-2">
          <Skeleton className="h-5 w-36" />
          {[1, 2].map(i => <Skeleton key={i} className="h-14" />)}
        </CardContent>
      </Card>
    );
  }

  const hasAlerts = alerts.length > 0;

  return (
    <Card className={hasAlerts && summary.hasUrgent
      ? 'border-red-300 dark:border-red-800 bg-gradient-to-br from-red-50/30 to-orange-50/30 dark:from-red-950/10 dark:to-orange-950/10'
      : hasAlerts
        ? 'border-amber-200 dark:border-amber-800'
        : 'border-emerald-200 dark:border-emerald-800'
    }>
      <CardHeader className="pb-2 px-4 pt-3">
        <div className="flex items-center justify-between">
          {hasAlerts && (
            <div className="flex gap-1.5">
              {summary.expired > 0 && <Badge variant="destructive" className="text-[9px] h-4 px-1.5">{summary.expired} منتهي</Badge>}
              {summary.critical > 0 && <Badge className="bg-orange-500 text-[9px] h-4 px-1.5">{summary.critical} حرج</Badge>}
              {summary.warning > 0 && <Badge className="bg-amber-500 text-[9px] h-4 px-1.5">{summary.warning} تحذير</Badge>}
            </div>
          )}
          <CardTitle className="text-sm flex items-center gap-1.5">
            <span>مراقبة التراخيص</span>
            <Shield className="h-4 w-4 text-primary" />
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-3">
        {!hasAlerts ? (
          <div className="text-center py-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">جميع التراخيص سارية</p>
            <p className="text-[10px] text-muted-foreground">لا توجد تراخيص تنتهي خلال 90 يوم</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[220px]">
            <div className="space-y-2">
              {alerts.map(alert => {
                const config = severityConfig[alert.severity];
                return (
                  <div
                    key={alert.id}
                    className={`p-2.5 rounded-lg border ${config.bg} transition-all hover:shadow-sm`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className={`flex items-center gap-1 ${config.text}`}>
                        <Badge variant="outline" className={`text-[9px] h-4 px-1 ${config.text} border-current`}>
                          {alert.daysRemaining < 0
                            ? `منتهي منذ ${Math.abs(alert.daysRemaining)} يوم`
                            : `${alert.daysRemaining} يوم`}
                        </Badge>
                        {config.icon}
                      </div>
                      <div className="text-right flex-1">
                        <p className={`text-[11px] font-bold ${config.text}`}>{alert.licenseLabel}</p>
                        {alert.licenseNumber && (
                          <p className="text-[9px] text-muted-foreground font-mono">{alert.licenseNumber}</p>
                        )}
                        <p className="text-[9px] text-muted-foreground">
                          ينتهي: {format(parseISO(alert.expiryDate), 'dd MMM yyyy', { locale: arLocale })}
                        </p>
                      </div>
                    </div>
                    <p className={`text-[9px] mt-1 ${config.text}`}>{alert.actionRequired}</p>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full text-[10px] h-7 mt-2"
          onClick={() => navigate('/dashboard/permits')}
        >
          <ChevronLeft className="h-3 w-3 ml-1" />
          إدارة التراخيص والتصاريح
        </Button>
      </CardContent>
    </Card>
  );
};

export default LicenseExpiryWidget;
