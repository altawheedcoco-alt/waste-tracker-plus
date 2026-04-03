import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Minus, BarChart3, Target, Zap, Award } from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

const PerformanceComparisonDashboard = () => {
  const { organization } = useAuth();
  const [compareMode, setCompareMode] = useState<'month' | 'quarter'>('month');

  const { data, isLoading } = useQuery({
    queryKey: ['perf-comparison', organization?.id, compareMode],
    enabled: !!organization?.id,
    queryFn: async () => {
      const now = new Date();
      const currentStart = new Date(now.getFullYear(), compareMode === 'month' ? now.getMonth() : Math.floor(now.getMonth() / 3) * 3, 1);
      const prevStart = new Date(currentStart);
      if (compareMode === 'month') prevStart.setMonth(prevStart.getMonth() - 1);
      else prevStart.setMonth(prevStart.getMonth() - 3);

      const [currentRes, prevRes] = await Promise.all([
        supabase.from('shipments').select('id, status, quantity, created_at')
          .eq('generator_id', organization!.id)
          .gte('created_at', currentStart.toISOString())
          .lt('created_at', now.toISOString()),
        supabase.from('shipments').select('id, status, quantity, created_at')
          .eq('generator_id', organization!.id)
          .gte('created_at', prevStart.toISOString())
          .lt('created_at', currentStart.toISOString()),
      ]);

      const calc = (items: any[]) => ({
        count: items.length,
        tons: items.reduce((s, i) => s + (Number(i.quantity) || 0), 0),
        confirmed: items.filter(i => i.status === 'confirmed').length,
        rate: items.length ? Math.round((items.filter(i => i.status === 'confirmed').length / items.length) * 100) : 0,
      });

      const current = calc(currentRes.data || []);
      const previous = calc(prevRes.data || []);

      const pctChange = (c: number, p: number) => p === 0 ? (c > 0 ? 100 : 0) : Math.round(((c - p) / p) * 100);

      return {
        current, previous,
        changes: {
          count: pctChange(current.count, previous.count),
          tons: pctChange(current.tons, previous.tons),
          confirmed: pctChange(current.confirmed, previous.confirmed),
          rate: current.rate - previous.rate,
        },
        radarData: [
          { metric: 'الشحنات', current: Math.min(current.count, 100), previous: Math.min(previous.count, 100) },
          { metric: 'الأطنان', current: Math.min(current.tons, 100), previous: Math.min(previous.tons, 100) },
          { metric: 'الإنجاز', current: current.rate, previous: previous.rate },
          { metric: 'المؤكدة', current: Math.min(current.confirmed * 10, 100), previous: Math.min(previous.confirmed * 10, 100) },
          { metric: 'الكفاءة', current: Math.min(current.rate + 10, 100), previous: Math.min(previous.rate + 5, 100) },
        ],
        barData: [
          { label: 'الشحنات', current: current.count, previous: previous.count },
          { label: 'المؤكدة', current: current.confirmed, previous: previous.confirmed },
          { label: 'الأطنان', current: Math.round(current.tons), previous: Math.round(previous.tons) },
        ],
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <Skeleton className="h-96" />;

  const TrendIcon = ({ val }: { val: number }) => {
    if (val > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (val < 0) return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const periodLabel = compareMode === 'month' ? 'الشهر الحالي vs السابق' : 'الربع الحالي vs السابق';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">مقارنة الأداء</h3>
          <Badge variant="outline" className="text-xs">{periodLabel}</Badge>
        </div>
        <Select value={compareMode} onValueChange={(v: 'month' | 'quarter') => setCompareMode(v)}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">شهري</SelectItem>
            <SelectItem value="quarter">ربع سنوي</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Change indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'الشحنات', val: data?.changes.count || 0, icon: BarChart3 },
          { label: 'الأطنان', val: data?.changes.tons || 0, icon: Zap },
          { label: 'المؤكدة', val: data?.changes.confirmed || 0, icon: Award },
          { label: 'معدل الإنجاز', val: data?.changes.rate || 0, icon: Target },
        ].map(item => (
          <Card key={item.label}>
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendIcon val={item.val} />
                  <span className={`text-sm font-bold ${item.val > 0 ? 'text-green-600' : item.val < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {item.val > 0 ? '+' : ''}{item.val}%
                  </span>
                </div>
              </div>
              <item.icon className="h-5 w-5 text-muted-foreground/40" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">رادار الأداء</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={data?.radarData || []}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis tick={false} domain={[0, 100]} />
                  <Radar name="الحالي" dataKey="current" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.3)" strokeWidth={2} />
                  <Radar name="السابق" dataKey="previous" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground) / 0.1)" strokeWidth={1} strokeDasharray="4 4" />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">مقارنة مباشرة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.barData || []}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="current" name="الحالي" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="previous" name="السابق" fill="hsl(var(--muted-foreground) / 0.4)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PerformanceComparisonDashboard;
