import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Leaf, Wind, Droplets, Shield } from 'lucide-react';
import { useMemo } from 'react';

const DisposalScorecard = () => {
  const { organization } = useAuth();

  const { data: shipments, isLoading } = useQuery({
    queryKey: ['disposal-scorecard', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const sixMonths = new Date(); sixMonths.setMonth(sixMonths.getMonth() - 6);
      const { data } = await supabase
        .from('shipments')
        .select('id, status, quantity, created_at')
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

    // Environmental metrics for disposal
    const leachateRisk = totalWeight > 1000 ? 'مرتفع' : totalWeight > 500 ? 'متوسط' : 'منخفض';
    const emissionsEstimate = totalWeight * 0.3; // CH4 estimate

    let score = Math.min(100, Math.round(
      Math.min(completed.length * 0.5, 30) + 40 + (totalWeight < 500 ? 30 : totalWeight < 1000 ? 20 : 10)
    ));
    const grade = score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D';
    const gradeColor = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-blue-600' : 'text-yellow-600';

    return { score, grade, gradeColor, totalWeight, leachateRisk, emissionsEstimate, completed: completed.length };
  }, [shipments]);

  if (isLoading) return <Skeleton className="h-[280px]" />;
  if (!scorecard) return null;

  return (
    <Card>
      <CardHeader>
        <div className="text-right">
          <CardTitle className="flex items-center gap-2 justify-end">
            <Shield className="w-5 h-5 text-green-600" />
            بطاقة الأداء البيئي — التخلص
          </CardTitle>
          <CardDescription>مؤشرات الرشيح والانبعاثات — آخر ٦ أشهر</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
          <div className="text-center min-w-[80px]">
            <span className={`text-4xl font-black ${scorecard.gradeColor}`}>{scorecard.grade}</span>
            <p className="text-xs text-muted-foreground mt-1">التقييم البيئي</p>
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-semibold">{scorecard.score}/100</span>
              <span className="text-muted-foreground">Environmental Score</span>
            </div>
            <Progress value={scorecard.score} className="h-3" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-3 text-center">
            <Wind className="w-4 h-4 text-orange-600 mx-auto mb-1" />
            <p className="text-sm font-bold">{Math.round(scorecard.emissionsEstimate)}</p>
            <p className="text-[10px] text-muted-foreground">طن CH₄ تقديري</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 text-center">
            <Droplets className="w-4 h-4 text-blue-600 mx-auto mb-1" />
            <p className="text-sm font-bold">{scorecard.leachateRisk}</p>
            <p className="text-[10px] text-muted-foreground">خطر الرشيح</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-3 text-center">
            <Leaf className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
            <p className="text-sm font-bold">{Math.round(scorecard.totalWeight)}</p>
            <p className="text-[10px] text-muted-foreground">طن مستقبَلة</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DisposalScorecard;
