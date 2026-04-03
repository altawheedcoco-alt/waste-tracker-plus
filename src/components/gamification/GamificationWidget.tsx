import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, TrendingUp, Flame, ChevronLeft } from 'lucide-react';
import { useGamification } from '@/hooks/useGamification';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

/**
 * ودجة مصغرة للداشبورد تعرض ملخص التقدم والإنجازات
 */
const GamificationWidget = () => {
  const navigate = useNavigate();
  const { gamification, levelInfo, unlockedCount, totalCount, isLoading } = useGamification();

  if (isLoading || !gamification) return null;

  const recentStats = [
    { icon: Star, value: gamification.total_points, label: 'نقطة', color: 'text-yellow-500' },
    { icon: TrendingUp, value: gamification.total_shipments, label: 'شحنة', color: 'text-primary' },
    { icon: Flame, value: gamification.streak_days, label: 'يوم متواصل', color: 'text-orange-500' },
  ];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            التقدم والإنجازات
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate('/dashboard/gamification')}>
            عرض الكل
            <ChevronLeft className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Level */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-lg font-black text-primary">{levelInfo.current.level}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold">{levelInfo.current.name}</span>
              <span className="text-muted-foreground">{Math.round(levelInfo.progress)}%</span>
            </div>
            <Progress value={levelInfo.progress} className="h-1.5" />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex justify-between">
          {recentStats.map(s => (
            <div key={s.label} className="text-center">
              <s.icon className={`h-4 w-4 mx-auto mb-0.5 ${s.color}`} />
              <p className="text-sm font-bold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Achievements progress */}
        <div className="flex items-center justify-between text-xs bg-muted/40 rounded-lg p-2">
          <span>الإنجازات المفتوحة</span>
          <Badge variant="secondary" className="text-[10px]">{unlockedCount}/{totalCount}</Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default GamificationWidget;
