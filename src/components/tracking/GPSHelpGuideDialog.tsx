import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  HelpCircle, Radio, Car, Wifi, MapPin, Settings, 
  CheckCircle, ArrowRight, Smartphone, Globe, Server,
  Link, Unlink, Activity, Clock, AlertTriangle
} from 'lucide-react';

interface GPSHelpGuideDialogProps {
  trigger?: React.ReactNode;
}

const GPSHelpGuideDialog: React.FC<GPSHelpGuideDialogProps> = ({ trigger }) => {
  const steps = [
    {
      number: 1,
      title: 'تسجيل جهاز GPS',
      description: 'قم بتسجيل جهاز GPS الموجود في السيارة',
      icon: Radio,
      details: [
        'انتقل إلى تبويب "تسجيل جهاز"',
        'أدخل اسم الجهاز والرقم التسلسلي (IMEI)',
        'اختر نوع الجهاز (Teltonika, Queclink, إلخ)',
        'أدخل إعدادات الاتصال حسب البروتوكول',
        'اضغط "تسجيل الجهاز"',
      ],
    },
    {
      number: 2,
      title: 'إعداد الجهاز للاتصال',
      description: 'قم بإعداد جهاز GPS لإرسال البيانات للخادم',
      icon: Settings,
      details: [
        'افتح برنامج إعداد الجهاز (Configurator)',
        'أدخل عنوان الخادم: gps-gateway.lovable.app',
        'أدخل المنفذ حسب البروتوكول (HTTP: 80, TCP: 5001)',
        'احفظ الإعدادات وأعد تشغيل الجهاز',
        'انتظر حتى يتصل الجهاز بالخادم',
      ],
    },
    {
      number: 3,
      title: 'اختبار الاتصال',
      description: 'تأكد من أن الجهاز يرسل البيانات بشكل صحيح',
      icon: Wifi,
      details: [
        'انتقل إلى تبويب "اختبار الاتصال"',
        'اختر الجهاز من القائمة',
        'اضغط "بدء اختبار الاتصال"',
        'تحقق من نجاح الاتصال واستلام الموقع',
        'راجع سجل الاختبارات للتأكد',
      ],
    },
    {
      number: 4,
      title: 'ربط الجهاز بالسائق/السيارة',
      description: 'قم بربط جهاز GPS بالسائق المسؤول عن السيارة',
      icon: Link,
      details: [
        'انتقل إلى تبويب "ربط بالسيارات"',
        'ابحث عن السيارة أو السائق',
        'اضغط "ربط GPS" واختر الجهاز',
        'تأكيد الربط',
        'الآن يمكن تتبع السيارة مباشرة',
      ],
    },
    {
      number: 5,
      title: 'متابعة التتبع المباشر',
      description: 'راقب موقع السيارات في الوقت الفعلي',
      icon: MapPin,
      details: [
        'انتقل إلى تبويب "لوحة التتبع"',
        'شاهد جميع الأجهزة المتصلة',
        'اضغط على أي جهاز لمشاهدة التفاصيل',
        'تتبع الموقع والسرعة والبطارية',
        'استلم تنبيهات عند انقطاع الاتصال',
      ],
    },
  ];

  const trackingModes = [
    {
      title: 'تتبع الموبايل',
      icon: Smartphone,
      description: 'تتبع موقع السائق من خلال تطبيق الموبايل أو الموقع',
      pros: ['سهل الإعداد', 'لا يحتاج جهاز إضافي', 'مجاني'],
      cons: ['يعتمد على بطارية الموبايل', 'قد يتوقف في الخلفية'],
    },
    {
      title: 'تتبع GPS المركبة',
      icon: Car,
      description: 'تتبع موقع المركبة من خلال جهاز GPS مثبت',
      pros: ['دقة عالية', 'يعمل 24/7', 'لا يعتمد على السائق'],
      cons: ['يحتاج شراء جهاز', 'يحتاج إعداد تقني'],
    },
    {
      title: 'التتبع الهجين',
      icon: Activity,
      description: 'دمج التتبعين معاً للحصول على أفضل دقة',
      pros: ['أعلى دقة', 'كشف التلاعب', 'نسخة احتياطية'],
      cons: ['يحتاج إعداد الاثنين'],
    },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="lg" className="gap-2">
            <HelpCircle className="w-5 h-5" />
            دليل الربط والاستخدام
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <Radio className="w-6 h-6 text-primary" />
            دليل ربط GPS المركبات
          </DialogTitle>
          <DialogDescription>
            تعلم كيفية ربط أجهزة GPS بالمركبات وتتبعها في الوقت الفعلي
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[70vh] pl-4">
          <div className="space-y-8 py-4">
            {/* Introduction */}
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                ما هو نظام تتبع GPS؟
              </h3>
              <p className="text-muted-foreground">
                نظام تتبع GPS يتيح لك معرفة موقع سياراتك ومركباتك في الوقت الفعلي. 
                يمكنك ربط أجهزة GPS المثبتة في السيارات بالنظام لمتابعة الشحنات 
                وتتبع حركة الأسطول بدقة عالية.
              </p>
            </div>

            {/* Tracking Modes */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Settings className="w-5 h-5" />
                طرق التتبع المتاحة
              </h3>
              <div className="grid gap-4 md:grid-cols-3">
                {trackingModes.map((mode, index) => (
                  <div key={index} className="p-4 rounded-lg border space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <mode.icon className="w-5 h-5 text-primary" />
                      </div>
                      <h4 className="font-medium">{mode.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{mode.description}</p>
                    <div className="space-y-2">
                      <div className="space-y-1">
                        {mode.pros.map((pro, i) => (
                          <div key={i} className="flex items-center gap-1 text-xs text-primary">
                            <CheckCircle className="w-3 h-3" />
                            <span>{pro}</span>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-1">
                        {mode.cons.map((con, i) => (
                          <div key={i} className="flex items-center gap-1 text-xs text-muted-foreground">
                            <AlertTriangle className="w-3 h-3" />
                            <span>{con}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Step by Step Guide */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <ArrowRight className="w-5 h-5" />
                خطوات الربط
              </h3>
              <div className="space-y-6">
                {steps.map((step, index) => (
                  <div key={index} className="relative">
                    {index < steps.length - 1 && (
                      <div className="absolute top-12 right-5 w-0.5 h-full bg-border" />
                    )}
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shrink-0">
                        {step.number}
                      </div>
                      <div className="flex-1 space-y-3">
                        <div>
                          <h4 className="font-medium flex items-center gap-2">
                            <step.icon className="w-4 h-4 text-primary" />
                            {step.title}
                          </h4>
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                          {step.details.map((detail, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                              <span>{detail}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Supported Devices */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Server className="w-5 h-5" />
                الأجهزة المدعومة
              </h3>
              <div className="grid gap-2 md:grid-cols-2">
                {[
                  { name: 'Teltonika', models: 'FMB120, FMB920, FMB140', protocol: 'TCP/MQTT' },
                  { name: 'Queclink', models: 'GL300, GL500, GL520', protocol: 'HTTP/MQTT' },
                  { name: 'CalAmp', models: 'LMU-2600, LMU-3030', protocol: 'HTTP' },
                  { name: 'Coban GPS', models: 'TK102, TK103', protocol: 'TCP' },
                  { name: 'Meitrack', models: 'T333, T366', protocol: 'UDP' },
                  { name: 'أجهزة أخرى', models: 'تدعم HTTP/MQTT/TCP', protocol: 'متعدد' },
                ].map((device, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium">{device.name}</p>
                      <p className="text-xs text-muted-foreground">{device.models}</p>
                    </div>
                    <Badge variant="outline">{device.protocol}</Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="p-4 rounded-lg bg-accent/50 border border-border">
              <h3 className="font-semibold mb-2 flex items-center gap-2 text-foreground">
                <AlertTriangle className="w-5 h-5 text-primary" />
                نصائح مهمة
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  تأكد من وجود شريحة SIM فعالة في جهاز GPS مع باقة بيانات
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  ثبت الجهاز في مكان به تغطية GPS جيدة (قرب الزجاج الأمامي)
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  استخدم التتبع الهجين للحصول على أفضل دقة وكشف أي تلاعب
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  راجع لوحة التتبع بانتظام للتأكد من اتصال جميع الأجهزة
                </li>
              </ul>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default GPSHelpGuideDialog;
