import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { PieChart as PieChartIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { subMonths } from 'date-fns';

interface WasteTypeDistributionProps {
  organizationId: string | null;
  dateRange: {
    from: Date;
    to: Date;
  };
  detailed?: boolean;
}

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

const WasteTypeDistribution = ({ 
  organizationId, 
  dateRange,
  detailed = false 
}: WasteTypeDistributionProps) => {
  const { data: distributionData, isLoading } = useQuery({
    queryKey: ['waste-distribution', organizationId, dateRange.from, dateRange.to, detailed],
    queryFn: async () => {
      if (!organizationId) return [];

      // Current period
      const { data: currentShipments } = await supabase
        .from('shipments')
        .select('waste_type, quantity')
        .or(`generator_id.eq.${organizationId},transporter_id.eq.${organizationId},recycler_id.eq.${organizationId}`)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .not('waste_type', 'is', null);

      // Previous period for trend
      const periodLength = dateRange.to.getTime() - dateRange.from.getTime();
      const prevFrom = new Date(dateRange.from.getTime() - periodLength);
      const prevTo = dateRange.from;

      const { data: prevShipments } = await supabase
        .from('shipments')
        .select('waste_type, quantity')
        .or(`generator_id.eq.${organizationId},transporter_id.eq.${organizationId},recycler_id.eq.${organizationId}`)
        .gte('created_at', prevFrom.toISOString())
        .lte('created_at', prevTo.toISOString())
        .not('waste_type', 'is', null);

      const shipments = currentShipments || [];
      const previousShipments = prevShipments || [];

      // Group by waste type
      const grouped = shipments.reduce((acc, s) => {
        const type = s.waste_type || 'غير محدد';
        if (!acc[type]) {
          acc[type] = { count: 0, quantity: 0 };
        }
        acc[type].count += 1;
        acc[type].quantity += s.quantity || 0;
        return acc;
      }, {} as Record<string, { count: number; quantity: number }>);

      // Previous period grouped
      const prevGrouped = previousShipments.reduce((acc, s) => {
        const type = s.waste_type || 'غير محدد';
        if (!acc[type]) {
          acc[type] = { count: 0, quantity: 0 };
        }
        acc[type].count += 1;
        acc[type].quantity += s.quantity || 0;
        return acc;
      }, {} as Record<string, { count: number; quantity: number }>);

      const totalQuantity = Object.values(grouped).reduce((acc, v) => acc + v.quantity, 0);

      return Object.entries(grouped)
        .map(([name, data], index) => {
          const prevData = prevGrouped[name] || { count: 0, quantity: 0 };
          const change = prevData.quantity > 0 
            ? ((data.quantity - prevData.quantity) / prevData.quantity) * 100 
            : data.quantity > 0 ? 100 : 0;

          return {
            name,
            count: data.count,
            quantity: data.quantity,
            percentage: totalQuantity > 0 ? Math.round((data.quantity / totalQuantity) * 100) : 0,
            change: Math.round(change),
            color: COLORS[index % COLORS.length],
          };
        })
        .sort((a, b) => b.quantity - a.quantity);
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-primary" />
            توزيع أنواع النفايات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium mb-1">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            الكمية: {data.quantity.toLocaleString('ar-EG')} كجم
          </p>
          <p className="text-sm text-muted-foreground">
            النسبة: {data.percentage}%
          </p>
          <p className="text-sm text-muted-foreground">
            عدد الشحنات: {data.count}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  if (detailed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-primary" />
            تفاصيل أنواع النفايات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {distributionData?.map((item, index) => (
              <div key={item.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderTrendIcon(item.change)}
                    <span className={`text-sm ${
                      item.change > 0 ? 'text-green-600' : 
                      item.change < 0 ? 'text-red-600' : 
                      'text-muted-foreground'
                    }`}>
                      {item.change > 0 ? '+' : ''}{item.change}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${item.percentage}%`,
                        backgroundColor: item.color 
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-left">
                    {item.percentage}%
                  </span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{item.quantity.toLocaleString('ar-EG')} كجم</span>
                  <span>{item.count} شحنة</span>
                </div>
              </div>
            ))}
            {(!distributionData || distributionData.length === 0) && (
              <p className="text-center text-muted-foreground py-8">
                لا توجد بيانات للفترة المحددة
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5 text-primary" />
          توزيع أنواع النفايات
        </CardTitle>
      </CardHeader>
      <CardContent>
        {distributionData && distributionData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={distributionData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="quantity"
                label={({ name, percentage }) => `${name} (${percentage}%)`}
                labelLine={false}
              >
                {distributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            لا توجد بيانات للفترة المحددة
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WasteTypeDistribution;
