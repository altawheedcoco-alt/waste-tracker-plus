/**
 * متتبع مصادر المخلفات — خاص بالمولدين
 * يعرض تحليل مصادر التوليد حسب الموقع والنوع
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MapPin, TrendingUp, TrendingDown, AlertTriangle, Factory } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface WasteSource {
  location: string;
  wasteType: string;
  quantity: number;
  trend: 'up' | 'down' | 'stable';
  percentage: number;
}

const WasteSourceTracker = () => {
  const { organization } = useAuth();

  const { data: shipments } = useQuery({
    queryKey: ['waste-sources', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('shipments')
        .select('waste_type, quantity, pickup_address, status, created_at')
        .eq('generator_id', organization.id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(100);
      return data || [];
    },
    enabled: !!organization?.id,
    staleTime: 1000 * 60 * 5,
  });

  // تحليل المصادر
  const sources: WasteSource[] = (() => {
    if (!shipments?.length) return [];
    const typeMap = new Map<string, number>();
    shipments.forEach(s => {
      const type = (s as any).waste_type || 'غير مصنف';
      typeMap.set(type, (typeMap.get(type) || 0) + (Number((s as any).quantity) || 1));
    });
    const total = Array.from(typeMap.values()).reduce((a, b) => a + b, 0);
    return Array.from(typeMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, qty]) => ({
        location: '-',
        wasteType: type,
        quantity: qty,
        trend: qty > total / typeMap.size ? 'up' : 'down',
        percentage: Math.round((qty / total) * 100),
      }));
  })();

  const totalWeight = sources.reduce((a, b) => a + b.quantity, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Factory className="h-4 w-4 text-primary" />
          تحليل مصادر المخلفات
          <Badge variant="secondary" className="text-[10px] mr-auto">
            آخر 30 يوم
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sources.length === 0 ? (
          <div className="text-center py-4">
            <AlertTriangle className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">لا توجد بيانات كافية بعد</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>الإجمالي: {totalWeight.toLocaleString('ar-EG')} كجم</span>
              <span>{sources.length} أنواع</span>
            </div>
            {sources.map((source, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium">{source.wasteType}</span>
                    {source.trend === 'up' ? (
                      <TrendingUp className="h-3 w-3 text-destructive" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-green-500" />
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {source.percentage}%
                  </span>
                </div>
                <Progress value={source.percentage} className="h-1.5" />
              </div>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default WasteSourceTracker;
