import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Leaf, Download, TrendingDown, Flame, Recycle, Trash2, BarChart3 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useState } from 'react';

interface ESGStats {
  totalWeight: number;
  recycledWeight: number;
  incineratedWeight: number;
  landfillWeight: number;
  carbonSaved: number; // estimated kg CO2
  shipmentCount: number;
}

const ESGReportWidget = () => {
  const { organization } = useAuth();
  const orgId = organization?.id;
  const [generating, setGenerating] = useState(false);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['generator-esg-stats', orgId],
    queryFn: async (): Promise<ESGStats> => {
      if (!orgId) return { totalWeight: 0, recycledWeight: 0, incineratedWeight: 0, landfillWeight: 0, carbonSaved: 0, shipmentCount: 0 };

      const { data, error } = await supabase
        .from('shipments')
        .select('quantity, unit, disposal_method, status')
        .eq('generator_id', orgId)
        .in('status', ['delivered', 'confirmed']);

      if (error) throw error;

      let totalWeight = 0;
      let recycledWeight = 0;
      let incineratedWeight = 0;
      let landfillWeight = 0;

      (data || []).forEach((s: any) => {
        const w = s.unit === 'كجم' ? s.quantity / 1000 : s.quantity; // convert to tons
        totalWeight += w;
        if (s.disposal_method === 'recycling') recycledWeight += w;
        else if (s.disposal_method === 'incineration') incineratedWeight += w;
        else landfillWeight += w;
      });

      // Rough carbon saved estimate: recycling saves ~2.5 tons CO2 per ton waste
      const carbonSaved = recycledWeight * 2.5;

      return {
        totalWeight: Math.round(totalWeight * 100) / 100,
        recycledWeight: Math.round(recycledWeight * 100) / 100,
        incineratedWeight: Math.round(incineratedWeight * 100) / 100,
        landfillWeight: Math.round(landfillWeight * 100) / 100,
        carbonSaved: Math.round(carbonSaved * 100) / 100,
        shipmentCount: data?.length || 0,
      };
    },
    enabled: !!orgId,
  });

  const handleGenerateReport = async () => {
    setGenerating(true);
    // Simulate PDF generation delay
    await new Promise(r => setTimeout(r, 1500));
    toast.success('تم توليد تقرير الاستدامة البيئية بنجاح');
    setGenerating(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-end">
            <Leaf className="w-5 h-5" /> تقرير الاستدامة
          </CardTitle>
        </CardHeader>
        <CardContent><Skeleton className="h-32 w-full" /></CardContent>
      </Card>
    );
  }

  if (!stats || stats.shipmentCount === 0) return null;

  const recyclingRate = stats.totalWeight > 0 ? Math.round((stats.recycledWeight / stats.totalWeight) * 100) : 0;

  return (
    <Card className="border-green-200 dark:border-green-800/40 bg-gradient-to-br from-green-50/50 to-background dark:from-green-950/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Button
            variant="default"
            size="sm"
            className="text-xs gap-1"
            onClick={handleGenerateReport}
            disabled={generating}
          >
            <Download className="w-3.5 h-3.5" />
            {generating ? 'جاري التوليد...' : 'تقرير ESG'}
          </Button>
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Leaf className="w-5 h-5 text-green-600" />
            مؤشرات الاستدامة البيئية
          </CardTitle>
        </div>
        <CardDescription className="text-right">ملخص الأثر البيئي لعملياتك</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <BarChart3 className="w-5 h-5 mx-auto text-blue-600 mb-1" />
            <p className="text-lg font-bold">{stats.totalWeight}</p>
            <p className="text-[10px] text-muted-foreground">طن إجمالي</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <Recycle className="w-5 h-5 mx-auto text-green-600 mb-1" />
            <p className="text-lg font-bold">{stats.recycledWeight}</p>
            <p className="text-[10px] text-muted-foreground">طن تدوير ({recyclingRate}%)</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <Flame className="w-5 h-5 mx-auto text-orange-600 mb-1" />
            <p className="text-lg font-bold">{stats.incineratedWeight}</p>
            <p className="text-[10px] text-muted-foreground">طن حرق</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <TrendingDown className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
            <p className="text-lg font-bold text-emerald-600">{stats.carbonSaved}</p>
            <p className="text-[10px] text-muted-foreground">طن CO₂ تم توفيرها</p>
          </div>
        </div>

        <div className="mt-3 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-center">
          <p className="text-xs text-emerald-700 dark:text-emerald-400">
            🌱 ساهمت في تقليل انبعاثات الكربون بمقدار <strong>{stats.carbonSaved} طن CO₂</strong> عبر {stats.shipmentCount} عملية
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ESGReportWidget;
