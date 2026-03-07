import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Recycle, Package, Eye, Shield, Building2, AlertTriangle,
  ClipboardCheck, FileText, Search,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useRegulatorConfig, useRegulatorStats } from '@/hooks/useRegulatorData';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import DashboardV2Header from '@/components/dashboard/shared/DashboardV2Header';
import V2TabsNav from '@/components/dashboard/shared/V2TabsNav';
import { KPICard } from '@/components/shared/KPICard';

const tabItems = [
  { value: 'waste-chain', label: 'سلسلة الحيازة', icon: Recycle },
  { value: 'manifests', label: 'تدقيق المانيفست', icon: Package },
  { value: 'declarations', label: 'الإقرارات الدورية', icon: FileText },
  { value: 'entities', label: 'الجهات الخاضعة', icon: Building2 },
];

const RegulatorWMRA = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'waste-chain';
  const [activeTab, setActiveTab] = useState(initialTab);
  const { data: config } = useRegulatorConfig();

  const levelCode = config?.regulator_level_code;
  const isWMRA = levelCode === 'wmra';

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

        <DashboardV2Header
          userName="WMRA"
          orgName="جهاز تنظيم إدارة المخلفات"
          orgLabel="قانون 202 لسنة 2020"
          icon={Recycle}
          gradient="from-primary to-primary/70"
        >
          {!isWMRA && <Badge variant="outline">عرض رقابي مرجعي</Badge>}
        </DashboardV2Header>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPICard icon={Package} value={wasteStats?.total || 0} label="إجمالي الشحنات تحت المراقبة" />
          <KPICard icon={Eye} value={wasteStats?.pending || 0} label="شحنات قيد التتبع" iconClassName="text-amber-500" />
          <KPICard icon={Shield} value={wasteStats?.delivered || 0} label="شحنات مكتملة" iconClassName="text-emerald-500" />
          <KPICard icon={Building2} value={regulatedOrgs.length} label="جهات خاضعة للرقابة" iconClassName="text-blue-500" />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
          <V2TabsNav tabs={tabItems} />

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
