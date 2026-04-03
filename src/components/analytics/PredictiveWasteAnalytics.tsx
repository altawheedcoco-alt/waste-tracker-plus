/**
 * Predictive Waste Analytics Widget
 * Forecasts waste generation trends based on historical data
 */
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp, TrendingDown, BarChart3, Calendar, ArrowUpRight,
  ArrowDownRight, Minus, Activity
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface MonthlyData {
  month: string;
  label: string;
  totalTons: number;
  shipmentCount: number;
}

interface Prediction {
  nextMonthTons: number;
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
  confidence: number;
  peakMonth: string;
  avgMonthlyTons: number;
}

const PredictiveWasteAnalytics: React.FC = () => {
  const { organization } = useAuth();

  const { data: historicalData } = useQuery({
    queryKey: ['waste-predictions', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      // Get last 12 months of shipments
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const { data } = await (supabase
        .from('shipments' as any)
        .select('quantity, unit, created_at, waste_type')
        .eq('organization_id', organization.id) as any)
        .in('status', ['delivered', 'confirmed'])
        .gte('created_at', twelveMonthsAgo.toISOString())
        .order('created_at', { ascending: true });

      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { monthlyData, prediction } = useMemo(() => {
    if (!historicalData?.length) {
      return { monthlyData: [] as MonthlyData[], prediction: null };
    }

    // Group by month
    const byMonth: Record<string, { tons: number; count: number }> = {};
    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

    for (const s of historicalData) {
      const d = new Date(s.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const qty = Number(s.quantity) || 0;
      const tons = (s.unit === 'كجم' || s.unit === 'kg' || !s.unit) ? qty / 1000 : qty;

      if (!byMonth[key]) byMonth[key] = { tons: 0, count: 0 };
      byMonth[key].tons += tons;
      byMonth[key].count += 1;
    }

    const sorted = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => {
        const [y, m] = month.split('-');
        return {
          month,
          label: `${monthNames[parseInt(m) - 1]} ${y}`,
          totalTons: Math.round(data.tons * 100) / 100,
          shipmentCount: data.count,
        };
      });

    // Simple linear regression for prediction
    let pred: Prediction | null = null;
    if (sorted.length >= 3) {
      const values = sorted.map(s => s.totalTons);
      const n = values.length;
      const avg = values.reduce((s, v) => s + v, 0) / n;

      // Trend: compare last 3 months avg vs first 3 months avg
      const recent = values.slice(-3).reduce((s, v) => s + v, 0) / 3;
      const earlier = values.slice(0, 3).reduce((s, v) => s + v, 0) / 3;
      const trendPercent = earlier > 0 ? Math.round(((recent - earlier) / earlier) * 100) : 0;

      // Simple moving average prediction
      const nextMonthTons = Math.round(recent * 100) / 100;

      // Find peak month
      const peakIdx = values.indexOf(Math.max(...values));
      const peakMonth = sorted[peakIdx]?.label || '—';

      // Confidence based on data quantity
      const confidence = Math.min(90, 40 + n * 5);

      pred = {
        nextMonthTons,
        trend: trendPercent > 5 ? 'up' : trendPercent < -5 ? 'down' : 'stable',
        trendPercent: Math.abs(trendPercent),
        confidence,
        peakMonth,
        avgMonthlyTons: Math.round(avg * 100) / 100,
      };
    }

    return { monthlyData: sorted, prediction: pred };
  }, [historicalData]);

  const TrendIcon = prediction?.trend === 'up' ? ArrowUpRight : prediction?.trend === 'down' ? ArrowDownRight : Minus;
  const trendColor = prediction?.trend === 'up' ? 'text-red-500' : prediction?.trend === 'down' ? 'text-emerald-500' : 'text-muted-foreground';

  return (
    <Card>
      <CardHeader className="pb-2 px-4 pt-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <Badge variant="outline" className="text-[9px] h-4 px-1.5">
            {monthlyData.length} شهر
          </Badge>
          <div className="flex items-center gap-1.5">
            <span>التنبؤ بالمخلفات</span>
            <Activity className="h-4 w-4 text-primary" />
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="px-4 pb-3 space-y-3">
        {!prediction ? (
          <div className="text-center py-6 text-muted-foreground">
            <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">بيانات غير كافية للتنبؤ</p>
            <p className="text-[10px]">يحتاج 3 أشهر على الأقل</p>
          </div>
        ) : (
          <>
            {/* Prediction Card */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">التوقع للشهر القادم</p>
              <div className="text-2xl font-black text-primary">
                {prediction.nextMonthTons} <span className="text-sm font-normal">طن</span>
              </div>
              <div className="flex items-center justify-center gap-1 mt-1">
                <TrendIcon className={`w-3.5 h-3.5 ${trendColor}`} />
                <span className={`text-xs font-semibold ${trendColor}`}>
                  {prediction.trendPercent}% {prediction.trend === 'up' ? 'زيادة' : prediction.trend === 'down' ? 'انخفاض' : 'مستقر'}
                </span>
              </div>
              <Badge variant="outline" className="text-[8px] mt-1.5">
                ثقة {prediction.confidence}%
              </Badge>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-muted/30 rounded-lg p-2.5 border text-center">
                <Calendar className="w-4 h-4 mx-auto mb-0.5 text-muted-foreground" />
                <div className="text-xs font-bold">{prediction.avgMonthlyTons} طن</div>
                <p className="text-[8px] text-muted-foreground">متوسط شهري</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-2.5 border text-center">
                <TrendingUp className="w-4 h-4 mx-auto mb-0.5 text-muted-foreground" />
                <div className="text-xs font-bold truncate">{prediction.peakMonth}</div>
                <p className="text-[8px] text-muted-foreground">شهر الذروة</p>
              </div>
            </div>

            {/* Mini Bar Chart */}
            <div className="space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground">آخر {monthlyData.length} أشهر</p>
              <div className="flex items-end gap-1 h-16">
                {monthlyData.slice(-6).map((m, i) => {
                  const maxTons = Math.max(...monthlyData.slice(-6).map(d => d.totalTons));
                  const height = maxTons > 0 ? (m.totalTons / maxTons) * 100 : 0;
                  return (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-0.5">
                      <span className="text-[7px] text-muted-foreground">{m.totalTons}</span>
                      <div
                        className="w-full rounded-t bg-primary/70 min-h-[2px] transition-all"
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-[7px] text-muted-foreground truncate w-full text-center">
                        {m.label.split(' ')[0]?.slice(0, 3)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PredictiveWasteAnalytics;
