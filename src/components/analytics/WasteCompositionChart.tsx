/**
 * WasteCompositionChart — تحليل تركيبة المخلفات
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const COLORS = [
  'hsl(var(--primary))', 'hsl(142, 76%, 36%)', 'hsl(48, 96%, 53%)',
  'hsl(262, 83%, 58%)', 'hsl(346, 87%, 50%)', 'hsl(199, 89%, 48%)',
  'hsl(24, 94%, 50%)', 'hsl(173, 80%, 40%)',
];

const WASTE_LABELS: Record<string, string> = {
  plastic: 'بلاستيك', paper: 'ورق', metal: 'معادن', glass: 'زجاج',
  organic: 'عضوي', electronic: 'إلكتروني', hazardous: 'خطر', mixed: 'مختلط',
  construction: 'إنشائي', textile: 'نسيج', wood: 'خشب', rubber: 'مطاط',
  oil: 'زيوت', chemical: 'كيميائي', medical: 'طبي', food: 'غذائي', other: 'أخرى',
};

export default function WasteCompositionChart() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['waste-composition', orgId],
    queryFn: async () => {
      if (!orgId) return null;

      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const { data: shipments } = await supabase
        .from('shipments')
        .select('waste_type, actual_weight, quantity')
        .or(`generator_id.eq.${orgId},recycler_id.eq.${orgId},transporter_id.eq.${orgId}`)
        .gte('created_at', threeMonthsAgo.toISOString());

      const typeMap = new Map<string, number>();
      let totalWeight = 0;

      (shipments || []).forEach(item => {
        const weight = item.actual_weight || item.quantity || 0;
        const type = (item.waste_type || 'other').toLowerCase();
        typeMap.set(type, (typeMap.get(type) || 0) + weight);
        totalWeight += weight;
      });

      const chartData = Array.from(typeMap.entries())
        .map(([type, weight]) => ({
          name: WASTE_LABELS[type] || type,
          value: Math.round(weight * 100) / 100,
          percentage: totalWeight > 0 ? Math.round((weight / totalWeight) * 1000) / 10 : 0,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);

      return { chartData, totalWeight: Math.round(totalWeight) };
    },
    enabled: !!orgId,
    staleTime: 30 * 60 * 1000,
  });

  const renderLabel = ({ name, percentage }: { name: string; percentage: number }) => {
    if (percentage < 5) return null;
    return `${name} ${percentage}%`;
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trash2 className="h-5 w-5 text-primary" />
            تركيبة المخلفات
          </CardTitle>
          {data && (
            <span className="text-xs text-muted-foreground">
              إجمالي: {data.totalWeight.toLocaleString()} كجم
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[250px] bg-muted/20 rounded animate-pulse" />
        ) : data?.chartData.length ? (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={data.chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={90}
                paddingAngle={2} dataKey="value" label={renderLabel} labelLine={{ strokeWidth: 1 }}>
                {data.chartData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, direction: 'rtl' }}
                formatter={(val: number) => [`${val.toLocaleString()} كجم`, 'الوزن']} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 10, direction: 'rtl' }} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">
            لا توجد بيانات كافية
          </div>
        )}
      </CardContent>
    </Card>
  );
}
