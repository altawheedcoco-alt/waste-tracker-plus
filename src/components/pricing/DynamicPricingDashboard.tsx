import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  DollarSign, TrendingUp, TrendingDown, Zap, MapPin, Clock,
  Package, BarChart3, Settings
} from 'lucide-react';

interface PricingRule {
  id: string;
  name: string;
  factor: string;
  impact: string;
  enabled: boolean;
  weight: number;
}

const PRICING_RULES: PricingRule[] = [
  { id: '1', name: 'عامل المسافة', factor: 'المسافة بين المولد والمدور', impact: '+2 ج.م لكل 10 كم إضافية', enabled: true, weight: 25 },
  { id: '2', name: 'عامل الطلب', factor: 'حجم الطلب في المنطقة', impact: '+15% في أوقات الذروة', enabled: true, weight: 20 },
  { id: '3', name: 'نوع المخلفات', factor: 'خطورة/قيمة المادة', impact: 'مضاعف حسب التصنيف', enabled: true, weight: 30 },
  { id: '4', name: 'الموسمية', factor: 'الفصل والمناسبات', impact: '+10% في رمضان والأعياد', enabled: true, weight: 10 },
  { id: '5', name: 'حجم الطلبية', factor: 'خصم الكميات الكبيرة', impact: '-5% فوق 5 طن', enabled: true, weight: 15 },
];

const PRICE_EXAMPLES = [
  { material: 'بلاستيك HDPE', base: 18, dynamic: 22, change: 22, reason: 'طلب مرتفع + مسافة' },
  { material: 'كرتون', base: 5, dynamic: 4.5, change: -10, reason: 'فائض في العرض' },
  { material: 'معادن حديدية', base: 8, dynamic: 9.5, change: 19, reason: 'ذروة موسمية' },
  { material: 'زجاج', base: 3, dynamic: 3, change: 0, reason: 'سوق مستقر' },
  { material: 'مخلفات خطرة', base: 45, dynamic: 52, change: 16, reason: 'تكلفة نقل + تأمين' },
];

const DynamicPricingDashboard = () => {
  const avgAdjustment = Math.round(PRICE_EXAMPLES.reduce((s, p) => s + p.change, 0) / PRICE_EXAMPLES.length);

  return (
    <div className="space-y-4" dir="rtl">
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <Zap className="h-4 w-4 mx-auto mb-1 text-primary" />
            <div className="text-lg font-bold">{PRICING_RULES.filter(r => r.enabled).length}</div>
            <p className="text-[10px] text-muted-foreground">عامل نشط</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <TrendingUp className="h-4 w-4 mx-auto mb-1 text-emerald-600" />
            <div className="text-lg font-bold">+{avgAdjustment}%</div>
            <p className="text-[10px] text-muted-foreground">متوسط التعديل</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <BarChart3 className="h-4 w-4 mx-auto mb-1 text-primary" />
            <div className="text-lg font-bold">5</div>
            <p className="text-[10px] text-muted-foreground">مواد مسعّرة</p>
          </CardContent>
        </Card>
      </div>

      {/* Pricing Rules */}
      <Card>
        <CardHeader className="pb-2 px-4 pt-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" />
            عوامل التسعير
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-3">
          {PRICING_RULES.map(rule => (
            <div key={rule.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">{rule.name}</span>
                  <Badge variant="outline" className="text-[8px] h-4 px-1">{rule.weight}%</Badge>
                </div>
                <p className="text-[10px] text-muted-foreground">{rule.impact}</p>
              </div>
              <Switch checked={rule.enabled} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Live Prices */}
      <Card>
        <CardHeader className="pb-2 px-4 pt-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            الأسعار الديناميكية الحالية
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-2">
          {PRICE_EXAMPLES.map(p => (
            <div key={p.material} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <div>
                <span className="text-xs font-medium">{p.material}</span>
                <p className="text-[9px] text-muted-foreground">{p.reason}</p>
              </div>
              <div className="flex items-center gap-2 text-left">
                <span className="text-[10px] text-muted-foreground line-through">{p.base} ج.م</span>
                <span className="text-sm font-bold">{p.dynamic} ج.م</span>
                <Badge variant="outline" className={`text-[8px] h-4 ${
                  p.change > 0 ? 'text-emerald-600 border-emerald-300' :
                  p.change < 0 ? 'text-red-500 border-red-300' :
                  'text-muted-foreground'
                }`}>
                  {p.change > 0 ? '+' : ''}{p.change}%
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default DynamicPricingDashboard;
