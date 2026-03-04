import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Plus, Radio, Wifi, Server, Key, Globe, Hash, 
  CheckCircle, AlertCircle, Loader2, Info, Settings2 
} from 'lucide-react';
import { useGPSDevices } from '@/hooks/useGPSDevices';
import { GPSProtocol } from '@/types/gpsTracking';
import { toast } from 'sonner';

const GPSDeviceRegistration: React.FC = () => {
  const { deviceTypes, addDevice, isLoading } = useGPSDevices();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const [formData, setFormData] = useState({
    device_name: '',
    device_serial: '',
    device_type: '',
    protocol: 'http' as GPSProtocol,
    api_endpoint: '',
    api_key: '',
    mqtt_broker: '',
    mqtt_port: '1883',
    mqtt_topic: '',
    mqtt_username: '',
    mqtt_password: '',
    tcp_host: '',
    tcp_port: '',
    sim_number: '',
    firmware_version: '',
    notes: '',
    auto_connect: true,
  });

  const selectedDeviceType = deviceTypes.find(t => t.name === formData.device_type);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setRegistrationSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.device_name || !formData.device_serial || !formData.device_type) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setIsSubmitting(true);

    // Build connection config based on protocol
    let connectionConfig: Record<string, any> = {};
    
    if (formData.protocol === 'http') {
      connectionConfig = {
        api_endpoint: formData.api_endpoint,
        api_key: formData.api_key,
      };
    } else if (formData.protocol === 'mqtt') {
      connectionConfig = {
        broker: formData.mqtt_broker,
        port: parseInt(formData.mqtt_port),
        topic: formData.mqtt_topic,
        username: formData.mqtt_username,
        password: formData.mqtt_password,
      };
    } else if (formData.protocol === 'tcp' || formData.protocol === 'udp') {
      connectionConfig = {
        host: formData.tcp_host,
        port: parseInt(formData.tcp_port),
      };
    }

    connectionConfig.sim_number = formData.sim_number;
    connectionConfig.firmware_version = formData.firmware_version;
    connectionConfig.notes = formData.notes;
    connectionConfig.auto_connect = formData.auto_connect;

    const result = await addDevice({
      device_name: formData.device_name,
      device_serial: formData.device_serial,
      device_type: formData.device_type,
      protocol: formData.protocol,
      api_endpoint: formData.api_endpoint || null,
      api_key: formData.api_key || null,
      connection_config: connectionConfig,
    });

    setIsSubmitting(false);

    if (result) {
      setRegistrationSuccess(true);
      // Reset form
      setFormData({
        device_name: '',
        device_serial: '',
        device_type: '',
        protocol: 'http',
        api_endpoint: '',
        api_key: '',
        mqtt_broker: '',
        mqtt_port: '1883',
        mqtt_topic: '',
        mqtt_username: '',
        mqtt_password: '',
        tcp_host: '',
        tcp_port: '',
        sim_number: '',
        firmware_version: '',
        notes: '',
        auto_connect: true,
      });
    }
  };

  const handleDeviceTypeChange = (value: string) => {
    const deviceType = deviceTypes.find(t => t.name === value);
    handleInputChange('device_type', value);
    if (deviceType) {
      handleInputChange('protocol', deviceType.protocol);
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Alert */}
      {registrationSuccess && (
        <Alert className="border-primary bg-primary/5">
          <CheckCircle className="h-4 w-4 text-primary" />
          <AlertTitle>تم التسجيل بنجاح!</AlertTitle>
          <AlertDescription>
            تم تسجيل الجهاز بنجاح. يمكنك الآن ربطه بسيارة واختبار الاتصال.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Radio className="w-5 h-5" />
                معلومات الجهاز الأساسية
              </CardTitle>
              <CardDescription>
                أدخل البيانات الأساسية للجهاز
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="device_name">
                  اسم الجهاز <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="device_name"
                  placeholder="مثال: جهاز الشاحنة رقم 1"
                  value={formData.device_name}
                  onChange={(e) => handleInputChange('device_name', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="device_serial">
                  الرقم التسلسلي / IMEI <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Hash className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="device_serial"
                    className="pr-10"
                    placeholder="123456789012345"
                    value={formData.device_serial}
                    onChange={(e) => handleInputChange('device_serial', e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  يمكن العثور على الرقم التسلسلي على ملصق الجهاز
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="device_type">
                  نوع/طراز الجهاز <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.device_type}
                  onValueChange={handleDeviceTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع الجهاز" />
                  </SelectTrigger>
                  <SelectContent>
                    {deviceTypes.map((type) => (
                      <SelectItem key={type.name} value={type.name}>
                        <div className="flex items-center justify-between w-full gap-4">
                          <span>{type.manufacturer} - {type.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {type.protocol.toUpperCase()}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedDeviceType && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>{selectedDeviceType.manufacturer}</AlertTitle>
                  <AlertDescription>
                    بروتوكول: {selectedDeviceType.protocol.toUpperCase()} | 
                    المنفذ الافتراضي: {selectedDeviceType.default_port || 'غير محدد'}
                  </AlertDescription>
                </Alert>
              )}

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="sim_number">رقم شريحة SIM (اختياري)</Label>
                <Input
                  id="sim_number"
                  placeholder="+20XXXXXXXXXX"
                  value={formData.sim_number}
                  onChange={(e) => handleInputChange('sim_number', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="firmware_version">إصدار البرنامج الثابت (اختياري)</Label>
                <Input
                  id="firmware_version"
                  placeholder="v1.0.0"
                  value={formData.firmware_version}
                  onChange={(e) => handleInputChange('firmware_version', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Connection Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings2 className="w-5 h-5" />
                إعدادات الاتصال
              </CardTitle>
              <CardDescription>
                حسب بروتوكول الجهاز: {formData.protocol.toUpperCase()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* HTTP Protocol Settings */}
              {formData.protocol === 'http' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="api_endpoint">
                      <Globe className="w-4 h-4 inline ml-1" />
                      رابط API الجهاز
                    </Label>
                    <Input
                      id="api_endpoint"
                      placeholder="https://api.device-provider.com/v1/location"
                      value={formData.api_endpoint}
                      onChange={(e) => handleInputChange('api_endpoint', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      رابط API الذي يوفره مزود الجهاز لاستلام بيانات الموقع
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="api_key">
                      <Key className="w-4 h-4 inline ml-1" />
                      مفتاح API
                    </Label>
                    <Input
                      id="api_key"
                      type="password"
                      placeholder="••••••••••••••••"
                      value={formData.api_key}
                      onChange={(e) => handleInputChange('api_key', e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* MQTT Protocol Settings */}
              {formData.protocol === 'mqtt' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="mqtt_broker">
                      <Server className="w-4 h-4 inline ml-1" />
                      عنوان MQTT Broker
                    </Label>
                    <Input
                      id="mqtt_broker"
                      placeholder="mqtt.example.com"
                      value={formData.mqtt_broker}
                      onChange={(e) => handleInputChange('mqtt_broker', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="mqtt_port">المنفذ</Label>
                      <Input
                        id="mqtt_port"
                        type="number"
                        placeholder="1883"
                        value={formData.mqtt_port}
                        onChange={(e) => handleInputChange('mqtt_port', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mqtt_topic">الموضوع (Topic)</Label>
                      <Input
                        id="mqtt_topic"
                        placeholder="gps/devices/{device_id}"
                        value={formData.mqtt_topic}
                        onChange={(e) => handleInputChange('mqtt_topic', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="mqtt_username">اسم المستخدم</Label>
                      <Input
                        id="mqtt_username"
                        placeholder="username"
                        value={formData.mqtt_username}
                        onChange={(e) => handleInputChange('mqtt_username', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mqtt_password">كلمة المرور</Label>
                      <Input
                        id="mqtt_password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.mqtt_password}
                        onChange={(e) => handleInputChange('mqtt_password', e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* TCP/UDP Protocol Settings */}
              {(formData.protocol === 'tcp' || formData.protocol === 'udp') && (
                <>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>إعدادات الاتصال المباشر</AlertTitle>
                    <AlertDescription>
                      هذا البروتوكول يتطلب إعداد خادم استقبال. سيتم توفير عنوان الخادم بعد التسجيل.
                    </AlertDescription>
                  </Alert>

                  <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">عنوان خادم الاستقبال:</span>
                      <code className="px-2 py-1 bg-background rounded text-sm">
                        gps-gateway.lovable.app
                      </code>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">المنفذ:</span>
                      <code className="px-2 py-1 bg-background rounded text-sm">
                        {formData.protocol === 'tcp' ? '5001' : '5002'}
                      </code>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      قم بإعداد الجهاز لإرسال البيانات إلى هذا العنوان
                    </p>
                  </div>
                </>
              )}

              <Separator />

              {/* Additional Settings */}
              <div className="space-y-2">
                <Label htmlFor="notes">ملاحظات إضافية</Label>
                <Textarea
                  id="notes"
                  placeholder="أي ملاحظات أو تعليمات خاصة بالجهاز..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <Label htmlFor="auto_connect" className="font-medium">
                    اتصال تلقائي
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    محاولة الاتصال تلقائياً عند التسجيل
                  </p>
                </div>
                <Switch
                  id="auto_connect"
                  checked={formData.auto_connect}
                  onCheckedChange={(checked) => handleInputChange('auto_connect', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end mt-6">
          <Button 
            type="submit" 
            size="lg" 
            disabled={isSubmitting || !formData.device_name || !formData.device_serial || !formData.device_type}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                جاري التسجيل...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 ml-2" />
                تسجيل الجهاز
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default GPSDeviceRegistration;
