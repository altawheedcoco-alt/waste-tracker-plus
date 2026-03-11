import { useState, lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, KeyRound, Zap, Brain, Shield } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSovereignGovernance } from '@/hooks/useSovereignGovernance';

const SovereignRolesPanel = lazy(() => import('./SovereignRolesPanel'));
const SovereignDelegationPanel = lazy(() => import('./SovereignDelegationPanel'));
const EarlyWarningPanel = lazy(() => import('./EarlyWarningPanel'));
const AICommandCenter = lazy(() => import('./AICommandCenter'));

const TabFallback = () => <Skeleton className="h-48 w-full rounded-xl" />;

const SovereignGovernanceDashboard = () => {
  const [activeTab, setActiveTab] = useState('early-warning');
  const { criticalAlerts, roles, delegations, decisions, isLoading } = useSovereignGovernance();

  const tabs = [
    { value: 'early-warning', label: 'الإنذار المبكر', icon: Zap, badge: criticalAlerts.length || undefined },
    { value: 'roles', label: 'الأدوار السيادية', icon: Crown, badge: roles.length || undefined },
    { value: 'delegation', label: 'التفويضات', icon: KeyRound, badge: delegations.length || undefined },
    { value: 'ai-command', label: 'القرار الذكي', icon: Brain, badge: decisions.filter(d => d.status === 'pending').length || undefined },
  ];

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-red-500 flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold">الحوكمة السيادية</h2>
          <p className="text-xs text-muted-foreground">إدارة الأدوار والتفويضات والإنذار المبكر ومركز القرار الذكي</p>
        </div>
      </div>

      {/* Quick KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {tabs.map(tab => (
          <Card key={tab.value} className="cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => setActiveTab(tab.value)}>
            <CardContent className="p-3 flex items-center gap-3">
              <tab.icon className={`w-5 h-5 ${activeTab === tab.value ? 'text-primary' : 'text-muted-foreground'}`} />
              <div>
                <p className="text-sm font-medium">{tab.label}</p>
                {tab.badge !== undefined && (
                  <Badge variant={tab.value === 'early-warning' && criticalAlerts.length > 0 ? 'destructive' : 'secondary'} className="text-[10px]">
                    {tab.badge}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          {tabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-1 text-xs">
              <tab.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <Badge variant="secondary" className="text-[9px] h-4 px-1 mr-1">{tab.badge}</Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="early-warning" className="mt-4">
          <Suspense fallback={<TabFallback />}><EarlyWarningPanel /></Suspense>
        </TabsContent>
        <TabsContent value="roles" className="mt-4">
          <Suspense fallback={<TabFallback />}><SovereignRolesPanel /></Suspense>
        </TabsContent>
        <TabsContent value="delegation" className="mt-4">
          <Suspense fallback={<TabFallback />}><SovereignDelegationPanel /></Suspense>
        </TabsContent>
        <TabsContent value="ai-command" className="mt-4">
          <Suspense fallback={<TabFallback />}><AICommandCenter /></Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SovereignGovernanceDashboard;
