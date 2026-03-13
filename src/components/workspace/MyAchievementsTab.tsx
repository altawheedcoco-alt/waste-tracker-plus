import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, Package, FileCheck, Loader2 } from 'lucide-react';

const MyAchievementsTab = () => {
  const { user, organization } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['my-achievements', user?.id],
    queryFn: async () => {
      if (!user?.id || !organization?.id) return null;

      const [shipmentsRes, logsRes] = await Promise.all([
        supabase
          .from('shipments')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organization.id)
          .eq('status', 'delivered'),
        supabase
          .from('activity_logs')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
      ]);

      return {
        deliveredShipments: shipmentsRes.count || 0,
        totalActions: logsRes.count || 0,
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
      milestone: 100,
    },
    {
      title: 'إجراءات منفذة',
      value: stats?.totalActions || 0,
      icon: TrendingUp,
      milestone: 500,
    },
  ];

  const totalScore = (stats?.deliveredShipments || 0) + (stats?.totalActions || 0) * 0.1;
  const level = totalScore >= 500 ? 'خبير' : totalScore >= 200 ? 'متقدم' : totalScore >= 50 ? 'متوسط' : 'مبتدئ';

  return (
    <div className="space-y-6">
      {/* Level Badge */}
      <Card className="border-primary/10 overflow-hidden">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
            <Trophy className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">المستوى الحالي</p>
            <div className="flex items-center gap-2 mt-1">
              <h3 className="text-2xl font-bold">{level}</h3>
              <Badge variant="secondary">{Math.round(totalScore)} نقطة</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        {achievements.map(a => {
          const progress = Math.min((a.value / a.milestone) * 100, 100);
          return (
            <Card key={a.title} className="border-border/30">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <a.icon className="w-5 h-5 text-primary" />
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
