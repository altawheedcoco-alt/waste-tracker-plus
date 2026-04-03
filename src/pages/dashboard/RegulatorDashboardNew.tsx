import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useState, lazy, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import BackButton from '@/components/ui/back-button';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Shield, ClipboardCheck, AlertTriangle, Gavel, Building2, BarChart3, Scale, FileCheck, Search, Link2 } from 'lucide-react';
import RegulatorOverview from '@/components/regulator/RegulatorOverview';
import FieldInspectionPanel from '@/components/regulator/FieldInspectionPanel';
import ViolationsPanel from '@/components/regulator/ViolationsPanel';
import PenaltiesPanel from '@/components/regulator/PenaltiesPanel';
import OrganizationsRegistry from '@/components/regulator/OrganizationsRegistry';
import JurisdictionPanel from '@/components/regulator/JurisdictionPanel';
import LicenseManagementPanel from '@/components/regulator/LicenseManagementPanel';
import RegulatorDocumentVerification from '@/components/regulator/RegulatorDocumentVerification';
import ComplianceMonitoringPanel from '@/components/regulator/ComplianceMonitoringPanel';
import RegulatoryReportsPanel from '@/components/regulator/RegulatoryReportsPanel';
import ChainOfCustodyPanel from '@/components/regulator/ChainOfCustodyPanel';
import DashboardV2Header from '@/components/dashboard/shared/DashboardV2Header';
import V2TabsNav from '@/components/dashboard/shared/V2TabsNav';



const tabItems = [
  { value: 'overview', label: 'نظرة عامة', icon: BarChart3 },
  { value: 'compliance', label: 'رصد الامتثال', icon: Shield },
  { value: 'organizations', label: 'المنظمات', icon: Building2 },
  { value: 'custody', label: 'سلسلة الحيازة', icon: Link2 },
  { value: 'licenses', label: 'التراخيص والإفادات', icon: FileCheck },
  { value: 'inspections', label: 'التفتيش', icon: ClipboardCheck },
  { value: 'violations', label: 'المخالفات', icon: AlertTriangle },
  { value: 'penalties', label: 'العقوبات', icon: Gavel },
  { value: 'reports', label: 'التقارير', icon: BarChart3 },
  { value: 'jurisdiction', label: 'الاختصاصات', icon: Scale },
  { value: 'verify', label: 'التحقق', icon: Search },
];

const RegulatorDashboardNew = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:p-6">
      <BackButton />

      <DashboardV2Header
        userName={user?.email?.split('@')[0] || ''}
        orgName="المنظومة الرقابية"
        orgLabel="الرقابة الحكومية"
        icon={Shield}
        gradient="from-amber-600 to-amber-500"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
        <V2TabsNav tabs={tabItems} />

        <TabsContent value="overview" className="mt-4">
          <RegulatorOverview />
        </TabsContent>
        <TabsContent value="compliance" className="mt-4">
          <ComplianceMonitoringPanel />
        </TabsContent>
        <TabsContent value="organizations" className="mt-4">
          <OrganizationsRegistry />
        </TabsContent>
        <TabsContent value="custody" className="mt-4">
          <ChainOfCustodyPanel />
        </TabsContent>
        <TabsContent value="licenses" className="mt-4">
          <LicenseManagementPanel />
        </TabsContent>
        <TabsContent value="inspections" className="mt-4">
          <FieldInspectionPanel />
        </TabsContent>
        <TabsContent value="violations" className="mt-4">
          <ViolationsPanel />
        </TabsContent>
        <TabsContent value="penalties" className="mt-4">
          <PenaltiesPanel />
        </TabsContent>
        <TabsContent value="reports" className="mt-4">
          <RegulatoryReportsPanel />
        </TabsContent>
        <TabsContent value="jurisdiction" className="mt-4">
          <JurisdictionPanel />
        </TabsContent>
        <TabsContent value="verify" className="mt-4">
          <RegulatorDocumentVerification />
        </TabsContent>
      </Tabs>

    </div>
      </DashboardLayout>
  );
};

export default RegulatorDashboardNew;
