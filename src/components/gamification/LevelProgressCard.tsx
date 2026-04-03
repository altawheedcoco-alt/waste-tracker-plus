import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Flame, Star, Zap } from 'lucide-react';
import { useGamification } from '@/hooks/useGamification';
import { Skeleton } from '@/components/ui/skeleton';

const LevelProgressCard = () => {
  const { gamification, levelInfo, unlockedCount, totalCount, isLoading } = useGamification();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!gamification) return null;

  const stats = [
    { label: 'النقاط', value: gamification.total_points, icon: Star, color: 'text-yellow-500' },
    { label: 'الشحنات', value: gamification.total_shipments, icon: TrendingUp, color: 'text-primary' },
    { label: 'سلسلة النشاط', value: `${gamification.streak_days} يوم`, icon: Flame, color: 'text-orange-500' },
    { label: 'الإنجازات', value: `${unlockedCount}/${totalCount}`, icon: Zap, color: 'text-purple-500' },
  ];

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-l from-primary/10 via-primary/5 to-transparent p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground">المستوى الحالي</p>
            <h2 className="text-2xl font-black">{levelInfo.current.name}</h2>
          </div>
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-3xl font-black text-primary">{levelInfo.current.level}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{gamification.xp_current} XP</span>
            <span>{levelInfo.next?.xp || '∞'} XP</span>
          </div>
          <Progress value={levelInfo.progress} className="h-3" />
          <p className="text-xs text-muted-foreground text-center">
            {levelInfo.next ? `${Math.round(levelInfo.next.xp - gamification.xp_current)} نقطة للمستوى التالي (${levelInfo.next.name})` : 'وصلت لأعلى مستوى! 🎉'}
          </p>
        </div>
      </div>

      <CardContent className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map(stat => (
            <div key={stat.label} className="text-center p-3 rounded-lg bg-muted/50">
              <stat.icon className={`h-5 w-5 mx-auto mb-1 ${stat.color}`} />
              <p className="text-lg font-bold">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default LevelProgressCard;
