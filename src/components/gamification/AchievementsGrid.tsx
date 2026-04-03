import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Award, Lock } from 'lucide-react';
import { useGamification, getTierColor } from '@/hooks/useGamification';
import { Skeleton } from '@/components/ui/skeleton';

const CATEGORY_LABELS: Record<string, string> = {
  all: 'الكل',
  shipments: 'الشحنات',
  tonnage: 'الأطنان',
  activity: 'النشاط',
  environmental: 'البيئة',
};

const AchievementsGrid = () => {
  const { achievements, unlockedCount, totalCount, isLoading } = useGamification();

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const categories = ['all', ...new Set(achievements.map(a => a.category))];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          الإنجازات والأوسمة
        </CardTitle>
        <Badge variant="secondary">{unlockedCount}/{totalCount}</Badge>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" dir="rtl">
          <TabsList className="mb-4 flex-wrap h-auto gap-1">
            {categories.map(cat => (
              <TabsTrigger key={cat} value={cat} className="text-xs">
                {CATEGORY_LABELS[cat] || cat}
              </TabsTrigger>
            ))}
          </TabsList>
          {categories.map(cat => (
            <TabsContent key={cat} value={cat}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {achievements
                  .filter(a => cat === 'all' || a.category === cat)
                  .map(achievement => (
                    <div
                      key={achievement.id}
                      className={`relative rounded-xl border-2 p-4 text-center transition-all ${
                        achievement.earned
                          ? 'border-primary/50 bg-primary/5 shadow-sm'
                          : 'border-border/50 bg-muted/30 opacity-60'
                      }`}
                    >
                      <div className="text-3xl mb-2">
                        {achievement.earned ? achievement.icon : <Lock className="h-8 w-8 mx-auto text-muted-foreground" />}
                      </div>
                      <p className="text-sm font-semibold leading-tight">{achievement.title_ar}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{achievement.description_ar}</p>
                      <Badge className={`mt-2 text-[10px] ${getTierColor(achievement.tier)}`} variant="outline">
                        +{achievement.points_reward} نقطة
                      </Badge>
                      {achievement.earned && achievement.earnedAt && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(achievement.earnedAt).toLocaleDateString('ar-EG')}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AchievementsGrid;
