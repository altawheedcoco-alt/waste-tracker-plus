import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Recycle, TreePine } from 'lucide-react';
import { useGamification } from '@/hooks/useGamification';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

// Simulated monthly data based on total
const generateMonthlyData = (totalTons: number) => {
  const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'];
  const fraction = totalTons / 6;
  return months.map((m, i) => ({
    month: m,
    tons: Math.round((fraction * (0.5 + Math.random())) * 100) / 100,
  }));
};

const PersonalStatsCard = () => {
  const { gamification, isLoading } = useGamification();

  if (isLoading) {
    return <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>;
  }

  if (!gamification) return null;

  const monthlyData = generateMonthlyData(Number(gamification.total_tons) || 0);
  const co2Saved = (Number(gamification.total_tons) * 0.5).toFixed(1);
  const treesEquiv = Math.round(Number(gamification.total_tons) * 0.8);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-5 w-5 text-primary" />
          إحصائياتي البيئية
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
            <Recycle className="h-5 w-5 mx-auto text-green-600 mb-1" />
            <p className="text-lg font-bold text-green-700 dark:text-green-400">{Number(gamification.total_tons).toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground">طن مُعاد تدويره</p>
          </div>
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <TrendingUp className="h-5 w-5 mx-auto text-blue-600 mb-1" />
            <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{co2Saved}</p>
            <p className="text-[10px] text-muted-foreground">طن CO₂ مُوفَّر</p>
          </div>
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
            <TreePine className="h-5 w-5 mx-auto text-emerald-600 mb-1" />
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{treesEquiv}</p>
            <p className="text-[10px] text-muted-foreground">شجرة مُعادِلة</p>
          </div>
        </div>

        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorTons" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number) => [`${v} طن`, 'الأطنان']} />
              <Area type="monotone" dataKey="tons" stroke="hsl(var(--primary))" fill="url(#colorTons)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalStatsCard;
