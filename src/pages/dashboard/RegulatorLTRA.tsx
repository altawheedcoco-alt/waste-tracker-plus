import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, MapPin, Users, Shield, FileCheck, BarChart3, AlertTriangle, Activity, Building2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useRegulatorConfig, useRegulatorStats } from '@/hooks/useRegulatorData';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const RegulatorLTRA = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'fleet';
  const [activeTab, setActiveTab] = useState(initialTab);
  const { data: config } = useRegulatorConfig();
  const { data: stats } = useRegulatorStats();

  const levelCode = config?.regulator_level_code;
  const isLTRA = levelCode === 'ltra';

  // Fetch transporter orgs count
  const { data: transporterCount = 0 } = useQuery({
    queryKey: ['ltra-transporter-count'],
    queryFn: async () => {
      const { count } = await supabase.from('organizations').select('id', { count: 'exact', head: true }).eq('organization_type', 'transporter');
      return count || 0;
    },
  });

  // Fetch driver count
  const { data: driverCount = 0 } = useQuery({
    queryKey: ['ltra-driver-count'],
    queryFn: async () => {
      const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).not('driver_license_number', 'is', null);
      return count || 0;
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:p-6">
        <BackButton />
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10">
            <Truck className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">جهاز تنظيم النقل البري (LTRA)</h1>
            <p className="text-muted-foreground text-sm">الرقابة على أنشطة النقل البري وتراخيص المركبات والسائقين</p>
          </div>
          {!isLTRA && (
            <Badge variant="outline" className="mr-auto">عرض مرجعي</Badge>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'شركات النقل المسجلة', value: transporterCount, icon: Building2, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'السائقون المرخصون', value: driverCount, icon: Users, color: 'text-blue-600', bg: 'bg-blue-500/10' },
            { label: 'زيارات التفتيش', value: stats?.totalInspections || 0, icon: FileCheck, color: 'text-amber-600', bg: 'bg-amber-500/10' },
            { label: 'المخالفات المرورية', value: stats?.openViolations || 0, icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
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
            <TabsTrigger value="fleet" className="gap-1.5 text-xs"><Truck className="w-4 h-4" /> أساطيل النقل</TabsTrigger>
            <TabsTrigger value="drivers" className="gap-1.5 text-xs"><Users className="w-4 h-4" /> السائقون</TabsTrigger>
            <TabsTrigger value="hazmat" className="gap-1.5 text-xs"><Shield className="w-4 h-4" /> المواد الخطرة</TabsTrigger>
            <TabsTrigger value="vehicles" className="gap-1.5 text-xs"><FileCheck className="w-4 h-4" /> ترخيص المركبات</TabsTrigger>
            <TabsTrigger value="incidents" className="gap-1.5 text-xs"><BarChart3 className="w-4 h-4" /> الحوادث</TabsTrigger>
          </TabsList>

          <TabsContent value="fleet" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Truck className="w-5 h-5 text-blue-600" />
                  رقابة أساطيل النقل المسجلة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-dashed">
                    <CardContent className="p-4 text-center">
                      <Building2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-2xl font-bold">{transporterCount}</p>
                      <p className="text-xs text-muted-foreground">شركة نقل مسجلة</p>
                    </CardContent>
                  </Card>
                  <Card className="border-dashed">
                    <CardContent className="p-4 text-center">
                      <Truck className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-2xl font-bold">—</p>
                      <p className="text-xs text-muted-foreground">مركبة مرخصة</p>
                    </CardContent>
                  </Card>
                  <Card className="border-dashed">
                    <CardContent className="p-4 text-center">
                      <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-2xl font-bold">—</p>
                      <p className="text-xs text-muted-foreground">رحلة نقل هذا الشهر</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="drivers" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="w-5 h-5 text-indigo-600" />
                  سجل السائقين والرخص المهنية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  متابعة رخص القيادة المهنية وتصاريح نقل المخلفات وسجل المخالفات المرورية للسائقين
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hazmat" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="w-5 h-5 text-red-600" />
                  تصاريح نقل المواد الخطرة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  إدارة ومراقبة تصاريح نقل المخلفات الخطرة وفقاً للوائح السلامة المعتمدة من LTRA
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vehicles" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileCheck className="w-5 h-5 text-teal-600" />
                  ترخيص وتسجيل المركبات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  التحقق من تراخيص المركبات والفحص الفني الدوري ومدى ملاءمتها لنقل أنواع المخلفات المختلفة
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="incidents" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="w-5 h-5 text-amber-600" />
                  تقارير الحوادث والوقائع
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  توثيق ومتابعة حوادث النقل والتسربات والوقائع الخطرة أثناء عمليات نقل المخلفات
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default RegulatorLTRA;
