import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3, TrendingUp, TrendingDown, Minus, Target,
  Award, Users, Zap
} from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';

const MY_PERFORMANCE = {
  shipments: 85, revenue: 78, recycling_rate: 92, compliance: 95,
  satisfaction: 88, speed: 72,
};

const INDUSTRY_AVG = {
  shipments: 65, revenue: 60, recycling_rate: 70, compliance: 80,
  satisfaction: 75, speed: 65,
};

const RADAR_DATA = [
  { metric: 'الشحنات', mine: MY_PERFORMANCE.shipments, avg: INDUSTRY_AVG.shipments },
  { metric: 'الإيرادات', mine: MY_PERFORMANCE.revenue, avg: INDUSTRY_AVG.revenue },
  { metric: 'التدوير', mine: MY_PERFORMANCE.recycling_rate, avg: INDUSTRY_AVG.recycling_rate },
  { metric: 'الامتثال', mine: MY_PERFORMANCE.compliance, avg: INDUSTRY_AVG.compliance },
  { metric: 'الرضا', mine: MY_PERFORMANCE.satisfaction, avg: INDUSTRY_AVG.satisfaction },
  { metric: 'السرعة', mine: MY_PERFORMANCE.speed, avg: INDUSTRY_AVG.speed },
];

const RANKING_DATA = [
  { category: 'معدل التدوير', rank: 3, total: 45, percentile: 93 },
  { category: 'رضا العملاء', rank: 7, total: 45, percentile: 84 },
  { category: 'سرعة التنفيذ', rank: 12, total: 45, percentile: 73 },
  { category: 'الامتثال البيئي', rank: 2, total: 45, percentile: 96 },
  { category: 'حجم العمليات', rank: 8, total: 45, percentile: 82 },
];

const BenchmarkingDashboard = () => {
  const overallScore = Math.round(Object.values(MY_PERFORMANCE).reduce((s, v) => s + v, 0) / 6);
  const industryAvgScore = Math.round(Object.values(INDUSTRY_AVG).reduce((s, v) => s + v, 0) / 6);

  return (
    <div className="space-y-4" dir="rtl">
      {/* Overall Score */}
      <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">أداؤك مقارنة بالقطاع</p>
              <div className="text-3xl font-black text-primary">{overallScore}</div>
              <p className="text-[10px] text-muted-foreground">متوسط القطاع: {industryAvgScore}</p>
            </div>
            <div className="text-center">
              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs px-3 py-1">
                أعلى من المتوسط بـ {overallScore - industryAvgScore}%
              </Badge>
              <p className="text-[9px] text-muted-foreground mt-1">* البيانات مجهولة الهوية</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Radar */}
      <Card>
        <CardHeader className="pb-0 px-4 pt-3">
          <CardTitle className="text-sm">مخطط الأداء المقارن</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-3">
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={RADAR_DATA}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 8 }} />
              <Radar name="أداؤك" dataKey="mine" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.2)" strokeWidth={2} />
              <Radar name="متوسط القطاع" dataKey="avg" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground)/0.1)" strokeWidth={1} strokeDasharray="4 4" />
            </RadarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 text-[9px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-primary" /> أداؤك</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-muted-foreground" /> متوسط القطاع</span>
          </div>
        </CardContent>
      </Card>

      {/* Rankings */}
      <Card>
        <CardHeader className="pb-2 px-4 pt-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            ترتيبك في القطاع
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-3">
          {RANKING_DATA.map(r => (
            <div key={r.category}>
              <div className="flex justify-between text-xs mb-1">
                <span>{r.category}</span>
                <span className="font-bold">
                  #{r.rank} <span className="text-muted-foreground font-normal">من {r.total}</span>
                </span>
              </div>
              <Progress value={r.percentile} className="h-1.5" />
              <p className="text-[9px] text-muted-foreground mt-0.5">
                أفضل من {r.percentile}% من الجهات المماثلة
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default BenchmarkingDashboard;
