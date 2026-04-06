/**
 * نظام مكافآت السائق المتقدم
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gift, Star, Trophy, Target, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const rewards = [
  { title: 'بونص الأداء الشهري', target: 50, current: 42, unit: 'شحنة', reward: '500 ج.م', icon: Target },
  { title: 'صفر حوادث (3 أشهر)', target: 90, current: 78, unit: 'يوم', reward: '1,000 ج.م', icon: Star },
  { title: 'تقييم 5 نجوم', target: 20, current: 15, unit: 'تقييم', reward: '300 ج.م', icon: Trophy },
];

const DriverRewardsProgram = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <Gift className="h-4 w-4 text-primary" />
        برنامج المكافآت
        <Badge variant="secondary" className="mr-auto text-[9px]">1,200 نقطة</Badge>
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {rewards.map((r, i) => {
        const pct = Math.round((r.current / r.target) * 100);
        return (
          <div key={i} className="p-2 rounded-lg border space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <r.icon className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium">{r.title}</span>
              </div>
              <Badge variant="outline" className="text-[9px]">{r.reward}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={pct} className="h-1.5 flex-1" />
              <span className="text-[10px] text-muted-foreground">{r.current}/{r.target} {r.unit}</span>
            </div>
          </div>
        );
      })}
    </CardContent>
  </Card>
);

export default DriverRewardsProgram;
