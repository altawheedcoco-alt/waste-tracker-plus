import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import BackButton from '@/components/ui/back-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, ClipboardCheck, AlertTriangle, Gavel, Building2, BarChart3, Scale, FileCheck, Search, Link2, Eye } from 'lucide-react';
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

const RegulatorDashboardNew = () => {
  const { user, roles } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  return (
      <div className="space-y-6 p-4 sm:p-6">
        <BackButton />
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">المنظومة الرقابية الحكومية</h1>
            <p className="text-muted-foreground text-sm">مراقبة الامتثال البيئي • التفتيش الميداني • القرارات والعقوبات • سلسلة الحيازة</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
          <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="overview" className="gap-1.5 text-xs sm:text-sm">
              <BarChart3 className="w-4 h-4" /> نظرة عامة
            </TabsTrigger>
            <TabsTrigger value="compliance" className="gap-1.5 text-xs sm:text-sm">
              <Shield className="w-4 h-4" /> رصد الامتثال
            </TabsTrigger>
            <TabsTrigger value="organizations" className="gap-1.5 text-xs sm:text-sm">
              <Building2 className="w-4 h-4" /> المنظمات
            </TabsTrigger>
            <TabsTrigger value="custody" className="gap-1.5 text-xs sm:text-sm">
              <Link2 className="w-4 h-4" /> سلسلة الحيازة
            </TabsTrigger>
            <TabsTrigger value="licenses" className="gap-1.5 text-xs sm:text-sm">
              <FileCheck className="w-4 h-4" /> التراخيص والإفادات
            </TabsTrigger>
            <TabsTrigger value="inspections" className="gap-1.5 text-xs sm:text-sm">
              <ClipboardCheck className="w-4 h-4" /> التفتيش
            </TabsTrigger>
            <TabsTrigger value="violations" className="gap-1.5 text-xs sm:text-sm">
              <AlertTriangle className="w-4 h-4" /> المخالفات
            </TabsTrigger>
            <TabsTrigger value="penalties" className="gap-1.5 text-xs sm:text-sm">
              <Gavel className="w-4 h-4" /> العقوبات
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-1.5 text-xs sm:text-sm">
              <BarChart3 className="w-4 h-4" /> التقارير
            </TabsTrigger>
            <TabsTrigger value="jurisdiction" className="gap-1.5 text-xs sm:text-sm">
              <Scale className="w-4 h-4" /> الاختصاصات
            </TabsTrigger>
            <TabsTrigger value="verify" className="gap-1.5 text-xs sm:text-sm">
              <Search className="w-4 h-4" /> التحقق
            </TabsTrigger>
          </TabsList>

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
  );
};

export default RegulatorDashboardNew;
