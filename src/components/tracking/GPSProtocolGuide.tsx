import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Globe, Server, Wifi, Radio, Info, Copy, CheckCircle,
  ExternalLink, FileCode, Book, Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const GPSProtocolGuide: React.FC = () => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('تم النسخ إلى الحافظة');
  };

  const protocols = [
    {
      id: 'http',
      name: 'HTTP/REST API',
      icon: Globe,
      description: 'بروتوكول HTTP القياسي للاتصال عبر الإنترنت',
      supported: ['Queclink', 'CalAmp', 'Generic'],
      setup: {
        endpoint: 'https://gps-gateway.lovable.app/api/v1/location',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-ID': 'YOUR_DEVICE_SERIAL',
          'X-API-Key': 'YOUR_API_KEY',
        },
        payload: `{
  "device_id": "YOUR_DEVICE_SERIAL",
  "latitude": 24.7136,
  "longitude": 46.6753,
  "speed": 60,
  "heading": 180,
  "altitude": 612,
  "timestamp": "2024-01-15T10:30:00Z",
  "battery": 85,
  "signal": 95
}`,
      },
    },
    {
      id: 'mqtt',
      name: 'MQTT Protocol',
      icon: Server,
      description: 'بروتوكول MQTT للاتصال المباشر والسريع',
      supported: ['Teltonika', 'Queclink'],
      setup: {
        broker: 'mqtt.lovable.app',
        port: 1883,
        topic: 'gps/devices/{device_id}/location',
        qos: 1,
        payload: `{
  "lat": 24.7136,
  "lng": 46.6753,
  "spd": 60,
  "hdg": 180,
  "alt": 612,
  "ts": 1705315800,
  "bat": 85,
  "sig": 95
}`,
      },
    },
    {
      id: 'tcp',
      name: 'TCP Socket',
      icon: Wifi,
      description: 'اتصال TCP مباشر للأجهزة التقليدية',
      supported: ['Teltonika FMB', 'Coban GPS'],
      setup: {
        host: 'gps-gateway.lovable.app',
        port: 5001,
        format: 'Binary or Text',
        example: '$$DEVICE_ID,lat:24.7136,lng:46.6753,spd:60,ts:1705315800##',
      },
    },
    {
      id: 'udp',
      name: 'UDP Socket',
      icon: Radio,
      description: 'اتصال UDP سريع للبيانات المتكررة',
      supported: ['Teltonika FMB', 'Meitrack'],
      setup: {
        host: 'gps-gateway.lovable.app',
        port: 5002,
        format: 'Binary or Text',
        example: '$DEVICE_ID,24.7136,46.6753,60,1705315800#',
      },
    },
  ];

  const deviceGuides = [
    {
      name: 'Teltonika FMB Series',
      models: ['FMB120', 'FMB920', 'FMB140'],
      protocol: 'TCP/MQTT',
      steps: [
        'افتح Teltonika Configurator على الكمبيوتر',
        'اتصل بالجهاز عبر USB أو Bluetooth',
        'انتقل إلى GPRS Settings',
        'أدخل عنوان الخادم: gps-gateway.lovable.app',
        'أدخل المنفذ: 5001',
        'احفظ الإعدادات وأعد تشغيل الجهاز',
      ],
      configUrl: 'https://wiki.teltonika-gps.com/',
    },
    {
      name: 'Queclink GL Series',
      models: ['GL300', 'GL500', 'GL520'],
      protocol: 'HTTP/MQTT',
      steps: [
        'أرسل رسالة SMS للجهاز لبدء الإعداد',
        'الأمر: AT+GTSER=server,gps-gateway.lovable.app,80',
        'الأمر: AT+GTREP=1,30,1',
        'انتظر رسالة التأكيد',
        'تحقق من الاتصال في النظام',
      ],
      configUrl: 'https://www.queclink.com/support/',
    },
    {
      name: 'CalAmp LMU Series',
      models: ['LMU-2600', 'LMU-3030'],
      protocol: 'HTTP',
      steps: [
        'ادخل إلى CalAmp PULS Manager',
        'اختر الجهاز من القائمة',
        'انتقل إلى Server Configuration',
        'أدخل: URL = https://gps-gateway.lovable.app/api/v1/location',
        'فعّل الإرسال الدوري كل 30 ثانية',
        'احفظ واختبر الاتصال',
      ],
      configUrl: 'https://www.calamp.com/support/',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>دليل ربط أجهزة GPS</AlertTitle>
        <AlertDescription>
          هذا الدليل يوضح كيفية إعداد أجهزة GPS المختلفة للاتصال بالنظام. اختر البروتوكول المناسب لجهازك.
        </AlertDescription>
      </Alert>

      {/* Protocol Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>البروتوكولات المدعومة</CardTitle>
          <CardDescription>
            اختر البروتوكول المناسب لجهاز GPS الخاص بك
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="http" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              {protocols.map((proto) => (
                <TabsTrigger key={proto.id} value={proto.id} className="flex items-center gap-2">
                  <proto.icon className="w-4 h-4" />
                  {proto.name.split(' ')[0]}
                </TabsTrigger>
              ))}
            </TabsList>

            {protocols.map((proto) => (
              <TabsContent key={proto.id} value={proto.id} className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <proto.icon className="w-5 h-5" />
                      {proto.name}
                    </h3>
                    <p className="text-muted-foreground">{proto.description}</p>
                  </div>
                  <div className="flex gap-2">
                    {proto.supported.map((device) => (
                      <Badge key={device} variant="outline">{device}</Badge>
                    ))}
                  </div>
                </div>

                {proto.id === 'http' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Endpoint:</span>
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-background px-2 py-1 rounded">
                            {proto.setup.endpoint}
                          </code>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => copyToClipboard(proto.setup.endpoint as string)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Method:</span>
                        <Badge>{proto.setup.method}</Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Headers:</span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => copyToClipboard(JSON.stringify(proto.setup.headers, null, 2))}
                        >
                          <Copy className="w-4 h-4 ml-1" />
                          نسخ
                        </Button>
                      </div>
                      <pre className="p-4 rounded-lg bg-muted text-sm overflow-x-auto">
                        {JSON.stringify(proto.setup.headers, null, 2)}
                      </pre>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Payload Example:</span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => copyToClipboard(proto.setup.payload as string)}
                        >
                          <Copy className="w-4 h-4 ml-1" />
                          نسخ
                        </Button>
                      </div>
                      <pre className="p-4 rounded-lg bg-muted text-sm overflow-x-auto">
                        {proto.setup.payload}
                      </pre>
                    </div>
                  </div>
                )}

                {proto.id === 'mqtt' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Broker:</span>
                        <code className="text-sm bg-background px-2 py-1 rounded">
                          {proto.setup.broker}
                        </code>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Port:</span>
                        <code className="text-sm bg-background px-2 py-1 rounded">
                          {proto.setup.port}
                        </code>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Topic:</span>
                        <code className="text-sm bg-background px-2 py-1 rounded">
                          {proto.setup.topic}
                        </code>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">QoS:</span>
                        <Badge variant="outline">{proto.setup.qos}</Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-sm font-medium">Payload Example:</span>
                      <pre className="p-4 rounded-lg bg-muted text-sm overflow-x-auto">
                        {proto.setup.payload}
                      </pre>
                    </div>
                  </div>
                )}

                {(proto.id === 'tcp' || proto.id === 'udp') && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Host:</span>
                        <code className="text-sm bg-background px-2 py-1 rounded">
                          {proto.setup.host}
                        </code>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Port:</span>
                        <code className="text-sm bg-background px-2 py-1 rounded">
                          {proto.setup.port}
                        </code>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Format:</span>
                        <Badge variant="outline">{proto.setup.format}</Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-sm font-medium">Example Message:</span>
                      <pre className="p-4 rounded-lg bg-muted text-sm overflow-x-auto">
                        {proto.setup.example}
                      </pre>
                    </div>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Device-Specific Guides */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Book className="w-5 h-5" />
            دليل إعداد الأجهزة
          </CardTitle>
          <CardDescription>
            خطوات تفصيلية لإعداد كل نوع من أجهزة GPS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-6">
              {deviceGuides.map((guide, index) => (
                <div key={index} className="p-4 rounded-lg border space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{guide.name}</h3>
                      <div className="flex gap-2 mt-1">
                        {guide.models.map((model) => (
                          <Badge key={model} variant="secondary" className="text-xs">
                            {model}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Badge>{guide.protocol}</Badge>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      خطوات الإعداد:
                    </h4>
                    <ol className="space-y-2 list-decimal list-inside">
                      {guide.steps.map((step, stepIndex) => (
                        <li key={stepIndex} className="text-sm text-muted-foreground">
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>

                  <Button variant="outline" size="sm" asChild>
                    <a href={guide.configUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 ml-2" />
                      التوثيق الرسمي
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default GPSProtocolGuide;
