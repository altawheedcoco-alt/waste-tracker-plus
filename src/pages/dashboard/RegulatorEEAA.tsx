import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Leaf, AlertTriangle, FileSpreadsheet, BarChart3, Activity,
  Shield, Building2, FileCheck, Eye, Scale, Search,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useRegulatorConfig, useRegulatorStats } from '@/hooks/useRegulatorData';
import { Skeleton } from '@/components/ui/skeleton';

const RegulatorEEAA = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'monitoring';
  const [activeTab, setActiveTab] = useState(initialTab);
  const { data: config } = useRegulatorConfig();
  const { data: stats } = useRegulatorStats();

  const levelCode = config?.regulator_level_code;
  const isEEAA = levelCode === 'eeaa';

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:p-6">
        <BackButton />

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-green-500/10">
            <Leaf className="w-7 h-7 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">جهاز شؤون البيئة (EEAA)</h1>
            <p className="text-muted-foreground text-sm">
              الرقابة البيئية ومكافحة التلوث • قانون 4 لسنة 1994
            </p>
          </div>
          {!isEEAA && <Badge variant="outline" className="mr-auto">عرض رقابي مرجعي</Badge>}
        </div>

        {/* Oversight KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'منشآت تحت الرقابة البيئية', value: stats?.totalOrganizations || 0, icon: Building2, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'زيارات تفتيش بيئي', value: stats?.totalInspections || 0, icon: FileCheck, color: 'text-blue-600', bg: 'bg-blue-500/10' },
            { label: 'مخالفات بيئية مفتوحة', value: stats?.openViolations || 0, icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
            { label: 'معدل الامتثال البيئي', value: stats?.totalOrganizations ? `${Math.round(((stats.totalOrganizations - (stats.openViolations || 0)) / stats.totalOrganizations) * 100)}%` : '—', icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
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
            <TabsTrigger value="monitoring" className="gap-1.5 text-xs"><Leaf className="w-3.5 h-3.5" /> الرصد البيئي</TabsTrigger>
            <TabsTrigger value="eia" className="gap-1.5 text-xs"><AlertTriangle className="w-3.5 h-3.5" /> دراسات الأثر</TabsTrigger>
            <TabsTrigger value="approvals" className="gap-1.5 text-xs"><FileSpreadsheet className="w-3.5 h-3.5" /> الموافقات المعلقة</TabsTrigger>
            <TabsTrigger value="emissions" className="gap-1.5 text-xs"><Activity className="w-3.5 h-3.5" /> الانبعاثات</TabsTrigger>
          </TabsList>

          <TabsContent value="monitoring" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Eye className="w-5 h-5 text-green-600" />
                  الرصد البيئي ومراقبة التلوث
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Leaf className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">لوحة الرصد البيئي — قريباً</p>
                  <p className="text-xs text-muted-foreground mt-1">مراقبة مؤشرات جودة الهواء والمياه ومستويات التلوث</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="eia" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Scale className="w-5 h-5 text-amber-600" />
                  مراجعة دراسات تقييم الأثر البيئي (EIA)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">فحص دراسات الأثر البيئي — قريباً</p>
                  <p className="text-xs text-muted-foreground mt-1">مراجعة واعتماد أو رفض دراسات الأثر البيئي المقدمة من المنشآت</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approvals" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileCheck className="w-5 h-5 text-blue-600" />
                  الموافقات البيئية المعلقة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <FileSpreadsheet className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">طلبات الموافقة البيئية — قريباً</p>
                  <p className="text-xs text-muted-foreground mt-1">مراجعة طلبات الموافقات البيئية وإصدار القرارات</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="emissions" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="w-5 h-5 text-red-600" />
                  رصد الانبعاثات والملوثات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Activity className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">نظام رصد الانبعاثات — قريباً</p>
                  <p className="text-xs text-muted-foreground mt-1">مراقبة الانبعاثات الغازية والسائلة من المنشآت الخاضعة</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Regulatory Notice */}
        <Card className="border-green-200 bg-green-50/30 dark:bg-green-950/10">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-sm text-green-800 dark:text-green-400">الصلاحية الرقابية</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  يختص جهاز شؤون البيئة بالرقابة على الالتزام بالمعايير البيئية وحماية البيئة من التلوث وفقاً لقانون 4 لسنة 1994.
                  يحق للجهاز إصدار إنذارات وتحذيرات وفرض غرامات وإيقاف الأنشطة المخالفة.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default RegulatorEEAA;
