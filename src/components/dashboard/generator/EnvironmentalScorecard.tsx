import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Leaf, Award, TrendingUp, Droplets, Wind } from 'lucide-react';
import { useMemo } from 'react';

const EnvironmentalScorecard = () => {
  const { organization } = useAuth();

  const { data: shipments, isLoading } = useQuery({
    queryKey: ['env-scorecard-shipments', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const { data } = await supabase
        .from('shipments')
        .select('id, status, waste_type, quantity, recycler_id, created_at')
        .eq('generator_id', organization.id)
        .gte('created_at', sixMonthsAgo.toISOString());
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const scorecard = useMemo(() => {
    if (!shipments?.length) return null;

    const completed = shipments.filter(s => ['delivered', 'confirmed'].includes(s.status));
    const totalWeight = completed.reduce((s, sh) => s + (sh.quantity || 0), 0);
    const recycled = completed.filter(s => s.recycler_id);
    const recycledWeight = recycled.reduce((s, sh) => s + (sh.quantity || 0), 0);

    const diversionRate = totalWeight > 0 ? (recycledWeight / totalWeight) * 100 : 0;
    const co2Saved = recycledWeight * 0.5; // Estimated CO2 savings per ton recycled
    const waterSaved = recycledWeight * 2.3; // Estimated water savings (m³)

    // Green Score (0-100)
    let score = 0;
    score += Math.min(diversionRate * 0.5, 50); // Up to 50 points for diversion
    score += Math.min(completed.length * 0.5, 20); // Up to 20 points for activity
    score += recycled.length > 0 ? 15 : 0; // 15 points for recycling
    score += totalWeight > 100 ? 15 : totalWeight > 10 ? 10 : 5; // Volume score
    score = Math.min(Math.round(score), 100);

    const grade = score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D';
    const gradeColor = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-blue-600' : score >= 40 ? 'text-yellow-600' : 'text-red-600';

    // Achievements
    const achievements = [];
    if (diversionRate >= 75) achievements.push({ icon: '🏆', label: 'بطل التدوير — أكثر من ٧٥٪ تحويل' });
    if (completed.length >= 50) achievements.push({ icon: '⭐', label: 'ناشط بيئي — ٥٠+ شحنة مكتملة' });
    if (co2Saved >= 100) achievements.push({ icon: '🌍', label: 'حامي المناخ — وفرت ١٠٠+ طن CO₂' });
    if (diversionRate >= 50) achievements.push({ icon: '♻️', label: 'مُدوّر فعّال — تحويل أكثر من ٥٠٪' });

    return { score, grade, gradeColor, diversionRate, co2Saved, waterSaved, totalWeight, achievements };
  }, [shipments]);

  if (isLoading) return <Skeleton className="h-[300px]" />;
  if (!scorecard) return null;

  return (
    <Card>
      <CardHeader>
        <div className="text-right">
          <CardTitle className="flex items-center gap-2 justify-end">
            <Leaf className="w-5 h-5 text-green-600" />
            بطاقة الأداء البيئي
          </CardTitle>
          <CardDescription>مؤشرات الاستدامة والأثر البيئي — آخر ٦ أشهر</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Green Score */}
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

        {/* KPI Cards */}
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
            <p className="text-sm font-bold">{Math.round(scorecard.diversionRate)}%</p>
            <p className="text-[10px] text-muted-foreground">معدل التحويل</p>
          </div>
        </div>

        {/* Achievements */}
        {scorecard.achievements.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-right flex items-center gap-1 justify-end">
              <Award className="w-3 h-3" />
              الإنجازات
            </h4>
            <div className="flex flex-wrap gap-2 justify-end">
              {scorecard.achievements.map((a, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {a.icon} {a.label}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnvironmentalScorecard;
