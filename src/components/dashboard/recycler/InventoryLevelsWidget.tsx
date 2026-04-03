/**
 * ودجة مستويات المخزون — خاص بالمدورين
 * يعرض حالة المخزون من المواد الخام والمنتجات المعاد تدويرها
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Package, AlertTriangle, ArrowDown, ArrowUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const InventoryLevelsWidget = () => {
  const { organization } = useAuth();

  const { data: inventory } = useQuery({
    queryKey: ['recycler-inventory', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const { data: shipments } = await supabase
        .from('shipments')
        .select('waste_type, actual_weight, quantity, status, created_at')
        .eq('recycler_id', organization.id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .limit(300);

      if (!shipments?.length) return null;

      const typeMap = new Map<string, { incoming: number; processed: number }>();
      shipments.forEach((s: any) => {
        const type = s.waste_type || 'أخرى';
        const weight = Number(s.actual_weight || s.quantity) || 0;
        const current = typeMap.get(type) || { incoming: 0, processed: 0 };
        if (s.status === 'delivered') {
          current.incoming += weight;
        } else if (s.status === 'confirmed') {
          current.processed += weight;
        }
        typeMap.set(type, current);
      });

      return Array.from(typeMap.entries())
        .sort((a, b) => (b[1].incoming + b[1].processed) - (a[1].incoming + a[1].processed))
        .slice(0, 5)
        .map(([name, data]) => {
          const total = data.incoming + data.processed;
          const capacity = total * 1.5; // سعة تقديرية
          const fillLevel = Math.min(100, Math.round((total / capacity) * 100));
          return {
            name,
            incoming: Math.round(data.incoming),
            processed: Math.round(data.processed),
            onHand: Math.round(data.incoming - data.processed * 0.85),
            fillLevel,
            status: fillLevel > 85 ? 'high' : fillLevel > 50 ? 'normal' : 'low',
          };
        });
    },
    enabled: !!organization?.id,
    staleTime: 1000 * 60 * 5,
  });

  const statusColors = {
    high: 'text-amber-600 dark:text-amber-400',
    normal: 'text-green-600 dark:text-green-400',
    low: 'text-blue-600 dark:text-blue-400',
  };

  const statusLabels = {
    high: 'مرتفع',
    normal: 'طبيعي',
    low: 'منخفض',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          مستويات المخزون
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!inventory ? (
          <div className="text-center py-4">
            <Package className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">لا توجد بيانات مخزون</p>
          </div>
        ) : (
          <div className="space-y-3">
            {inventory.map((item, i) => (
              <div key={i} className="space-y-1.5 p-2 rounded-lg bg-muted/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">{item.name}</span>
                  <Badge variant="outline" className={`text-[9px] border-0 ${statusColors[item.status]}`}>
                    {statusLabels[item.status]}
                  </Badge>
                </div>
                <Progress value={item.fillLevel} className="h-1.5" />
                <div className="flex justify-between text-[9px] text-muted-foreground">
                  <span className="flex items-center gap-0.5">
                    <ArrowDown className="h-2.5 w-2.5 text-green-500" />
                    وارد: {item.incoming.toLocaleString('ar-EG')} كجم
                  </span>
                  <span className="flex items-center gap-0.5">
                    <ArrowUp className="h-2.5 w-2.5 text-blue-500" />
                    مُعالج: {item.processed.toLocaleString('ar-EG')} كجم
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InventoryLevelsWidget;
