import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Recycle } from 'lucide-react';

const materials = [
  { name: 'بلاستيك PET', inputTons: 120, outputTons: 96, yield: 80, target: 85 },
  { name: 'بلاستيك HDPE', inputTons: 85, outputTons: 72.25, yield: 85, target: 82 },
  { name: 'ورق مقوى', inputTons: 200, outputTons: 170, yield: 85, target: 80 },
  { name: 'حديد خردة', inputTons: 150, outputTons: 142.5, yield: 95, target: 90 },
  { name: 'زجاج', inputTons: 60, outputTons: 54, yield: 90, target: 88 },
  { name: 'ألومنيوم', inputTons: 40, outputTons: 37.2, yield: 93, target: 90 },
];

const RecyclerInputYieldAnalysis = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <Recycle className="h-5 w-5 text-primary" />
        تحليل العائد من المدخلات
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      {materials.map((m, i) => (
        <div key={i} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="font-medium">{m.name}</span>
            <span className="text-muted-foreground">
              {m.inputTons}ط → {m.outputTons}ط
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Progress value={m.yield} className="flex-1 h-2" />
            <span className={`text-xs font-bold ${m.yield >= m.target ? 'text-green-600' : 'text-yellow-600'}`}>
              {m.yield}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground">المستهدف: {m.target}%</p>
        </div>
      ))}
      <div className="flex items-center gap-2 pt-2 border-t text-sm text-green-600">
        <TrendingUp className="h-4 w-4" />
        متوسط العائد الإجمالي: 88%
      </div>
    </CardContent>
  </Card>
);

export default RecyclerInputYieldAnalysis;
