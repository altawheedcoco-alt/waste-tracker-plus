import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/badge';
import { Badge } from '@/components/ui/badge';
import { Factory, FileCheck, HardHat, ClipboardCheck, Building2, BarChart3, AlertTriangle, TrendingUp, Shield, Recycle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useRegulatorConfig, useRegulatorStats } from '@/hooks/useRegulatorData';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const RegulatorIDA = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'registry';
  const [activeTab, setActiveTab] = useState(initialTab);
  const { data: config } = useRegulatorConfig();
  const { data: stats } = useRegulatorStats();

  const levelCode = config?.regulator_level_code;
  const isIDA = levelCode === 'ida';

  // Fetch industrial entities (recyclers + disposal)
  const { data: industrialCount = 0 } = useQuery({
    queryKey: ['ida-industrial-count'],
    queryFn: async () => {
      const { count } = await supabase.from('organizations').select('id', { count: 'exact', head: true }).in('organization_type', ['recycler', 'disposal']);
      return count || 0;
    },
  });

  const { data: recyclerCount = 0 } = useQuery({
    queryKey: ['ida-recycler-count'],
    queryFn: async () => {
      const { count } = await supabase.from('organizations').select('id', { count: 'exact', head: true }).eq('organization_type', 'recycler');
      return count || 0;
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:p-6">
        <BackButton />
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-500/10">
            <Factory className="w-7 h-7 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">الهيئة العامة للتنمية الصناعية (IDA)</h1>
            <p className="text-muted-foreground text-sm">الرقابة على المنشآت الصناعية وتراخيص التشغيل • قانون التنمية الصناعية</p>
          </div>
          {!isIDA && (
            <Badge variant="outline" className="mr-auto">عرض مرجعي</Badge>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'المنشآت الصناعية', value: industrialCount, icon: Factory, color: 'text-orange-600', bg: 'bg-orange-500/10' },
            { label: 'مصانع التدوير', value: recyclerCount, icon: Recycle, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
            { label: 'زيارات التفتيش', value: stats?.totalInspections || 0, icon: ClipboardCheck, color: 'text-blue-600', bg: 'bg-blue-500/10' },
            { label: 'المخالفات الصناعية', value: stats?.openViolations || 0, icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
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
            <TabsTrigger value="registry" className="gap-1.5 text-xs"><Factory className="w-4 h-4" /> السجل الصناعي</TabsTrigger>
            <TabsTrigger value="licenses" className="gap-1.5 text-xs"><FileCheck className="w-4 h-4" /> تراخيص التشغيل</TabsTrigger>
            <TabsTrigger value="safety" className="gap-1.5 text-xs"><HardHat className="w-4 h-4" /> السلامة الصناعية</TabsTrigger>
            <TabsTrigger value="inspections" className="gap-1.5 text-xs"><ClipboardCheck className="w-4 h-4" /> التفتيش</TabsTrigger>
            <TabsTrigger value="facilities" className="gap-1.5 text-xs"><Building2 className="w-4 h-4" /> المنشآت</TabsTrigger>
          </TabsList>

          <TabsContent value="registry" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Factory className="w-5 h-5 text-orange-600" />
                  السجل الصناعي الرقمي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-dashed">
                    <CardContent className="p-4 text-center">
                      <Factory className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-2xl font-bold">{industrialCount}</p>
                      <p className="text-xs text-muted-foreground">منشأة صناعية مسجلة</p>
                    </CardContent>
                  </Card>
                  <Card className="border-dashed">
                    <CardContent className="p-4 text-center">
                      <Recycle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-2xl font-bold">{recyclerCount}</p>
                      <p className="text-xs text-muted-foreground">مصنع تدوير</p>
                    </CardContent>
                  </Card>
                  <Card className="border-dashed">
                    <CardContent className="p-4 text-center">
                      <Shield className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-2xl font-bold">{industrialCount - recyclerCount}</p>
                      <p className="text-xs text-muted-foreground">مرفق تخلص نهائي</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="licenses" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileCheck className="w-5 h-5 text-teal-600" />
                  تراخيص التشغيل الصناعي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  إدارة ومتابعة تراخيص التشغيل الصناعي والسجل الصناعي للمنشآت الخاضعة لولاية الهيئة
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="safety" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <HardHat className="w-5 h-5 text-amber-600" />
                  معايير السلامة الصناعية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  متابعة التزام المنشآت بمعايير السلامة الصناعية وإجراءات الحماية والوقاية
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inspections" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ClipboardCheck className="w-5 h-5 text-blue-600" />
                  التفتيش الصناعي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  جدولة وتنفيذ زيارات التفتيش على المنشآت الصناعية والتحقق من الامتثال
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="facilities" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  خريطة المنشآت الصناعية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  عرض جغرافي لجميع المنشآت الصناعية (مصانع التدوير ومرافق التخلص) مع بيانات الترخيص
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default RegulatorIDA;
