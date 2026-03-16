import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Leaf, TreePine, Car, Zap, Droplets, TrendingUp, ChevronLeft,
  Recycle, Factory, BarChart3
} from 'lucide-react';
import { useEnvironmentalKPIs } from '@/hooks/useEnvironmentalKPIs';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

type Period = 'month' | 'quarter' | 'year' | 'all';

const EnvironmentalKPIWidget = () => {
  const [period, setPeriod] = useState<Period>('year');
  const { data: kpis, isLoading } = useEnvironmentalKPIs(period);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card className="border-emerald-200 dark:border-emerald-800">
        <CardContent className="p-4 space-y-3">
          <Skeleton className="h-5 w-40" />
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!kpis) return null;

  const periodLabels: Record<Period, string> = {
    month: 'الشهر', quarter: 'الربع', year: 'السنة', all: 'الكل',
  };

  return (
    <Card className="border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50/30 to-teal-50/30 dark:from-emerald-950/20 dark:to-teal-950/20">
      <CardHeader className="pb-2 px-4 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {(['month', 'quarter', 'year'] as Period[]).map(p => (
              <Button
                key={p}
                variant={period === p ? 'default' : 'ghost'}
                size="sm"
                className={cn('h-6 px-2 text-[10px]', period === p && 'bg-emerald-600 hover:bg-emerald-700')}
                onClick={() => setPeriod(p)}
              >
                {periodLabels[p]}
              </Button>
            ))}
          </div>
          <CardTitle className="text-sm flex items-center gap-1.5">
            <span>الأثر البيئي</span>
            <Leaf className="h-4 w-4 text-emerald-600" />
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-3 space-y-3">
        {/* Main KPI */}
        <div className="text-center py-2">
          <div className="text-3xl font-black text-emerald-700 dark:text-emerald-400">
            {kpis.co2SavedTons.toLocaleString('ar-EG')}
          </div>
          <p className="text-xs text-muted-foreground">طن CO₂ تم توفيره</p>
          <Progress value={Math.min(kpis.recyclingRate, 100)} className="h-1.5 mt-2" />
          <p className="text-[10px] text-muted-foreground mt-1">
            نسبة التدوير: {kpis.recyclingRate}%
          </p>
        </div>

        {/* Secondary KPIs Grid */}
        <div className="grid grid-cols-2 gap-2">
          <KPICard
            icon={<Recycle className="h-4 w-4 text-emerald-600" />}
            value={kpis.recycledTons.toLocaleString('ar-EG')}
            unit="طن"
            label="مخلفات مُدوّرة"
          />
          <KPICard
            icon={<TreePine className="h-4 w-4 text-green-700" />}
            value={kpis.treesEquivalent.toLocaleString('ar-EG')}
            unit="شجرة"
            label="مكافئ أشجار/سنة"
          />
          <KPICard
            icon={<Car className="h-4 w-4 text-blue-600" />}
            value={kpis.carsOffRoad.toLocaleString('ar-EG')}
            unit="سيارة"
            label="مكافئ سيارات/سنة"
          />
          <KPICard
            icon={<Droplets className="h-4 w-4 text-cyan-600" />}
            value={(kpis.waterSavedLiters / 1000).toLocaleString('ar-EG', { maximumFractionDigits: 0 })}
            unit="م³"
            label="مياه تم توفيرها"
          />
        </div>

        {/* Top waste types */}
        {kpis.wasteByType.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <p className="text-[10px] font-semibold text-muted-foreground text-right">أعلى أنواع المخلفات أثراً:</p>
            {kpis.wasteByType.slice(0, 3).map(w => (
              <div key={w.type} className="flex items-center justify-between text-[10px]">
                <Badge variant="outline" className="text-[9px] h-4 px-1.5 text-emerald-700 border-emerald-300">
                  {w.co2} طن CO₂
                </Badge>
                <span className="font-medium">{w.type} ({w.tons} طن)</span>
              </div>
            ))}
          </div>
        )}

        {/* Action */}
        <Button
          variant="outline"
          size="sm"
          className="w-full text-[10px] h-7 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          onClick={() => navigate('/dashboard/environmental-sustainability')}
        >
          <ChevronLeft className="h-3 w-3 ml-1" />
          تقرير الاستدامة الكامل
        </Button>
      </CardContent>
    </Card>
  );
};

const KPICard = ({ icon, value, unit, label }: { icon: React.ReactNode; value: string; unit: string; label: string }) => (
  <div className="bg-background/60 rounded-lg p-2 text-center border border-emerald-100 dark:border-emerald-900/50">
    <div className="flex items-center justify-center mb-1">{icon}</div>
    <div className="text-sm font-bold">
      {value} <span className="text-[10px] font-normal text-muted-foreground">{unit}</span>
    </div>
    <p className="text-[9px] text-muted-foreground leading-tight">{label}</p>
  </div>
);

export default EnvironmentalKPIWidget;
