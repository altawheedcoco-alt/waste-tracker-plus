/**
 * ٣. تجميع الحمولات الذكي — يحلل الشحنات المعلقة ويقترح تجميعات
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Boxes, Zap, RefreshCw, TrendingDown, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface ConsolidationGroup {
  area: string;
  wasteType: string;
  shipments: any[];
  estimatedSaving: number;
}

const LoadConsolidator = () => {
  const { organization } = useAuth();
  const [groups, setGroups] = useState<ConsolidationGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const analyzeConsolidation = async () => {
    if (!organization?.id) return;
    setAnalyzing(true);
    try {
      const { data: shipments } = await supabase
        .from('shipments')
        .select('id, shipment_number, pickup_address, delivery_address, waste_type, quantity, unit, status')
        .eq('transporter_id', organization.id)
        .in('status', ['new', 'approved'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (!shipments?.length) {
        toast.info('لا توجد شحنات معلقة للتجميع');
        setGroups([]);
        setAnalyzing(false);
        return;
      }

      // Try AI consolidation
      try {
        const { data, error } = await supabase.functions.invoke('ai-load-consolidator', {
          body: { shipments, organizationId: organization.id }
        });
        if (!error && data?.groups) {
          setGroups(data.groups);
          toast.success(`تم العثور على ${data.groups.length} مجموعة تجميع محتملة`);
          setAnalyzing(false);
          return;
        }
      } catch {
        // Fallback to local grouping
      }

      // Local fallback: group by waste_type + similar area
      const grouped = new Map<string, any[]>();
      shipments.forEach(s => {
        const key = `${s.waste_type || 'عام'}_${(s.pickup_address || '').split(',')[0]?.trim() || 'غير محدد'}`;
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key)!.push(s);
      });

      const result: ConsolidationGroup[] = [];
      grouped.forEach((items, key) => {
        if (items.length >= 2) {
          const [wasteType, area] = key.split('_');
          result.push({
            area: area || 'منطقة غير محددة',
            wasteType: wasteType || 'عام',
            shipments: items,
            estimatedSaving: Math.min(40, Math.round(items.length * 10)),
          });
        }
      });

      setGroups(result);
      if (result.length === 0) toast.info('لا توجد فرص تجميع حالياً');
      else toast.success(`تم العثور على ${result.length} فرصة تجميع`);
    } catch (err) {
      console.error('Consolidation error:', err);
      toast.error('خطأ في تحليل التجميع');
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => { analyzeConsolidation(); }, [organization?.id]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Boxes className="h-5 w-5 text-primary" />
            محرك تجميع الحمولات
          </CardTitle>
          <Button variant="outline" size="sm" onClick={analyzeConsolidation} disabled={analyzing}>
            <RefreshCw className={`h-4 w-4 ml-1 ${analyzing ? 'animate-spin' : ''}`} />
            {analyzing ? 'جاري التحليل...' : 'تحليل'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {groups.length === 0 && !analyzing && (
          <p className="text-sm text-muted-foreground text-center py-4">
            لا توجد فرص تجميع حالياً — ستظهر عند وجود شحنات متشابهة
          </p>
        )}

        {groups.map((group, i) => (
          <div key={i} className="p-3 border rounded-lg space-y-2 hover:border-primary/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{group.area}</span>
              </div>
              <Badge variant="secondary">{group.wasteType}</Badge>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{group.shipments.length} شحنات قابلة للتجميع</span>
              <div className="flex items-center gap-1 text-emerald-600">
                <TrendingDown className="h-3 w-3" />
                <span>توفير ~{group.estimatedSaving}%</span>
              </div>
            </div>
            <div className="flex gap-1 flex-wrap">
              {group.shipments.slice(0, 3).map(s => (
                <Badge key={s.id} variant="outline" className="text-[10px]">{s.shipment_number}</Badge>
              ))}
              {group.shipments.length > 3 && (
                <Badge variant="outline" className="text-[10px]">+{group.shipments.length - 3}</Badge>
              )}
            </div>
            <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => toast.info('سيتم تفعيل التجميع التلقائي قريباً')}>
              <Zap className="h-3 w-3 ml-1" /> تنفيذ التجميع
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default LoadConsolidator;
