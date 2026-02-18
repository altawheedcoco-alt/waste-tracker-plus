import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from 'recharts';
import { Users, Star, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface PartnerPerformanceChartProps {
  organizationId: string | null;
  dateRange: {
    from: Date;
    to: Date;
  };
  selectedPartners?: string[];
}

interface PartnerMetrics {
  id: string;
  name: string;
  type: string;
  shipmentsCount: number;
  totalQuantity: number;
  completionRate: number;
  avgResponseTime: number;
  score: number;
}

const PartnerPerformanceChart = ({ 
  organizationId, 
  dateRange,
  selectedPartners = []
}: PartnerPerformanceChartProps) => {
  const { data: performanceData, isLoading } = useQuery({
    queryKey: ['partner-performance', organizationId, dateRange.from, dateRange.to, selectedPartners],
    queryFn: async () => {
      if (!organizationId) return [];

      // Get shipments with partner info
      const { data: shipments } = await supabase
        .from('shipments')
        .select(`
          id,
          quantity,
          status,
          created_at,
          updated_at,
          generator_id,
          transporter_id,
          recycler_id,
          generator:generator_id(id, name, organization_type),
          transporter:transporter_id(id, name, organization_type),
          recycler:recycler_id(id, name, organization_type)
        `)
        .or(`generator_id.eq.${organizationId},transporter_id.eq.${organizationId},recycler_id.eq.${organizationId}`)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      if (!shipments) return [];

      // Group by partner
      const partnerMap = new Map<string, PartnerMetrics>();

      shipments.forEach(s => {
        const partners = [
          s.generator_id !== organizationId ? s.generator : null,
          s.transporter_id !== organizationId ? s.transporter : null,
          s.recycler_id !== organizationId ? s.recycler : null,
        ].filter(Boolean) as any[];

        partners.forEach(partner => {
          if (!partner?.id) return;
          
          if (selectedPartners.length > 0 && !selectedPartners.includes(partner.id)) {
            return;
          }

          if (!partnerMap.has(partner.id)) {
            partnerMap.set(partner.id, {
              id: partner.id,
              name: partner.name,
              type: partner.organization_type,
              shipmentsCount: 0,
              totalQuantity: 0,
              completionRate: 0,
              avgResponseTime: 24,
              score: 0,
            });
          }

          const data = partnerMap.get(partner.id)!;
          data.shipmentsCount += 1;
          data.totalQuantity += s.quantity || 0;
        });
      });

      // Calculate completion rates and scores
      return Array.from(partnerMap.values()).map(p => {
        const partnerShipments = shipments.filter(s => 
          s.generator_id === p.id || s.transporter_id === p.id || s.recycler_id === p.id
        );
        const confirmedCount = partnerShipments.filter(s => s.status === 'confirmed').length;
        const completionRate = partnerShipments.length > 0 
          ? Math.round((confirmedCount / partnerShipments.length) * 100) 
          : 0;

        // Calculate performance score (0-100)
        const volumeScore = Math.min(p.shipmentsCount * 5, 30);
        const completionScore = completionRate * 0.5;
        const responseScore = Math.max(0, 20 - p.avgResponseTime);
        const score = Math.round(volumeScore + completionScore + responseScore);

        return {
          ...p,
          completionRate,
          score: Math.min(score, 100),
        };
      }).sort((a, b) => b.score - a.score);
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            أداء الجهات المرتبطة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const typeLabels: Record<string, string> = {
    generator: 'منتج نفايات',
    transporter: 'ناقل',
    recycler: 'معيد تدوير',
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: 'ممتاز', variant: 'default' as const };
    if (score >= 60) return { label: 'جيد', variant: 'secondary' as const };
    return { label: 'يحتاج تحسين', variant: 'destructive' as const };
  };

  const radarData = performanceData?.slice(0, 5).map(p => ({
    name: p.name,
    'حجم الشحنات': Math.min(p.shipmentsCount * 10, 100),
    'معدل الإنجاز': p.completionRate,
    'سرعة الاستجابة': Math.max(0, 100 - p.avgResponseTime * 2),
    'الكمية': Math.min((p.totalQuantity / 1000) * 10, 100),
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Partner List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            تصنيف الجهات المرتبطة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {performanceData?.map((partner, index) => {
              const scoreBadge = getScoreBadge(partner.score);
              return (
                <div key={partner.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">{partner.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {typeLabels[partner.type] || partner.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <span>{partner.shipmentsCount} شحنة</span>
                      <span>{partner.totalQuantity.toLocaleString('en-US')} كجم</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={partner.score} className="flex-1 h-2" />
                      <span className={cn("font-medium", getScoreColor(partner.score))}>
                        {partner.score}%
                      </span>
                    </div>
                  </div>
                  <Badge variant={scoreBadge.variant}>
                    {scoreBadge.label}
                  </Badge>
                </div>
              );
            })}
            {(!performanceData || performanceData.length === 0) && (
              <p className="text-center text-muted-foreground py-8">
                لا توجد بيانات جهات مرتبطة للفترة المحددة
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Radar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            مقارنة الأداء
          </CardTitle>
        </CardHeader>
        <CardContent>
          {radarData && radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar
                  name="حجم الشحنات"
                  dataKey="حجم الشحنات"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.2}
                />
                <Radar
                  name="معدل الإنجاز"
                  dataKey="معدل الإنجاز"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.2}
                />
                <Radar
                  name="سرعة الاستجابة"
                  dataKey="سرعة الاستجابة"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.2}
                />
                <Legend />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[350px] flex items-center justify-center text-muted-foreground">
              لا توجد بيانات كافية للمقارنة
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Comparison Bar Chart */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            مقارنة حجم العمليات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {performanceData && performanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                data={performanceData.slice(0, 10)} 
                layout="vertical"
                margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  width={90}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="shipmentsCount" 
                  name="عدد الشحنات" 
                  fill="hsl(var(--primary))"
                  radius={[0, 4, 4, 0]}
                />
                <Bar 
                  dataKey="completionRate" 
                  name="معدل الإنجاز (%)" 
                  fill="#10b981"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              لا توجد بيانات للفترة المحددة
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PartnerPerformanceChart;
