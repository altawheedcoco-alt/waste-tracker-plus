import { lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, FileText, Zap, Eye, Users, Building2, Receipt, ClipboardCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PartnerVisibilitySettings from '@/components/settings/PartnerVisibilitySettings';
import OrganizationTermsSettings from '@/components/settings/OrganizationTermsSettings';
import MovementSupervisorSettings from '@/components/settings/MovementSupervisorSettings';
import AutomationSettingsDialog from '@/components/automation/AutomationSettingsDialog';
import DocumentTemplateManager from '@/components/documents/DocumentTemplateManager';
import ComplianceLicenseSettings from '@/components/settings/ComplianceLicenseSettings';

interface Props {
  orgType: string;
}

type TabConfig = {
  value: string;
  label: string;
  icon: typeof Shield;
  visibleFor: string[];
};

const tabs: TabConfig[] = [
  { value: 'compliance', label: 'التراخيص والامتثال', icon: ClipboardCheck, visibleFor: ['transporter', 'generator', 'recycler', 'disposal', 'transport_office'] },
  { value: 'automation', label: 'الأتمتة', icon: Zap, visibleFor: ['transporter', 'generator', 'recycler', 'disposal', 'consultant', 'consulting_office', 'transport_office'] },
  { value: 'visibility', label: 'الرؤية والحجب', icon: Shield, visibleFor: ['transporter'] },
  { value: 'supervisors', label: 'مسئولو الحركة', icon: Users, visibleFor: ['transporter', 'generator'] },
  { value: 'terms', label: 'الشروط والأحكام', icon: FileText, visibleFor: ['transporter', 'generator', 'recycler', 'disposal', 'consultant', 'consulting_office', 'transport_office'] },
  { value: 'templates', label: 'قوالب المستندات', icon: Receipt, visibleFor: ['transporter', 'generator', 'recycler', 'disposal', 'consultant', 'consulting_office'] },
];

const OrganizationSettings = ({ orgType }: Props) => {
  const visibleTabs = tabs.filter(t => t.visibleFor.includes(orgType));
  const defaultTab = visibleTabs[0]?.value || 'automation';

  if (visibleTabs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">لا توجد إعدادات مؤسسية متاحة لنوع جهتك الحالي</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue={defaultTab} className="space-y-4">
      <div className="overflow-x-auto scrollbar-thin pb-1">
        <TabsList className="inline-flex w-max gap-0.5 h-auto p-1 bg-muted/30 backdrop-blur-sm rounded-xl border border-border/30">
          {visibleTabs.map(tab => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.value} value={tab.value}
                className="gap-1.5 rounded-lg px-3 py-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Icon className="h-3.5 w-3.5" />{tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>

      {/* Compliance & Licenses */}
      <TabsContent value="compliance">
        <ComplianceLicenseSettings />
      </TabsContent>

      {/* Automation */}
      <TabsContent value="automation">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />الإجراءات التلقائية
            </CardTitle>
            <CardDescription className="text-xs">إدارة أتمتة العمليات والمهام التلقائية</CardDescription>
          </CardHeader>
          <CardContent>
            <AutomationSettingsDialog>
              <Button className="w-full gap-2" size="lg"><Zap className="h-5 w-5" />فتح إعدادات الأتمتة</Button>
            </AutomationSettingsDialog>
            <p className="text-xs text-muted-foreground mt-3 text-center">أكثر من 150 إجراء تلقائي متاح للتفعيل</p>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Visibility */}
      <TabsContent value="visibility">
        <PartnerVisibilitySettings />
      </TabsContent>

      {/* Movement Supervisors */}
      <TabsContent value="supervisors">
        <MovementSupervisorSettings />
      </TabsContent>

      {/* Terms */}
      <TabsContent value="terms">
        <OrganizationTermsSettings />
      </TabsContent>

      {/* Document Templates */}
      <TabsContent value="templates">
        <DocumentTemplateManager />
      </TabsContent>
    </Tabs>
  );
};

export default OrganizationSettings;
