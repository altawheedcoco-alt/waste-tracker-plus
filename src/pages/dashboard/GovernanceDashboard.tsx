import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Users, GitBranch, ScrollText, AlertTriangle, BarChart3 } from 'lucide-react';
import { useGovernanceStats } from '@/hooks/useGovernance';
import GovernanceRolesTab from '@/components/governance/GovernanceRolesTab';
import GovernanceWorkflowsTab from '@/components/governance/GovernanceWorkflowsTab';
import GovernanceAuditTab from '@/components/governance/GovernanceAuditTab';
import GovernanceAlertsTab from '@/components/governance/GovernanceAlertsTab';
import GovernanceOverviewTab from '@/components/governance/GovernanceOverviewTab';

const GovernanceDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { data: stats } = useGovernanceStats();

  const kpis = [
    { label: 'الأدوار المعرّفة', value: stats?.totalRoles || 0, icon: Users, color: 'text-blue-600' },
    { label: 'سلاسل الموافقات', value: stats?.activeWorkflows || 0, icon: GitBranch, color: 'text-emerald-600' },
    { label: 'موافقات معلقة', value: stats?.pendingApprovals || 0, icon: ScrollText, color: 'text-amber-600' },
    { label: 'تنبيهات نشطة', value: stats?.unresolvedAlerts || 0, icon: AlertTriangle, color: 'text-red-600' },
  ];

  return (
    <div dir="rtl" className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">نظام الحوكمة والرقابة الداخلية</h1>
          <p className="text-muted-foreground text-sm">إدارة الأدوار، سلاسل الموافقات، وسجل التدقيق</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <kpi.icon className={`w-8 h-8 ${kpi.color}`} />
              <div>
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="overview" className="flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">نظرة عامة</span>
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">الأدوار</span>
          </TabsTrigger>
          <TabsTrigger value="workflows" className="flex items-center gap-1.5">
            <GitBranch className="w-4 h-4" />
            <span className="hidden sm:inline">الموافقات</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-1.5">
            <ScrollText className="w-4 h-4" />
            <span className="hidden sm:inline">التدقيق</span>
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            <span className="hidden sm:inline">التنبيهات</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview"><GovernanceOverviewTab /></TabsContent>
        <TabsContent value="roles"><GovernanceRolesTab /></TabsContent>
        <TabsContent value="workflows"><GovernanceWorkflowsTab /></TabsContent>
        <TabsContent value="audit"><GovernanceAuditTab /></TabsContent>
        <TabsContent value="alerts"><GovernanceAlertsTab /></TabsContent>
      </Tabs>
    </div>
  );
};

export default GovernanceDashboard;
