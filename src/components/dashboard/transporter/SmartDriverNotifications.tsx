import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bell, MapPin, Clock, Wrench, AlertTriangle, FileX,
  Fuel, CheckCircle2, RefreshCw, Loader2, BellOff
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';

const alertIcons: Record<string, any> = {
  approaching_destination: MapPin,
  delay_warning: Clock,
  maintenance_due: Wrench,
  rest_reminder: AlertTriangle,
  document_expiry: FileX,
  fuel_reminder: Fuel,
};

const severityStyles: Record<string, string> = {
  info: 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20',
  warning: 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20',
  critical: 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20',
};

const severityBadge: Record<string, 'default' | 'secondary' | 'destructive'> = {
  info: 'secondary',
  warning: 'default',
  critical: 'destructive',
};

const SmartDriverNotifications = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['driver-smart-alerts', organization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('driver_smart_alerts')
        .select('*, driver:drivers(id, profile:profiles(full_name))')
        .eq('organization_id', organization!.id)
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id,
    refetchInterval: 30000,
  });

  const dismissAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('driver_smart_alerts')
        .update({ is_dismissed: true, is_read: true })
        .eq('id', alertId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-smart-alerts'] });
    },
  });

  const generateAlerts = async () => {
    if (!organization?.id) return;
    setIsGenerating(true);
    try {
      // Fetch drivers and their active shipments to generate smart alerts
      const { data: drivers } = await supabase
        .from('drivers')
        .select('id, license_expiry, is_available, profile:profiles(full_name)')
        .eq('organization_id', organization.id);

      if (!drivers?.length) {
        toast.info('لا يوجد سائقون لتوليد تنبيهات لهم');
        return;
      }

      const alertsToInsert: any[] = [];
      const now = new Date();

      for (const driver of drivers) {
        const profile = Array.isArray(driver.profile) ? driver.profile[0] : driver.profile;
        const driverName = profile?.full_name || 'سائق';

        // Check license expiry
        if (driver.license_expiry) {
          const expiry = new Date(driver.license_expiry);
          const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
            alertsToInsert.push({
              organization_id: organization.id,
              driver_id: driver.id,
              alert_type: 'document_expiry',
              title: `تنبيه انتهاء رخصة - ${driverName}`,
              message: `رخصة القيادة ستنتهي خلال ${daysUntilExpiry} يوم. يرجى التجديد قبل الموعد.`,
              severity: daysUntilExpiry <= 7 ? 'critical' : 'warning',
              expires_at: expiry.toISOString(),
            });
          }
        }

        // Check active shipments for delay warnings
        const { data: activeShipments } = await supabase
          .from('shipments')
          .select('id, shipment_number, expected_delivery_date, status')
          .eq('driver_id', driver.id)
          .in('status', ['in_transit', 'approved']);

        for (const shipment of activeShipments || []) {
          if (shipment.expected_delivery_date) {
            const expectedDate = new Date(shipment.expected_delivery_date);
            const hoursUntilDeadline = (expectedDate.getTime() - now.getTime()) / (1000 * 60 * 60);
            if (hoursUntilDeadline < 2 && hoursUntilDeadline > -24) {
              alertsToInsert.push({
                organization_id: organization.id,
                driver_id: driver.id,
                alert_type: 'delay_warning',
                title: `تحذير تأخر - ${shipment.shipment_number}`,
                message: hoursUntilDeadline > 0
                  ? `الشحنة متبقي عليها أقل من ${Math.ceil(hoursUntilDeadline)} ساعة للتسليم`
                  : `الشحنة متأخرة عن موعد التسليم المتوقع`,
                severity: hoursUntilDeadline <= 0 ? 'critical' : 'warning',
                shipment_id: shipment.id,
              });
            }
          }
        }

        // Maintenance reminder (check trip costs for high mileage)
        const { data: recentTrips } = await supabase
          .from('trip_costs')
          .select('distance_km')
          .eq('driver_id', driver.id)
          .eq('organization_id', organization.id)
          .gte('trip_date', new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

        const totalKm = (recentTrips || []).reduce((s, t) => s + (Number(t.distance_km) || 0), 0);
        if (totalKm > 5000) {
          alertsToInsert.push({
            organization_id: organization.id,
            driver_id: driver.id,
            alert_type: 'maintenance_due',
            title: `صيانة مستحقة - ${driverName}`,
            message: `قطع السائق ${totalKm.toLocaleString()} كم خلال 30 يوم. يُنصح بفحص المركبة.`,
            severity: totalKm > 10000 ? 'critical' : 'warning',
          });
        }
      }

      if (alertsToInsert.length > 0) {
        const { error } = await supabase.from('driver_smart_alerts').insert(alertsToInsert);
        if (error) throw error;
        toast.success(`تم توليد ${alertsToInsert.length} تنبيه ذكي`);
        queryClient.invalidateQueries({ queryKey: ['driver-smart-alerts'] });
      } else {
        toast.info('لا توجد تنبيهات جديدة — كل شيء على ما يرام ✅');
      }
    } catch (error) {
      console.error('Error generating alerts:', error);
      toast.error('حدث خطأ أثناء توليد التنبيهات');
    } finally {
      setIsGenerating(false);
    }
  };

  const unreadCount = alerts.filter((a: any) => !a.is_read).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Button size="sm" variant="outline" onClick={generateAlerts} disabled={isGenerating} className="gap-1">
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            فحص وتوليد
          </Button>
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="w-5 h-5 text-primary" />
              إشعارات السائقين الذكية
              {unreadCount > 0 && <Badge variant="destructive">{unreadCount}</Badge>}
            </CardTitle>
          </div>
        </div>
        <CardDescription className="text-right">تنبيهات استباقية للسائقين بناءً على البيانات التشغيلية</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center text-muted-foreground py-6">جاري التحميل...</div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <BellOff className="w-10 h-10 mx-auto text-muted-foreground/50" />
            <p className="text-muted-foreground text-sm">لا توجد تنبيهات حالياً</p>
            <Button size="sm" variant="outline" onClick={generateAlerts} disabled={isGenerating}>
              فحص الآن
            </Button>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2">
              {alerts.map((alert: any) => {
                const Icon = alertIcons[alert.alert_type] || Bell;
                const driverProfile = Array.isArray(alert.driver?.profile) ? alert.driver.profile[0] : alert.driver?.profile;
                return (
                  <div
                    key={alert.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${severityStyles[alert.severity] || severityStyles.info} ${!alert.is_read ? 'ring-1 ring-primary/20' : 'opacity-80'}`}
                  >
                    <Button
                      size="icon"
                      variant="ghost"
                      className="shrink-0 h-7 w-7"
                      onClick={() => dismissAlert.mutate(alert.id)}
                    >
                      <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <div className="flex-1 text-right space-y-1 min-w-0">
                      <div className="flex items-center gap-2 justify-end flex-wrap">
                        <Badge variant={severityBadge[alert.severity]} className="text-[10px]">
                          {alert.severity === 'critical' ? 'حرج' : alert.severity === 'warning' ? 'تحذير' : 'معلومة'}
                        </Badge>
                        <span className="text-sm font-medium truncate">{alert.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{alert.message}</p>
                      <div className="flex items-center gap-2 justify-end text-[10px] text-muted-foreground">
                        {driverProfile?.full_name && <span>{driverProfile.full_name}</span>}
                        <span>{formatDistanceToNow(new Date(alert.created_at), { locale: ar, addSuffix: true })}</span>
                      </div>
                    </div>
                    <div className={`shrink-0 p-2 rounded-full ${alert.severity === 'critical' ? 'bg-red-100 text-red-600 dark:bg-red-900/30' : alert.severity === 'warning' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartDriverNotifications;
