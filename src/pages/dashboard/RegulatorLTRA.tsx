import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Truck, Users, Shield, FileCheck, BarChart3, AlertTriangle,
  Building2, Eye, Scale, Search,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useRegulatorConfig, useRegulatorStats } from '@/hooks/useRegulatorData';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

const RegulatorLTRA = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'fleet';
  const [activeTab, setActiveTab] = useState(initialTab);
  const { data: config } = useRegulatorConfig();
  const { data: stats } = useRegulatorStats();

  const levelCode = config?.regulator_level_code;
  const isLTRA = levelCode === 'ltra';

  const { data: transporterCount = 0 } = useQuery({
    queryKey: ['ltra-transporter-count'],
    queryFn: async () => {
      const { count } = await supabase.from('organizations').select('id', { count: 'exact', head: true }).eq('organization_type', 'transporter');
      return count || 0;
    },
  });

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

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10">
            <Truck className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">جهاز تنظيم النقل البري (LTRA)</h1>
            <p className="text-muted-foreground text-sm">
              الرقابة على النقل البري وتراخيص المركبات والسائقين
            </p>
          </div>
          {!isLTRA && <Badge variant="outline" className="mr-auto">عرض رقابي مرجعي</Badge>}
        </div>

        {/* Oversight KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'شركات نقل مرخصة', value: transporterCount, icon: Building2, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'سائقون مسجلون', value: driverCount, icon: Users, color: 'text-blue-600', bg: 'bg-blue-500/10' },
            { label: 'مخالفات نقل مفتوحة', value: stats?.openViolations || 0, icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
            { label: 'نسبة الالتزام', value: transporterCount ? `${Math.round(((transporterCount - (stats?.openViolations || 0)) / transporterCount) * 100)}%` : '—', icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
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
            <TabsTrigger value="fleet" className="gap-1.5 text-xs"><Truck className="w-3.5 h-3.5" /> الأساطيل المرخصة</TabsTrigger>
            <TabsTrigger value="drivers" className="gap-1.5 text-xs"><Users className="w-3.5 h-3.5" /> تدقيق رخص السائقين</TabsTrigger>
            <TabsTrigger value="hazmat" className="gap-1.5 text-xs"><Shield className="w-3.5 h-3.5" /> تصاريح المواد الخطرة</TabsTrigger>
            <TabsTrigger value="vehicles" className="gap-1.5 text-xs"><FileCheck className="w-3.5 h-3.5" /> فحص المركبات</TabsTrigger>
            <TabsTrigger value="incidents" className="gap-1.5 text-xs"><AlertTriangle className="w-3.5 h-3.5" /> بلاغات الحوادث</TabsTrigger>
          </TabsList>

          <TabsContent value="fleet" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Eye className="w-5 h-5 text-blue-600" />
                  مراقبة أساطيل النقل المرخصة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Truck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">رقابة الأساطيل — قريباً</p>
                  <p className="text-xs text-muted-foreground mt-1">مراقبة حالة تراخيص وصلاحية أساطيل شركات النقل</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="drivers" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="w-5 h-5 text-blue-600" />
                  تدقيق رخص السائقين وصلاحياتهم
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">تدقيق رخص السائقين — قريباً</p>
                  <p className="text-xs text-muted-foreground mt-1">فحص صلاحية رخص القيادة ومدى التزام السائقين بالاشتراطات</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hazmat" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="w-5 h-5 text-red-600" />
                  تصاريح نقل المواد الخطرة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Shield className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">تصاريح المواد الخطرة — قريباً</p>
                  <p className="text-xs text-muted-foreground mt-1">مراجعة وإصدار ورفض تصاريح نقل المواد الخطرة</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vehicles" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileCheck className="w-5 h-5 text-amber-600" />
                  فحص وترخيص المركبات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <FileCheck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">فحص المركبات — قريباً</p>
                  <p className="text-xs text-muted-foreground mt-1">فحص صلاحية مركبات نقل المخلفات ومدى مطابقتها للاشتراطات</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="incidents" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  بلاغات الحوادث والمخالفات المرورية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <AlertTriangle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">سجل الحوادث — قريباً</p>
                  <p className="text-xs text-muted-foreground mt-1">تسجيل ومتابعة حوادث النقل وإصدار الجزاءات المناسبة</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Regulatory Notice */}
        <Card className="border-blue-200 bg-blue-50/30 dark:bg-blue-950/10">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Scale className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-sm text-blue-800 dark:text-blue-400">الصلاحية الرقابية</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  يختص جهاز تنظيم النقل البري بالإشراف على أنشطة النقل وضمان السلامة المرورية.
                  يحق للجهاز إصدار تحذيرات أولاً، ثم إنذارات رسمية، وصولاً لسحب التراخيص وفرض الغرامات على المخالفين.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default RegulatorLTRA;
