import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserMinus, TrendingDown, AlertCircle, Clock } from 'lucide-react';

interface ChurnRisk {
  clientName: string;
  lastShipment: string;
  daysSinceLastActivity: number;
  riskLevel: 'low' | 'medium' | 'high' | 'churned';
  totalRevenue: number;
  totalShipments: number;
  declineReason: string;
  recommendedAction: string;
}

const RISK_STYLES: Record<string, { label: string; color: string }> = {
  low: { label: 'منخفض', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  medium: { label: 'متوسط', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  high: { label: 'مرتفع', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
  churned: { label: 'فُقد', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
};

const MOCK_CHURN: ChurnRisk[] = [
  {
    clientName: 'شركة النيل للصناعات', lastShipment: '2026-01-15',
    daysSinceLastActivity: 81, riskLevel: 'churned', totalRevenue: 45000, totalShipments: 32,
    declineReason: 'تحوّل لمنافس بأسعار أقل',
    recommendedAction: 'تقديم عرض خاص مع خصم 15%',
  },
  {
    clientName: 'مصنع الأهرام للمواد الغذائية', lastShipment: '2026-03-01',
    daysSinceLastActivity: 36, riskLevel: 'high', totalRevenue: 28000, totalShipments: 18,
    declineReason: 'تأخير متكرر في آخر 3 شحنات',
    recommendedAction: 'اتصال عاجل من مدير الحسابات + ضمان مواعيد',
  },
  {
    clientName: 'المستشفى الدولي', lastShipment: '2026-03-20',
    daysSinceLastActivity: 17, riskLevel: 'medium', totalRevenue: 62000, totalShipments: 45,
    declineReason: 'انخفاض تدريجي في حجم الطلبات',
    recommendedAction: 'مراجعة العقد وتقديم خدمات إضافية',
  },
  {
    clientName: 'جامعة القاهرة', lastShipment: '2026-03-28',
    daysSinceLastActivity: 9, riskLevel: 'low', totalRevenue: 15000, totalShipments: 12,
    declineReason: 'تذبذب موسمي طبيعي',
    recommendedAction: 'متابعة دورية',
  },
];

export default function ChurnAnalysis() {
  const churnedCount = MOCK_CHURN.filter(c => c.riskLevel === 'churned').length;
  const atRiskCount = MOCK_CHURN.filter(c => c.riskLevel === 'high').length;
  const totalLostRevenue = MOCK_CHURN.filter(c => c.riskLevel === 'churned').reduce((s, c) => s + c.totalRevenue, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <UserMinus className="w-5 h-5 text-red-500" />
          تحليل معدل فقد العملاء
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 bg-red-50 dark:bg-red-950 rounded">
            <p className="text-lg font-bold text-red-600">{churnedCount}</p>
            <p className="text-muted-foreground">عملاء فُقدوا</p>
          </div>
          <div className="p-2 bg-orange-50 dark:bg-orange-950 rounded">
            <p className="text-lg font-bold text-orange-600">{atRiskCount}</p>
            <p className="text-muted-foreground">معرّضين للفقد</p>
          </div>
          <div className="p-2 bg-muted/50 rounded">
            <p className="text-lg font-bold text-destructive">{totalLostRevenue.toLocaleString()}</p>
            <p className="text-muted-foreground">إيرادات مفقودة</p>
          </div>
        </div>

        <ScrollArea className="h-[280px]">
          <div className="space-y-3">
            {MOCK_CHURN.sort((a, b) => {
              const order = { churned: 0, high: 1, medium: 2, low: 3 };
              return order[a.riskLevel] - order[b.riskLevel];
            }).map((client, idx) => (
              <div key={idx} className="p-3 border rounded-lg space-y-2 hover:bg-muted/30">
                <div className="flex items-center justify-between">
                  <Badge className={RISK_STYLES[client.riskLevel].color}>
                    {RISK_STYLES[client.riskLevel].label}
                  </Badge>
                  <p className="text-sm font-semibold">{client.clientName}</p>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{client.totalShipments} شحنة</span>
                  <span>{client.totalRevenue.toLocaleString()} ج.م إيرادات</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{client.daysSinceLastActivity} يوم</span>
                </div>
                <p className="text-xs text-muted-foreground">⚠ {client.declineReason}</p>
                <p className="text-xs text-primary">💡 {client.recommendedAction}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
