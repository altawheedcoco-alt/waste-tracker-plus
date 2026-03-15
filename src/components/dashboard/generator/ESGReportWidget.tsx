import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Leaf, Download, TrendingDown, Flame, Recycle, Trash2, BarChart3, TrendingUp, Calendar, Users, Building2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useState, useMemo } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { format, subMonths, startOfMonth } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const COLORS = ['hsl(var(--primary))', 'hsl(142, 76%, 36%)', 'hsl(25, 95%, 53%)', 'hsl(262, 83%, 58%)'];

const ESGReportWidget = () => {
  const { organization } = useAuth();
  const orgId = organization?.id;
  const [generating, setGenerating] = useState(false);
  const [period, setPeriod] = useState('6');

  // Fetch partner org IDs (recyclers & disposal)
  const { data: partnerOrgs = [] } = useQuery({
    queryKey: ['esg-partner-orgs', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data: partnerships } = await supabase
        .from('verified_partnerships')
        .select('requester_org_id, partner_org_id')
        .or(`requester_org_id.eq.${orgId},partner_org_id.eq.${orgId}`)
        .eq('status', 'active');

      if (!partnerships?.length) return [];

      const partnerIds = partnerships.map(p =>
        p.requester_org_id === orgId ? p.partner_org_id : p.requester_org_id
      );

      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name, organization_type')
        .in('id', partnerIds)
        .in('organization_type', ['recycler', 'disposal'])
        .eq('is_active', true);

      return orgs || [];
    },
    enabled: !!orgId,
    staleTime: 1000 * 60 * 10,
  });

  const allOrgIds = useMemo(() => {
    const ids = [orgId];
    partnerOrgs.forEach((p: any) => ids.push(p.id));
    return ids.filter(Boolean) as string[];
  }, [orgId, partnerOrgs]);

  const { data: rawShipments = [], isLoading } = useQuery({
    queryKey: ['generator-esg-detailed', orgId, period, allOrgIds],
    queryFn: async () => {
      if (!orgId || allOrgIds.length === 0) return [];
      const monthsBack = parseInt(period);
      const fromDate = startOfMonth(subMonths(new Date(), monthsBack - 1)).toISOString();

      const orFilter = [
        ...allOrgIds.map(id => `generator_id.eq.${id}`),
        ...allOrgIds.map(id => `recycler_id.eq.${id}`),
      ].join(',');

      const { data, error } = await supabase
        .from('shipments')
        .select('quantity, unit, disposal_method, status, created_at, waste_type, generator_id, recycler_id')
        .or(orFilter)
        .in('status', ['delivered', 'confirmed'])
        .gte('created_at', fromDate);

      if (error) throw error;
      // Deduplicate by removing shipments already counted
      const seen = new Set<string>();
      return (data || []).filter((s: any) => {
        const key = `${s.created_at}-${s.quantity}-${s.waste_type}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    },
    enabled: !!orgId && allOrgIds.length > 0,
  });

  const stats = useMemo(() => {
    let totalWeight = 0, recycledWeight = 0, incineratedWeight = 0, landfillWeight = 0;

    rawShipments.forEach((s: any) => {
      const w = s.unit === 'كجم' ? s.quantity / 1000 : s.quantity;
      totalWeight += w;
      if (s.disposal_method === 'recycling') recycledWeight += w;
      else if (s.disposal_method === 'incineration') incineratedWeight += w;
      else landfillWeight += w;
    });

    const carbonSaved = recycledWeight * 2.5;
    const recyclingRate = totalWeight > 0 ? Math.round((recycledWeight / totalWeight) * 100) : 0;

    return {
      totalWeight: Math.round(totalWeight * 100) / 100,
      recycledWeight: Math.round(recycledWeight * 100) / 100,
      incineratedWeight: Math.round(incineratedWeight * 100) / 100,
      landfillWeight: Math.round(landfillWeight * 100) / 100,
      carbonSaved: Math.round(carbonSaved * 100) / 100,
      shipmentCount: rawShipments.length,
      recyclingRate,
    };
  }, [rawShipments]);

  // Monthly breakdown for chart
  const monthlyData = useMemo(() => {
    const months: Record<string, { month: string; recycling: number; incineration: number; landfill: number; total: number }> = {};
    const monthsBack = parseInt(period);

    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const key = format(d, 'yyyy-MM');
      months[key] = { month: format(d, 'MMM', { locale: ar }), recycling: 0, incineration: 0, landfill: 0, total: 0 };
    }

    rawShipments.forEach((s: any) => {
      const key = format(new Date(s.created_at), 'yyyy-MM');
      if (months[key]) {
        const w = s.unit === 'كجم' ? s.quantity / 1000 : s.quantity;
        months[key].total += w;
        if (s.disposal_method === 'recycling') months[key].recycling += w;
        else if (s.disposal_method === 'incineration') months[key].incineration += w;
        else months[key].landfill += w;
      }
    });

    return Object.values(months).map(m => ({
      ...m,
      recycling: Math.round(m.recycling * 100) / 100,
      incineration: Math.round(m.incineration * 100) / 100,
      landfill: Math.round(m.landfill * 100) / 100,
      total: Math.round(m.total * 100) / 100,
    }));
  }, [rawShipments, period]);

  // Pie data
  const pieData = useMemo(() => [
    { name: 'تدوير', value: stats.recycledWeight },
    { name: 'حرق', value: stats.incineratedWeight },
    { name: 'دفن', value: stats.landfillWeight },
  ].filter(d => d.value > 0), [stats]);

  // Waste type breakdown
  const wasteTypeData = useMemo(() => {
    const types: Record<string, number> = {};
    rawShipments.forEach((s: any) => {
      const w = s.unit === 'كجم' ? s.quantity / 1000 : s.quantity;
      types[s.waste_type || 'أخرى'] = (types[s.waste_type || 'أخرى'] || 0) + w;
    });
    return Object.entries(types)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [rawShipments]);

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const { useDocumentService } = await import('@/hooks/useDocumentService');
      const reportEl = document.querySelector('[data-esg-report]') as HTMLElement;
      if (reportEl) {
        const { PDFService } = await import('@/services/documentService');
        await PDFService.download(reportEl, {
          filename: `ESG_Report_${organization?.name || 'org'}_${period}m`,
        });
        toast.success('تم توليد تقرير الاستدامة البيئية بنجاح');
      } else {
        toast.error('لم يتم العثور على محتوى التقرير');
      }
    } catch (err) {
      console.error('ESG report generation error:', err);
      toast.error('حدث خطأ أثناء توليد التقرير');
    } finally {
      setGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <Card><CardHeader><CardTitle className="flex items-center gap-2 justify-end"><Leaf className="w-5 h-5" /> تقرير الاستدامة</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-32 w-full" /></CardContent></Card>
    );
  }

  if (stats.shipmentCount === 0) return null;

  const recyclerPartners = partnerOrgs.filter((p: any) => p.organization_type === 'recycler');
  const disposalPartners = partnerOrgs.filter((p: any) => p.organization_type === 'disposal');

  return (
    <Card className="border-green-200 dark:border-green-800/40 bg-gradient-to-br from-green-50/50 to-background dark:from-green-950/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Button variant="default" size="sm" className="text-xs gap-1" onClick={handleGenerateReport} disabled={generating}>
              <Download className="w-3.5 h-3.5" />
              {generating ? 'جاري التوليد...' : 'تقرير PDF'}
            </Button>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[100px] h-8 text-xs">
                <Calendar className="w-3 h-3 ml-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 أشهر</SelectItem>
                <SelectItem value="6">6 أشهر</SelectItem>
                <SelectItem value="12">12 شهر</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Leaf className="w-5 h-5 text-green-600" />
            مؤشرات الاستدامة البيئية
          </CardTitle>
        </div>
        <CardDescription className="text-right">ملخص الأثر البيئي لعملياتك وشركائك</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4" data-esg-report>
        {/* Partner Sources Banner */}
        {partnerOrgs.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap p-2 rounded-lg bg-muted/50 border text-xs">
            <Users className="w-4 h-4 text-primary shrink-0" />
            <span className="text-muted-foreground">مصادر البيانات:</span>
            <Badge variant="outline" className="text-[10px] gap-1">
              <Building2 className="w-3 h-3" />
              {organization?.name}
            </Badge>
            {recyclerPartners.map((p: any) => (
              <Badge key={p.id} variant="secondary" className="text-[10px] gap-1">
                <Recycle className="w-3 h-3" />
                {p.name}
              </Badge>
            ))}
            {disposalPartners.map((p: any) => (
              <Badge key={p.id} variant="secondary" className="text-[10px] gap-1">
                <Flame className="w-3 h-3" />
                {p.name}
              </Badge>
            ))}
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="text-center p-3 rounded-lg bg-muted/50 border">
            <BarChart3 className="w-5 h-5 mx-auto text-blue-600 mb-1" />
            <p className="text-lg font-bold">{stats.totalWeight}</p>
            <p className="text-[10px] text-muted-foreground">طن إجمالي</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50 border">
            <Recycle className="w-5 h-5 mx-auto text-green-600 mb-1" />
            <p className="text-lg font-bold">{stats.recycledWeight}</p>
            <p className="text-[10px] text-muted-foreground">طن تدوير</p>
            <Progress value={stats.recyclingRate} className="h-1.5 mt-1" />
            <p className="text-[9px] text-green-600 mt-0.5">{stats.recyclingRate}%</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50 border">
            <Flame className="w-5 h-5 mx-auto text-orange-600 mb-1" />
            <p className="text-lg font-bold">{stats.incineratedWeight}</p>
            <p className="text-[10px] text-muted-foreground">طن حرق</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40">
            <TrendingDown className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
            <p className="text-lg font-bold text-emerald-600">{stats.carbonSaved}</p>
            <p className="text-[10px] text-muted-foreground">طن CO₂ وُفرت</p>
          </div>
        </div>

        {/* Charts */}
        <Tabs defaultValue="monthly" className="w-full">
          <TabsList className="w-full h-8">
            <TabsTrigger value="types" className="text-xs flex-1">أنواع المخلفات</TabsTrigger>
            <TabsTrigger value="pie" className="text-xs flex-1">طرق التخلص</TabsTrigger>
            <TabsTrigger value="monthly" className="text-xs flex-1">الاتجاه الشهري</TabsTrigger>
          </TabsList>

          <TabsContent value="monthly" className="mt-3">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <RechartsTooltip contentStyle={{ fontSize: 11, direction: 'rtl' }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="recycling" name="تدوير" fill="hsl(142, 76%, 36%)" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="incineration" name="حرق" fill="hsl(25, 95%, 53%)" stackId="a" />
                  <Bar dataKey="landfill" name="دفن" fill="hsl(262, 83%, 58%)" stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="pie" className="mt-3">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ fontSize: 11, direction: 'rtl' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="types" className="mt-3">
            <div className="space-y-2">
              {wasteTypeData.map((wt, i) => (
                <div key={wt.name} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-8 text-left">{wt.value}t</span>
                  <div className="flex-1">
                    <Progress value={(wt.value / (wasteTypeData[0]?.value || 1)) * 100} className="h-2" />
                  </div>
                  <span className="text-xs font-medium w-24 text-right truncate">{wt.name}</span>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Impact Summary */}
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30">
          <p className="text-xs text-emerald-700 dark:text-emerald-400 text-center">
            🌱 ساهمت مع شركائك في تقليل انبعاثات الكربون بمقدار <strong>{stats.carbonSaved} طن CO₂</strong> عبر {stats.shipmentCount} عملية خلال {period} أشهر
          </p>
          <div className="flex items-center justify-center gap-4 mt-2 text-[10px] text-emerald-600 dark:text-emerald-500">
            <span>🌳 ≈ {Math.round(stats.carbonSaved / 0.022)} شجرة مزروعة</span>
            <span>🚗 ≈ {Math.round(stats.carbonSaved * 4000)} كم قيادة</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ESGReportWidget;
