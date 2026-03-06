import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Leaf, AlertTriangle, FileSpreadsheet, BarChart3, Activity, Shield, Building2, TrendingUp, FileCheck } from 'lucide-react';
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
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-green-500/10">
            <Leaf className="w-7 h-7 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">جهاز شؤون البيئة (EEAA)</h1>
            <p className="text-muted-foreground text-sm">الرقابة البيئية والحماية من التلوث • قانون 4 لسنة 1994</p>
          </div>
          {!isEEAA && (
            <Badge variant="outline" className="mr-auto">عرض مرجعي</Badge>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'المنظمات الخاضعة', value: stats?.totalOrganizations || 0, icon: Building2, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'زيارات التفتيش', value: stats?.totalInspections || 0, icon: FileCheck, color: 'text-blue-600', bg: 'bg-blue-500/10' },
            { label: 'مخالفات بيئية', value: stats?.openViolations || 0, icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
            { label: 'معدل الامتثال البيئي', value: stats?.totalOrganizations ? `${Math.round(((stats.totalOrganizations - stats.openViolations) / stats.totalOrganizations) * 100)}%` : '0%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
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
            <TabsTrigger value="monitoring" className="gap-1.5 text-xs"><Leaf className="w-4 h-4" /> الرصد البيئي</TabsTrigger>
            <TabsTrigger value="eia" className="gap-1.5 text-xs"><AlertTriangle className="w-4 h-4" /> تقييم الأثر</TabsTrigger>
            <TabsTrigger value="approvals" className="gap-1.5 text-xs"><FileSpreadsheet className="w-4 h-4" /> الموافقات البيئية</TabsTrigger>
            <TabsTrigger value="emissions" className="gap-1.5 text-xs"><Activity className="w-4 h-4" /> الانبعاثات</TabsTrigger>
          </TabsList>

          <TabsContent value="monitoring" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Leaf className="w-5 h-5 text-green-600" />
                  نظام الرصد البيئي الذاتي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-dashed">
                    <CardContent className="p-4 text-center">
                      <BarChart3 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="font-medium text-sm">مؤشرات جودة الهواء</p>
                      <p className="text-xs text-muted-foreground">رصد الانبعاثات والجسيمات العالقة</p>
                    </CardContent>
                  </Card>
                  <Card className="border-dashed">
                    <CardContent className="p-4 text-center">
                      <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="font-medium text-sm">مؤشرات جودة المياه</p>
                      <p className="text-xs text-muted-foreground">رصد المخلفات السائلة والصرف الصناعي</p>
                    </CardContent>
                  </Card>
                  <Card className="border-dashed">
                    <CardContent className="p-4 text-center">
                      <AlertTriangle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="font-medium text-sm">مؤشرات التربة</p>
                      <p className="text-xs text-muted-foreground">رصد تلوث التربة ومواقع الدفن</p>
                    </CardContent>
                  </Card>
                  <Card className="border-dashed">
                    <CardContent className="p-4 text-center">
                      <Shield className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="font-medium text-sm">الإنذار المبكر</p>
                      <p className="text-xs text-muted-foreground">تنبيهات تجاوز الحدود المسموحة</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="eia" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  مراجعة دراسات تقييم الأثر البيئي (EIA)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  مراجعة واعتماد دراسات تقييم الأثر البيئي المقدمة من المنشآت الصناعية والمرافق البيئية وفقاً لقانون 4 لسنة 1994
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approvals" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                  الموافقات البيئية والتصاريح
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  إصدار ومتابعة الموافقات البيئية وتصاريح الانبعاثات للمنشآت الخاضعة للرقابة
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="emissions" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="w-5 h-5 text-violet-600" />
                  تتبع الانبعاثات والملوثات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  رصد ومتابعة الانبعاثات الغازية والملوثات من المنشآت الصناعية ومرافق التدوير والتخلص
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default RegulatorEEAA;
