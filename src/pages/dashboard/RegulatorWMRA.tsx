import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Recycle, Package, MapPin, Layers, Activity, Leaf, FileText, BarChart3, Building2, TrendingUp, AlertTriangle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useRegulatorConfig, useRegulatorStats } from '@/hooks/useRegulatorData';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

const RegulatorWMRA = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'waste-chain';
  const [activeTab, setActiveTab] = useState(initialTab);
  const { data: config } = useRegulatorConfig();
  const { data: stats } = useRegulatorStats();
  const { organization } = useAuth();

  // Fetch waste chain data
  const { data: recentShipments = [] } = useQuery({
    queryKey: ['wmra-recent-shipments'],
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
        supabase.from('shipments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('shipments').select('id', { count: 'exact', head: true }).eq('status', 'delivered'),
      ]);
      return {
        total: total.count || 0,
        pending: pending.count || 0,
        delivered: delivered.count || 0,
      };
    },
  });

  const levelCode = config?.regulator_level_code;
  const isWMRA = levelCode === 'wmra';

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:p-6">
        <BackButton />
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10">
            <Recycle className="w-7 h-7 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">جهاز تنظيم إدارة المخلفات (WMRA)</h1>
            <p className="text-muted-foreground text-sm">الرقابة الشاملة على منظومة إدارة المخلفات • قانون 202 لسنة 2020</p>
          </div>
          {!isWMRA && (
            <Badge variant="outline" className="mr-auto">عرض مرجعي</Badge>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'إجمالي الشحنات', value: wasteStats?.total || 0, icon: Package, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'شحنات قيد التنفيذ', value: wasteStats?.pending || 0, icon: Activity, color: 'text-amber-600', bg: 'bg-amber-500/10' },
            { label: 'شحنات مكتملة', value: wasteStats?.delivered || 0, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
            { label: 'منظمات مُسجلة', value: stats?.totalOrganizations || 0, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-500/10' },
          ].map(c => (
            <Card key={c.label}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${c.bg}`}>
                    <c.icon className={`w-5 h-5 ${c.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{c.value}</p>
                    <p className="text-xs text-muted-foreground">{c.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
          <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="waste-chain" className="gap-1.5 text-xs"><Recycle className="w-4 h-4" /> سلسلة المخلفات</TabsTrigger>
            <TabsTrigger value="manifests" className="gap-1.5 text-xs"><Package className="w-4 h-4" /> المانيفست</TabsTrigger>
            <TabsTrigger value="flow" className="gap-1.5 text-xs"><Activity className="w-4 h-4" /> تدفق المخلفات</TabsTrigger>
            <TabsTrigger value="sustainability" className="gap-1.5 text-xs"><Leaf className="w-4 h-4" /> الاستدامة</TabsTrigger>
          </TabsList>

          <TabsContent value="waste-chain" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Recycle className="w-5 h-5 text-emerald-600" />
                  رقابة سلسلة حيازة المخلفات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentShipments.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">لا توجد شحنات حديثة</p>
                  ) : (
                    <div className="divide-y">
                      {recentShipments.map((s: any) => (
                        <div key={s.id} className="py-3 flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">شحنة #{s.shipment_number}</p>
                            <p className="text-xs text-muted-foreground">
                              {(s.generator_org as any)?.name} ← {(s.transporter_org as any)?.name}
                            </p>
                            <p className="text-xs text-muted-foreground">{s.waste_type} • {s.quantity} {s.unit}</p>
                          </div>
                          <Badge variant={s.status === 'delivered' ? 'default' : s.status === 'pending' ? 'secondary' : 'outline'}>
                            {s.status === 'delivered' ? 'مكتملة' : s.status === 'pending' ? 'قيد التنفيذ' : s.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manifests" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="w-5 h-5 text-blue-600" />
                  مراقبة وثائق المانيفست
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  مراقبة جميع وثائق المانيفست الصادرة عبر المنظومة والتحقق من اكتمال سلسلة الحيازة
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="flow" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="w-5 h-5 text-violet-600" />
                  خريطة تدفق المخلفات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  تتبع حركة المخلفات من نقطة التولد حتى نقطة التخلص النهائي أو إعادة التدوير
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sustainability" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Leaf className="w-5 h-5 text-green-600" />
                  مؤشرات الاستدامة البيئية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  مؤشرات أداء الاستدامة على مستوى المنظومة وفقاً لمعايير ESG
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default RegulatorWMRA;
