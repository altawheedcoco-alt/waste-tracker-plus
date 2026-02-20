import React, { useState, lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { useSafetyStats } from '@/hooks/useSafetyManager';
import {
  Shield, AlertTriangle, ClipboardCheck, FileWarning,
  HardHat, Siren, Users, TrendingUp, Activity, Flame, GraduationCap
} from 'lucide-react';

const EmergencyPlansPanel = lazy(() => import('./EmergencyPlansPanel'));
const EvacuationDrillsPanel = lazy(() => import('./EvacuationDrillsPanel'));
const WorkPermitsPanel = lazy(() => import('./WorkPermitsPanel'));
const OHSReportPanel = lazy(() => import('@/components/ohs/OHSReportPanel'));
const IncidentReportManager = lazy(() => import('@/components/compliance/IncidentReportManager'));
const SafetyTrainingPanel = lazy(() => import('./SafetyTrainingPanel'));

const TabFallback = () => (
  <div className="space-y-4 mt-6">
    <Skeleton className="h-32 w-full rounded-xl" />
    <Skeleton className="h-48 w-full rounded-xl" />
  </div>
);

const SafetyManagerDashboard = () => {
  const { data: stats, isLoading } = useSafetyStats();

  const kpis = [
    { label: 'خطط الطوارئ النشطة', value: stats?.activePlans ?? 0, total: stats?.totalPlans ?? 0, icon: Siren, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: 'التدريبات المنفذة', value: stats?.completedDrills ?? 0, total: stats?.totalDrills ?? 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'متوسط درجة التدريب', value: `${stats?.avgDrillScore ?? 0}%`, icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'تصاريح عمل معلقة', value: stats?.pendingPermits ?? 0, total: stats?.totalPermits ?? 0, icon: FileWarning, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'حوادث حرجة', value: stats?.criticalIncidents ?? 0, total: stats?.totalIncidents ?? 0, icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
    { label: 'نسبة الامتثال OHS', value: `${stats?.avgCompliance ?? 0}%`, icon: ClipboardCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  const tabItems = [
    { value: 'overview', label: 'نظرة عامة', icon: Activity },
    { value: 'emergency', label: 'خطط الطوارئ', icon: Siren },
    { value: 'drills', label: 'تدريبات الإخلاء', icon: Flame },
    { value: 'permits', label: 'تصاريح العمل', icon: FileWarning },
    { value: 'training', label: 'الدورات والكروت', icon: GraduationCap },
    { value: 'incidents', label: 'سجل الحوادث', icon: AlertTriangle },
    { value: 'ohs', label: 'تقارير OHS', icon: ClipboardCheck },
  ];

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
          <HardHat className="w-6 h-6 text-amber-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold">إدارة السلامة والصحة المهنية</h2>
          <p className="text-sm text-muted-foreground">خطط الطوارئ • التدريبات • تصاريح العمل • الحوادث • تقارير OHS</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="h-full">
              <CardContent className="p-3 text-center">
                <div className={`w-10 h-10 rounded-lg ${kpi.bg} flex items-center justify-center mx-auto mb-2`}>
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mx-auto mb-1" />
                ) : (
                  <p className="text-2xl font-bold">{kpi.value}</p>
                )}
                {'total' in kpi && kpi.total !== undefined && (
                  <p className="text-[10px] text-muted-foreground">من {kpi.total}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full" dir="rtl">
        <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card p-1">
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap bg-transparent gap-0.5 h-auto p-0">
            {tabItems.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="text-[10px] sm:text-sm whitespace-nowrap gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg text-muted-foreground data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border data-[state=active]:border-primary/30 data-[state=active]:shadow-sm hover:text-foreground transition-all duration-200"
              >
                <tab.icon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="text-right pb-2">
                <CardTitle className="text-base flex items-center gap-2 justify-end">
                  <span>مهام مدير السلامة</span>
                  <Shield className="w-5 h-5 text-primary" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-right text-sm">
                {[
                  'إعداد ومراجعة خطط الطوارئ والإخلاء',
                  'تنظيم وتنفيذ تدريبات الإخلاء الدورية',
                  'مراجعة واعتماد تصاريح العمل الخطر',
                  'التحقيق في الحوادث وتوثيق الإجراءات التصحيحية',
                  'إجراء جولات تفتيش السلامة (OHS)',
                  'مراقبة امتثال السائقين لمعايير السلامة',
                  'تدريب الموظفين على إجراءات السلامة',
                  'إعداد تقارير الأداء البيئي والسلامة',
                ].map((task, i) => (
                  <div key={i} className="flex items-start gap-2 justify-end">
                    <span>{task}</span>
                    <Badge variant="outline" className="text-[10px] shrink-0">{i + 1}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-right pb-2">
                <CardTitle className="text-base flex items-center gap-2 justify-end">
                  <span>ملخص الحالة</span>
                  <Activity className="w-5 h-5 text-primary" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-right">
                {[
                  { label: 'خطط طوارئ نشطة', value: stats?.activePlans ?? 0, status: (stats?.activePlans ?? 0) > 0 ? 'success' : 'warning' },
                  { label: 'تصاريح عمل معلقة', value: stats?.pendingPermits ?? 0, status: (stats?.pendingPermits ?? 0) === 0 ? 'success' : 'warning' },
                  { label: 'حوادث حرجة مفتوحة', value: stats?.criticalIncidents ?? 0, status: (stats?.criticalIncidents ?? 0) === 0 ? 'success' : 'destructive' },
                  { label: 'متوسط نتائج التدريبات', value: `${stats?.avgDrillScore ?? 0}%`, status: (stats?.avgDrillScore ?? 0) >= 80 ? 'success' : 'warning' },
                  { label: 'نسبة الامتثال العامة', value: `${stats?.avgCompliance ?? 0}%`, status: (stats?.avgCompliance ?? 0) >= 80 ? 'success' : 'warning' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <Badge variant={item.status === 'success' ? 'default' : item.status === 'destructive' ? 'destructive' : 'secondary'} className="text-xs">
                      {item.value}
                    </Badge>
                    <span className="text-sm">{item.label}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="emergency" className="mt-4">
          <Suspense fallback={<TabFallback />}>
            <EmergencyPlansPanel />
          </Suspense>
        </TabsContent>

        <TabsContent value="drills" className="mt-4">
          <Suspense fallback={<TabFallback />}>
            <EvacuationDrillsPanel />
          </Suspense>
        </TabsContent>

        <TabsContent value="permits" className="mt-4">
          <Suspense fallback={<TabFallback />}>
            <WorkPermitsPanel />
          </Suspense>
        </TabsContent>

        <TabsContent value="training" className="mt-4">
          <Suspense fallback={<TabFallback />}>
            <SafetyTrainingPanel />
          </Suspense>
        </TabsContent>

        <TabsContent value="incidents" className="mt-4">
          <Suspense fallback={<TabFallback />}>
            <IncidentReportManager />
          </Suspense>
        </TabsContent>

        <TabsContent value="ohs" className="mt-4">
          <Suspense fallback={<TabFallback />}>
            <OHSReportPanel />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SafetyManagerDashboard;
