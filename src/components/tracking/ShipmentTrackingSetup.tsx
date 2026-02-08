import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Settings, ChevronDown, Save, Loader2 } from 'lucide-react';
import TrackingSourceSelector from './TrackingSourceSelector';
import GPSDeviceManager from './GPSDeviceManager';
import HybridTrackingStatus from './HybridTrackingStatus';
import { useHybridTracking } from '@/hooks/useHybridTracking';
import { useGPSDevices } from '@/hooks/useGPSDevices';
import { TrackingSource, GPSDevice } from '@/types/gpsTracking';

interface ShipmentTrackingSetupProps {
  shipmentId: string;
  driverId: string | null;
  onConfigChange?: () => void;
}

const ShipmentTrackingSetup: React.FC<ShipmentTrackingSetupProps> = ({
  shipmentId,
  driverId,
  onConfigChange,
}) => {
  const { devices } = useGPSDevices();
  const { 
    config, 
    hybridData, 
    isLoading, 
    setTrackingSource 
  } = useHybridTracking({
    shipmentId,
    driverId,
    enabled: true,
  });

  const [selectedSource, setSelectedSource] = useState<TrackingSource>(
    config?.tracking_source || 'mobile'
  );
  const [selectedDevice, setSelectedDevice] = useState<GPSDevice | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [settings, setSettings] = useState({
    primary_source: 'mobile' as TrackingSource,
    fallback_enabled: true,
    location_sync_interval: 30,
    anomaly_detection_enabled: true,
    max_source_deviation: 500,
  });

  // Sync with config when loaded
  useEffect(() => {
    if (config) {
      setSelectedSource(config.tracking_source as TrackingSource);
      setSettings({
        primary_source: config.primary_source as TrackingSource,
        fallback_enabled: config.fallback_enabled,
        location_sync_interval: config.location_sync_interval,
        anomaly_detection_enabled: config.anomaly_detection_enabled,
        max_source_deviation: config.max_source_deviation,
      });

      if (config.gps_device_id) {
        const device = devices.find(d => d.id === config.gps_device_id);
        if (device) setSelectedDevice(device);
      }
    }
  }, [config, devices]);

  const handleSave = async () => {
    await setTrackingSource(
      selectedSource,
      selectedDevice?.id,
      settings
    );
    onConfigChange?.();
  };

  const handleDeviceSelect = (device: GPSDevice) => {
    setSelectedDevice(prev => prev?.id === device.id ? null : device);
  };

  const hasGPSDevice = devices.length > 0;

  return (
    <div className="space-y-6">
      {/* Tracking Source Selection */}
      <Card>
        <CardHeader>
          <CardTitle>إعدادات التتبع</CardTitle>
          <CardDescription>
            اختر طريقة تتبع موقع الشحنة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <TrackingSourceSelector
            value={selectedSource}
            onChange={setSelectedSource}
            hasGPSDevice={hasGPSDevice}
          />

          {/* GPS Device Selection for GPS/Hybrid modes */}
          {(selectedSource === 'gps_device' || selectedSource === 'hybrid') && (
            <div className="pt-4 border-t">
              <GPSDeviceManager
                onSelectDevice={handleDeviceSelect}
                selectedDeviceId={selectedDevice?.id}
              />
            </div>
          )}

          {/* Advanced Settings */}
          {selectedSource === 'hybrid' && (
            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    إعدادات متقدمة
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                <div className="space-y-4 p-4 rounded-lg bg-muted/50">
                  {/* Primary Source */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor="primary_source" className="flex-1">
                      <div className="font-medium">المصدر الأساسي</div>
                      <div className="text-xs text-muted-foreground">
                        المصدر المفضل عند توفر كلا المصدرين
                      </div>
                    </Label>
                    <select
                      id="primary_source"
                      value={settings.primary_source}
                      onChange={(e) => setSettings({ ...settings, primary_source: e.target.value as TrackingSource })}
                      className="w-40 h-9 rounded-md border bg-background px-3 text-sm"
                    >
                      <option value="mobile">الموبايل</option>
                      <option value="gps_device">GPS السيارة</option>
                    </select>
                  </div>

                  <Separator />

                  {/* Fallback */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor="fallback" className="flex-1">
                      <div className="font-medium">التحويل التلقائي</div>
                      <div className="text-xs text-muted-foreground">
                        التحويل للمصدر البديل عند انقطاع الأساسي
                      </div>
                    </Label>
                    <Switch
                      id="fallback"
                      checked={settings.fallback_enabled}
                      onCheckedChange={(checked) => setSettings({ ...settings, fallback_enabled: checked })}
                    />
                  </div>

                  <Separator />

                  {/* Sync Interval */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">فاصل التحديث</Label>
                      <span className="text-sm text-muted-foreground">{settings.location_sync_interval} ثانية</span>
                    </div>
                    <Slider
                      value={[settings.location_sync_interval]}
                      onValueChange={([value]) => setSettings({ ...settings, location_sync_interval: value })}
                      min={10}
                      max={120}
                      step={5}
                    />
                  </div>

                  <Separator />

                  {/* Anomaly Detection */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor="anomaly" className="flex-1">
                      <div className="font-medium">كشف الشذوذ</div>
                      <div className="text-xs text-muted-foreground">
                        تنبيه عند وجود فارق كبير بين المصادر
                      </div>
                    </Label>
                    <Switch
                      id="anomaly"
                      checked={settings.anomaly_detection_enabled}
                      onCheckedChange={(checked) => setSettings({ ...settings, anomaly_detection_enabled: checked })}
                    />
                  </div>

                  {settings.anomaly_detection_enabled && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium">حد الانحراف المسموح</Label>
                        <span className="text-sm text-muted-foreground">{settings.max_source_deviation} متر</span>
                      </div>
                      <Slider
                        value={[settings.max_source_deviation]}
                        onValueChange={([value]) => setSettings({ ...settings, max_source_deviation: value })}
                        min={100}
                        max={2000}
                        step={100}
                      />
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Save Button */}
          <Button onClick={handleSave} className="w-full" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 ml-2" />
            )}
            حفظ الإعدادات
          </Button>
        </CardContent>
      </Card>

      {/* Current Status */}
      {config && (
        <HybridTrackingStatus
          config={config}
          hybridData={hybridData}
        />
      )}
    </div>
  );
};

export default ShipmentTrackingSetup;
