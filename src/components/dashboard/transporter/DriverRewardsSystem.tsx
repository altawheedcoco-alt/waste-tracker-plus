import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Trophy, Zap, Fuel, Shield } from 'lucide-react';

const rewards = [
  { driver: 'أحمد محمد', achievement: 'صفر حوادث — 6 أشهر', points: 500, icon: Shield, tier: 'ذهبي' },
  { driver: 'محمد علي', achievement: 'أقل استهلاك وقود', points: 300, icon: Fuel, tier: 'فضي' },
  { driver: 'خالد حسن', achievement: 'أعلى تقييم عملاء', points: 400, icon: Star, tier: 'ذهبي' },
  { driver: 'عمر أحمد', achievement: '100 رحلة بدون تأخير', points: 250, icon: Zap, tier: 'برونزي' },
];

const tierColors: Record<string, string> = {
  ذهبي: 'bg-yellow-100 text-yellow-800',
  فضي: 'bg-gray-100 text-gray-800',
  برونزي: 'bg-orange-100 text-orange-800',
};

export default function DriverRewardsSystem() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="w-5 h-5 text-primary" />
          نظام المكافآت والحوافز
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {rewards.map((r, i) => {
          const Icon = r.icon;
          return (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{r.driver}</p>
                <p className="text-[10px] text-muted-foreground">{r.achievement}</p>
              </div>
              <div className="text-left">
                <Badge variant="outline" className={`text-[10px] ${tierColors[r.tier]}`}>{r.tier}</Badge>
                <p className="text-[10px] font-bold text-primary mt-0.5">{r.points} نقطة</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
