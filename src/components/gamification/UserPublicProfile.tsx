import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Award, Star, TrendingUp, Flame, Shield, Calendar } from 'lucide-react';
import { useGamification, getTierColor } from '@/hooks/useGamification';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

const UserPublicProfile = () => {
  const { profile, organization } = useAuth();
  const { gamification, achievements, levelInfo, unlockedCount, isLoading } = useGamification();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const recentEarned = achievements.filter(a => a.earned).slice(0, 6);
  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '؟';

  return (
    <Card className="overflow-hidden">
      {/* Header Banner */}
      <div className="h-24 bg-gradient-to-l from-primary via-primary/80 to-primary/60 relative">
        <div className="absolute -bottom-10 right-6">
          <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
            <AvatarImage src={profile?.avatar_url || ''} />
            <AvatarFallback className="text-xl font-bold bg-primary text-primary-foreground">{initials}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      <CardContent className="pt-14 pb-6 px-6 space-y-6">
        {/* User Info */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold">{profile?.full_name || 'مستخدم'}</h2>
            <p className="text-sm text-muted-foreground">{organization?.name || ''}</p>
            
          </div>
          <Badge className="text-sm gap-1" variant="outline">
            <Shield className="h-3.5 w-3.5" />
            المستوى {levelInfo.current.level} - {levelInfo.current.name}
          </Badge>
        </div>

        {/* Level Progress */}
        <div className="space-y-2 bg-muted/30 rounded-xl p-4">
          <div className="flex justify-between text-sm">
            <span className="font-medium">التقدم للمستوى التالي</span>
            <span className="text-muted-foreground">{Math.round(levelInfo.progress)}%</span>
          </div>
          <Progress value={levelInfo.progress} className="h-2.5" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{gamification?.xp_current || 0} XP</span>
            <span>{levelInfo.next?.name || 'أقصى مستوى'}</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: Star, label: 'النقاط', value: gamification?.total_points || 0, color: 'text-yellow-500' },
            { icon: TrendingUp, label: 'الشحنات', value: gamification?.total_shipments || 0, color: 'text-primary' },
            { icon: Award, label: 'الإنجازات', value: unlockedCount, color: 'text-purple-500' },
            { icon: Flame, label: 'أيام النشاط', value: gamification?.streak_days || 0, color: 'text-orange-500' },
          ].map(s => (
            <div key={s.label} className="text-center p-2 rounded-lg bg-muted/40">
              <s.icon className={`h-4 w-4 mx-auto mb-1 ${s.color}`} />
              <p className="text-base font-bold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Recent Achievements */}
        {recentEarned.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              أحدث الإنجازات
            </h3>
            <div className="flex flex-wrap gap-2">
              {recentEarned.map(a => (
                <Badge key={a.id} className={`gap-1 ${getTierColor(a.tier)}`} variant="outline">
                  <span>{a.icon}</span>
                  {a.title_ar}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserPublicProfile;
