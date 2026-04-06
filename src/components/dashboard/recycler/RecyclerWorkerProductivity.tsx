import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Award, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const workers = [
  { name: 'أحمد محمود', line: 'خط PET', productivity: 96, output: '3.4 ط/وردية', rank: 1 },
  { name: 'محمد عبدالله', line: 'خط الحديد', productivity: 94, output: '5.2 ط/وردية', rank: 2 },
  { name: 'عبدالرحمن سعيد', line: 'خط HDPE', productivity: 89, output: '2.9 ط/وردية', rank: 3 },
  { name: 'حسن إبراهيم', line: 'خط الورق', productivity: 85, output: '4.1 ط/وردية', rank: 4 },
  { name: 'علي حسن', line: 'خط الزجاج', productivity: 78, output: '1.8 ط/وردية', rank: 5 },
];

const RecyclerWorkerProductivity = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <Users className="h-5 w-5 text-primary" />
        إنتاجية العمال
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {workers.map((w) => (
        <div key={w.rank} className="flex items-center gap-3">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
            w.rank === 1 ? 'bg-yellow-500/20 text-yellow-600' :
            w.rank === 2 ? 'bg-gray-400/20 text-gray-600' :
            w.rank === 3 ? 'bg-orange-500/20 text-orange-600' :
            'bg-muted text-muted-foreground'
          }`}>
            {w.rank}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{w.name}</span>
              <span className="text-xs text-muted-foreground">{w.line} • {w.output}</span>
            </div>
            <Progress value={w.productivity} className="h-1.5" />
          </div>
          <span className="text-sm font-bold text-primary">{w.productivity}%</span>
        </div>
      ))}
    </CardContent>
  </Card>
);

export default RecyclerWorkerProductivity;
