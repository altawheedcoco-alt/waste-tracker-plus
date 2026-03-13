import { memo, useState, useMemo, useRef } from 'react';
import { generateDigitalVerificationStamp } from '@/lib/digitalVerificationStamp';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Leaf, Download, Printer, Award, Globe, TreePine, Target,
  TrendingUp, TrendingDown, BarChart3, Recycle, Flame, Trash2,
  Building2, Users, Calendar, FileText, Shield, CheckCircle2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line } from 'recharts';
import { format, subMonths, startOfMonth } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const COLORS = ['hsl(var(--primary))', 'hsl(142, 76%, 36%)', 'hsl(25, 95%, 53%)', 'hsl(262, 83%, 58%)', 'hsl(200, 80%, 50%)', 'hsl(340, 80%, 55%)'];

const SDG_ICONS: Record<number, string> = {
  7: '⚡', 9: '🏗️', 11: '🏙️', 12: '♻️', 13: '🌍', 15: '🌿',
};

interface ESGReportPanelProps {
  organizationId?: string;
  showPrint?: boolean;
  embedded?: boolean;
}

const ESGReportPanel = memo(({ organizationId, showPrint = true, embedded = false }: ESGReportPanelProps) => {
  const { organization, user } = useAuth();
  const orgId = organizationId || organization?.id;
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState('6');
  const [reportType, setReportType] = useState<'monthly' | 'quarterly' | 'annual'>('quarterly');
  const printRef = useRef<HTMLDivElement>(null);

  // Fetch real shipment data for ESG
  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ['esg-report-shipments', orgId, period],
    queryFn: async () => {
      if (!orgId) return [];
      const monthsBack = parseInt(period);
      const fromDate = startOfMonth(subMonths(new Date(), monthsBack - 1)).toISOString();

      const { data, error } = await supabase
        .from('shipments')
        .select('quantity, unit, waste_type, status, created_at, disposal_method, generator_id, recycler_id, transporter_id')
        .or(`generator_id.eq.${orgId},recycler_id.eq.${orgId},transporter_id.eq.${orgId},organization_id.eq.${orgId}`)
        .in('status', ['delivered', 'confirmed'] as any[])
        .gte('created_at', fromDate);

      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  // Calculate ESG metrics from real data
  const metrics = useMemo(() => {
    let totalWeight = 0, recycledWeight = 0, incineratedWeight = 0, landfillWeight = 0;
    const monthlyMap: Record<string, { recycled: number; incinerated: number; landfill: number; total: number }> = {};
    const wasteTypes: Record<string, number> = {};

    shipments.forEach((s: any) => {
      const w = s.unit === 'كجم' ? s.quantity / 1000 : s.quantity;
      totalWeight += w;
      
      if (s.disposal_method === 'recycling' || !s.disposal_method) recycledWeight += w;
      else if (s.disposal_method === 'incineration') incineratedWeight += w;
      else landfillWeight += w;

      const monthKey = format(new Date(s.created_at), 'yyyy-MM');
      if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { recycled: 0, incinerated: 0, landfill: 0, total: 0 };
      monthlyMap[monthKey].total += w;
      if (s.disposal_method === 'recycling' || !s.disposal_method) monthlyMap[monthKey].recycled += w;
      else if (s.disposal_method === 'incineration') monthlyMap[monthKey].incinerated += w;
      else monthlyMap[monthKey].landfill += w;

      wasteTypes[s.waste_type || 'أخرى'] = (wasteTypes[s.waste_type || 'أخرى'] || 0) + w;
    });

    const carbonSaved = recycledWeight * 2.5 + incineratedWeight * 0.5;
    const diversionRate = totalWeight > 0 ? ((recycledWeight + incineratedWeight) / totalWeight) * 100 : 0;
    const treesSaved = Math.round(carbonSaved / 0.022);
    const waterSaved = Math.round(recycledWeight * 45); // liters per ton recycled
    const energySaved = Math.round(recycledWeight * 1800); // kWh per ton

    // ESG Scores (calculated from real data)
    const environmentalScore = Math.min(100, Math.round(diversionRate * 0.9 + (carbonSaved > 0 ? 10 : 0)));
    const socialScore = Math.min(100, Math.round(50 + (shipments.length > 10 ? 20 : shipments.length * 2) + (diversionRate > 50 ? 15 : 0)));
    const governanceScore = Math.min(100, Math.round(60 + (totalWeight > 0 ? 20 : 0) + (diversionRate > 70 ? 15 : 0)));
    const overallScore = Math.round((environmentalScore * 0.5 + socialScore * 0.25 + governanceScore * 0.25));

    const rating = overallScore >= 90 ? 'A+' : overallScore >= 80 ? 'A' : overallScore >= 70 ? 'B+' : overallScore >= 60 ? 'B' : 'C';

    // Monthly trend data
    const monthsBack = parseInt(period);
    const monthlyData = [];
    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const key = format(d, 'yyyy-MM');
      const m = monthlyMap[key] || { recycled: 0, incinerated: 0, landfill: 0, total: 0 };
      monthlyData.push({
        month: format(d, 'MMM', { locale: ar }),
        recycled: Math.round(m.recycled * 100) / 100,
        incinerated: Math.round(m.incinerated * 100) / 100,
        landfill: Math.round(m.landfill * 100) / 100,
        total: Math.round(m.total * 100) / 100,
        carbonSaved: Math.round(m.recycled * 2.5 * 100) / 100,
      });
    }

    // SDG Contributions
    const sdgData = [
      { sdg: 7, name: 'طاقة نظيفة', score: Math.min(100, Math.round(energySaved / 100)), icon: '⚡' },
      { sdg: 9, name: 'الصناعة والابتكار', score: Math.min(100, Math.round(diversionRate * 0.8)), icon: '🏗️' },
      { sdg: 11, name: 'مدن مستدامة', score: Math.min(100, Math.round(diversionRate * 0.9)), icon: '🏙️' },
      { sdg: 12, name: 'الاستهلاك المسؤول', score: Math.min(100, Math.round(diversionRate)), icon: '♻️' },
      { sdg: 13, name: 'العمل المناخي', score: Math.min(100, Math.round(carbonSaved > 0 ? 70 + carbonSaved / 10 : 0)), icon: '🌍' },
      { sdg: 15, name: 'الحياة في البر', score: Math.min(100, Math.round(treesSaved > 0 ? 60 + treesSaved / 100 : 0)), icon: '🌿' },
    ];

    // Waste type breakdown
    const wasteTypeData = Object.entries(wasteTypes)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    // Pie data
    const pieData = [
      { name: 'تدوير', value: Math.round(recycledWeight * 100) / 100 },
      { name: 'حرق', value: Math.round(incineratedWeight * 100) / 100 },
      { name: 'دفن', value: Math.round(landfillWeight * 100) / 100 },
    ].filter(d => d.value > 0);

    return {
      totalWeight: Math.round(totalWeight * 100) / 100,
      recycledWeight: Math.round(recycledWeight * 100) / 100,
      incineratedWeight: Math.round(incineratedWeight * 100) / 100,
      landfillWeight: Math.round(landfillWeight * 100) / 100,
      carbonSaved: Math.round(carbonSaved * 100) / 100,
      diversionRate: Math.round(diversionRate),
      treesSaved,
      waterSaved,
      energySaved,
      environmentalScore,
      socialScore,
      governanceScore,
      overallScore,
      rating,
      monthlyData,
      sdgData,
      wasteTypeData,
      pieData,
      shipmentCount: shipments.length,
    };
  }, [shipments, period]);

  // Save ESG snapshot
  const saveSnapshot = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error('No org');
      const certNumber = `ESG-${format(new Date(), 'yyyyMMdd')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      
      const { error } = await supabase.from('esg_report_snapshots').insert({
        organization_id: orgId,
        report_period: `${period} months`,
        report_type: reportType,
        generated_by: user?.id,
        overall_score: metrics.overallScore,
        environmental_score: metrics.environmentalScore,
        social_score: metrics.socialScore,
        governance_score: metrics.governanceScore,
        total_weight_tons: metrics.totalWeight,
        recycled_weight_tons: metrics.recycledWeight,
        carbon_saved_tons: metrics.carbonSaved,
        diversion_rate: metrics.diversionRate,
        report_data: { metrics, generatedAt: new Date().toISOString() } as any,
        sdg_data: metrics.sdgData as any,
        certificate_number: certNumber,
        status: 'final',
      });
      if (error) throw error;
      return certNumber;
    },
    onSuccess: (certNumber) => {
      toast.success(`تم حفظ تقرير ESG بنجاح - رقم الشهادة: ${certNumber}`);
      queryClient.invalidateQueries({ queryKey: ['esg-report-snapshots'] });
    },
    onError: () => toast.error('فشل في حفظ التقرير'),
  });

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html dir="rtl"><head><title>تقرير ESG - ${organization?.name}</title>
          <style>body{font-family:Arial,sans-serif;padding:40px;direction:rtl}
          .grid{display:grid;gap:16px}.grid-2{grid-template-columns:1fr 1fr}
          .card{border:1px solid #e5e7eb;border-radius:8px;padding:16px}
          .badge{display:inline-block;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:bold}
          .green{background:#d1fae5;color:#065f46}.amber{background:#fef3c7;color:#92400e}
          h1{color:#1e40af;margin-bottom:8px}h2{color:#374151}
          .score{font-size:48px;font-weight:bold;color:#059669;text-align:center}
          .metric{text-align:center;padding:12px}.metric p{margin:4px 0}
          .sdg{display:flex;align-items:center;gap:8px;padding:8px;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:8px}
          @media print{body{padding:20px}}</style></head>
          <body>
          <h1>تقرير الاستدامة البيئية والاجتماعية والحوكمة (ESG)</h1>
          <p>${organization?.name} | الفترة: ${period} أشهر | التاريخ: ${format(new Date(), 'PPP', { locale: ar })}</p>
          <hr/>
          <div class="score">${metrics.overallScore}/100 (${metrics.rating})</div>
          <div class="grid grid-2" style="margin-top:24px">
            <div class="metric card"><p style="font-size:24px;font-weight:bold">${metrics.totalWeight}</p><p>طن إجمالي</p></div>
            <div class="metric card"><p style="font-size:24px;font-weight:bold;color:#059669">${metrics.recycledWeight}</p><p>طن تدوير</p></div>
            <div class="metric card"><p style="font-size:24px;font-weight:bold;color:#059669">${metrics.carbonSaved}</p><p>طن CO₂ مُوفر</p></div>
            <div class="metric card"><p style="font-size:24px;font-weight:bold">${metrics.diversionRate}%</p><p>معدل التحويل</p></div>
          </div>
          <h2 style="margin-top:24px">النتائج الثلاثة</h2>
          <div class="grid grid-2" style="grid-template-columns:1fr 1fr 1fr">
            <div class="metric card"><p style="font-size:20px;font-weight:bold;color:#059669">${metrics.environmentalScore}</p><p>البيئي</p></div>
            <div class="metric card"><p style="font-size:20px;font-weight:bold;color:#2563eb">${metrics.socialScore}</p><p>الاجتماعي</p></div>
            <div class="metric card"><p style="font-size:20px;font-weight:bold;color:#7c3aed">${metrics.governanceScore}</p><p>الحوكمة</p></div>
          </div>
          <h2 style="margin-top:24px">المساهمة في أهداف التنمية المستدامة (SDGs)</h2>
          ${metrics.sdgData.map(s => `<div class="sdg"><span style="font-size:20px">${s.icon}</span><span>SDG ${s.sdg}: ${s.name}</span><span class="badge green">${s.score}%</span></div>`).join('')}
          <h2 style="margin-top:24px">المكافئات البيئية</h2>
          <div class="grid grid-2">
            <div class="metric card"><p>🌳 ${metrics.treesSaved}</p><p>شجرة مزروعة</p></div>
            <div class="metric card"><p>💧 ${metrics.waterSaved.toLocaleString()}</p><p>لتر مياه</p></div>
            <div class="metric card"><p>⚡ ${metrics.energySaved.toLocaleString()}</p><p>كيلوواط ساعة</p></div>
            <div class="metric card"><p>🚗 ${Math.round(metrics.carbonSaved * 4000).toLocaleString()}</p><p>كم قيادة مُوفرة</p></div>
          </div>
          <p style="margin-top:32px;text-align:center;color:#6b7280;font-size:12px">تم إنشاء هذا التقرير آلياً بواسطة منصة iRecycle | ${format(new Date(), 'PPP', { locale: ar })}</p>
          </body></html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  if (isLoading) return <Card><CardContent className="py-8 text-center text-muted-foreground">جاري تحميل بيانات ESG...</CardContent></Card>;
  if (metrics.shipmentCount === 0) return <Card><CardContent className="py-8 text-center text-muted-foreground">لا توجد بيانات كافية لإنشاء تقرير ESG</CardContent></Card>;

  // Radar chart data
  const radarData = [
    { subject: 'البيئي', value: metrics.environmentalScore },
    { subject: 'الاجتماعي', value: metrics.socialScore },
    { subject: 'الحوكمة', value: metrics.governanceScore },
    { subject: 'التحويل', value: metrics.diversionRate },
    { subject: 'الكربون', value: Math.min(100, Math.round(metrics.carbonSaved / (metrics.totalWeight || 1) * 40)) },
  ];

  return (
    <div ref={printRef} className="space-y-4">
      {/* Header */}
      <Card className="border-green-200 dark:border-green-800/40 bg-gradient-to-br from-green-50/50 to-background dark:from-green-950/10">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              {showPrint && (
                <>
                  <Button size="sm" variant="outline" className="text-xs gap-1" onClick={handlePrint}>
                    <Printer className="w-3.5 h-3.5" />طباعة
                  </Button>
                  <Button size="sm" variant="default" className="text-xs gap-1" onClick={() => saveSnapshot.mutate()} disabled={saveSnapshot.isPending}>
                    <Download className="w-3.5 h-3.5" />{saveSnapshot.isPending ? 'جاري...' : 'حفظ التقرير'}
                  </Button>
                </>
              )}
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[100px] h-8 text-xs">
                  <Calendar className="w-3 h-3 ml-1" /><SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 أشهر</SelectItem>
                  <SelectItem value="6">6 أشهر</SelectItem>
                  <SelectItem value="12">سنة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center">
                <div className={cn(
                  'text-2xl font-bold',
                  metrics.overallScore >= 80 ? 'text-emerald-600' : metrics.overallScore >= 60 ? 'text-amber-600' : 'text-red-600'
                )}>
                  {metrics.overallScore}
                </div>
                <Badge variant={metrics.overallScore >= 80 ? 'default' : 'secondary'} className="text-[10px]">
                  {metrics.rating}
                </Badge>
              </div>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="w-5 h-5 text-green-600" />
                تقرير ESG
              </CardTitle>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* ESG Scores */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'البيئي', score: metrics.environmentalScore, icon: TreePine, color: 'text-emerald-600' },
          { label: 'الاجتماعي', score: metrics.socialScore, icon: Users, color: 'text-blue-600' },
          { label: 'الحوكمة', score: metrics.governanceScore, icon: Shield, color: 'text-purple-600' },
        ].map(item => (
          <Card key={item.label}>
            <CardContent className="p-4 text-center">
              <item.icon className={cn('w-6 h-6 mx-auto mb-1', item.color)} />
              <p className={cn('text-xl font-bold', item.color)}>{item.score}</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <Progress value={item.score} className="h-1.5 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card><CardContent className="p-3 text-center">
          <BarChart3 className="w-5 h-5 mx-auto text-blue-600 mb-1" />
          <p className="text-lg font-bold">{metrics.totalWeight}</p>
          <p className="text-[10px] text-muted-foreground">طن إجمالي</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <Recycle className="w-5 h-5 mx-auto text-green-600 mb-1" />
          <p className="text-lg font-bold">{metrics.diversionRate}%</p>
          <p className="text-[10px] text-muted-foreground">معدل التحويل</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <TrendingDown className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
          <p className="text-lg font-bold text-emerald-600">{metrics.carbonSaved}</p>
          <p className="text-[10px] text-muted-foreground">طن CO₂ مُوفر</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <TreePine className="w-5 h-5 mx-auto text-green-700 mb-1" />
          <p className="text-lg font-bold">{metrics.treesSaved}</p>
          <p className="text-[10px] text-muted-foreground">شجرة مكافئة</p>
        </CardContent></Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="sdg" className="flex-1 text-xs gap-1"><Globe className="w-3 h-3" />SDGs</TabsTrigger>
          <TabsTrigger value="radar" className="flex-1 text-xs gap-1"><Target className="w-3 h-3" />الأداء</TabsTrigger>
          <TabsTrigger value="disposal" className="flex-1 text-xs gap-1"><Recycle className="w-3 h-3" />التخلص</TabsTrigger>
          <TabsTrigger value="trends" className="flex-1 text-xs gap-1"><TrendingUp className="w-3 h-3" />الاتجاهات</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="mt-3">
          <Card><CardContent className="p-3">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.monthlyData}>
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <RechartsTooltip contentStyle={{ fontSize: 11, direction: 'rtl' }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="recycled" name="تدوير" fill="hsl(142, 76%, 36%)" stackId="a" />
                  <Bar dataKey="incinerated" name="حرق" fill="hsl(25, 95%, 53%)" stackId="a" />
                  <Bar dataKey="landfill" name="دفن" fill="hsl(262, 83%, 58%)" stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="radar" className="mt-3">
          <Card><CardContent className="p-3">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Radar name="الأداء" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="disposal" className="mt-3">
          <Card><CardContent className="p-3">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={metrics.pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {metrics.pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={{ fontSize: 11, direction: 'rtl' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="sdg" className="mt-3">
          <Card><CardContent className="p-3 space-y-2">
            {metrics.sdgData.map(sdg => (
              <div key={sdg.sdg} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50" dir="rtl">
                <span className="text-xl">{sdg.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px]">SDG {sdg.sdg}</Badge>
                    <span className="text-xs font-medium">{sdg.name}</span>
                  </div>
                  <Progress value={sdg.score} className="h-1.5 mt-1" />
                </div>
                <span className="text-sm font-bold">{sdg.score}%</span>
              </div>
            ))}
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* Environmental Equivalents */}
      <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/30">
        <CardContent className="p-4">
          <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-3 text-right flex items-center gap-2 justify-end">
            <Globe className="w-4 h-4" /> المكافئات البيئية
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
            <div>
              <p className="text-2xl">🌳</p>
              <p className="font-bold text-emerald-700 dark:text-emerald-400">{metrics.treesSaved.toLocaleString()}</p>
              <p className="text-muted-foreground">شجرة مزروعة</p>
            </div>
            <div>
              <p className="text-2xl">💧</p>
              <p className="font-bold text-blue-600">{metrics.waterSaved.toLocaleString()}</p>
              <p className="text-muted-foreground">لتر مياه</p>
            </div>
            <div>
              <p className="text-2xl">⚡</p>
              <p className="font-bold text-amber-600">{metrics.energySaved.toLocaleString()}</p>
              <p className="text-muted-foreground">كيلوواط ساعة</p>
            </div>
            <div>
              <p className="text-2xl">🚗</p>
              <p className="font-bold text-purple-600">{Math.round(metrics.carbonSaved * 4000).toLocaleString()}</p>
              <p className="text-muted-foreground">كم قيادة مُوفرة</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

ESGReportPanel.displayName = 'ESGReportPanel';
export default ESGReportPanel;
