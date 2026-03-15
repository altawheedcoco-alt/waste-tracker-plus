import { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Leaf, AlertTriangle, FileText, BarChart3, Loader2,
  TreePine, Car, Home, Printer, Download,
  TrendingDown, Recycle, Factory, FlaskConical,
} from 'lucide-react';
import { loadEmissionFactors, type ShipmentCarbonResult } from '@/lib/carbonEngine';

interface TechnicalReportsPanelProps {
  assignments: any[];
}

const TechnicalReportsPanel = memo(({ assignments }: TechnicalReportsPanelProps) => {
  const [selectedOrg, setSelectedOrg] = useState<string>('all');
  const [nonConformanceNotes, setNonConformanceNotes] = useState('');
  const [nonConformanceOrg, setNonConformanceOrg] = useState('');
  const orgIds = assignments.map((a: any) => a.organization_id);

  // Fetch emissions data across all linked orgs
  const { data: emissionsData, isLoading } = useQuery({
    queryKey: ['consultant-emissions', orgIds, selectedOrg],
    queryFn: async () => {
      const targetOrgs = selectedOrg === 'all' ? orgIds : [selectedOrg];
      if (!targetOrgs.length) return null;

      const factors = await loadEmissionFactors();
      let totalWeight = 0;
      let totalSaved = 0;
      let totalEmissions = 0;
      let recycledCount = 0;
      let totalCount = 0;
      const wasteBreakdown: Record<string, number> = {};

      for (const orgId of targetOrgs) {
        const { data: shipments } = await supabase
          .from('shipments')
          .select('waste_type, quantity, unit, status, disposal_method')
          .or(`organization_id.eq.${orgId},generator_id.eq.${orgId}`)
          .limit(500);

        if (!shipments) continue;

        for (const s of shipments) {
          totalCount++;
          const qty = Number(s.quantity) || 0;
          const weightTons = (s.unit === 'كجم' || s.unit === 'kg' || !s.unit) ? qty / 1000 : qty;
          totalWeight += weightTons;

          const wt = (s.waste_type as string) || 'other';
          wasteBreakdown[wt] = (wasteBreakdown[wt] || 0) + weightTons;

          const processingFactor = factors.waste_processing[wt] || 1.0;
          totalEmissions += weightTons * processingFactor;

          const isRecycled = s.disposal_method === 'recycling' || s.status === 'confirmed';
          if (isRecycled) {
            recycledCount++;
            const savingsFactor = factors.recycling_savings[wt] || 0.5;
            totalSaved += weightTons * savingsFactor;
          }
        }
      }

      const savedKg = totalSaved * 1000;
      return {
        totalWeight: Math.round(totalWeight * 100) / 100,
        totalEmissions: Math.round(totalEmissions * 1000) / 1000,
        totalSaved: Math.round(totalSaved * 1000) / 1000,
        netImpact: Math.round((totalEmissions - totalSaved) * 1000) / 1000,
        treesEquivalent: Math.round(savedKg / 21.77),
        carsEquivalent: Math.round((totalSaved / 4.6) * 10) / 10,
        homesEquivalent: Math.round((totalSaved / 7.5) * 10) / 10,
        recyclingRate: totalCount > 0 ? Math.round((recycledCount / totalCount) * 100) : 0,
        totalCount,
        wasteBreakdown,
      };
    },
    enabled: orgIds.length > 0,
  });

  // Submit non-conformance report
  const submitNonConformance = async () => {
    if (!nonConformanceOrg || !nonConformanceNotes.trim()) {
      toast.error('اختر الجهة واكتب تفاصيل عدم المطابقة');
      return;
    }

    try {
      const { error } = await supabase.from('corrective_actions').insert({
        organization_id: nonConformanceOrg,
        title: 'تقرير عدم مطابقة - استشاري بيئي',
        description: nonConformanceNotes,
        severity: 'major',
        status: 'open',
        source: 'consultant_review',
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      } as any);
      if (error) throw error;
      toast.success('تم إصدار تقرير عدم المطابقة بنجاح');
      setNonConformanceNotes('');
      setNonConformanceOrg('');
    } catch (e: any) {
      toast.error(e.message || 'فشل في الإرسال');
    }
  };

  const getOrgName = (orgId: string) => {
    const a = assignments.find((x: any) => x.organization_id === orgId);
    return a?.organization?.name || orgId;
  };

  const wasteTypeLabels: Record<string, string> = {
    plastic: 'بلاستيك', paper: 'ورق', metal: 'معادن', glass: 'زجاج',
    electronic: 'إلكتروني', organic: 'عضوي', chemical: 'كيميائي',
    medical: 'طبي', construction: 'بناء', other: 'أخرى',
  };

  return (
    <div className="space-y-6">
      {/* Org filter */}
      <div className="flex items-center gap-3">
        <Select value={selectedOrg} onValueChange={setSelectedOrg}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="اختر الجهة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الجهات</SelectItem>
            {assignments.map((a: any) => (
              <SelectItem key={a.organization_id} value={a.organization_id}>
                {a.organization?.name || a.organization_id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Emissions Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Leaf className="w-5 h-5 text-emerald-600" />
            سجل الانبعاثات الكربونية
          </CardTitle>
          <CardDescription>حساب الكربون الذي تم توفيره من خلال إعادة التدوير</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : !emissionsData ? (
            <p className="text-center text-muted-foreground py-8">لا توجد بيانات</p>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard icon={Factory} label="إجمالي الانبعاثات" value={`${emissionsData.totalEmissions} طن`} color="text-red-500" />
                <MetricCard icon={Recycle} label="CO₂ تم توفيره" value={`${emissionsData.totalSaved} طن`} color="text-emerald-600" />
                <MetricCard icon={TrendingDown} label="الأثر الصافي" value={`${emissionsData.netImpact} طن`} color="text-blue-600" />
                <MetricCard icon={BarChart3} label="معدل التدوير" value={`${emissionsData.recyclingRate}%`} color="text-purple-600" />
              </div>

              {/* Equivalents */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                  <TreePine className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-emerald-700">{emissionsData.treesEquivalent}</p>
                  <p className="text-[11px] text-emerald-600">شجرة/سنة</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                  <Car className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-700">{emissionsData.carsEquivalent}</p>
                  <p className="text-[11px] text-blue-600">سيارة/سنة</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <Home className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-amber-700">{emissionsData.homesEquivalent}</p>
                  <p className="text-[11px] text-amber-600">منزل/سنة</p>
                </div>
              </div>

              {/* Waste breakdown */}
              {Object.keys(emissionsData.wasteBreakdown).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-3">توزيع المخلفات حسب النوع</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.entries(emissionsData.wasteBreakdown).sort((a, b) => b[1] - a[1]).map(([type, weight]) => (
                      <div key={type} className="flex items-center justify-between p-2.5 rounded-lg border border-border text-sm">
                        <span>{wasteTypeLabels[type] || type}</span>
                        <Badge variant="outline" className="text-[10px]">{(weight as number).toFixed(2)} طن</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
                    const el = document.querySelector('[data-emissions-report]') as HTMLElement;
                    if (el) {
                      import('@/services/documentService').then(({ PrintService }) => {
                        PrintService.printHTML(el.innerHTML, { title: 'التقرير الفني' });
                      });
                    }
                  }}>
                  <Printer className="w-4 h-4" />طباعة التقرير
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Non-Conformance Report */}
      <Card className="border-amber-200 dark:border-amber-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            تقرير عدم المطابقة
          </CardTitle>
          <CardDescription>
            إصدار تنبيه إذا قامت جهة بخلط مخلفات خطرة مع مخلفات عادية أو أي مخالفة بيئية
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={nonConformanceOrg} onValueChange={setNonConformanceOrg}>
            <SelectTrigger>
              <SelectValue placeholder="اختر الجهة المخالفة" />
            </SelectTrigger>
            <SelectContent>
              {assignments.map((a: any) => (
                <SelectItem key={a.organization_id} value={a.organization_id}>
                  {a.organization?.name || a.organization_id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Textarea
            value={nonConformanceNotes}
            onChange={(e) => setNonConformanceNotes(e.target.value)}
            placeholder="وصف تفصيلي لعدم المطابقة: نوع المخالفة، الأدلة، التوصيات التصحيحية..."
            className="min-h-[120px]"
          />

          <div className="flex justify-end">
            <Button onClick={submitNonConformance} variant="destructive" className="gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              إصدار تقرير عدم المطابقة
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

const MetricCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) => (
  <div className="text-center p-4 rounded-xl border border-border bg-card">
    <Icon className={`w-6 h-6 ${color} mx-auto mb-2`} />
    <p className="text-xl font-bold">{value}</p>
    <p className="text-[11px] text-muted-foreground">{label}</p>
  </div>
);

TechnicalReportsPanel.displayName = 'TechnicalReportsPanel';
export default TechnicalReportsPanel;
