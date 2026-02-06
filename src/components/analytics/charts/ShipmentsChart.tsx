import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, differenceInDays } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ShipmentsChartProps {
  organizationId: string | null;
  dateRange: {
    from: Date;
    to: Date;
  };
  wasteTypes?: string[];
  groupBy?: 'date' | 'status';
}

const statusColors: Record<string, string> = {
  new: '#94a3b8',
  approved: '#60a5fa',
  assigned: '#a78bfa',
  picked_up: '#fbbf24',
  in_transit: '#f97316',
  delivered: '#22c55e',
  confirmed: '#10b981',
  cancelled: '#ef4444',
};

const statusLabels: Record<string, string> = {
  new: 'جديد',
  approved: 'معتمد',
  assigned: 'مُسند',
  picked_up: 'تم الاستلام',
  in_transit: 'في الطريق',
  delivered: 'تم التسليم',
  confirmed: 'مؤكد',
  cancelled: 'ملغي',
};

const ShipmentsChart = ({ 
  organizationId, 
  dateRange, 
  wasteTypes = [],
  groupBy = 'date' 
}: ShipmentsChartProps) => {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ['shipments-chart', organizationId, dateRange.from, dateRange.to, wasteTypes, groupBy],
    queryFn: async () => {
      if (!organizationId) return [];

      const { data } = await supabase
        .from('shipments')
        .select('id, status, created_at, waste_type, quantity')
        .or(`generator_id.eq.${organizationId},transporter_id.eq.${organizationId},recycler_id.eq.${organizationId}`)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      let shipments = data || [];
      
      // Filter by waste types if specified
      if (wasteTypes.length > 0) {
        shipments = shipments.filter(s => wasteTypes.includes(s.waste_type || ''));
      }
      if (groupBy === 'status') {
        // Group by status
        const statusGroups = shipments.reduce((acc, s) => {
          const status = s.status || 'unknown';
          if (!acc[status]) {
            acc[status] = { count: 0, quantity: 0 };
          }
          acc[status].count += 1;
          acc[status].quantity += s.quantity || 0;
          return acc;
        }, {} as Record<string, { count: number; quantity: number }>);

        return Object.entries(statusGroups).map(([status, data]) => ({
          name: statusLabels[status] || status,
          count: data.count,
          quantity: data.quantity,
          status,
        }));
      }

      // Group by date
      const daysDiff = differenceInDays(dateRange.to, dateRange.from);
      let intervals: Date[];
      let formatPattern: string;

      if (daysDiff <= 14) {
        intervals = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
        formatPattern = 'dd/MM';
      } else if (daysDiff <= 90) {
        intervals = eachWeekOfInterval({ start: dateRange.from, end: dateRange.to });
        formatPattern = 'dd MMM';
      } else {
        intervals = eachMonthOfInterval({ start: dateRange.from, end: dateRange.to });
        formatPattern = 'MMM yyyy';
      }

      return intervals.map(date => {
        const periodEnd = daysDiff <= 14 
          ? new Date(date.getTime() + 24 * 60 * 60 * 1000 - 1)
          : daysDiff <= 90
            ? new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000 - 1)
            : new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const periodShipments = shipments.filter(s => {
          const shipmentDate = new Date(s.created_at);
          return shipmentDate >= date && shipmentDate <= periodEnd;
        });

        return {
          name: format(date, formatPattern, { locale: ar }),
          count: periodShipments.length,
          quantity: periodShipments.reduce((acc, s) => acc + (s.quantity || 0), 0),
        };
      });
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            الشحنات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString('en-US')}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          {groupBy === 'status' ? 'توزيع الشحنات حسب الحالة' : 'الشحنات عبر الزمن'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="count" 
              name="عدد الشحنات" 
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
            >
              {groupBy === 'status' && chartData?.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={statusColors[entry.status] || '#94a3b8'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ShipmentsChart;
