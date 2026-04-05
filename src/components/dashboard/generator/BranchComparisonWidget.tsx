/**
 * مقارنة أداء الفروع - يقارن بين المواقع المختلفة للمنشأة
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';

const BranchComparisonWidget = () => {
  const { organization } = useAuth();

  const { data: shipments = [] } = useQuery({
    queryKey: ['generator-branch-comparison', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('shipments')
        .select('pickup_address, quantity, unit, waste_type, status')
        .eq('generator_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(500);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const branches = useMemo(() => {
    const branchMap: Record<string, { address: string; totalQty: number; shipmentCount: number; recycledCount: number; wasteTypes: Set<string> }> = {};

    for (const s of shipments) {
      const addr = s.pickup_address?.split(',')[0]?.trim() || s.pickup_address || 'عنوان غير محدد';
      if (!branchMap[addr]) {
        branchMap[addr] = { address: addr, totalQty: 0, shipmentCount: 0, recycledCount: 0, wasteTypes: new Set() };
      }
      const tons = s.unit === 'ton' ? (s.quantity || 0) : (s.quantity || 0) / 1000;
      branchMap[addr].totalQty += tons;
      branchMap[addr].shipmentCount += 1;
      if (['delivered', 'confirmed'].includes(s.status)) branchMap[addr].recycledCount += 1;
      if (s.waste_type) branchMap[addr].wasteTypes.add(s.waste_type);
    }

    return Object.values(branchMap)
      .map(b => ({ ...b, recycleRate: b.shipmentCount > 0 ? (b.recycledCount / b.shipmentCount) * 100 : 0, wasteTypeCount: b.wasteTypes.size }))
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, 6);
  }, [shipments]);

  const maxQty = Math.max(...branches.map(b => b.totalQty), 1);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 justify-end">
          <Building2 className="h-4 w-4 text-primary" />
          مقارنة أداء المواقع/الفروع
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2" dir="rtl">
        {branches.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">لا توجد بيانات كافية</p>
        ) : (
          branches.map((b, i) => (
            <div key={i} className="space-y-1 p-2 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-[10px]">{b.shipmentCount} شحنة</Badge>
                  <Badge variant="secondary" className="text-[10px]">{b.wasteTypeCount} نوع</Badge>
                </div>
                <span className="text-xs font-medium truncate max-w-[160px]">{b.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-16">{b.totalQty.toFixed(1)} طن</span>
                <Progress value={(b.totalQty / maxQty) * 100} className="h-1.5 flex-1" />
                <span className="text-[10px] w-12 text-left">
                  {b.recycleRate > 70 ? <TrendingUp className="h-3 w-3 text-green-500 inline" /> :
                   b.recycleRate > 40 ? <Minus className="h-3 w-3 text-amber-500 inline" /> :
                   <TrendingDown className="h-3 w-3 text-red-500 inline" />}
                  {' '}{b.recycleRate.toFixed(0)}%
                </span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default BranchComparisonWidget;
