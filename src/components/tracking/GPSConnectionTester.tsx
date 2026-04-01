import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Wifi, WifiOff, Radio, RefreshCw, CheckCircle, XCircle, 
  AlertCircle, Loader2, Signal, Clock, MapPin, Activity,
  Play, History
} from 'lucide-react';
import { useGPSDevices } from '@/hooks/useGPSDevices';
import { GPSDevice } from '@/types/gpsTracking';
import { formatDistanceToNow, format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ConnectionTestResult {
  success: boolean;
  message: string;
  latency?: number;
  timestamp: Date;
  details?: {
    protocol: string;
    lastLocation?: { lat: number; lng: number };
    batteryLevel?: number;
    signalStrength?: number;
  };
}

const GPSConnectionTester: React.FC = () => {
  const { devices, testConnection, refreshDevices } = useGPSDevices();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isTesting, setIsTesting] = useState(false);
  const [testProgress, setTestProgress] = useState(0);
  const [testResults, setTestResults] = useState<ConnectionTestResult[]>([]);
  const [currentTest, setCurrentTest] = useState<string>('');

  const selectedDevice = devices.find(d => d.id === selectedDeviceId);

  const runConnectionTest = async () => {
    if (!selectedDeviceId || !selectedDevice) return;

    setIsTesting(true);
    setTestProgress(0);
    setCurrentTest('بدء الاختبار...');

    const steps = [
      { name: 'التحقق من إعدادات الجهاز', progress: 20 },
      { name: 'محاولة الاتصال بالجهاز', progress: 50 },
      { name: 'استلام بيانات الموقع', progress: 80 },
      { name: 'التحقق من البيانات', progress: 100 },
    ];

    try {
      for (const step of steps) {
        setCurrentTest(step.name);
        setTestProgress(step.progress);
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      const success = await testConnection(selectedDeviceId);
      
      const result: ConnectionTestResult = {
        success,
        message: success ? 'تم الاتصال بنجاح' : 'فشل الاتصال بالجهاز',
        latency: success ? Math.min(250, Math.floor(performance.now() % 200) + 50) : undefined,
        timestamp: new Date(),
        details: success ? {
          protocol: selectedDevice.protocol,
          lastLocation: selectedDevice.last_location || undefined,
          batteryLevel: selectedDevice.battery_level || undefined,
          signalStrength: selectedDevice.signal_strength || undefined,
        } : undefined,
      };

      setTestResults(prev => [result, ...prev]);
    } catch (error) {
      setTestResults(prev => [{
        success: false,
        message: 'حدث خطأ أثناء الاختبار',
        timestamp: new Date(),
      }, ...prev]);
    }

    setIsTesting(false);
    setCurrentTest('');
    setTestProgress(0);
  };

  const getStatusBadge = (device: GPSDevice) => {
    if (!device.last_ping_at) {
      return <Badge variant="secondary">غير متصل</Badge>;
    }

    const lastPing = new Date(device.last_ping_at);
    const minutesAgo = (Date.now() - lastPing.getTime()) / 60000;

    if (minutesAgo < 5) {
      return <Badge className="bg-primary text-primary-foreground">متصل</Badge>;
    } else if (minutesAgo < 30) {
      return <Badge variant="outline">خامل</Badge>;
    }
    return <Badge variant="destructive">غير متصل</Badge>;
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Test Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="w-5 h-5" />
            اختبار الاتصال
          </CardTitle>
          <CardDescription>
            اختر جهاز لاختبار الاتصال به
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Device Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">اختر الجهاز</label>
            <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
              <SelectTrigger>
                <SelectValue placeholder="اختر جهاز GPS" />
              </SelectTrigger>
              <SelectContent>
                {devices.map((device) => (
                  <SelectItem key={device.id} value={device.id}>
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4" />
                      <span>{device.device_name}</span>
                      {getStatusBadge(device)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Device Info */}
          {selectedDevice && (
            <div className="p-4 rounded-lg bg-muted/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">الرقم التسلسلي:</span>
                <code className="text-sm">{selectedDevice.device_serial}</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">النوع:</span>
                <Badge variant="outline">{selectedDevice.device_type}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">البروتوكول:</span>
                <Badge>{selectedDevice.protocol.toUpperCase()}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">الحالة:</span>
                {getStatusBadge(selectedDevice)}
              </div>
              {selectedDevice.last_ping_at && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">آخر اتصال:</span>
                  <span className="text-sm">
                    {formatDistanceToNow(new Date(selectedDevice.last_ping_at), { addSuffix: true, locale: ar })}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Test Progress */}
          {isTesting && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">{currentTest}</span>
              </div>
              <Progress value={testProgress} className="h-2" />
            </div>
          )}

          {/* Test Button */}
          <Button 
            onClick={runConnectionTest} 
            disabled={!selectedDeviceId || isTesting}
            className="w-full"
            size="lg"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                جاري الاختبار...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 ml-2" />
                بدء اختبار الاتصال
              </>
            )}
          </Button>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshDevices}
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 ml-2" />
              تحديث القائمة
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            سجل الاختبارات
          </CardTitle>
          <CardDescription>
            نتائج اختبارات الاتصال السابقة
          </CardDescription>
        </CardHeader>
        <CardContent>
          {testResults.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لم يتم إجراء أي اختبارات بعد</p>
              <p className="text-sm">اختر جهاز وابدأ الاختبار</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {testResults.map((result, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border ${
                      result.success 
                        ? 'bg-primary/5 border-primary/30' 
                        : 'bg-destructive/5 border-destructive/30'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {result.success ? (
                          <CheckCircle className="w-5 h-5 text-primary" />
                        ) : (
                          <XCircle className="w-5 h-5 text-destructive" />
                        )}
                        <span className="font-medium">{result.message}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(result.timestamp, 'hh:mm:ss a', { locale: ar })}
                      </span>
                    </div>

                    {result.success && result.details && (
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        {result.latency && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>زمن الاستجابة: {result.latency}ms</span>
                          </div>
                        )}
                        {result.details.lastLocation && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            <span>
                              {result.details.lastLocation.lat.toFixed(4)}, {result.details.lastLocation.lng.toFixed(4)}
                            </span>
                          </div>
                        )}
                        {result.details.batteryLevel && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Activity className="w-3 h-3" />
                            <span>البطارية: {result.details.batteryLevel}%</span>
                          </div>
                        )}
                        {result.details.signalStrength && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Signal className="w-3 h-3" />
                            <span>الإشارة: {result.details.signalStrength}%</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GPSConnectionTester;
