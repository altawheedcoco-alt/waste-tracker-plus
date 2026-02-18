import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface PartnerRatingSummary {
  partnerId: string;
  partnerName: string;
  avgOverall: number;
  avgPunctuality: number;
  avgQuality: number;
  avgCommunication: number;
  totalRatings: number;
}

const PartnerRatingsWidget = () => {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data: ratingSummaries = [], isLoading } = useQuery({
    queryKey: ['partner-ratings-summary', orgId],
    queryFn: async () => {
      if (!orgId) return [];

      // Fetch ratings received by this org
      const { data: ratings, error } = await supabase
        .from('partner_ratings')
        .select('rater_organization_id, overall_rating, punctuality_rating, quality_rating, communication_rating')
        .eq('rated_organization_id', orgId);

      if (error) throw error;
      if (!ratings?.length) return [];

      // Aggregate by rater
      const raterMap = new Map<string, { ratings: typeof ratings }>();
      for (const r of ratings) {
        const existing = raterMap.get(r.rater_organization_id) || { ratings: [] };
        existing.ratings.push(r);
        raterMap.set(r.rater_organization_id, existing);
      }

      // Fetch rater names
      const raterIds = Array.from(raterMap.keys());
      const { data: orgs } = await supabase.from('organizations').select('id, name').in('id', raterIds);
      const nameMap = new Map((orgs || []).map(o => [o.id, o.name]));

      const summaries: PartnerRatingSummary[] = Array.from(raterMap.entries()).map(([id, data]) => {
        const rs = data.ratings;
        const avg = (arr: (number | null)[]) => {
          const valid = arr.filter((v): v is number => v !== null);
          return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
        };
        return {
          partnerId: id,
          partnerName: nameMap.get(id) || 'غير معروف',
          avgOverall: Math.round(avg(rs.map(r => r.overall_rating)) * 10) / 10,
          avgPunctuality: Math.round(avg(rs.map(r => r.punctuality_rating)) * 10) / 10,
          avgQuality: Math.round(avg(rs.map(r => r.quality_rating)) * 10) / 10,
          avgCommunication: Math.round(avg(rs.map(r => r.communication_rating)) * 10) / 10,
          totalRatings: rs.length,
        };
      });

      return summaries.sort((a, b) => b.avgOverall - a.avgOverall);
    },
    enabled: !!orgId,
    staleTime: 120_000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>تقييمات الجهات المرتبطة</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-20 w-full" /></CardContent>
      </Card>
    );
  }

  if (ratingSummaries.length === 0) return null;

  const overallAvg = ratingSummaries.length > 0
    ? Math.round((ratingSummaries.reduce((s, r) => s + r.avgOverall, 0) / ratingSummaries.length) * 10) / 10
    : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">{overallAvg}</span>
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
          </div>
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Star className="w-5 h-5 text-amber-500" />
            تقييماتنا من الجهات المرتبطة
          </CardTitle>
        </div>
        <CardDescription className="text-right">متوسط التقييمات التي حصلت عليها منظمتك</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {ratingSummaries.slice(0, 5).map((r) => (
          <div key={r.partnerId} className="flex items-center justify-between p-2 rounded-lg border">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5" dir="ltr">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={cn(
                      'w-3.5 h-3.5',
                      s <= Math.round(r.avgOverall)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-muted-foreground/20'
                    )}
                  />
                ))}
              </div>
              <span className="text-sm font-medium">{r.avgOverall}</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-medium">{r.partnerName}</span>
              <p className="text-xs text-muted-foreground">{r.totalRatings} تقييم</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default PartnerRatingsWidget;
