import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Radio, Car, Smartphone, MapPin, Activity, Settings, 
  Eye, Lock, AlertTriangle, CheckCircle, Wifi, WifiOff,
  Clock, Gauge, Navigation, Battery, Signal, RefreshCw,
  Link, Unlink, Loader2, Info
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useGPSDevices } from '@/hooks/useGPSDevices';
import { useHybridTracking } from '@/hooks/useHybridTracking';
import { TrackingSource, TRACKING_SOURCE_OPTIONS, GPSDevice } from '@/types/gpsTracking';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ShipmentGPSTrackingPanelProps {
  shipmentId: string;
  driverId: string | null;
  transporterId: string | null;
  generatorId: string | null;
  recyclerId: string | null;
  shipmentStatus: string;
  onLocationUpdate?: (lat: number, lng: number) => void;
}

const ShipmentGPSTrackingPanel: React.FC<ShipmentGPSTrackingPanelProps> = ({
  shipmentId,
  driverId,
  transporterId,
  generatorId,
  recyclerId,
  shipmentStatus,
  onLocationUpdate,
}) => {
  const { profile, roles, organization } = useAuth();
  const { devices, refreshDevices } = useGPSDevices();
  const {
    config,
    hybridData,
    linkedDevice,
    isLoading,
    setTrackingSource,
    getCurrentLocation,
    refreshConfig,
  } = useHybridTracking({
    shipmentId,
    driverId,
    enabled: true,
  });

  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);

  // تحديد صلاحيات المستخدم
  const isAdmin = roles.includes('admin');
  const isTransporter = organization?.id === transporterId;
  const isGenerator = organization?.id === generatorId;
  const isRecycler = organization?.id === recyclerId;
  const isDriver = roles.includes('driver');

  // التحكم الكامل للناقل والمدير فقط
  const canControl = isAdmin || isTransporter;
  // الرؤية للجميع (المولد والمدور والسائق)
  const canView = canControl || isGenerator || isRecycler || isDriver;

  // الأجهزة المتاحة للربط (التابعة لنفس المنظمة)
  const availableDevices = devices.filter(d => !d.driver_id || d.driver_id === driverId);

  // تحديث الموقع عند التغيير
  useEffect(() => {
    const location = getCurrentLocation();
    if (location && onLocationUpdate) {
      onLocationUpdate(location.lat, location.lng);
    }
  }, [hybridData, getCurrentLocation, onLocationUpdate]);

  const handleSourceChange = async (source: TrackingSource) => {
    if (!canControl) {
      toast.error('ليس لديك صلاحية تغيير إعدادات التتبع');
      return;
    }

    let deviceId: string | null = null;
    if (source === 'gps_device' || source === 'hybrid') {
      deviceId = selectedDeviceId || linkedDevice?.id || null;
    }

    await setTrackingSource(source, deviceId);
  };

  const handleDeviceLink = async (deviceId: string) => {
    if (!canControl) {
      toast.error('ليس لديك صلاحية ربط الأجهزة');
      return;
    }

    setSelectedDeviceId(deviceId);
    
    if (config?.tracking_source) {
      await setTrackingSource(config.tracking_source, deviceId);
    }
  };

  const getStatusBadge = (device: GPSDevice) => {
    if (!device.last_ping_at) {
      return <Badge variant="secondary"><WifiOff className="w-3 h-3 ml-1" />غير متصل</Badge>;
    }
    const lastPing = new Date(device.last_ping_at);
    const minutesAgo = (Date.now() - lastPing.getTime()) / 60000;
    if (minutesAgo < 5) {
      return <Badge className="bg-primary text-primary-foreground"><Wifi className="w-3 h-3 ml-1" />متصل</Badge>;
    }
    return <Badge variant="outline"><Clock className="w-3 h-3 ml-1" />خامل</Badge>;
  };

  if (!canView) {
    return (
      <Alert>
        <Lock className="h-4 w-4" />
        <AlertTitle>الوصول مقيد</AlertTitle>
        <AlertDescription>
          ليس لديك صلاحية عرض بيانات التتبع لهذه الشحنة.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">تتبع GPS المركبة</CardTitle>
              <CardDescription>
                {canControl ? 'إدارة وتحكم في تتبع الشحنة' : 'عرض بيانات التتبع المباشر'}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canControl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="w-4 h-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={refreshConfig}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* شارة الصلاحيات */}
        <div className="flex items-center gap-2 mt-2">
          {canControl ? (
            <Badge variant="outline" className="gap-1">
              <Settings className="w-3 h-3" />
              تحكم كامل
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <Eye className="w-3 h-3" />
              عرض فقط
            </Badge>
          )}
          {isGenerator && <Badge variant="outline">المولد</Badge>}
          {isRecycler && <Badge variant="outline">المدور</Badge>}
          {isTransporter && <Badge className="bg-primary text-primary-foreground">الناقل</Badge>}
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="pt-4 space-y-4">
        {/* حالة التتبع الحالية */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* نوع التتبع */}
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Radio className="w-4 h-4" />
              نوع التتبع
            </div>
            <div className="font-medium">
              {config?.tracking_source === 'mobile' && 'تتبع الموبايل'}
              {config?.tracking_source === 'gps_device' && 'جهاز GPS السيارة'}
              {config?.tracking_source === 'hybrid' && 'تتبع مدمج'}
              {!config && 'غير مُعد'}
            </div>
          </div>

          {/* الموقع الحالي */}
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              الموقع الحالي
            </div>
            <div className="font-medium font-mono text-sm">
              {getCurrentLocation() ? (
                <>
                  {getCurrentLocation()!.lat.toFixed(4)}, {getCurrentLocation()!.lng.toFixed(4)}
                </>
              ) : (
                <span className="text-muted-foreground">غير متوفر</span>
              )}
            </div>
          </div>

          {/* حالة الانحراف (للتتبع المدمج) */}
          {config?.tracking_source === 'hybrid' && (
            <div className={cn(
              "p-4 rounded-lg space-y-2",
              hybridData.anomaly_detected 
                ? "bg-destructive/10 border border-destructive/30" 
                : "bg-muted/50"
            )}>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="w-4 h-4" />
                الانحراف
              </div>
              <div className="font-medium">
                {hybridData.deviation_meters !== null ? (
                  <span className={hybridData.anomaly_detected ? "text-destructive" : ""}>
                    {hybridData.deviation_meters} متر
                    {hybridData.anomaly_detected && " - تنبيه!"}
                  </span>
                ) : (
                  <span className="text-muted-foreground">جاري الحساب...</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* بيانات المصادر */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* بيانات الموبايل */}
          <div className="p-4 rounded-lg border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-primary" />
                <span className="font-medium">تتبع الموبايل</span>
              </div>
              {hybridData.mobile ? (
                <Badge className="bg-primary text-primary-foreground">نشط</Badge>
              ) : (
                <Badge variant="secondary">غير متصل</Badge>
              )}
            </div>
            {hybridData.mobile && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  {hybridData.mobile.lat.toFixed(4)}, {hybridData.mobile.lng.toFixed(4)}
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(hybridData.mobile.timestamp, { addSuffix: true, locale: ar })}
                </div>
              </div>
            )}
          </div>

          {/* بيانات جهاز GPS */}
          <div className="p-4 rounded-lg border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-primary" />
                <span className="font-medium">جهاز GPS السيارة</span>
              </div>
              {linkedDevice ? (
                getStatusBadge(linkedDevice)
              ) : (
                <Badge variant="outline">غير مربوط</Badge>
              )}
            </div>
            {linkedDevice && (
              <div className="space-y-2">
                <p className="text-sm font-medium">{linkedDevice.device_name}</p>
                <p className="text-xs text-muted-foreground">{linkedDevice.device_serial}</p>
                {hybridData.gps_device && (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {hybridData.gps_device.lat.toFixed(4)}, {hybridData.gps_device.lng.toFixed(4)}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(hybridData.gps_device.timestamp, { addSuffix: true, locale: ar })}
                    </div>
                  </div>
                )}
                {linkedDevice.battery_level !== null && (
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Battery className={cn(
                        "w-3 h-3",
                        linkedDevice.battery_level < 20 ? "text-destructive" : "text-muted-foreground"
                      )} />
                      {linkedDevice.battery_level}%
                    </div>
                    {linkedDevice.signal_strength !== null && (
                      <div className="flex items-center gap-1">
                        <Signal className="w-3 h-3 text-muted-foreground" />
                        {linkedDevice.signal_strength}%
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* إعدادات التحكم - للناقل والمدير فقط */}
        {canControl && showSettings && (
          <>
            <Separator />
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Settings className="w-4 h-4" />
                إعدادات التتبع
              </h4>

              {/* اختيار نوع التتبع */}
              <div className="space-y-3">
                <Label>نوع التتبع</Label>
                <div className="grid gap-3 md:grid-cols-3">
                  {TRACKING_SOURCE_OPTIONS.map((option) => (
                    <div
                      key={option.value}
                      onClick={() => handleSourceChange(option.value)}
                      className={cn(
                        "p-4 rounded-lg border cursor-pointer transition-all",
                        config?.tracking_source === option.value
                          ? "border-primary bg-primary/5"
                          : "hover:border-muted-foreground/30"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {option.value === 'mobile' && <Smartphone className="w-5 h-5" />}
                        {option.value === 'gps_device' && <Radio className="w-5 h-5" />}
                        {option.value === 'hybrid' && <Activity className="w-5 h-5" />}
                        <span className="font-medium">{option.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ربط جهاز GPS */}
              {(config?.tracking_source === 'gps_device' || config?.tracking_source === 'hybrid') && (
                <div className="space-y-3">
                  <Label>جهاز GPS المركبة</Label>
                  <Select
                    value={linkedDevice?.id || selectedDeviceId}
                    onValueChange={handleDeviceLink}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر جهاز GPS" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDevices.map((device) => (
                        <SelectItem key={device.id} value={device.id}>
                          <div className="flex items-center gap-2">
                            <Radio className="w-4 h-4" />
                            <span>{device.device_name}</span>
                            <Badge variant="outline" className="text-xs">
                              {device.device_type}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                      {availableDevices.length === 0 && (
                        <div className="p-4 text-center text-muted-foreground text-sm">
                          لا توجد أجهزة متاحة
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* خيارات إضافية */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <Label>كشف الانحرافات</Label>
                    <p className="text-xs text-muted-foreground">تنبيه عند وجود فرق كبير بين المصادر</p>
                  </div>
                  <Switch
                    checked={config?.anomaly_detection_enabled ?? true}
                    onCheckedChange={async (checked) => {
                      if (config) {
                        await setTrackingSource(
                          config.tracking_source as TrackingSource,
                          config.gps_device_id,
                          { anomaly_detection_enabled: checked }
                        );
                      }
                    }}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <Label>التحويل التلقائي</Label>
                    <p className="text-xs text-muted-foreground">التبديل للمصدر البديل عند انقطاع الأساسي</p>
                  </div>
                  <Switch
                    checked={config?.fallback_enabled ?? true}
                    onCheckedChange={async (checked) => {
                      if (config) {
                        await setTrackingSource(
                          config.tracking_source as TrackingSource,
                          config.gps_device_id,
                          { fallback_enabled: checked }
                        );
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* تنبيه للمستخدمين ذوي صلاحية العرض فقط */}
        {!canControl && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              أنت تشاهد بيانات التتبع كـ{isGenerator ? ' مولد' : isRecycler ? ' مدور' : ' مستخدم'}.
              التحكم في إعدادات التتبع متاح للناقل ومدير النظام فقط.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default ShipmentGPSTrackingPanel;
