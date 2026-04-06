/**
 * سجل إنجازات الموظف
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, TrendingUp, Target } from 'lucide-react';

const achievements = [
  { title: 'إتمام 50 مهمة بنجاح', date: '2026-04-01', points: 500, icon: '🏆' },
  { title: 'صفر أخطاء لمدة شهر', date: '2026-03-31', points: 300, icon: '⭐' },
  { title: 'أسرع إنجاز مهمة (12 دقيقة)', date: '2026-03-25', points: 150, icon: '⚡' },
  { title: 'تقييم 5 نجوم من 3 شركاء', date: '2026-03-20', points: 200, icon: '🌟' },
];

const EmployeeAchievements = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <Trophy className="h-4 w-4 text-primary" />
        إنجازاتي
        <Badge variant="secondary" className="mr-auto text-[9px]">
          {achievements.reduce((s, a) => s + a.points, 0)} نقطة
        </Badge>
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {achievements.map((a, i) => (
        <div key={i} className="flex items-center gap-2 p-2 rounded border">
          <span className="text-lg">{a.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium">{a.title}</p>
            <p className="text-[10px] text-muted-foreground">{new Date(a.date).toLocaleDateString('ar-EG')}</p>
          </div>
          <Badge variant="outline" className="text-[9px]">+{a.points}</Badge>
        </div>
      ))}
    </CardContent>
  </Card>
);

export default EmployeeAchievements;
