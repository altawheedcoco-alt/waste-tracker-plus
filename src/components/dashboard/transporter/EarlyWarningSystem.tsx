import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Wrench, ThermometerSun, Gauge, Battery } from 'lucide-react';

interface EarlyWarning {
  id: string;
  vehiclePlate: string;
  vehicleModel: string;
  warningType: 'engine' | 'brakes' | 'tires' | 'battery' | 'overheating' | 'oil';
  severity: 'low' | 'medium' | 'high' | 'critical';
  prediction: string;
  confidence: number;
  daysUntilFailure: number;
  recommendedAction: string;
}

const WARNING_ICONS: Record<string, any> = {
  engine: Gauge,
  brakes: AlertTriangle,
  tires: Wrench,
  battery: Battery,
  overheating: ThermometerSun,
  oil: Wrench,
};

const WARNING_LABELS: Record<string, string> = {
  engine: 'المحرك', brakes: 'الفرامل', tires: 'الإطارات',
  battery: 'البطارية', overheating: 'ارتفاع حرارة', oil: 'الزيت',
};

const SEVERITY_STYLES: Record<string, string> = {
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const SEVERITY_LABELS: Record<string, string> = {
  low: 'منخفض', medium: 'متوسط', high: 'عالي', critical: 'حرج',
};

const MOCK_WARNINGS: EarlyWarning[] = [
  {
    id: '1', vehiclePlate: 'أ ب ج 1234', vehicleModel: 'إيسوزو 2022',
    warningType: 'brakes', severity: 'high', prediction: 'تآكل متقدم في تيل الفرامل الأمامية',
    confidence: 87, daysUntilFailure: 12, recommendedAction: 'استبدال تيل الفرامل خلال أسبوع',
  },
  {
    id: '2', vehiclePlate: 'ز ح ط 9012', vehicleModel: 'هينو 2020',
    warningType: 'engine', severity: 'critical', prediction: 'اهتزاز غير طبيعي في المحرك - احتمال عطل وشيك',
    confidence: 92, daysUntilFailure: 5, recommendedAction: 'فحص عاجل وإيقاف المركبة مؤقتاً',
  },
  {
    id: '3', vehiclePlate: 'د هـ و 5678', vehicleModel: 'ميتسوبيشي 2023',
    warningType: 'tires', severity: 'medium', prediction: 'تآكل غير متساوي في الإطار الخلفي الأيسر',
    confidence: 75, daysUntilFailure: 25, recommendedAction: 'فحص ضبط الزوايا وتبديل الإطارات',
  },
  {
    id: '4', vehiclePlate: 'أ ب ج 1234', vehicleModel: 'إيسوزو 2022',
    warningType: 'oil', severity: 'low', prediction: 'اقتراب موعد تغيير الزيت',
    confidence: 95, daysUntilFailure: 30, recommendedAction: 'جدولة تغيير زيت خلال الصيانة القادمة',
  },
];

export default function EarlyWarningSystem() {
  const criticalCount = MOCK_WARNINGS.filter(w => w.severity === 'critical' || w.severity === 'high').length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          نظام الإنذار المبكر للأعطال
          {criticalCount > 0 && (
            <Badge variant="destructive" className="mr-auto">{criticalCount} تحذير عاجل</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[350px]">
          <div className="space-y-3">
            {MOCK_WARNINGS.sort((a, b) => {
              const order = { critical: 0, high: 1, medium: 2, low: 3 };
              return order[a.severity] - order[b.severity];
            }).map(warning => {
              const Icon = WARNING_ICONS[warning.warningType] || AlertTriangle;
              return (
                <div key={warning.id} className="p-3 border rounded-lg space-y-2 hover:bg-muted/30">
                  <div className="flex items-start justify-between">
                    <Badge className={SEVERITY_STYLES[warning.severity]}>
                      {SEVERITY_LABELS[warning.severity]}
                    </Badge>
                    <div className="flex items-center gap-2 text-right">
                      <div>
                        <p className="text-sm font-medium">{warning.vehicleModel}</p>
                        <p className="text-xs text-muted-foreground">{warning.vehiclePlate}</p>
                      </div>
                      <Icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="bg-muted/50 p-2 rounded text-right">
                    <p className="text-xs font-medium">{WARNING_LABELS[warning.warningType]}: {warning.prediction}</p>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-primary font-medium">
                      ⏱ {warning.daysUntilFailure} يوم قبل العطل المتوقع
                    </span>
                    <span className="text-muted-foreground">ثقة: {warning.confidence}%</span>
                  </div>

                  <p className="text-xs text-muted-foreground border-t pt-2">
                    💡 {warning.recommendedAction}
                  </p>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
