import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import ComplianceHub from '@/components/compliance/ComplianceHub';
import { Shield } from 'lucide-react';

const ComplianceAnalysisPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-4 p-4 md:p-6">
        <BackButton />
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            مركز تحليل الامتثال
          </h1>
          <p className="text-xs text-muted-foreground">تقارير استشارية غير ملزمة — تحليل معايير وذكاء اصطناعي</p>
        </div>
        <ComplianceHub />
      </div>
    </DashboardLayout>
  );
};

export default ComplianceAnalysisPage;
