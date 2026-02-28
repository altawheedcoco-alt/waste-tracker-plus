import { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle, MapPin, CheckCircle2, Clock, Shield,
  Navigation, Truck, Bell, XCircle, Eye
} from 'lucide-react';
import { useGeofencing, GeofenceAlert } from '@/hooks/useGeofencing';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

const alertTypeConfig: Record<string, { icon: any; label: string; color: string }> = {
  entered_pickup: { icon: MapPin, label: 'وصول لمنطقة الاستلام', color: 'text-blue-600' },
  entered_delivery: { icon: Navigation, label: 'وصول لمنطقة التسليم', color: 'text-green-600' },
  unauthorized_dump: { icon: AlertTriangle, label: 'تفريغ في مكان غير معتمد', color: 'text-red-600' },
  route_deviation: { icon: Truck, label: 'انحراف عن المسار', color: 'text-orange-600' },
  signal_lost: { icon: XCircle, label: 'فقدان إشارة GPS', color: 'text-red-600' },
  eta_warning: { icon: Clock, label: 'تنبيه وقت الوصول', color: 'text-amber-600' },
  speed_violation: { icon: AlertTriangle, label: 'تجاوز السرعة', color: 'text-red-600' },
};

const severityBadge: Record<string, { variant: 'default' | 'secondary' | 'destructive'; label: string }> = {
  info: { variant: 'secondary', label: 'معلومة' },
  warning: { variant: 'default', label: 'تحذير' },
  critical: { variant: 'destructive', label: 'حرج' },
};

const GeofenceAlertsPanel = memo(() => {
  const { organization } = useAuth();
  const { alerts, isLoading, resolveAlert, criticalAlerts, warningAlerts, unresolvedCount } = useGeofencing(organization?.id);
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<string>('all');

  const filteredAlerts = filter === 'all' ? alerts : alerts.filter(a => a.severity === filter);

  const handleResolve = (alertId: string) => {
    resolveAlert.mutate({ alertId, notes: resolutionNotes[alertId] });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {criticalAlerts.length > 0 && (
              <Badge variant="destructive" className="animate-pulse gap-1">
                <AlertTriangle className="w-3 h-3" />
                {criticalAlerts.length} حرج
              </Badge>
            )}
            {warningAlerts.length > 0 && (
              <Badge variant="default" className="gap-1">
                <Bell className="w-3 h-3" />
                {warningAlerts.length} تحذير
              </Badge>
            )}
          </div>
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            تنبيهات النطاق الجغرافي
            {unresolvedCount > 0 && (
              <Badge variant="secondary" className="text-[10px]">{unresolvedCount}</Badge>
            )}
          </CardTitle>
        </div>
        <CardDescription className="text-right">مراقبة مواقع السائقين والتنبيهات الجغرافية</CardDescription>
        
        {/* Filter buttons */}
        <div className="flex gap-1 justify-end mt-2">
          {['all', 'critical', 'warning', 'info'].map(f => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-7"
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'الكل' : f === 'critical' ? 'حرج' : f === 'warning' ? 'تحذير' : 'معلومات'}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">جاري التحميل...</div>
        ) : filteredAlerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">لا توجد تنبيهات نشطة</p>
            <p className="text-xs text-muted-foreground mt-1">جميع السائقين في النطاق المعتمد</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <AnimatePresence>
              <div className="space-y-2">
                {filteredAlerts.map((alert, i) => {
                  const config = alertTypeConfig[alert.alert_type] || alertTypeConfig.eta_warning;
                  const severity = severityBadge[alert.severity] || severityBadge.info;
                  const Icon = config.icon;

                  return (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: i * 0.03 }}
                      className={cn(
                        'p-3 rounded-lg border transition-all',
                        alert.severity === 'critical' && 'bg-destructive/5 border-destructive/30',
                        alert.severity === 'warning' && 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/30',
                        alert.severity === 'info' && 'bg-muted/50',
                      )}
                      dir="rtl"
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn('mt-0.5 shrink-0', config.color)}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 justify-between">
                            <Badge variant={severity.variant} className="text-[10px]">{severity.label}</Badge>
                            <span className="text-sm font-medium">{config.label}</span>
                          </div>
                          {alert.message && (
                            <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                            <span>{format(new Date(alert.created_at), 'PPp', { locale: ar })}</span>
                            {alert.distance_meters && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {Math.round(alert.distance_meters)}م
                              </span>
                            )}
                          </div>
                          
                          {/* Resolution */}
                          <div className="flex items-center gap-2 mt-2">
                            <Input
                              placeholder="ملاحظات المعالجة..."
                              value={resolutionNotes[alert.id] || ''}
                              onChange={e => setResolutionNotes(prev => ({ ...prev, [alert.id]: e.target.value }))}
                              className="h-7 text-xs flex-1"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs shrink-0"
                              onClick={() => handleResolve(alert.id)}
                              disabled={resolveAlert.isPending}
                            >
                              <CheckCircle2 className="w-3 h-3 ml-1" />
                              معالجة
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </AnimatePresence>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
});

GeofenceAlertsPanel.displayName = 'GeofenceAlertsPanel';
export default GeofenceAlertsPanel;
