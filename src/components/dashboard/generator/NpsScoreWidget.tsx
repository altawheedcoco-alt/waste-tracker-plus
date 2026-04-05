/**
 * تقييم رضا العملاء (NPS) بعد كل شحنة
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SmilePlus, Frown, Meh, ThumbsUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

const NpsScoreWidget = () => {
  const { organization } = useAuth();

  const { data: ratings = [] } = useQuery({
    queryKey: ['generator-nps', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('partner_ratings')
        .select('overall_rating, comment, created_at')
        .eq('rated_organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(50);
      return (data || []) as any[];
    },
    enabled: !!organization?.id,
  });

  const nps = useMemo(() => {
    if (ratings.length === 0) return { score: 0, promoters: 0, passives: 0, detractors: 0, avg: 0 };

    const promoters = ratings.filter(r => r.overall_rating >= 4).length;
    const passives = ratings.filter(r => r.overall_rating === 3).length;
    const detractors = ratings.filter(r => r.overall_rating <= 2).length;
    const total = ratings.length;
    const score = Math.round(((promoters - detractors) / total) * 100);
    const avg = ratings.reduce((sum, r) => sum + r.overall_rating, 0) / total;

    return { score, promoters, passives, detractors, avg };
  }, [ratings]);

  const getScoreColor = (s: number) => s >= 50 ? 'text-green-600' : s >= 0 ? 'text-amber-600' : 'text-red-600';
  const getScoreLabel = (s: number) => s >= 50 ? 'ممتاز' : s >= 0 ? 'جيد' : 'يحتاج تحسين';

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 justify-end">
          <SmilePlus className="h-4 w-4 text-primary" />
          مؤشر رضا الشركاء (NPS)
        </CardTitle>
      </CardHeader>
      <CardContent dir="rtl">
        {ratings.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">لا توجد تقييمات بعد</p>
        ) : (
          <div className="space-y-3">
            <div className="text-center p-3 rounded-lg bg-muted/20">
              <p className={`text-3xl font-bold ${getScoreColor(nps.score)}`}>{nps.score}</p>
              <Badge variant="outline" className="text-xs mt-1">{getScoreLabel(nps.score)}</Badge>
              <p className="text-xs text-muted-foreground mt-1">متوسط التقييم: {nps.avg.toFixed(1)}/5 ⭐</p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded bg-green-50 dark:bg-green-950/20">
                <ThumbsUp className="h-4 w-4 mx-auto text-green-500 mb-1" />
                <p className="font-bold text-green-600">{nps.promoters}</p>
                <p className="text-[10px] text-muted-foreground">مروّج</p>
              </div>
              <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/20">
                <Meh className="h-4 w-4 mx-auto text-amber-500 mb-1" />
                <p className="font-bold text-amber-600">{nps.passives}</p>
                <p className="text-[10px] text-muted-foreground">محايد</p>
              </div>
              <div className="p-2 rounded bg-red-50 dark:bg-red-950/20">
                <Frown className="h-4 w-4 mx-auto text-red-500 mb-1" />
                <p className="font-bold text-red-600">{nps.detractors}</p>
                <p className="text-[10px] text-muted-foreground">منتقد</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NpsScoreWidget;
