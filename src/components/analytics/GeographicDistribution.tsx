/**
 * GeographicDistribution — التوزيع الجغرافي
 * يعرض توزيع الشحنات حسب المحافظات
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function GeographicDistribution() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['geographic-distribution', orgId],
    queryFn: async () => {
      if (!orgId) return null;

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      // Get shipments with pickup/delivery addresses
      const { data: shipments } = await supabase
        .from('shipments')
        .select('pickup_address, delivery_address, governorate, total_weight, status')
        .or(`source_id.eq.${orgId},destination_id.eq.${orgId}`)
        .gte('created_at', sixMonthsAgo.toISOString());

      const govMap = new Map<string, { count: number; weight: number }>();

      (shipments || []).forEach(s => {
        const gov = s.governorate || extractGovernorate(s.pickup_address || s.delivery_address || '');
        if (!gov) return;
        const existing = govMap.get(gov) || { count: 0, weight: 0 };
        existing.count++;
        existing.weight += s.total_weight || 0;
        govMap.set(gov, existing);
      });

      const regions = Array.from(govMap.entries())
        .map(([name, stats]) => ({
          name: name.length > 12 ? name.slice(0, 12) + '...' : name,
          fullName: name,
          count: stats.count,
          weight: Math.round(stats.weight),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const totalRegions = govMap.size;
      const topRegion = regions[0];

      return { regions, totalRegions, topRegion };
    },
    enabled: !!orgId,
    staleTime: 30 * 60 * 1000,
  });

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-5 w-5 text-primary" />
            التوزيع الجغرافي
          </CardTitle>
          {data && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1 text-xs">
                <Navigation className="h-3 w-3" />
                {data.totalRegions} منطقة
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[250px] bg-muted/20 rounded animate-pulse" />
        ) : data?.regions.length ? (
          <div className="space-y-3">
            {/* Top region highlight */}
            {data.topRegion && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-sm font-medium">{data.topRegion.fullName}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {data.topRegion.count} شحنة · {data.topRegion.weight.toLocaleString()} كجم
                </span>
              </div>
            )}

            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.regions} layout="vertical" margin={{ top: 0, right: 5, left: 5, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={70} className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{ borderRadius: 8, fontSize: 12, direction: 'rtl' }}
                  formatter={(val: number, name: string) => [
                    name === 'count' ? `${val} شحنة` : `${val.toLocaleString()} كجم`,
                    name === 'count' ? 'الشحنات' : 'الوزن'
                  ]}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">
            لا توجد بيانات جغرافية كافية
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function extractGovernorate(address: string): string {
  if (!address) return '';
  const govs = ['القاهرة', 'الجيزة', 'الإسكندرية', 'الشرقية', 'الدقهلية', 'البحيرة', 'المنوفية', 'القليوبية',
    'كفر الشيخ', 'الغربية', 'دمياط', 'بورسعيد', 'الإسماعيلية', 'السويس', 'الفيوم', 'بني سويف', 'المنيا',
    'أسيوط', 'سوهاج', 'قنا', 'الأقصر', 'أسوان', 'البحر الأحمر', 'الوادي الجديد', 'مرسى مطروح', 'شمال سيناء', 'جنوب سيناء'];
  for (const g of govs) {
    if (address.includes(g)) return g;
  }
  return address.split(',')[0]?.trim() || '';
}
