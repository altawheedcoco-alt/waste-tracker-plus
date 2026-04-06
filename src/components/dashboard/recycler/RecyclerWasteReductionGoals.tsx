import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Leaf } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const goals = [
  { name: 'تقليل نسبة الفاقد إلى 5%', current: 7.2, target: 5, unit: '%', progress: 72 },
  { name: 'رفع معدل الاسترداد إلى 90%', current: 86, target: 90, unit: '%', progress: 96 },
  { name: 'خفض استهلاك المياه 20%', current: 15, target: 20, unit: '%', progress: 75 },
  { name: 'صفر نفايات للمدفن بحلول 2027', current: 92, target: 100, unit: '% تحويل', progress: 92 },
  { name: 'خفض الانبعاثات 30%', current: 22, target: 30, unit: '%', progress: 73 },
];

const RecyclerWasteReductionGoals = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <Target className="h-5 w-5 text-primary" />
        أهداف الاستدامة
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      {goals.map((g, i) => (
        <div key={i} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{g.name}</span>
            <span className="text-xs text-muted-foreground">{g.current}{g.unit} / {g.target}{g.unit}</span>
          </div>
          <Progress value={g.progress} className="h-2" />
        </div>
      ))}
      <div className="flex items-center gap-2 pt-2 border-t text-xs text-green-600">
        <Leaf className="h-3 w-3" />
        معدل تحقيق الأهداف الإجمالي: 82%
      </div>
    </CardContent>
  </Card>
);

export default RecyclerWasteReductionGoals;
