import DashboardLayout from '@/components/dashboard/DashboardLayout';
import RegulatoryDocumentsCenter from '@/components/regulatory/RegulatoryDocumentsCenter';

const RegulatoryDocuments = () => {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 px-4">
      <RegulatoryDocumentsCenter />
    </div>
  );
};

export default RegulatoryDocuments;
