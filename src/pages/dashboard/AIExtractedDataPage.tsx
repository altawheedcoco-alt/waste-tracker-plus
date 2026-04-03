import DashboardLayout from '@/components/dashboard/DashboardLayout';
import AIExtractedDataViewer from '@/components/settings/AIExtractedDataViewer';

const AIExtractedDataPage = () => {
  return (
    <DashboardLayout>
      <div className="p-4 space-y-4 max-w-4xl mx-auto">
      <AIExtractedDataViewer />
    </div>
  );
};

export default AIExtractedDataPage;
