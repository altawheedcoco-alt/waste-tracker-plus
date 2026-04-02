import { useState, lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, KeyRound, Zap, Brain, Shield, BarChart3, Siren, Target, FileText, History, ShieldCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSovereignGovernance } from '@/hooks/useSovereignGovernance';
import { useSovereignRealtime } from '@/hooks/useSovereignRealtime';
import SovereignOverviewCard from './SovereignOverviewCard';

const SovereignRolesPanel = lazy(() => import('./SovereignRolesPanel'));
const SovereignDelegationPanel = lazy(() => import('./SovereignDelegationPanel'));
const EarlyWarningPanel = lazy(() => import('./EarlyWarningPanel'));
const AICommandCenter = lazy(() => import('./AICommandCenter'));
const SovereignKPIsPanel = lazy(() => import('./SovereignKPIsPanel'));
const CrisisManagementPanel = lazy(() => import('./CrisisManagementPanel'));
const SLAMonitoringPanel = lazy(() => import('./SLAMonitoringPanel'));
const SovereignReportsPanel = lazy(() => import('./SovereignReportsPanel'));
const SovereignAuditTimeline = lazy(() => import('./SovereignAuditTimeline'));
const SecurityAuditPanel = lazy(() => import('./SecurityAuditPanel'));

import PlatformPulseChart from './PlatformPulseChart';

const TabFallback = () => <Skeleton className="h-48 w-full rounded-xl" />;

const SovereignGovernanceDashboard = () => {
  const [activeTab, setActiveTab] = useState('kpis');
  const { criticalAlerts, roles, delegations, decisions, isLoading } = useSovereignGovernance();

  const tabs = [
    { value: 'kpis', label: 'المؤشرات', icon: BarChart3 },
    { value: 'early-warning', label: 'الإنذار المبكر', icon: Zap, badge: criticalAlerts.length || undefined },
    { value: 'crisis', label: 'الأزمات', icon: Siren },
    { value: 'roles', label: 'الأدوار', icon: Crown, badge: roles.length || undefined },
    { value: 'delegation', label: 'التفويضات', icon: KeyRound },
    { value: 'sla', label: 'SLA', icon: Target },
    { value: 'ai-command', label: 'القرار الذكي', icon: Brain, badge: decisions.filter(d => d.status === 'pending').length || undefined },
    { value: 'reports', label: 'التقارير', icon: FileText },
    { value: 'security', label: 'الفحص الأمني', icon: ShieldCheck },
    { value: 'audit', label: 'سجل الرقابة', icon: History },
  ];

  return (
    <div className="space-y-4" dir="rtl">
      {/* BackButton removed: rendered inside admin dashboard tab */}
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-red-500 flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold">الحوكمة السيادية</h2>
          <p className="text-xs text-muted-foreground">مؤشرات الأداء · الإنذار المبكر · الأزمات · الأدوار · التفويضات · SLA · القرار الذكي · التقارير</p>
        </div>
      </div>

      {/* Overview Card */}
      <SovereignOverviewCard />
      <PlatformPulseChart />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto scrollbar-hide">
          <TabsList className="w-max min-w-full justify-start gap-0.5 bg-muted/50 p-1">
            {tabs.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 whitespace-nowrap">
                <tab.icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <Badge variant={tab.value === 'early-warning' ? 'destructive' : 'secondary'} className="text-[9px] h-4 px-1">{tab.badge}</Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="kpis" className="mt-4">
          <Suspense fallback={<TabFallback />}><SovereignKPIsPanel /></Suspense>
        </TabsContent>
        <TabsContent value="early-warning" className="mt-4">
          <Suspense fallback={<TabFallback />}><EarlyWarningPanel /></Suspense>
        </TabsContent>
        <TabsContent value="crisis" className="mt-4">
          <Suspense fallback={<TabFallback />}><CrisisManagementPanel /></Suspense>
        </TabsContent>
        <TabsContent value="roles" className="mt-4">
          <Suspense fallback={<TabFallback />}><SovereignRolesPanel /></Suspense>
        </TabsContent>
        <TabsContent value="delegation" className="mt-4">
          <Suspense fallback={<TabFallback />}><SovereignDelegationPanel /></Suspense>
        </TabsContent>
        <TabsContent value="sla" className="mt-4">
          <Suspense fallback={<TabFallback />}><SLAMonitoringPanel /></Suspense>
        </TabsContent>
        <TabsContent value="ai-command" className="mt-4">
          <Suspense fallback={<TabFallback />}><AICommandCenter /></Suspense>
        </TabsContent>
        <TabsContent value="reports" className="mt-4">
          <Suspense fallback={<TabFallback />}><SovereignReportsPanel /></Suspense>
        </TabsContent>
        <TabsContent value="security" className="mt-4">
          <Suspense fallback={<TabFallback />}><SecurityAuditPanel /></Suspense>
        </TabsContent>
        <TabsContent value="audit" className="mt-4">
          <Suspense fallback={<TabFallback />}><SovereignAuditTimeline /></Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SovereignGovernanceDashboard;
