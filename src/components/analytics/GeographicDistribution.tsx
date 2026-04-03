/**
 * GeographicDistribution — التوزيع الجغرافي
 */
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

      const { data: shipments } = await supabase
        .from('shipments')
        .select('pickup_city, delivery_city, actual_weight, status')
        .or(`generator_id.eq.${orgId},recycler_id.eq.${orgId},transporter_id.eq.${orgId}`)
        .gte('created_at', sixMonthsAgo.toISOString());

      const cityMap = new Map<string, { count: number; weight: number }>();

      (shipments || []).forEach(s => {
        const cities = [s.pickup_city, s.delivery_city].filter(Boolean) as string[];
        cities.forEach(city => {
          const existing = cityMap.get(city) || { count: 0, weight: 0 };
          existing.count++;
          existing.weight += s.actual_weight || 0;
          cityMap.set(city, existing);
        });
      });

      const regions = Array.from(cityMap.entries())
        .map(([name, stats]) => ({
          name: name.length > 12 ? name.slice(0, 12) + '...' : name,
          fullName: name,
          count: stats.count,
          weight: Math.round(stats.weight),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return { regions, totalRegions: cityMap.size, topRegion: regions[0] };
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
            <Badge variant="outline" className="gap-1 text-xs">
              <Navigation className="h-3 w-3" />
              {data.totalRegions} منطقة
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[250px] bg-muted/20 rounded animate-pulse" />
        ) : data?.regions.length ? (
          <div className="space-y-3">
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
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, direction: 'rtl' }}
                  formatter={(val: number) => [`${val} شحنة`, 'العدد']} />
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
