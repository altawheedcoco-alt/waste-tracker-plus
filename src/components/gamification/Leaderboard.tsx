import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Crown, Medal, Award, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';

const RANK_ICONS = [
  { icon: Crown, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
  { icon: Medal, color: 'text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800/50' },
  { icon: Award, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
];

interface LeaderboardEntry {
  user_id: string;
  total_points: number;
  current_level: number;
  level_name: string;
  total_shipments: number;
  total_tons: number;
  profile_name?: string;
}

const Leaderboard = () => {
  const { user, organization } = useAuth();

  const { data: leaders = [], isLoading } = useQuery({
    queryKey: ['leaderboard', organization?.id],
    enabled: !!organization?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_gamification' as any)
        .select('user_id, total_points, current_level, level_name, total_shipments, total_tons')
        .eq('organization_id', organization!.id)
        .order('total_points', { ascending: false })
        .limit(10);
      if (error) throw error;

      // Fetch names
      const userIds = (data || []).map((d: any) => d.user_id);
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      const nameMap = new Map((profiles || []).map(p => [p.id, p.full_name]));

      return (data || []).map((d: any) => ({
        ...d,
        profile_name: nameMap.get(d.user_id) || 'مستخدم',
      })) as LeaderboardEntry[];
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-5 w-5 text-primary" />
          لوحة المتصدرين
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {leaders.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-6">لا توجد بيانات بعد</p>
        ) : (
          leaders.map((entry, idx) => {
            const isMe = entry.user_id === user?.id;
            const rankConfig = RANK_ICONS[idx] || null;
            const initials = entry.profile_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '؟';

            return (
              <div
                key={entry.user_id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                  isMe ? 'bg-primary/10 border border-primary/20' : 'bg-muted/30 hover:bg-muted/50'
                }`}
              >
                {/* Rank */}
                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                  rankConfig ? rankConfig.bg : 'bg-muted'
                }`}>
                  {rankConfig ? (
                    <rankConfig.icon className={`h-4 w-4 ${rankConfig.color}`} />
                  ) : (
                    <span className="text-xs font-bold text-muted-foreground">{idx + 1}</span>
                  )}
                </div>

                {/* Avatar & Name */}
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {entry.profile_name}
                    {isMe && <Badge className="mr-1 text-[9px]" variant="secondary">أنت</Badge>}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {entry.level_name} • {entry.total_shipments} شحنة
                  </p>
                </div>

                {/* Points */}
                <div className="text-left shrink-0">
                  <p className="text-sm font-bold text-primary">{entry.total_points}</p>
                  <p className="text-[10px] text-muted-foreground">نقطة</p>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};

export default Leaderboard;
