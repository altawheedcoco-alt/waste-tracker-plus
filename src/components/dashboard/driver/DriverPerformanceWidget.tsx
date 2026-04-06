import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Medal, Trophy, Star, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const stats = {
  rank: 3,
  totalDrivers: 28,
  points: 1850,
  nextLevel: 2000,
  level: 'ذهبي',
  monthlyTrips: 42,
  onTimeRate: 96,
  safetyScore: 92,
};

const badges = [
  { name: 'سائق الشهر', icon: '🏆', earned: true },
  { name: '100 رحلة بدون حوادث', icon: '🛡️', earned: true },
  { name: 'أعلى تقييم عميل', icon: '⭐', earned: false },
  { name: 'صفر تأخير', icon: '⏰', earned: false },
];

const DriverPerformanceWidget = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <Trophy className="h-5 w-5 text-primary" />
        أداء السائق
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="text-center p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
        <Medal className="h-8 w-8 mx-auto text-yellow-600 mb-1" />
        <p className="text-2xl font-bold text-yellow-600">#{stats.rank}</p>
        <p className="text-xs text-muted-foreground">من أصل {stats.totalDrivers} سائق • مستوى {stats.level}</p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>النقاط</span>
          <span className="text-primary font-bold">{stats.points}/{stats.nextLevel}</span>
        </div>
        <Progress value={(stats.points / stats.nextLevel) * 100} className="h-2" />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="p-2 rounded border">
          <p className="font-bold text-primary">{stats.monthlyTrips}</p>
          <p className="text-muted-foreground">رحلة/شهر</p>
        </div>
        <div className="p-2 rounded border">
          <p className="font-bold text-green-600">{stats.onTimeRate}%</p>
          <p className="text-muted-foreground">التزام</p>
        </div>
        <div className="p-2 rounded border">
          <p className="font-bold text-primary">{stats.safetyScore}</p>
          <p className="text-muted-foreground">سلامة</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {badges.map((b, i) => (
          <span key={i} className={`text-sm px-2 py-1 rounded-full border ${b.earned ? 'bg-primary/5' : 'bg-muted opacity-50'}`}>
            {b.icon} {b.name}
          </span>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default DriverPerformanceWidget;
