import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Leaf, AlertTriangle, FileSpreadsheet, Activity,
  Shield, Building2, FileCheck, Eye, Scale, Search,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useRegulatorConfig, useRegulatorStats } from '@/hooks/useRegulatorData';
import DashboardV2Header from '@/components/dashboard/shared/DashboardV2Header';
import V2TabsNav from '@/components/dashboard/shared/V2TabsNav';
import { KPICard } from '@/components/shared/KPICard';

const tabItems = [
  { value: 'monitoring', label: 'الرصد البيئي', icon: Leaf },
  { value: 'eia', label: 'دراسات الأثر', icon: AlertTriangle },
  { value: 'approvals', label: 'الموافقات المعلقة', icon: FileSpreadsheet },
  { value: 'emissions', label: 'الانبعاثات', icon: Activity },
];

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

        <DashboardV2Header
          userName="EEAA"
          orgName="جهاز شؤون البيئة"
          orgLabel="قانون 4 لسنة 1994"
          icon={Leaf}
          gradient="from-emerald-600 to-emerald-500"
        >
          {!isEEAA && <Badge variant="outline">عرض رقابي مرجعي</Badge>}
        </DashboardV2Header>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPICard icon={Building2} value={stats?.totalOrganizations || 0} label="منشآت تحت الرقابة البيئية" />
          <KPICard icon={FileCheck} value={stats?.totalInspections || 0} label="زيارات تفتيش بيئي" iconClassName="text-blue-500" />
          <KPICard icon={AlertTriangle} value={stats?.openViolations || 0} label="مخالفات بيئية مفتوحة" iconClassName="text-destructive" />
          <KPICard
            icon={Shield}
            value={stats?.totalOrganizations ? `${Math.round(((stats.totalOrganizations - (stats.openViolations || 0)) / stats.totalOrganizations) * 100)}%` : '—'}
            label="معدل الامتثال البيئي"
            iconClassName="text-emerald-500"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
          <V2TabsNav tabs={tabItems} />

          <TabsContent value="monitoring" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Eye className="w-5 h-5 text-emerald-600" />
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="emissions" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="w-5 h-5 text-destructive" />
                  رصد الانبعاثات والملوثات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Activity className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">نظام رصد الانبعاثات — قريباً</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Regulatory Notice */}
        <Card className="border-emerald-200 bg-emerald-50/30 dark:bg-emerald-950/10">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-sm text-emerald-800 dark:text-emerald-400">الصلاحية الرقابية</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  يختص جهاز شؤون البيئة بالرقابة على الالتزام بالمعايير البيئية وحماية البيئة من التلوث وفقاً لقانون 4 لسنة 1994.
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
