/**
 * CitizenRewardsDashboard — Enhanced with challenges, leaderboard, QR scanning
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Gift, Leaf, TreePine, Droplets, Star, Trophy, QrCode,
  ShoppingBag, Heart, Medal, Flame, Target, Users,
  Calendar, Sparkles, Crown, Award, TrendingUp, MapPin
} from 'lucide-react';

interface RewardItem {
  id: string;
  name: string;
  description: string;
  points_cost: number;
  type: 'discount' | 'voucher' | 'donation' | 'tree_planting';
  partner: string;
  available: number;
  image?: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  targetKg: number;
  currentKg: number;
  pointsReward: number;
  deadline: string;
  type: 'daily' | 'weekly' | 'monthly' | 'special';
  icon: string;
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
  globalRank: 47,
  cityRank: 12,
};

const LEVELS = [
  { level: 1, name: 'مبتدئ', minPoints: 0, icon: '🌱' },
  { level: 2, name: 'مشارك', minPoints: 500, icon: '🌿' },
  { level: 3, name: 'ناشط', minPoints: 1000, icon: '🌳' },
  { level: 4, name: 'بطل أخضر', minPoints: 2000, icon: '🏆' },
  { level: 5, name: 'حارس البيئة', minPoints: 3000, icon: '🛡️' },
  { level: 6, name: 'سفير الاستدامة', minPoints: 5000, icon: '🌍' },
  { level: 7, name: 'قائد التغيير', minPoints: 8000, icon: '⭐' },
  { level: 8, name: 'أسطورة التدوير', minPoints: 12000, icon: '👑' },
];

const REWARDS: RewardItem[] = [
  { id: '1', name: 'خصم 20% على Carrefour', description: 'كوبون خصم على المشتريات', points_cost: 500, type: 'voucher', partner: 'كارفور', available: 50 },
  { id: '2', name: 'ازرع شجرة باسمك', description: 'نزرع شجرة حقيقية في مشروع التشجير', points_cost: 300, type: 'tree_planting', partner: 'مبادرة مصر الخضراء', available: 100 },
  { id: '3', name: 'تبرع لمستشفى 57357', description: 'تحويل نقاطك لتبرع خيري', points_cost: 200, type: 'donation', partner: '57357', available: 999 },
  { id: '4', name: 'خصم 15% على أوبر', description: '3 رحلات بخصم', points_cost: 400, type: 'discount', partner: 'أوبر', available: 30 },
  { id: '5', name: 'اشتراك شهري Spotify', description: 'شهر مجاني', points_cost: 800, type: 'voucher', partner: 'Spotify', available: 20 },
  { id: '6', name: 'كوبون Talabat 50 ج.م', description: 'خصم على طلبك القادم', points_cost: 350, type: 'voucher', partner: 'طلبات', available: 40 },
];

const CHALLENGES: Challenge[] = [
  { id: '1', title: 'تحدي اليوم: فرز 5 كجم', description: 'افرز 5 كجم من أي نوع مخلفات', targetKg: 5, currentKg: 3.2, pointsReward: 50, deadline: 'اليوم', type: 'daily', icon: '🎯' },
  { id: '2', title: 'أسبوع بدون بلاستيك', description: 'قلل استهلاك البلاستيك لمدة أسبوع', targetKg: 0, currentKg: 0, pointsReward: 200, deadline: '5 أيام', type: 'weekly', icon: '🚫' },
  { id: '3', title: 'جامع المعادن', description: 'اجمع 20 كجم معادن هذا الشهر', targetKg: 20, currentKg: 8.5, pointsReward: 500, deadline: '18 يوم', type: 'monthly', icon: '🔧' },
  { id: '4', title: 'يوم الأرض الخاص', description: 'شارك في حملة تنظيف يوم الأرض', targetKg: 10, currentKg: 0, pointsReward: 1000, deadline: '22 أبريل', type: 'special', icon: '🌍' },
];

const LEADERBOARD = [
  { rank: 1, name: 'أحمد محمد', points: 8940, level: 'قائد التغيير', city: 'القاهرة' },
  { rank: 2, name: 'سارة إبراهيم', points: 7230, level: 'سفير الاستدامة', city: 'الإسكندرية' },
  { rank: 3, name: 'محمد علي', points: 6100, level: 'سفير الاستدامة', city: 'المنصورة' },
  { rank: 4, name: 'فاطمة حسن', points: 5800, level: 'سفير الاستدامة', city: 'القاهرة' },
  { rank: 5, name: 'عمر خالد', points: 4500, level: 'حارس البيئة', city: 'أسيوط' },
];

const RECENT_ACTIVITY = [
  { action: 'فرز بلاستيك', kg: 3.5, points: 35, time: 'اليوم' },
  { action: 'فرز كرتون', kg: 8.0, points: 40, time: 'أمس' },
  { action: 'فرز معادن', kg: 1.2, points: 60, time: 'منذ يومين' },
  { action: 'فرز زجاج', kg: 5.0, points: 25, time: 'منذ 3 أيام' },
  { action: 'إكمال تحدي', kg: 0, points: 200, time: 'منذ 4 أيام' },
];

const TYPE_ICONS: Record<string, React.ReactNode> = {
  discount: <ShoppingBag className="h-4 w-4" />,
  voucher: <Gift className="h-4 w-4" />,
  donation: <Heart className="h-4 w-4" />,
  tree_planting: <TreePine className="h-4 w-4" />,
};

const CHALLENGE_COLORS: Record<string, string> = {
  daily: 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30',
  weekly: 'border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/30',
  monthly: 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/30',
  special: 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/30',
};

const CitizenRewardsDashboard = () => {
  const progress = (USER_STATS.totalPoints / USER_STATS.nextLevelPoints) * 100;
  const currentLevel = LEVELS.find(l => l.level === USER_STATS.level);

  return (
    <div className="space-y-4" dir="rtl">
      {/* Level & Points Hero */}
      <Card className="bg-gradient-to-br from-primary/5 via-accent/5 to-emerald-50/30 dark:from-primary/10 dark:to-emerald-950/20 border-primary/20 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-emerald-500 to-amber-500" />
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-2xl">
                {currentLevel?.icon || '🏆'}
              </div>
              <div>
                <div className="text-sm font-bold">{USER_STATS.rank}</div>
                <div className="text-xs text-muted-foreground">المستوى {USER_STATS.level}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-[9px] h-4 border-amber-300 text-amber-700">
                    <Flame className="h-2.5 w-2.5 ml-0.5" />
                    {USER_STATS.streak} يوم
                  </Badge>
                  <Badge variant="outline" className="text-[9px] h-4">
                    <MapPin className="h-2.5 w-2.5 ml-0.5" />
                    #{USER_STATS.cityRank} بالمدينة
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-left">
              <div className="text-3xl font-black text-primary">{USER_STATS.availablePoints.toLocaleString('ar-EG')}</div>
              <div className="text-[10px] text-muted-foreground">نقطة متاحة</div>
            </div>
          </div>

          <div className="mb-2">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>{USER_STATS.totalPoints.toLocaleString('ar-EG')} نقطة</span>
              <span>{USER_STATS.nextLevelPoints.toLocaleString('ar-EG')} للمستوى التالي</span>
            </div>
            <Progress value={progress} className="h-2.5" />
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
      <Button className="w-full bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90" size="lg">
        <QrCode className="h-5 w-5 ml-2" />
        امسح QR الحاوية لتسجيل تدوير
      </Button>

      {/* Tabs */}
      <Tabs defaultValue="challenges" dir="rtl">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="challenges" className="text-xs">التحديات</TabsTrigger>
          <TabsTrigger value="rewards" className="text-xs">المكافآت</TabsTrigger>
          <TabsTrigger value="leaderboard" className="text-xs">المتصدرين</TabsTrigger>
          <TabsTrigger value="activity" className="text-xs">النشاط</TabsTrigger>
        </TabsList>

        {/* Challenges Tab */}
        <TabsContent value="challenges" className="space-y-3 mt-3">
          {CHALLENGES.map(ch => {
            const prog = ch.targetKg > 0 ? (ch.currentKg / ch.targetKg) * 100 : 0;
            return (
              <Card key={ch.id} className={CHALLENGE_COLORS[ch.type]}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{ch.icon}</span>
                      <div>
                        <p className="text-xs font-semibold">{ch.title}</p>
                        <p className="text-[10px] text-muted-foreground">{ch.description}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[9px] h-5">
                      <Star className="h-2.5 w-2.5 ml-0.5" />
                      {ch.pointsReward}
                    </Badge>
                  </div>
                  {ch.targetKg > 0 && (
                    <div>
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                        <span>{ch.currentKg} / {ch.targetKg} كجم</span>
                        <span>{ch.deadline}</span>
                      </div>
                      <Progress value={prog} className="h-2" />
                    </div>
                  )}
                  {ch.targetKg === 0 && (
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>المهلة: {ch.deadline}</span>
                      <Button size="sm" variant="outline" className="h-6 text-[10px]">شارك الآن</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="space-y-3 mt-3">
          {REWARDS.map(reward => (
            <Card key={reward.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
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
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-3 mt-3">
          <div className="grid grid-cols-3 gap-2 mb-3">
            {LEADERBOARD.slice(0, 3).map((user, i) => (
              <Card key={user.rank} className={i === 0 ? 'border-amber-300 bg-amber-50/50 dark:bg-amber-950/20' : ''}>
                <CardContent className="p-3 text-center">
                  <div className="text-2xl mb-1">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div>
                  <p className="text-xs font-bold truncate">{user.name}</p>
                  <p className="text-[10px] text-primary font-bold">{user.points.toLocaleString('ar-EG')}</p>
                  <p className="text-[9px] text-muted-foreground">{user.city}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {LEADERBOARD.slice(3).map(user => (
            <div key={user.rank} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold">{user.rank}</div>
                <div>
                  <p className="text-xs font-semibold">{user.name}</p>
                  <p className="text-[10px] text-muted-foreground">{user.level} • {user.city}</p>
                </div>
              </div>
              <span className="text-xs font-bold text-primary">{user.points.toLocaleString('ar-EG')}</span>
            </div>
          ))}

          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">{USER_STATS.globalRank}</div>
                <div>
                  <p className="text-xs font-semibold">أنت</p>
                  <p className="text-[10px] text-muted-foreground">{USER_STATS.rank}</p>
                </div>
              </div>
              <span className="text-xs font-bold text-primary">{USER_STATS.totalPoints.toLocaleString('ar-EG')}</span>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="mt-3">
          <Card>
            <CardContent className="p-3 space-y-0">
              {RECENT_ACTIVITY.map((a, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <Leaf className="h-3.5 w-3.5 text-emerald-600" />
                    </div>
                    <div>
                      <span className="text-xs font-medium">{a.action}</span>
                      {a.kg > 0 && <span className="text-[10px] text-muted-foreground mr-2">{a.kg} كجم</span>}
                    </div>
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-primary">+{a.points}</span>
                    <p className="text-[9px] text-muted-foreground">{a.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CitizenRewardsDashboard;
