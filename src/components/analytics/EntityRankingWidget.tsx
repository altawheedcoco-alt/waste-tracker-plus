import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Medal, Trophy, Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const EntityRankingWidget = () => {
  const { organization } = useAuth();

  const { data: rankings = [] } = useQuery({
    queryKey: ['entity-ranking', organization?.id],
    enabled: !!organization?.id,
    queryFn: async () => {
      // Get gamification profiles ordered by points
      const { data } = await supabase
        .from('gamification_profiles')
        .select('total_points, level, current_streak, organization_id')
        .order('total_points', { ascending: false })
        .limit(10);

      return (data || []).map((item, idx) => ({
        rank: idx + 1,
        points: item.total_points || 0,
        level: item.level || 1,
        streak: item.current_streak || 0,
        isMe: item.organization_id === organization?.id,
      }));
    },
    staleTime: 10 * 60 * 1000,
  });

  const myRank = rankings.find(r => r.isMe);

  const RankIcon = ({ rank }: { rank: number }) => {
    if (rank === 1) return <Crown className="h-4 w-4 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-4 w-4 text-gray-400" />;
    if (rank === 3) return <Trophy className="h-4 w-4 text-amber-600" />;
    return <span className="text-xs font-bold text-muted-foreground w-4 text-center">{rank}</span>;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            ترتيب الجهات
          </CardTitle>
          {myRank && (
            <Badge variant="outline" className="text-xs">
              ترتيبك: #{myRank.rank}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {rankings.slice(0, 5).map(r => (
            <div
              key={r.rank}
              className={`flex items-center justify-between p-2 rounded-lg text-sm transition-colors ${
                r.isMe ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <RankIcon rank={r.rank} />
                <span className={r.isMe ? 'font-bold' : ''}>
                  {r.isMe ? 'أنت' : `جهة #${r.rank}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  Lv.{r.level}
                </Badge>
                <span className="text-xs font-medium">{r.points.toLocaleString('ar-EG')} نقطة</span>
              </div>
            </div>
          ))}
          {rankings.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-4">لا توجد بيانات ترتيب حالياً</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EntityRankingWidget;
