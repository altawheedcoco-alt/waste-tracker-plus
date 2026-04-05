/**
 * مؤشر نظافة المنشأة - محدّث يومياً بناءً على بيانات الشحنات
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

const CleanlinessScoreWidget = () => {
  const { organization } = useAuth();

  const { data: shipments = [] } = useQuery({
    queryKey: ['generator-cleanliness', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
      const { data } = await supabase
        .from('shipments')
        .select('status, created_at, waste_type, hazard_level')
        .eq('generator_id', organization.id)
        .gte('created_at', thirtyDaysAgo);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const score = useMemo(() => {
    if (shipments.length === 0) return { value: 0, grade: 'N/A', color: 'text-muted-foreground', factors: [] };

    let points = 70; // Base
    const factors: { label: string; impact: number }[] = [];

    // Regular disposal frequency
    const daysWithShipments = new Set(shipments.map(s => s.created_at?.split('T')[0])).size;
    const freqScore = Math.min(daysWithShipments / 10, 1) * 10;
    points += freqScore;
    factors.push({ label: 'انتظام الجمع', impact: freqScore });

    // Completion rate
    const completed = shipments.filter(s => ['delivered', 'confirmed'].includes(s.status)).length;
    const completionRate = (completed / shipments.length) * 100;
    const compScore = (completionRate / 100) * 10;
    points += compScore;
    factors.push({ label: 'معدل الإتمام', impact: compScore });

    // No hazardous without proper handling
    const hazardous = shipments.filter(s => s.hazard_level === 'high' || s.hazard_level === 'dangerous');
    if (hazardous.length === 0) {
      points += 5;
      factors.push({ label: 'خالي من المخاطر', impact: 5 });
    }

    // Variety in waste types (proper sorting)
    const types = new Set(shipments.map(s => s.waste_type).filter(Boolean)).size;
    const sortScore = Math.min(types / 3, 1) * 5;
    points += sortScore;
    factors.push({ label: 'فرز جيد', impact: sortScore });

    const value = Math.min(Math.round(points), 100);
    const grade = value >= 90 ? 'A+' : value >= 80 ? 'A' : value >= 70 ? 'B' : value >= 60 ? 'C' : 'D';
    const color = value >= 80 ? 'text-green-600' : value >= 60 ? 'text-amber-600' : 'text-red-600';

    return { value, grade, color, factors };
  }, [shipments]);

  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (score.value / 100) * circumference;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 justify-end">
          <Sparkles className="h-4 w-4 text-amber-500" />
          مؤشر نظافة المنشأة
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center" dir="rtl">
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" strokeWidth="8" className="stroke-muted" />
            <circle cx="50" cy="50" r="40" fill="none" strokeWidth="8" strokeLinecap="round"
              className={score.value >= 80 ? 'stroke-green-500' : score.value >= 60 ? 'stroke-amber-500' : 'stroke-red-500'}
              style={{ strokeDasharray: circumference, strokeDashoffset, transition: 'stroke-dashoffset 1s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-xl font-bold ${score.color}`}>{score.grade}</span>
            <span className="text-[10px] text-muted-foreground">{score.value}/100</span>
          </div>
        </div>
        <div className="w-full mt-3 space-y-1">
          {score.factors.map((f, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <Badge variant="outline" className="text-[10px]">+{f.impact.toFixed(1)}</Badge>
              <span className="text-muted-foreground">{f.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CleanlinessScoreWidget;
