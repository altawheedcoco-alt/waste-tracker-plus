import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Gift, Leaf, TreePine, Droplets, Star, Trophy, QrCode,
  ShoppingBag, Heart, ChevronLeft, Medal, Flame
} from 'lucide-react';

interface RewardItem {
  id: string;
  name: string;
  description: string;
  points_cost: number;
  type: 'discount' | 'voucher' | 'donation' | 'tree_planting';
  partner: string;
  available: number;
}

const USER_STATS = {
  totalPoints: 2450,
  availablePoints: 1850,
  redeemedPoints: 600,
  level: 4,
  nextLevelPoints: 3000,
  totalKgRecycled: 145.6,
  co2SavedKg: 87.4,
  treesEquivalent: 4.2,
  streak: 12,
  rank: 'بطل أخضر',
};

const LEVELS = [
  { level: 1, name: 'مبتدئ', minPoints: 0 },
  { level: 2, name: 'مشارك', minPoints: 500 },
  { level: 3, name: 'ناشط', minPoints: 1000 },
  { level: 4, name: 'بطل أخضر', minPoints: 2000 },
  { level: 5, name: 'حارس البيئة', minPoints: 3000 },
  { level: 6, name: 'سفير الاستدامة', minPoints: 5000 },
  { level: 7, name: 'قائد التغيير', minPoints: 8000 },
  { level: 8, name: 'أسطورة التدوير', minPoints: 12000 },
];

const REWARDS: RewardItem[] = [
  {
    id: '1', name: 'خصم 20% على Carrefour', description: 'كوبون خصم على المشتريات',
    points_cost: 500, type: 'voucher', partner: 'كارفور', available: 50,
  },
  {
    id: '2', name: 'ازرع شجرة باسمك', description: 'نزرع شجرة حقيقية في مشروع التشجير',
    points_cost: 300, type: 'tree_planting', partner: 'مبادرة مصر الخضراء', available: 100,
  },
  {
    id: '3', name: 'تبرع لمستشفى 57357', description: 'تحويل نقاطك لتبرع خيري',
    points_cost: 200, type: 'donation', partner: '57357', available: 999,
  },
  {
    id: '4', name: 'خصم 15% على أوبر', description: '3 رحلات بخصم',
    points_cost: 400, type: 'discount', partner: 'أوبر', available: 30,
  },
  {
    id: '5', name: 'اشتراك شهري Spotify', description: 'شهر مجاني',
    points_cost: 800, type: 'voucher', partner: 'Spotify', available: 20,
  },
];

const RECENT_ACTIVITY = [
  { action: 'فرز بلاستيك', kg: 3.5, points: 35, time: 'اليوم' },
  { action: 'فرز كرتون', kg: 8.0, points: 40, time: 'أمس' },
  { action: 'فرز معادن', kg: 1.2, points: 60, time: 'منذ يومين' },
  { action: 'فرز زجاج', kg: 5.0, points: 25, time: 'منذ 3 أيام' },
];

const TYPE_ICONS: Record<string, React.ReactNode> = {
  discount: <ShoppingBag className="h-4 w-4" />,
  voucher: <Gift className="h-4 w-4" />,
  donation: <Heart className="h-4 w-4" />,
  tree_planting: <TreePine className="h-4 w-4" />,
};

const CitizenRewardsDashboard = () => {
  const progress = (USER_STATS.totalPoints / USER_STATS.nextLevelPoints) * 100;

  return (
    <div className="space-y-4" dir="rtl">
      {/* Level & Points */}
      <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm font-bold">{USER_STATS.rank}</div>
                <div className="text-xs text-muted-foreground">المستوى {USER_STATS.level}</div>
              </div>
            </div>
            <div className="text-left">
              <div className="text-2xl font-black text-primary">{USER_STATS.availablePoints.toLocaleString('ar-EG')}</div>
              <div className="text-[10px] text-muted-foreground">نقطة متاحة</div>
            </div>
          </div>

          <div className="mb-1">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>المستوى {USER_STATS.level}</span>
              <span>المستوى {USER_STATS.level + 1} ({USER_STATS.nextLevelPoints} نقطة)</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-[9px] h-5 border-amber-300 text-amber-700">
              <Flame className="h-3 w-3 ml-1" />
              {USER_STATS.streak} يوم متتالي
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Impact Stats */}
      <div className="grid grid-cols-3 gap-2">
        <Card>
          <CardContent className="p-2.5 text-center">
            <Leaf className="h-3.5 w-3.5 mx-auto mb-1 text-emerald-600" />
            <div className="text-sm font-bold">{USER_STATS.totalKgRecycled}</div>
            <p className="text-[8px] text-muted-foreground">كجم مُعاد تدويره</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2.5 text-center">
            <Droplets className="h-3.5 w-3.5 mx-auto mb-1 text-blue-600" />
            <div className="text-sm font-bold">{USER_STATS.co2SavedKg}</div>
            <p className="text-[8px] text-muted-foreground">كجم CO₂ وُفّر</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2.5 text-center">
            <TreePine className="h-3.5 w-3.5 mx-auto mb-1 text-green-600" />
            <div className="text-sm font-bold">{USER_STATS.treesEquivalent}</div>
            <p className="text-[8px] text-muted-foreground">مكافئ أشجار</p>
          </CardContent>
        </Card>
      </div>

      {/* Scan QR */}
      <Button className="w-full" size="lg">
        <QrCode className="h-5 w-5 ml-2" />
        امسح QR الحاوية لتسجيل تدوير
      </Button>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-2 px-4 pt-3">
          <CardTitle className="text-sm">النشاط الأخير</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="space-y-2">
            {RECENT_ACTIVITY.map((a, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-2">
                  <Leaf className="h-3.5 w-3.5 text-emerald-600" />
                  <div>
                    <span className="text-xs font-medium">{a.action}</span>
                    <span className="text-[10px] text-muted-foreground mr-2">{a.kg} كجم</span>
                  </div>
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold text-primary">+{a.points}</span>
                  <p className="text-[9px] text-muted-foreground">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rewards Catalog */}
      <Card>
        <CardHeader className="pb-2 px-4 pt-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Gift className="h-4 w-4 text-primary" />
            كتالوج المكافآت
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-3">
          {REWARDS.map(reward => (
            <div key={reward.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                {TYPE_ICONS[reward.type]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{reward.name}</p>
                <p className="text-[10px] text-muted-foreground">{reward.partner} • متاح: {reward.available}</p>
              </div>
              <Button
                size="sm"
                variant={USER_STATS.availablePoints >= reward.points_cost ? 'default' : 'outline'}
                disabled={USER_STATS.availablePoints < reward.points_cost}
                className="h-7 text-[10px] shrink-0"
              >
                {reward.points_cost} <Star className="h-3 w-3 mr-1" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default CitizenRewardsDashboard;
