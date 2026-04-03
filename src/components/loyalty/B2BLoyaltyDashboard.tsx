import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Crown, Star, Gift, TrendingUp, Award, Percent,
  ShieldCheck, Zap, ChevronLeft
} from 'lucide-react';

interface LoyaltyTier {
  name: string;
  minPoints: number;
  color: string;
  benefits: string[];
  discount: number;
}

const TIERS: LoyaltyTier[] = [
  { name: 'برونزي', minPoints: 0, color: 'text-amber-700', benefits: ['خصم 2% على الخدمات'], discount: 2 },
  { name: 'فضي', minPoints: 5000, color: 'text-slate-500', benefits: ['خصم 5%', 'أولوية جدولة'], discount: 5 },
  { name: 'ذهبي', minPoints: 15000, color: 'text-yellow-600', benefits: ['خصم 10%', 'مدير حساب مخصص', 'تقارير شهرية'], discount: 10 },
  { name: 'بلاتيني', minPoints: 50000, color: 'text-purple-600', benefits: ['خصم 15%', 'أولوية قصوى', 'استشارات مجانية', 'أسعار تفضيلية'], discount: 15 },
];

const DEMO_ORG = {
  name: 'شركة النظافة المتحدة',
  currentTier: 2,
  points: 18500,
  totalSpent: 245000,
  shipmentsCount: 156,
  memberSince: '2025-06-01',
  pointsThisMonth: 2100,
  savedAmount: 24500,
};

const POINT_HISTORY = [
  { action: 'شحنة SH-0412 مكتملة', points: 350, date: 'اليوم' },
  { action: 'شحنة SH-0410 مكتملة', points: 280, date: 'أمس' },
  { action: 'تقييم 5 نجوم من المدور', points: 100, date: 'منذ يومين' },
  { action: 'دفع فاتورة INV-0089', points: 450, date: 'منذ 3 أيام' },
  { action: 'إحالة جهة جديدة', points: 500, date: 'منذ أسبوع' },
];

const B2BLoyaltyDashboard = () => {
  const currentTier = TIERS[DEMO_ORG.currentTier];
  const nextTier = TIERS[DEMO_ORG.currentTier + 1];
  const progressToNext = nextTier ? ((DEMO_ORG.points - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100 : 100;

  return (
    <div className="space-y-4" dir="rtl">
      {/* Current Tier */}
      <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Crown className={`h-6 w-6 ${currentTier.color}`} />
              <div>
                <div className="text-sm font-bold">العضوية {currentTier.name}ة</div>
                <p className="text-[10px] text-muted-foreground">عضو منذ {new Date(DEMO_ORG.memberSince).toLocaleDateString('ar-EG')}</p>
              </div>
            </div>
            <div className="text-left">
              <div className="text-2xl font-black text-primary">{DEMO_ORG.points.toLocaleString('ar-EG')}</div>
              <p className="text-[10px] text-muted-foreground">نقطة</p>
            </div>
          </div>

          {nextTier && (
            <div>
              <div className="flex justify-between text-[10px] mb-1">
                <span>{currentTier.name}</span>
                <span>{nextTier.name} ({nextTier.minPoints.toLocaleString('ar-EG')} نقطة)</span>
              </div>
              <Progress value={progressToNext} className="h-2" />
              <p className="text-[9px] text-muted-foreground mt-1">
                متبقي {(nextTier.minPoints - DEMO_ORG.points).toLocaleString('ar-EG')} نقطة للترقية
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <Percent className="h-4 w-4 mx-auto mb-1 text-emerald-600" />
            <div className="text-lg font-bold">{currentTier.discount}%</div>
            <p className="text-[10px] text-muted-foreground">نسبة الخصم</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <TrendingUp className="h-4 w-4 mx-auto mb-1 text-primary" />
            <div className="text-lg font-bold">{DEMO_ORG.pointsThisMonth}</div>
            <p className="text-[10px] text-muted-foreground">نقاط الشهر</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Gift className="h-4 w-4 mx-auto mb-1 text-amber-500" />
            <div className="text-lg font-bold">{(DEMO_ORG.savedAmount/1000).toFixed(0)}K</div>
            <p className="text-[10px] text-muted-foreground">وفّرت (ج.م)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <ShieldCheck className="h-4 w-4 mx-auto mb-1 text-primary" />
            <div className="text-lg font-bold">{DEMO_ORG.shipmentsCount}</div>
            <p className="text-[10px] text-muted-foreground">شحنة</p>
          </CardContent>
        </Card>
      </div>

      {/* Benefits */}
      <Card>
        <CardHeader className="pb-2 px-4 pt-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            مزايا عضويتك
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          {currentTier.benefits.map((b, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5">
              <Star className="h-3 w-3 text-amber-500 shrink-0" />
              <span className="text-xs">{b}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Points History */}
      <Card>
        <CardHeader className="pb-2 px-4 pt-3">
          <CardTitle className="text-sm">سجل النقاط</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-2">
          {POINT_HISTORY.map((p, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
              <div>
                <p className="text-xs">{p.action}</p>
                <p className="text-[9px] text-muted-foreground">{p.date}</p>
              </div>
              <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300">
                +{p.points}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Tiers Overview */}
      <Card>
        <CardHeader className="pb-2 px-4 pt-3">
          <CardTitle className="text-sm">مستويات العضوية</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="grid grid-cols-4 gap-2">
            {TIERS.map((tier, i) => (
              <div key={i} className={`text-center p-2 rounded-lg border ${i === DEMO_ORG.currentTier ? 'border-primary bg-primary/5' : 'border-border'}`}>
                <Crown className={`h-4 w-4 mx-auto mb-1 ${tier.color}`} />
                <p className="text-[10px] font-bold">{tier.name}</p>
                <p className="text-[8px] text-muted-foreground">{tier.discount}% خصم</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default B2BLoyaltyDashboard;
