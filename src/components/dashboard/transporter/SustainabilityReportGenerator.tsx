import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Leaf, TreePine, Car, Droplets, FileText, Send,
  Loader2, BarChart3, RefreshCw, CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';

// Carbon conversion factors
const CARBON_PER_TON_RECYCLED = 500; // kg CO2 saved per ton recycled
const TREES_PER_TON_CO2 = 45; // trees needed to absorb 1 ton CO2/year
const KM_PER_KG_CO2 = 4.6; // km driven per kg CO2
const WATER_PER_TON_RECYCLED = 7000; // liters saved per ton recycled

const SustainabilityReportGenerator = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedPartner, setSelectedPartner] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch partners
  const { data: partners = [] } = useQuery({
    queryKey: ['sustainability-partners', organization?.id],
    queryFn: async () => {
      const { data } = await (supabase
        .from('verified_partnerships')
        .select('partner_id') as any)
        .eq('organization_id', organization!.id)
        .eq('status', 'active');
      
      if (!data?.length) return [];
      const partnerIds = (data as any[]).map(p => p.partner_id).filter(Boolean);
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name')
        .in('id', partnerIds);
      return (orgs || []).map((o: any) => ({ id: o.id, name: o.name }));
    },
    enabled: !!organization?.id,
  });

  // Fetch existing reports
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['sustainability-reports', organization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sustainability_reports')
        .select('*')
        .eq('organization_id', organization!.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      
      // Fetch partner names
      const partnerIds = [...new Set((data || []).map((r: any) => r.partner_organization_id).filter(Boolean))];
      let partnerMap: Record<string, string> = {};
      if (partnerIds.length > 0) {
        const { data: orgs } = await supabase.from('organizations').select('id, name').in('id', partnerIds);
        (orgs || []).forEach((o: any) => { partnerMap[o.id] = o.name; });
      }
      return (data || []).map((r: any) => ({ ...r, partner_name: r.partner_organization_id ? partnerMap[r.partner_organization_id] || '' : '' }));
      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const generateReport = async () => {
    if (!organization?.id) return;
    setIsGenerating(true);

    try {
      const [year, month] = selectedPeriod.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

      // Fetch shipments for this period
      let query = supabase
        .from('shipments')
        .select('id, quantity, unit, waste_type, status, generator_id, recycler_id')
        .eq('transporter_id', organization.id)
        .in('status', ['delivered', 'confirmed'])
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (selectedPartner !== 'all') {
        query = query.eq('generator_id', selectedPartner);
      }

      const { data: shipments } = await query;

      if (!shipments?.length) {
        toast.info('لا توجد شحنات مكتملة في هذه الفترة');
        setIsGenerating(false);
        return;
      }

      // Calculate metrics
      const totalWaste = shipments.reduce((s, sh) => s + (Number(sh.quantity) || 0), 0) / 1000; // to tons
      const recycledShipments = shipments.filter(s => s.recycler_id);
      const recycledTons = recycledShipments.reduce((s, sh) => s + (Number(sh.quantity) || 0), 0) / 1000;
      const landfillTons = totalWaste - recycledTons;
      const recyclingRate = totalWaste > 0 ? Math.round((recycledTons / totalWaste) * 100) : 0;
      const carbonSaved = recycledTons * CARBON_PER_TON_RECYCLED;
      const treesEquiv = Math.round((carbonSaved / 1000) * TREES_PER_TON_CO2);
      const drivingKm = Math.round(carbonSaved * KM_PER_KG_CO2);
      const waterSaved = Math.round(recycledTons * WATER_PER_TON_RECYCLED);

      // Waste type breakdown
      const wasteBreakdown: Record<string, number> = {};
      shipments.forEach(s => {
        const type = s.waste_type || 'غير محدد';
        wasteBreakdown[type] = (wasteBreakdown[type] || 0) + (Number(s.quantity) || 0);
      });

      const reportData = {
        organization_id: organization.id,
        partner_organization_id: selectedPartner !== 'all' ? selectedPartner : null,
        report_period: selectedPeriod,
        report_type: 'monthly',
        total_waste_collected_tons: totalWaste,
        total_recycled_tons: recycledTons,
        total_landfilled_tons: landfillTons,
        recycling_rate: recyclingRate,
        carbon_saved_kg: carbonSaved,
        trees_equivalent: treesEquiv,
        driving_km_equivalent: drivingKm,
        water_saved_liters: waterSaved,
        shipments_count: shipments.length,
        status: 'generated',
        report_data: { waste_breakdown: wasteBreakdown },
      };

      const { error } = await supabase.from('sustainability_reports').insert(reportData);
      if (error) throw error;

      toast.success('تم توليد تقرير الاستدامة بنجاح ✅');
      queryClient.invalidateQueries({ queryKey: ['sustainability-reports'] });
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('حدث خطأ أثناء توليد التقرير');
    } finally {
      setIsGenerating(false);
    }
  };

  const markAsSent = useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await supabase
        .from('sustainability_reports')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', reportId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sustainability-reports'] });
      toast.success('تم تحديث حالة التقرير إلى "مُرسل"');
    },
  });

  // Generate month options
  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = format(d, 'MMMM yyyy', { locale: ar });
    return { value, label };
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Leaf className="w-5 h-5 text-emerald-600" />
          تقارير الاستدامة للعملاء
        </CardTitle>
        <CardDescription className="text-right">
          تقارير شهرية بالبصمة الكربونية والأثر البيئي تُرسل للمولدين
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Generator controls */}
        <div className="flex flex-col sm:flex-row gap-2" dir="rtl">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="sm:w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {monthOptions.map(m => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedPartner} onValueChange={setSelectedPartner}>
            <SelectTrigger className="sm:w-[200px]"><SelectValue placeholder="كل الجهات المرتبطة" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الجهات المرتبطة</SelectItem>
              {partners.map((p: any) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={generateReport} disabled={isGenerating} className="gap-1">
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            توليد التقرير
          </Button>
        </div>

        {/* Reports list */}
        {isLoading ? (
          <div className="text-center text-muted-foreground py-4">جاري التحميل...</div>
        ) : reports.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            لا توجد تقارير بعد. استخدم الزر أعلاه لتوليد أول تقرير.
          </div>
        ) : (
          <ScrollArea className="max-h-[500px]">
            <div className="space-y-3">
              {reports.map((report: any) => {
                const partnerName = report.partner_name;
                return (
                  <Card key={report.id} className="border-emerald-200/50 dark:border-emerald-800/30">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          {report.status !== 'sent' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markAsSent.mutate(report.id)}
                              disabled={markAsSent.isPending}
                              className="gap-1"
                            >
                              <Send className="w-3 h-3" />
                              إرسال
                            </Button>
                          )}
                          <Badge variant={report.status === 'sent' ? 'default' : 'secondary'} className="text-xs">
                            {report.status === 'sent' ? '✅ مُرسل' : report.status === 'generated' ? '📄 جاهز' : '📝 مسودة'}
                          </Badge>
                        </div>

                        {/* Report details */}
                        <div className="flex-1 text-right space-y-2">
                          <div className="flex items-center gap-2 justify-end flex-wrap">
                            <Badge variant="outline" className="text-xs">{report.report_period}</Badge>
                            <span className="font-medium text-sm">{partnerName || 'كل الجهات المرتبطة'}</span>
                          </div>

                          {/* Environmental impact cards */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                              <TreePine className="w-4 h-4 mx-auto text-emerald-600 mb-1" />
                              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{Number(report.trees_equivalent).toLocaleString()}</p>
                              <p className="text-[10px] text-muted-foreground">شجرة معادلة</p>
                            </div>
                            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                              <Droplets className="w-4 h-4 mx-auto text-blue-600 mb-1" />
                              <p className="text-sm font-bold text-blue-700 dark:text-blue-400">{Number(report.water_saved_liters).toLocaleString()}</p>
                              <p className="text-[10px] text-muted-foreground">لتر ماء</p>
                            </div>
                            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                              <Car className="w-4 h-4 mx-auto text-amber-600 mb-1" />
                              <p className="text-sm font-bold text-amber-700 dark:text-amber-400">{Number(report.driving_km_equivalent).toLocaleString()}</p>
                              <p className="text-[10px] text-muted-foreground">كم قيادة</p>
                            </div>
                            <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/30">
                              <Leaf className="w-4 h-4 mx-auto text-green-600 mb-1" />
                              <p className="text-sm font-bold text-green-700 dark:text-green-400">{Number(report.carbon_saved_kg).toLocaleString()}</p>
                              <p className="text-[10px] text-muted-foreground">كجم CO₂</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap justify-end">
                            <span>{report.shipments_count} شحنة</span>
                            <span>نسبة التدوير: {Number(report.recycling_rate)}%</span>
                            <span>{Number(report.total_waste_collected_tons).toFixed(1)} طن</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default SustainabilityReportGenerator;
