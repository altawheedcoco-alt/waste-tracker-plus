import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Radio, MapPin, Activity, Clock, Battery, Signal, 
  RefreshCw, AlertTriangle, CheckCircle, Car, Wifi, WifiOff,
  Navigation, Gauge, ThermometerSun
} from 'lucide-react';
import { useGPSDevices } from '@/hooks/useGPSDevices';
import { GPSDevice } from '@/types/gpsTracking';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const GPSTrackingDashboard: React.FC = () => {
  const { devices, refreshDevices, isLoading } = useGPSDevices();
  const [selectedDevice, setSelectedDevice] = useState<GPSDevice | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshDevices();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshDevices]);

  const getDeviceStatus = (device: GPSDevice): 'online' | 'idle' | 'offline' => {
    if (!device.last_ping_at) return 'offline';
    
    const lastPing = new Date(device.last_ping_at);
    const minutesAgo = (Date.now() - lastPing.getTime()) / 60000;

    if (minutesAgo < 5) return 'online';
    if (minutesAgo < 30) return 'idle';
    return 'offline';
  };

  const onlineDevices = devices.filter(d => getDeviceStatus(d) === 'online');
  const idleDevices = devices.filter(d => getDeviceStatus(d) === 'idle');
  const offlineDevices = devices.filter(d => getDeviceStatus(d) === 'offline');

  const getStatusBadge = (status: 'online' | 'idle' | 'offline') => {
    switch (status) {
      case 'online':
        return <Badge className="bg-primary text-primary-foreground"><Wifi className="w-3 h-3 ml-1" />متصل</Badge>;
      case 'idle':
        return <Badge variant="outline"><Clock className="w-3 h-3 ml-1" />خامل</Badge>;
      case 'offline':
        return <Badge variant="destructive"><WifiOff className="w-3 h-3 ml-1" />غير متصل</Badge>;
    }
  };

  const DeviceCard: React.FC<{ device: GPSDevice }> = ({ device }) => {
    const status = getDeviceStatus(device);
    const isSelected = selectedDevice?.id === device.id;

    return (
      <Card 
        className={cn(
          'cursor-pointer transition-all hover:shadow-md',
          isSelected && 'ring-2 ring-primary',
          status === 'online' && 'border-primary/30',
          status === 'offline' && 'opacity-60'
        )}
        onClick={() => setSelectedDevice(device)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                status === 'online' ? 'bg-primary/10' : 'bg-muted'
              )}>
                <Radio className={cn(
                  'w-5 h-5',
                  status === 'online' ? 'text-primary' : 'text-muted-foreground'
                )} />
              </div>
              <div>
                <p className="font-medium">{device.device_name}</p>
                <p className="text-xs text-muted-foreground">{device.device_serial}</p>
              </div>
            </div>
            {getStatusBadge(status)}
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            {device.last_location && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span className="truncate">
                  {device.last_location.lat.toFixed(4)}, {device.last_location.lng.toFixed(4)}
                </span>
              </div>
            )}
            {device.last_ping_at && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>
                  {formatDistanceToNow(new Date(device.last_ping_at), { addSuffix: true, locale: ar })}
                </span>
              </div>
            )}
          </div>

          {(device.battery_level || device.signal_strength) && (
            <div className="flex items-center gap-4 mt-3 pt-3 border-t">
              {device.battery_level !== null && (
                <div className="flex items-center gap-2 flex-1">
                  <Battery className="w-4 h-4 text-muted-foreground" />
                  <Progress 
                    value={device.battery_level} 
                    className={cn(
                      'h-2',
                      device.battery_level < 20 && '[&>div]:bg-destructive'
                    )}
                  />
                  <span className="text-xs">{device.battery_level}%</span>
                </div>
              )}
              {device.signal_strength !== null && (
                <div className="flex items-center gap-1">
                  <Signal className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs">{device.signal_strength}%</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-primary/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">متصل الآن</p>
                <p className="text-3xl font-bold text-primary">{onlineDevices.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Wifi className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">خامل</p>
                <p className="text-3xl font-bold text-amber-500">{idleDevices.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">غير متصل</p>
                <p className="text-3xl font-bold text-destructive">{offlineDevices.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <WifiOff className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الأجهزة</p>
                <p className="text-3xl font-bold">{devices.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Radio className="w-6 h-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Devices List */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  أجهزة GPS المتصلة
                </CardTitle>
                <CardDescription>
                  عرض حالة جميع أجهزة GPS في الوقت الفعلي
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={autoRefresh ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                >
                  <RefreshCw className={cn('w-4 h-4 ml-1', autoRefresh && 'animate-spin')} />
                  {autoRefresh ? 'تحديث تلقائي' : 'تحديث يدوي'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="space-y-4">
              <TabsList>
                <TabsTrigger value="all">الكل ({devices.length})</TabsTrigger>
                <TabsTrigger value="online">متصل ({onlineDevices.length})</TabsTrigger>
                <TabsTrigger value="idle">خامل ({idleDevices.length})</TabsTrigger>
                <TabsTrigger value="offline">غير متصل ({offlineDevices.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <ScrollArea className="h-[500px]">
                  <div className="grid gap-4 md:grid-cols-2">
                    {devices.map((device) => (
                      <DeviceCard key={device.id} device={device} />
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="online">
                <ScrollArea className="h-[500px]">
                  <div className="grid gap-4 md:grid-cols-2">
                    {onlineDevices.map((device) => (
                      <DeviceCard key={device.id} device={device} />
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="idle">
                <ScrollArea className="h-[500px]">
                  <div className="grid gap-4 md:grid-cols-2">
                    {idleDevices.map((device) => (
                      <DeviceCard key={device.id} device={device} />
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="offline">
                <ScrollArea className="h-[500px]">
                  <div className="grid gap-4 md:grid-cols-2">
                    {offlineDevices.map((device) => (
                      <DeviceCard key={device.id} device={device} />
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Device Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radio className="w-5 h-5" />
              تفاصيل الجهاز
            </CardTitle>
            <CardDescription>
              معلومات تفصيلية عن الجهاز المحدد
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedDevice ? (
              <div className="space-y-6">
                {/* Device Header */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Radio className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{selectedDevice.device_name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedDevice.device_serial}</p>
                    {getStatusBadge(getDeviceStatus(selectedDevice))}
                  </div>
                </div>

                {/* Device Info */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm text-muted-foreground">النوع</span>
                    <Badge variant="outline">{selectedDevice.device_type}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm text-muted-foreground">البروتوكول</span>
                    <Badge>{selectedDevice.protocol.toUpperCase()}</Badge>
                  </div>
                </div>

                {/* Location */}
                {selectedDevice.last_location && (
                  <div className="p-4 rounded-lg border space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      آخر موقع
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">خط العرض</p>
                        <p className="font-mono">{selectedDevice.last_location.lat.toFixed(6)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">خط الطول</p>
                        <p className="font-mono">{selectedDevice.last_location.lng.toFixed(6)}</p>
                      </div>
                      {selectedDevice.last_location.speed !== undefined && (
                        <div className="flex items-center gap-2">
                          <Gauge className="w-4 h-4 text-muted-foreground" />
                          <span>{selectedDevice.last_location.speed} كم/س</span>
                        </div>
                      )}
                      {selectedDevice.last_location.heading !== undefined && (
                        <div className="flex items-center gap-2">
                          <Navigation className="w-4 h-4 text-muted-foreground" />
                          <span>{selectedDevice.last_location.heading}°</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Battery & Signal */}
                <div className="space-y-3">
                  {selectedDevice.battery_level !== null && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <Battery className="w-4 h-4" />
                          البطارية
                        </span>
                        <span className={cn(
                          'font-medium',
                          selectedDevice.battery_level < 20 && 'text-destructive'
                        )}>
                          {selectedDevice.battery_level}%
                        </span>
                      </div>
                      <Progress 
                        value={selectedDevice.battery_level} 
                        className={cn(
                          'h-2',
                          selectedDevice.battery_level < 20 && '[&>div]:bg-destructive'
                        )}
                      />
                    </div>
                  )}

                  {selectedDevice.signal_strength !== null && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <Signal className="w-4 h-4" />
                          قوة الإشارة
                        </span>
                        <span className="font-medium">{selectedDevice.signal_strength}%</span>
                      </div>
                      <Progress value={selectedDevice.signal_strength} className="h-2" />
                    </div>
                  )}
                </div>

                {/* Last Update */}
                {selectedDevice.last_ping_at && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">آخر تحديث:</span>
                    <span>
                      {formatDistanceToNow(new Date(selectedDevice.last_ping_at), { addSuffix: true, locale: ar })}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Radio className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>اختر جهاز لعرض التفاصيل</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GPSTrackingDashboard;
