/**
 * تقييم رضا العملاء NPS - فكرة #77
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

export default function CustomerNPS() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data: ratings, isLoading } = useQuery({
    queryKey: ['customer-nps', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from('partnership_ratings')
        .select('overall_rating, review_text, created_at')
        .eq('rated_organization_id', orgId!)
        .order('created_at', { ascending: false })
        .limit(100);
      return data || [];
    },
  });

  const nps = useMemo(() => {
    if (!ratings?.length) return null;
    // Convert 1-5 scale to NPS-like: 4-5 = promoter, 3 = passive, 1-2 = detractor
    const promoters = ratings.filter(r => r.overall_rating >= 4).length;
    const detractors = ratings.filter(r => r.overall_rating <= 2).length;
    const total = ratings.length;
    const score = Math.round(((promoters - detractors) / total) * 100);
    const avgRating = ratings.reduce((sum, r) => sum + r.overall_rating, 0) / total;

    return {
      score,
      promoters,
      passives: total - promoters - detractors,
      detractors,
      total,
      avgRating: avgRating.toFixed(1),
    };
  }, [ratings]);

  if (isLoading) return <Skeleton className="h-[200px] w-full rounded-xl" />;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Star className="h-5 w-5 text-amber-500" />
          رضا العملاء
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!nps ? (
          <p className="text-sm text-muted-foreground text-center py-6">لا توجد تقييمات بعد</p>
        ) : (
          <div className="space-y-3">
            <div className="text-center">
              <div className={`text-3xl font-bold ${nps.score >= 50 ? 'text-emerald-600' : nps.score >= 0 ? 'text-amber-600' : 'text-destructive'}`}>
                {nps.score > 0 ? '+' : ''}{nps.score}
              </div>
              <div className="text-xs text-muted-foreground">NPS Score</div>
              <div className="flex items-center justify-center gap-1 mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-3.5 w-3.5 ${i < Math.round(+nps.avgRating) ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/30'}`} />
                ))}
                <span className="text-xs text-muted-foreground mr-1">{nps.avgRating}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-1.5 rounded bg-emerald-500/10">
                <ThumbsUp className="h-3.5 w-3.5 text-emerald-500 mx-auto mb-0.5" />
                <div className="text-xs font-bold text-emerald-600">{nps.promoters}</div>
                <div className="text-[8px] text-muted-foreground">راضٍ</div>
              </div>
              <div className="p-1.5 rounded bg-muted/50">
                <Minus className="h-3.5 w-3.5 text-muted-foreground mx-auto mb-0.5" />
                <div className="text-xs font-bold">{nps.passives}</div>
                <div className="text-[8px] text-muted-foreground">محايد</div>
              </div>
              <div className="p-1.5 rounded bg-destructive/10">
                <ThumbsDown className="h-3.5 w-3.5 text-destructive mx-auto mb-0.5" />
                <div className="text-xs font-bold text-destructive">{nps.detractors}</div>
                <div className="text-[8px] text-muted-foreground">غير راضٍ</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
