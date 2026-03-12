import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Star, Gift, Target, Flame, Medal, Zap, TrendingUp } from "lucide-react";
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';

const DriverRewards = () => {
  const driverStats = {
    totalPoints: 12450,
    level: "فضي",
    rank: 3,
    totalDrivers: 28,
    streak: 14,
    completedTrips: 187,
    onTimeRate: 96,
    safetyScore: 98,
  };

  const achievements = [
    { icon: "🏆", name: "100 رحلة مكتملة", description: "أكملت 100 رحلة بنجاح", points: 500, earned: true, date: "2026-02-15" },
    { icon: "⚡", name: "سلسلة 7 أيام", description: "عمل 7 أيام متتالية بدون تأخير", points: 200, earned: true, date: "2026-03-01" },
    { icon: "🛡️", name: "بطل السلامة", description: "30 يوم بدون حوادث", points: 300, earned: true, date: "2026-02-28" },
    { icon: "⭐", name: "تقييم 5 نجوم", description: "حصل على تقييم 5 نجوم 10 مرات", points: 250, earned: false, progress: 7, target: 10 },
    { icon: "🚀", name: "سائق الشهر", description: "أفضل أداء في الشهر", points: 1000, earned: false, progress: 0, target: 1 },
  ];

  const rewards = [
    { name: "مكافأة 500 ج.م", points: 5000, category: "مالية", available: true },
    { name: "يوم إجازة إضافي", points: 3000, category: "إجازات", available: true },
    { name: "ترقية المركبة", points: 10000, category: "تشغيلية", available: true },
    { name: "تدريب مجاني ADR", points: 4000, category: "تدريب", available: true },
    { name: "بطاقة وقود 200 ج.م", points: 2000, category: "وقود", available: true },
  ];

  const leaderboard = [
    { rank: 1, name: "محمد أحمد", points: 15200, trips: 210, badge: "ذهبي" },
    { rank: 2, name: "أحمد حسن", points: 13800, trips: 195, badge: "ذهبي" },
    { rank: 3, name: "أنت", points: 12450, trips: 187, badge: "فضي", isMe: true },
    { rank: 4, name: "خالد محمود", points: 11200, trips: 172, badge: "فضي" },
    { rank: 5, name: "عمرو سعيد", points: 9800, trips: 156, badge: "برونزي" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Trophy className="h-7 w-7 text-primary" />
          نظام مكافآت السائقين
        </h1>
        <p className="text-muted-foreground mt-1">اكسب نقاط وحقق إنجازات واستبدلها بمكافآت</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-4 text-center">
            <Star className="h-6 w-6 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{driverStats.totalPoints.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">إجمالي النقاط</p>
          </CardContent>
        </Card>
        <Card><CardContent className="p-4 text-center">
          <Medal className="h-6 w-6 text-amber-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-foreground">{driverStats.level}</p>
          <p className="text-xs text-muted-foreground">المستوى الحالي</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Flame className="h-6 w-6 text-orange-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-foreground">{driverStats.streak}</p>
          <p className="text-xs text-muted-foreground">أيام متتالية</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Target className="h-6 w-6 text-emerald-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-foreground">{driverStats.onTimeRate}%</p>
          <p className="text-xs text-muted-foreground">معدل الالتزام</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="achievements" className="space-y-4">
        <TabsList>
          <TabsTrigger value="achievements">الإنجازات</TabsTrigger>
          <TabsTrigger value="rewards">المكافآت</TabsTrigger>
          <TabsTrigger value="leaderboard">لوحة المتصدرين</TabsTrigger>
        </TabsList>

        <TabsContent value="achievements" className="space-y-3">
          {achievements.map((a, i) => (
            <Card key={i} className={a.earned ? 'border-primary/30 bg-primary/5' : 'opacity-80'}>
              <CardContent className="p-4 flex items-center gap-4">
                <span className="text-3xl">{a.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-foreground">{a.name}</p>
                    {a.earned && <Badge className="bg-emerald-500">مكتمل</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{a.description}</p>
                  {!a.earned && a.progress !== undefined && (
                    <div className="mt-2">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${(a.progress / a.target!) * 100}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{a.progress}/{a.target}</p>
                    </div>
                  )}
                </div>
                <Badge variant="outline">+{a.points} نقطة</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="rewards" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rewards.map((r, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-foreground">{r.name}</h3>
                  <Badge variant="outline">{r.category}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{r.points.toLocaleString()} نقطة</span>
                  <Button size="sm" disabled={driverStats.totalPoints < r.points}>
                    {driverStats.totalPoints >= r.points ? 'استبدال' : 'نقاط غير كافية'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="leaderboard">
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {leaderboard.map((d) => (
                  <div key={d.rank} className={`flex items-center gap-4 p-4 ${d.isMe ? 'bg-primary/5' : ''}`}>
                    <span className={`text-2xl font-bold w-8 text-center ${d.rank <= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                      {d.rank <= 3 ? ['🥇','🥈','🥉'][d.rank - 1] : d.rank}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{d.name} {d.isMe && <Badge className="mr-2">أنت</Badge>}</p>
                      <p className="text-xs text-muted-foreground">{d.trips} رحلة • مستوى {d.badge}</p>
                    </div>
                    <p className="font-bold text-foreground">{d.points.toLocaleString()} نقطة</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DriverRewards;
