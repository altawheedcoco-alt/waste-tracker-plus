import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Factory, FileCheck, HardHat, ClipboardCheck, Building2,
  AlertTriangle, Shield, Recycle, Eye, Scale, Search,
} from 'lucide-react';
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

  const { data: industrialCount = 0 } = useQuery({
    queryKey: ['ida-industrial-count'],
    queryFn: async () => {
      const { count } = await supabase.from('organizations').select('id', { count: 'exact', head: true }).in('organization_type', ['recycler', 'disposal', 'generator']);
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

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-500/10">
            <Factory className="w-7 h-7 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">الهيئة العامة للتنمية الصناعية (IDA)</h1>
            <p className="text-muted-foreground text-sm">
              الرقابة على المنشآت الصناعية وتراخيص التشغيل • قانون التنمية الصناعية
            </p>
          </div>
          {!isIDA && <Badge variant="outline" className="mr-auto">عرض رقابي مرجعي</Badge>}
        </div>

        {/* Oversight KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'منشآت صناعية مسجلة', value: industrialCount, icon: Factory, color: 'text-orange-600', bg: 'bg-orange-500/10' },
            { label: 'منشآت تدوير', value: recyclerCount, icon: Recycle, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
            { label: 'مخالفات صناعية مفتوحة', value: stats?.openViolations || 0, icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
            { label: 'معدل الالتزام الصناعي', value: industrialCount ? `${Math.round(((industrialCount - (stats?.openViolations || 0)) / industrialCount) * 100)}%` : '—', icon: Shield, color: 'text-primary', bg: 'bg-primary/10' },
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
            <TabsTrigger value="registry" className="gap-1.5 text-xs"><Factory className="w-3.5 h-3.5" /> السجل الصناعي</TabsTrigger>
            <TabsTrigger value="licenses" className="gap-1.5 text-xs"><FileCheck className="w-3.5 h-3.5" /> تدقيق التراخيص</TabsTrigger>
            <TabsTrigger value="safety" className="gap-1.5 text-xs"><HardHat className="w-3.5 h-3.5" /> السلامة الصناعية</TabsTrigger>
            <TabsTrigger value="inspections" className="gap-1.5 text-xs"><ClipboardCheck className="w-3.5 h-3.5" /> جولات التفتيش</TabsTrigger>
            <TabsTrigger value="facilities" className="gap-1.5 text-xs"><Building2 className="w-3.5 h-3.5" /> قاعدة المنشآت</TabsTrigger>
          </TabsList>

          <TabsContent value="registry" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Eye className="w-5 h-5 text-orange-600" />
                  السجل الصناعي الموحد
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Factory className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">السجل الصناعي — قريباً</p>
                  <p className="text-xs text-muted-foreground mt-1">قاعدة بيانات موحدة لجميع المنشآت الصناعية المسجلة وحالة تراخيصها</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="licenses" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileCheck className="w-5 h-5 text-blue-600" />
                  تدقيق تراخيص التشغيل الصناعي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <FileCheck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">تدقيق التراخيص — قريباً</p>
                  <p className="text-xs text-muted-foreground mt-1">فحص صلاحية تراخيص التشغيل ومدى مطابقة النشاط الفعلي للترخيص</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="safety" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <HardHat className="w-5 h-5 text-amber-600" />
                  التفتيش على السلامة الصناعية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <HardHat className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">السلامة الصناعية — قريباً</p>
                  <p className="text-xs text-muted-foreground mt-1">فحص التزام المنشآت بمعايير السلامة الصناعية وتسجيل المخالفات</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inspections" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ClipboardCheck className="w-5 h-5 text-primary" />
                  جولات التفتيش الصناعي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <ClipboardCheck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">جولات التفتيش — قريباً</p>
                  <p className="text-xs text-muted-foreground mt-1">جدولة وتوثيق جولات التفتيش الميداني وإصدار التقارير</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="facilities" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  قاعدة بيانات المنشآت الصناعية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">قاعدة المنشآت — قريباً</p>
                  <p className="text-xs text-muted-foreground mt-1">بيانات تفصيلية عن المنشآت الصناعية ومواقعها وأنشطتها</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Regulatory Notice */}
        <Card className="border-orange-200 bg-orange-50/30 dark:bg-orange-950/10">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Scale className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-sm text-orange-800 dark:text-orange-400">الصلاحية الرقابية</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  تختص الهيئة العامة للتنمية الصناعية بالرقابة على المنشآت الصناعية (مولدين ومدورين) بصفتهم جهات صناعية.
                  يحق للهيئة إصدار تحذيرات أولاً، ثم إنذارات رسمية، ثم سحب تراخيص التشغيل وإغلاق المنشآت المخالفة.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default RegulatorIDA;
