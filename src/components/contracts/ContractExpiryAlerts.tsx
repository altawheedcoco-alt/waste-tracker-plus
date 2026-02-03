import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useContractAlerts } from '@/hooks/useContractAlerts';
import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  AlertTriangle,
  Clock,
  FileText,
  Bell,
  ChevronLeft,
  CalendarX,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContractExpiryAlertsProps {
  organizationId: string | null;
  showNotifications?: boolean;
  compact?: boolean;
}

export const ContractExpiryAlerts = ({
  organizationId,
  showNotifications = true,
  compact = false,
}: ContractExpiryAlertsProps) => {
  const navigate = useNavigate();
  const {
    alerts,
    summary,
    isLoading,
    showExpiryNotifications,
    getContractsByUrgency,
  } = useContractAlerts({
    organizationId,
    alertDays: 30,
  });

  useEffect(() => {
    if (showNotifications && alerts.length > 0) {
      showExpiryNotifications();
    }
  }, [alerts.length, showNotifications, showExpiryNotifications]);

  const urgencyGroups = getContractsByUrgency();

  const getUrgencyColor = (daysRemaining: number) => {
    if (daysRemaining < 0) return 'bg-destructive/10 text-destructive border-destructive/20';
    if (daysRemaining <= 7) return 'bg-red-500/10 text-red-600 border-red-500/20';
    if (daysRemaining <= 14) return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
    return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
  };

  const getUrgencyBadge = (daysRemaining: number) => {
    if (daysRemaining < 0) {
      return <Badge variant="destructive">منتهي</Badge>;
    }
    if (daysRemaining <= 7) {
      return <Badge variant="destructive">حرج</Badge>;
    }
    if (daysRemaining <= 14) {
      return <Badge className="bg-orange-500">تحذير</Badge>;
    }
    return <Badge variant="secondary">إشعار</Badge>;
  };

  if (isLoading) {
    return (
      <Card className={cn(compact && 'border-0 shadow-none')}>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {alerts.slice(0, 3).map(alert => (
          <div
            key={alert.id}
            className={cn(
              'flex items-center justify-between p-3 rounded-lg border',
              getUrgencyColor(alert.daysRemaining)
            )}
          >
            <div className="flex items-center gap-2">
              {alert.daysRemaining < 0 ? (
                <CalendarX className="h-4 w-4" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
              <span className="text-sm font-medium truncate max-w-[150px]">
                {alert.title}
              </span>
            </div>
            <span className="text-xs">
              {alert.daysRemaining < 0
                ? `منتهي منذ ${Math.abs(alert.daysRemaining)} يوم`
                : `${alert.daysRemaining} يوم`}
            </span>
          </div>
        ))}
        {alerts.length > 3 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => navigate('/dashboard/contracts')}
          >
            عرض الكل ({alerts.length})
            <ChevronLeft className="h-4 w-4 mr-1" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-5 w-5 text-orange-500" />
            تنبيهات العقود
          </CardTitle>
          <div className="flex gap-2">
            {summary.expired > 0 && (
              <Badge variant="destructive">{summary.expired} منتهي</Badge>
            )}
            {summary.critical > 0 && (
              <Badge className="bg-red-500">{summary.critical} حرج</Badge>
            )}
            {summary.expiringSoon > 0 && (
              <Badge variant="secondary">{summary.expiringSoon} قريباً</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3">
            {/* Expired Contracts */}
            {urgencyGroups.expired.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-destructive flex items-center gap-2">
                  <CalendarX className="h-4 w-4" />
                  عقود منتهية ({urgencyGroups.expired.length})
                </h4>
                {urgencyGroups.expired.map(alert => (
                  <ContractAlertItem
                    key={alert.id}
                    alert={alert}
                    onView={() => navigate('/dashboard/contracts')}
                  />
                ))}
              </div>
            )}

            {/* Critical Contracts */}
            {urgencyGroups.critical.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-red-600 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  عقود حرجة ({urgencyGroups.critical.length})
                </h4>
                {urgencyGroups.critical.map(alert => (
                  <ContractAlertItem
                    key={alert.id}
                    alert={alert}
                    onView={() => navigate('/dashboard/contracts')}
                  />
                ))}
              </div>
            )}

            {/* Warning Contracts */}
            {urgencyGroups.warning.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-orange-600 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  عقود تحذيرية ({urgencyGroups.warning.length})
                </h4>
                {urgencyGroups.warning.map(alert => (
                  <ContractAlertItem
                    key={alert.id}
                    alert={alert}
                    onView={() => navigate('/dashboard/contracts')}
                  />
                ))}
              </div>
            )}

            {/* Notice Contracts */}
            {urgencyGroups.notice.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-yellow-600 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  إشعارات ({urgencyGroups.notice.length})
                </h4>
                {urgencyGroups.notice.map(alert => (
                  <ContractAlertItem
                    key={alert.id}
                    alert={alert}
                    onView={() => navigate('/dashboard/contracts')}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

interface ContractAlertItemProps {
  alert: {
    id: string;
    title: string;
    contractNumber: string;
    endDate: string;
    daysRemaining: number;
    partnerName: string | null;
  };
  onView: () => void;
}

const ContractAlertItem = ({ alert, onView }: ContractAlertItemProps) => {
  const getUrgencyColor = (days: number) => {
    if (days < 0) return 'border-destructive/30 bg-destructive/5';
    if (days <= 7) return 'border-red-500/30 bg-red-500/5';
    if (days <= 14) return 'border-orange-500/30 bg-orange-500/5';
    return 'border-yellow-500/30 bg-yellow-500/5';
  };

  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-shadow',
        getUrgencyColor(alert.daysRemaining)
      )}
      onClick={onView}
    >
      <div className="space-y-1">
        <p className="font-medium text-sm">{alert.title}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{alert.contractNumber}</span>
          {alert.partnerName && (
            <>
              <span>•</span>
              <span>{alert.partnerName}</span>
            </>
          )}
        </div>
      </div>
      <div className="text-left">
        <p className="text-sm font-medium">
          {alert.daysRemaining < 0
            ? `منتهي منذ ${Math.abs(alert.daysRemaining)} يوم`
            : `${alert.daysRemaining} يوم متبقي`}
        </p>
        <p className="text-xs text-muted-foreground">
          {format(parseISO(alert.endDate), 'dd MMM yyyy', { locale: ar })}
        </p>
      </div>
    </div>
  );
};
