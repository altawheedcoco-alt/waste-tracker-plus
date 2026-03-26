import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Leaf, Award, Wind, Droplets, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';

const RecyclerScorecard = () => {
  const { organization } = useAuth();

  const { data: shipments, isLoading } = useQuery({
    queryKey: ['recycler-scorecard', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const sixMonths = new Date(); sixMonths.setMonth(sixMonths.getMonth() - 6);
      const { data } = await supabase
        .from('shipments')
        .select('id, status, quantity, recycler_id, created_at')
        .eq('recycler_id', organization.id)
        .gte('created_at', sixMonths.toISOString());
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const scorecard = useMemo(() => {
    if (!shipments?.length) return null;
    const completed = shipments.filter(s => ['delivered', 'confirmed'].includes(s.status));
    const totalWeight = completed.reduce((s, sh) => s + (sh.quantity || 0), 0);
    const co2Saved = totalWeight * 0.7;
    const waterSaved = totalWeight * 3.1;

    let score = Math.min(100, Math.round(
      Math.min(completed.length * 0.8, 40) + Math.min(totalWeight * 0.05, 30) + 30
    ));
    const grade = score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D';
    const gradeColor = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-blue-600' : 'text-yellow-600';

    return { score, grade, gradeColor, co2Saved, waterSaved, totalWeight, completed: completed.length };
  }, [shipments]);

  if (isLoading) return <Skeleton className="h-[280px]" />;
  if (!scorecard) return null;

  return (
    <Card>
      <CardHeader>
        <div className="text-right">
          <CardTitle className="flex items-center gap-2 justify-end">
            <Leaf className="w-5 h-5 text-green-600" />
            بطاقة الأداء البيئي — المدوّر
          </CardTitle>
          <CardDescription>البصمة الكربونية المُوفَّرة — آخر ٦ أشهر</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
          <div className="text-center min-w-[80px]">
            <span className={`text-4xl font-black ${scorecard.gradeColor}`}>{scorecard.grade}</span>
            <p className="text-xs text-muted-foreground mt-1">التقييم</p>
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-semibold">{scorecard.score}/100</span>
              <span className="text-muted-foreground">Green Score</span>
            </div>
            <Progress value={scorecard.score} className="h-3" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3 text-center">
            <Wind className="w-4 h-4 text-green-600 mx-auto mb-1" />
            <p className="text-sm font-bold">{Math.round(scorecard.co2Saved)}</p>
            <p className="text-[10px] text-muted-foreground">طن CO₂ مُوفَّر</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 text-center">
            <Droplets className="w-4 h-4 text-blue-600 mx-auto mb-1" />
            <p className="text-sm font-bold">{Math.round(scorecard.waterSaved)}</p>
            <p className="text-[10px] text-muted-foreground">م³ مياه مُوفَّرة</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-3 text-center">
            <TrendingUp className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
            <p className="text-sm font-bold">{Math.round(scorecard.totalWeight)}</p>
            <p className="text-[10px] text-muted-foreground">طن مُعالَجة</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecyclerScorecard;
