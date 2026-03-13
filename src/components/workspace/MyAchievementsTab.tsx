import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, TrendingUp, Award, Package, FileCheck, Loader2 } from 'lucide-react';

const MyAchievementsTab = () => {
  const { user, organization } = useAuth();

  // Get activity stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['my-achievements', user?.id],
    queryFn: async () => {
      if (!user?.id || !organization?.id) return null;

      const [shipmentsRes, logsRes, certsRes] = await Promise.all([
        supabase
          .from('shipments')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organization.id)
          .eq('status', 'delivered'),
        supabase
          .from('activity_logs')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('recycling_certificates')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organization.id),
      ]);

      return {
        deliveredShipments: shipmentsRes.count || 0,
        totalActions: logsRes.count || 0,
        certificates: certsRes.count || 0,
      };
    },
    enabled: !!user?.id && !!organization?.id,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  const achievements = [
    {
      title: 'شحنات مكتملة',
      value: stats?.deliveredShipments || 0,
      icon: Package,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      milestone: 100,
    },
    {
      title: 'إجراءات منفذة',
      value: stats?.totalActions || 0,
      icon: TrendingUp,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      milestone: 500,
    },
    {
      title: 'شهادات صادرة',
      value: stats?.certificates || 0,
      icon: FileCheck,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
      milestone: 50,
    },
  ];

  // Calculate level
  const totalScore = (stats?.deliveredShipments || 0) + (stats?.totalActions || 0) * 0.1 + (stats?.certificates || 0) * 5;
  const level = totalScore >= 500 ? 'خبير' : totalScore >= 200 ? 'متقدم' : totalScore >= 50 ? 'متوسط' : 'مبتدئ';
  const levelColors: Record<string, string> = {
    'خبير': 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    'متقدم': 'bg-purple-500/10 text-purple-600 border-purple-500/30',
    'متوسط': 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    'مبتدئ': 'bg-muted text-muted-foreground',
  };

  return (
    <div className="space-y-6">
      {/* Level Badge */}
      <Card className="border-primary/10 overflow-hidden">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">المستوى الحالي</p>
            <div className="flex items-center gap-2 mt-1">
              <h3 className="text-2xl font-bold">{level}</h3>
              <Badge className={levelColors[level]}>{Math.round(totalScore)} نقطة</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {achievements.map(a => {
          const progress = Math.min((a.value / a.milestone) * 100, 100);
          return (
            <Card key={a.title} className="border-border/30">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-xl ${a.bg} flex items-center justify-center`}>
                    <a.icon className={`w-5 h-5 ${a.color}`} />
                  </div>
                  <span className="text-2xl font-bold">{a.value}</span>
                </div>
                <p className="text-sm font-medium">{a.title}</p>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">الهدف: {a.milestone}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MyAchievementsTab;
