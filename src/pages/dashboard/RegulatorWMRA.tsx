import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Recycle, Package, Layers, Activity, Leaf, FileText, BarChart3,
  Building2, AlertTriangle, Shield, Eye, Scale, Search, ClipboardCheck,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useRegulatorConfig, useRegulatorStats } from '@/hooks/useRegulatorData';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const RegulatorWMRA = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'waste-chain';
  const [activeTab, setActiveTab] = useState(initialTab);
  const { data: config } = useRegulatorConfig();
  const { data: stats } = useRegulatorStats();

  const levelCode = config?.regulator_level_code;
  const isWMRA = levelCode === 'wmra';

  // Oversight: recent shipments for audit
  const { data: recentShipments = [], isLoading: shipmentsLoading } = useQuery({
    queryKey: ['wmra-oversight-shipments'],
    queryFn: async () => {
      const { data } = await supabase
        .from('shipments')
        .select('id, shipment_number, status, waste_type, quantity, unit, created_at, generator_org:organizations!shipments_generator_id_fkey(name), transporter_org:organizations!shipments_transporter_id_fkey(name)')
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  const { data: wasteStats } = useQuery({
    queryKey: ['wmra-waste-stats'],
    queryFn: async () => {
      const [total, pending, delivered] = await Promise.all([
        supabase.from('shipments').select('id', { count: 'exact', head: true }),
        supabase.from('shipments').select('id', { count: 'exact', head: true }).in('status', ['new', 'collecting', 'in_transit', 'confirmed']),
        supabase.from('shipments').select('id', { count: 'exact', head: true }).eq('status', 'delivered'),
      ]);
      return { total: total.count || 0, pending: pending.count || 0, delivered: delivered.count || 0 };
    },
  });

  // Organizations under WMRA jurisdiction
  const { data: regulatedOrgs = [] } = useQuery({
    queryKey: ['wmra-regulated-orgs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('organizations')
        .select('id, name, organization_type, city, created_at')
        .in('organization_type', ['generator', 'transporter', 'recycler', 'disposal'])
        .order('created_at', { ascending: false })
        .limit(15);
      return data || [];
    },
  });

  const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    new: { label: 'جديدة', variant: 'secondary' },
    collecting: { label: 'جاري الجمع', variant: 'outline' },
    in_transit: { label: 'في الطريق', variant: 'outline' },
    confirmed: { label: 'مؤكدة', variant: 'default' },
    delivered: { label: 'تم التسليم', variant: 'default' },
  };

  const orgTypeLabels: Record<string, string> = {
    generator: 'مولد', transporter: 'ناقل', recycler: 'مدور', disposal: 'تخلص',
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:p-6">
        <BackButton />

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Recycle className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">جهاز تنظيم إدارة المخلفات (WMRA)</h1>
            <p className="text-muted-foreground text-sm">
              الرقابة والإشراف على منظومة المخلفات • قانون 202 لسنة 2020
            </p>
          </div>
          {!isWMRA && <Badge variant="outline" className="mr-auto">عرض رقابي مرجعي</Badge>}
        </div>

        {/* Oversight KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'إجمالي الشحنات تحت المراقبة', value: wasteStats?.total || 0, icon: Package, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'شحنات قيد التتبع', value: wasteStats?.pending || 0, icon: Eye, color: 'text-amber-600', bg: 'bg-amber-500/10' },
            { label: 'شحنات مكتملة', value: wasteStats?.delivered || 0, icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
            { label: 'جهات خاضعة للرقابة', value: regulatedOrgs.length, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-500/10' },
          ].map(c => (
            <Card key={c.label}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${c.bg}`}>
                    <c.icon className={`w-5 h-5 ${c.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{c.label}</p>
                    <p className="text-2xl font-bold">{c.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full flex-wrap h-auto gap-1 bg-muted/50 p-1">
            <TabsTrigger value="waste-chain" className="gap-1.5 text-xs"><Recycle className="w-3.5 h-3.5" /> سلسلة الحيازة</TabsTrigger>
            <TabsTrigger value="manifests" className="gap-1.5 text-xs"><Package className="w-3.5 h-3.5" /> تدقيق المانيفست</TabsTrigger>
            <TabsTrigger value="declarations" className="gap-1.5 text-xs"><FileText className="w-3.5 h-3.5" /> الإقرارات الدورية</TabsTrigger>
            <TabsTrigger value="entities" className="gap-1.5 text-xs"><Building2 className="w-3.5 h-3.5" /> الجهات الخاضعة</TabsTrigger>
          </TabsList>

          {/* سلسلة الحيازة */}
          <TabsContent value="waste-chain" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Eye className="w-5 h-5 text-primary" />
                  مراقبة حركة المخلفات (سلسلة الحيازة)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {shipmentsLoading ? (
                  <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
                ) : recentShipments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">لا توجد شحنات للمراقبة</p>
                ) : (
                  <div className="space-y-2">
                    {recentShipments.map((s: any) => (
                      <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-lg bg-primary/10">
                            <Package className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{s.shipment_number}</p>
                            <p className="text-xs text-muted-foreground">
                              {s.generator_org?.name || '—'} ← {s.transporter_org?.name || '—'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{s.quantity} {s.unit}</span>
                          <Badge variant={statusLabels[s.status]?.variant || 'secondary'}>
                            {statusLabels[s.status]?.label || s.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* تدقيق المانيفست */}
          <TabsContent value="manifests" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ClipboardCheck className="w-5 h-5 text-amber-600" />
                  تدقيق بيانات المانيفست
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">أداة تدقيق المانيفست — قريباً</p>
                  <p className="text-xs text-muted-foreground mt-1">مراجعة مطابقة بيانات المانيفست مع سجلات الشحن الفعلية</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* الإقرارات الدورية */}
          <TabsContent value="declarations" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="w-5 h-5 text-blue-600" />
                  مراجعة الإقرارات الدورية المقدمة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">مراجعة الإقرارات الدورية — قريباً</p>
                  <p className="text-xs text-muted-foreground mt-1">فحص الإقرارات المقدمة من المولدين والناقلين والمدورين</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* الجهات الخاضعة */}
          <TabsContent value="entities" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  الجهات الخاضعة لرقابة WMRA
                </CardTitle>
              </CardHeader>
              <CardContent>
                {regulatedOrgs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">لا توجد جهات مسجلة</p>
                ) : (
                  <div className="space-y-2">
                    {regulatedOrgs.map((org: any) => (
                      <div key={org.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                        <div>
                          <p className="font-medium text-sm">{org.name}</p>
                          <p className="text-xs text-muted-foreground">{org.city || '—'}</p>
                        </div>
                        <Badge variant="outline">{orgTypeLabels[org.organization_type] || org.organization_type}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Regulatory Notice */}
        <Card className="border-amber-200 bg-amber-50/30 dark:bg-amber-950/10">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-sm text-amber-800 dark:text-amber-400">تنويه رقابي</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  هذه اللوحة مخصصة لأغراض الرقابة والإشراف فقط وفقاً لقانون 202 لسنة 2020.
                  يحق للجهاز إصدار تحذيرات وإنذارات وفرض جزاءات على المنشآت المخالفة.
                  البيانات المعروضة هي كما أُدخلت من قبل المستخدمين وتحت مسؤوليتهم الكاملة.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default RegulatorWMRA;
