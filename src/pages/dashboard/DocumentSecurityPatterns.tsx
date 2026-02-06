import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ShieldCheck, 
  FileText, 
  Download, 
  Eye, 
  Printer,
  Palette,
  Lock,
  CheckCircle2,
  Layers,
  QrCode,
  Fingerprint,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Guilloche Pattern SVG Components
const GuillochePattern1 = ({ color = 'currentColor', size = 200 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" className="opacity-20">
    <defs>
      <pattern id="guilloche1" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
        <circle cx="20" cy="20" r="15" fill="none" stroke={color} strokeWidth="0.5" />
        <circle cx="20" cy="20" r="10" fill="none" stroke={color} strokeWidth="0.3" />
        <circle cx="20" cy="20" r="5" fill="none" stroke={color} strokeWidth="0.2" />
        <path d="M5,20 Q20,5 35,20 Q20,35 5,20" fill="none" stroke={color} strokeWidth="0.4" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#guilloche1)" />
  </svg>
);

const GuillochePattern2 = ({ color = 'currentColor', size = 200 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" className="opacity-20">
    <defs>
      <pattern id="guilloche2" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
        <path d="M0,25 Q12.5,0 25,25 Q37.5,50 50,25" fill="none" stroke={color} strokeWidth="0.5" />
        <path d="M0,25 Q12.5,50 25,25 Q37.5,0 50,25" fill="none" stroke={color} strokeWidth="0.5" />
        <circle cx="25" cy="25" r="8" fill="none" stroke={color} strokeWidth="0.3" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#guilloche2)" />
  </svg>
);

const GuillochePattern3 = ({ color = 'currentColor', size = 200 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" className="opacity-20">
    <defs>
      <pattern id="guilloche3" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
        <path d="M30,0 L60,30 L30,60 L0,30 Z" fill="none" stroke={color} strokeWidth="0.5" />
        <path d="M30,10 L50,30 L30,50 L10,30 Z" fill="none" stroke={color} strokeWidth="0.4" />
        <path d="M30,20 L40,30 L30,40 L20,30 Z" fill="none" stroke={color} strokeWidth="0.3" />
        <circle cx="30" cy="30" r="5" fill="none" stroke={color} strokeWidth="0.2" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#guilloche3)" />
  </svg>
);

const GuillochePattern4 = ({ color = 'currentColor', size = 200 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" className="opacity-20">
    <defs>
      <pattern id="guilloche4" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M0,0 Q20,20 40,0" fill="none" stroke={color} strokeWidth="0.5" />
        <path d="M0,40 Q20,20 40,40" fill="none" stroke={color} strokeWidth="0.5" />
        <path d="M0,0 Q20,20 0,40" fill="none" stroke={color} strokeWidth="0.5" />
        <path d="M40,0 Q20,20 40,40" fill="none" stroke={color} strokeWidth="0.5" />
        <circle cx="20" cy="20" r="3" fill={color} opacity="0.3" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#guilloche4)" />
  </svg>
);

const GuillochePattern5 = ({ color = 'currentColor', size = 200 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" className="opacity-20">
    <defs>
      <pattern id="guilloche5" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
        {[0, 1, 2, 3].map(i => (
          <circle key={i} cx="40" cy="40" r={10 + i * 8} fill="none" stroke={color} strokeWidth="0.4" />
        ))}
        <path d="M40,0 L40,80 M0,40 L80,40" stroke={color} strokeWidth="0.2" />
        <path d="M10,10 L70,70 M70,10 L10,70" stroke={color} strokeWidth="0.2" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#guilloche5)" />
  </svg>
);

const patterns = [
  { 
    id: 'classic', 
    name: 'النمط الكلاسيكي', 
    description: 'نمط دائري متداخل للمستندات الرسمية',
    Component: GuillochePattern1,
    color: '#22c55e',
    usedIn: ['الشهادات', 'العقود'],
  },
  { 
    id: 'wave', 
    name: 'النمط الموجي', 
    description: 'نمط موجي للفواتير والإيصالات',
    Component: GuillochePattern2,
    color: '#3b82f6',
    usedIn: ['الفواتير', 'الإيصالات'],
  },
  { 
    id: 'diamond', 
    name: 'النمط الماسي', 
    description: 'نمط ماسي للتقارير الرسمية',
    Component: GuillochePattern3,
    color: '#8b5cf6',
    usedIn: ['التقارير', 'البيانات'],
  },
  { 
    id: 'cross', 
    name: 'النمط المتقاطع', 
    description: 'نمط متقاطع للوثائق الأمنية',
    Component: GuillochePattern4,
    color: '#f59e0b',
    usedIn: ['الوثائق الأمنية', 'الشحنات'],
  },
  { 
    id: 'radial', 
    name: 'النمط الشعاعي', 
    description: 'نمط شعاعي للشهادات الخاصة',
    Component: GuillochePattern5,
    color: '#ec4899',
    usedIn: ['الشهادات الخاصة', 'الاعتمادات'],
  },
];

const documentTypes = [
  { 
    id: 'shipment-receipt', 
    name: 'إيصال استلام الشحنة', 
    pattern: 'classic',
    features: ['رمز QR', 'توقيع رقمي', 'ختم الشركة'],
    icon: FileText,
  },
  { 
    id: 'recycling-certificate', 
    name: 'شهادة إعادة التدوير', 
    pattern: 'wave',
    features: ['رقم تسلسلي', 'باركود', 'علامة مائية'],
    icon: CheckCircle2,
  },
  { 
    id: 'transport-manifest', 
    name: 'بيان نقل المخلفات', 
    pattern: 'diamond',
    features: ['بصمة أمان', 'تاريخ مشفر', 'رمز تحقق'],
    icon: Layers,
  },
  { 
    id: 'invoice', 
    name: 'الفاتورة الضريبية', 
    pattern: 'cross',
    features: ['رقم ضريبي', 'باركود ضريبي', 'ختم إلكتروني'],
    icon: FileText,
  },
  { 
    id: 'contract', 
    name: 'العقود والاتفاقيات', 
    pattern: 'radial',
    features: ['توقيع إلكتروني', 'طابع زمني', 'تشفير'],
    icon: Shield,
  },
];

export default function DocumentSecurityPatterns() {
  const [selectedPattern, setSelectedPattern] = useState(patterns[0]);
  const [activeTab, setActiveTab] = useState('patterns');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-7 w-7 text-primary" />
              الرسم الغيوشي لمستندات النظام
            </h1>
            <p className="text-muted-foreground mt-1">
              أنماط الأمان المستخدمة في حماية المستندات والوثائق الرسمية
            </p>
          </div>
          <Badge variant="outline" className="gap-1 bg-emerald-50 text-emerald-700 border-emerald-200">
            <Lock className="h-3 w-3" />
            نظام حماية متقدم
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="patterns" className="gap-2">
              <Palette className="h-4 w-4" />
              الأنماط
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2">
              <FileText className="h-4 w-4" />
              المستندات
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Lock className="h-4 w-4" />
              الأمان
            </TabsTrigger>
          </TabsList>

          {/* Patterns Tab */}
          <TabsContent value="patterns" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {patterns.map((pattern) => {
                const PatternComponent = pattern.Component;
                return (
                  <Card 
                    key={pattern.id}
                    className={cn(
                      'cursor-pointer transition-all hover:shadow-lg',
                      selectedPattern.id === pattern.id && 'ring-2 ring-primary'
                    )}
                    onClick={() => setSelectedPattern(pattern)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center justify-between">
                        {pattern.name}
                        {selectedPattern.id === pattern.id && (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        )}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {pattern.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div 
                        className="relative rounded-lg overflow-hidden border"
                        style={{ backgroundColor: `${pattern.color}10` }}
                      >
                        <PatternComponent color={pattern.color} size={200} />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {pattern.usedIn.map((use) => (
                          <Badge key={use} variant="secondary" className="text-xs">
                            {use}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Selected Pattern Preview */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  معاينة النمط المختار: {selectedPattern.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="relative h-64 rounded-xl overflow-hidden border-2"
                  style={{ backgroundColor: `${selectedPattern.color}05` }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <selectedPattern.Component color={selectedPattern.color} size={400} />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-background/80 backdrop-blur-sm rounded-lg p-6 text-center">
                      <ShieldCheck className="h-12 w-12 mx-auto mb-2" style={{ color: selectedPattern.color }} />
                      <p className="font-bold text-lg">نظام آي ريسايكل</p>
                      <p className="text-sm text-muted-foreground">مستند محمي بتقنية الرسم الغيوشي</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 justify-center mt-4">
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    تحميل النمط
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Printer className="h-4 w-4" />
                    طباعة
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documentTypes.map((doc) => {
                const pattern = patterns.find(p => p.id === doc.pattern);
                const IconComponent = doc.icon;
                return (
                  <Card key={doc.id}>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <IconComponent className="h-5 w-5 text-primary" />
                        {doc.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-start gap-4">
                        <div 
                          className="relative w-24 h-24 rounded-lg overflow-hidden border flex-shrink-0"
                          style={{ backgroundColor: `${pattern?.color}10` }}
                        >
                          {pattern && <pattern.Component color={pattern.color} size={96} />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground mb-2">
                            النمط المستخدم: <span className="font-medium text-foreground">{pattern?.name}</span>
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {doc.features.map((feature) => (
                              <Badge key={feature} variant="outline" className="text-xs gap-1">
                                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-emerald-200 bg-emerald-50/30 dark:bg-emerald-950/10">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <QrCode className="h-5 w-5 text-emerald-600" />
                    رمز QR التحقق
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    رمز QR فريد لكل مستند يتيح التحقق الفوري من صحة الوثيقة عبر المسح الضوئي
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge className="bg-emerald-600">مُفعَّل</Badge>
                    <span className="text-xs text-muted-foreground">جميع المستندات</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-blue-50/30 dark:bg-blue-950/10">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Fingerprint className="h-5 w-5 text-blue-600" />
                    البصمة الرقمية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    تشفير SHA-256 لضمان عدم التلاعب بمحتوى المستند مع إمكانية التحقق من التكامل
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge className="bg-blue-600">مُفعَّل</Badge>
                    <span className="text-xs text-muted-foreground">الوثائق الحساسة</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-200 bg-purple-50/30 dark:bg-purple-950/10">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-5 w-5 text-purple-600" />
                    الرسم الغيوشي
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    أنماط هندسية معقدة يستحيل تزويرها تُطبع كخلفية شفافة على المستندات الرسمية
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge className="bg-purple-600">مُفعَّل</Badge>
                    <span className="text-xs text-muted-foreground">5 أنماط</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Security Stats */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  إحصائيات الأمان
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <p className="text-3xl font-bold text-primary">5</p>
                    <p className="text-sm text-muted-foreground">أنماط غيوشية</p>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <p className="text-3xl font-bold text-emerald-600">100%</p>
                    <p className="text-sm text-muted-foreground">تغطية المستندات</p>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <p className="text-3xl font-bold text-blue-600">SHA-256</p>
                    <p className="text-sm text-muted-foreground">مستوى التشفير</p>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <p className="text-3xl font-bold text-purple-600">QR+</p>
                    <p className="text-sm text-muted-foreground">تحقق متعدد</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
