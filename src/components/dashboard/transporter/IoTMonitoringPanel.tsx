import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wifi, Thermometer, Scale, Battery, Activity, Signal } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';

const IoTMonitoringPanel = () => {
  const { organization } = useAuth();

  const { data: devices = [] } = useQuery({
    queryKey: ['iot-devices', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('iot_devices')
        .select('*')
        .eq('organization_id', organization.id)
        .order('last_reading_at', { ascending: false });
      return data || [];
    },
    enabled: !!organization?.id,
    refetchInterval: 30_000, // Auto-refresh every 30s
  });

  const deviceTypeIcons: Record<string, any> = {
    temperature: Thermometer,
    weight: Scale,
    gps: Signal,
    fuel: Activity,
  };

  const deviceTypeLabels: Record<string, string> = {
    temperature: 'حساس حرارة',
    weight: 'حساس وزن',
    gps: 'جهاز تتبع',
    fuel: 'حساس وقود',
    camera: 'كاميرا ذكية',
  };

  const statusColors: Record<string, string> = {
    active: 'bg-emerald-500/10 text-emerald-600',
    offline: 'bg-muted text-muted-foreground',
    warning: 'bg-amber-500/10 text-amber-600',
    error: 'bg-destructive/10 text-destructive',
  };

  const activeDevices = devices.filter((d: any) => d.status === 'active').length;
  const offlineDevices = devices.filter((d: any) => d.status === 'offline').length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 text-center">
            <Wifi className="w-6 h-6 mx-auto mb-1 text-emerald-500" />
            <p className="text-2xl font-bold">{activeDevices}</p>
            <p className="text-xs text-muted-foreground">جهاز متصل</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Signal className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
            <p className="text-2xl font-bold">{offlineDevices}</p>
            <p className="text-xs text-muted-foreground">غير متصل</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Activity className="w-6 h-6 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{devices.length}</p>
            <p className="text-xs text-muted-foreground">إجمالي الأجهزة</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wifi className="w-5 h-5 text-primary" />
            أجهزة IoT المتصلة
          </CardTitle>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wifi className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>لا توجد أجهزة IoT مسجلة بعد</p>
              <p className="text-xs mt-1">سيتم عرض الأجهزة عند ربطها بالمركبات</p>
            </div>
          ) : (
            <div className="space-y-3">
              {devices.map((device: any) => {
                const Icon = deviceTypeIcons[device.device_type] || Wifi;
                return (
                  <div key={device.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{device.device_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {deviceTypeLabels[device.device_type] || device.device_type}
                          {device.device_serial && ` • ${device.device_serial}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {device.battery_level != null && (
                        <div className="flex items-center gap-1 text-xs">
                          <Battery className="w-3 h-3" />
                          {device.battery_level}%
                        </div>
                      )}
                      {device.last_reading && Object.keys(device.last_reading).length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {Object.entries(device.last_reading).map(([k, v]) => `${v}`).join(' | ')}
                        </Badge>
                      )}
                      <Badge variant="outline" className={statusColors[device.status]}>
                        {device.status === 'active' ? 'متصل' : device.status === 'offline' ? 'غير متصل' : device.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default IoTMonitoringPanel;
