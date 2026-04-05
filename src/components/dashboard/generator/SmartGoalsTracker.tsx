/**
 * أهداف بيئية ذكية SMART - تتبع التقدم نحو أهداف بيئية محددة
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, Plus, CheckCircle2, Clock, Leaf } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SmartGoal {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  deadline: string;
  category: string;
}

const DEFAULT_GOALS: SmartGoal[] = [
  { id: '1', title: 'تقليل النفايات المرسلة للمكبات', target: 50, current: 32, unit: '%', deadline: '2026-12-31', category: 'تقليل' },
  { id: '2', title: 'رفع معدل إعادة التدوير', target: 70, current: 45, unit: '%', deadline: '2026-12-31', category: 'تدوير' },
  { id: '3', title: 'خفض البصمة الكربونية', target: 30, current: 18, unit: 'طن CO₂', deadline: '2026-12-31', category: 'كربون' },
];

const SmartGoalsTracker = () => {
  const [goals] = useState<SmartGoal[]>(DEFAULT_GOALS);
  const [showAdd, setShowAdd] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setShowAdd(!showAdd)}>
            <Plus className="h-3 w-3" />
          </Button>
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            الأهداف البيئية SMART
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3" dir="rtl">
        {goals.map(goal => {
          const progress = Math.min((goal.current / goal.target) * 100, 100);
          const isCompleted = progress >= 100;
          const daysLeft = Math.max(0, Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000));

          return (
            <div key={goal.id} className="p-3 rounded-lg bg-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Clock className="h-3 w-3 text-muted-foreground" />
                  )}
                  <span className="text-[10px] text-muted-foreground">{daysLeft} يوم متبقي</span>
                </div>
                <span className="text-xs font-medium">{goal.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-20">
                  {goal.current}/{goal.target} {goal.unit}
                </span>
                <Progress value={progress} className="h-2 flex-1" />
                <Badge variant={isCompleted ? 'default' : 'outline'} className="text-[10px]">
                  {progress.toFixed(0)}%
                </Badge>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default SmartGoalsTracker;
