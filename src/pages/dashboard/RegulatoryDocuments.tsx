import DashboardLayout from '@/components/dashboard/DashboardLayout';
import RegulatoryDocumentsCenter from '@/components/regulatory/RegulatoryDocumentsCenter';
import BackButton from '@/components/ui/back-button';

const RegulatoryDocuments = () => {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 px-4">
        <BackButton />
      <RegulatoryDocumentsCenter />
    </div>
      </DashboardLayout>
  );
};

export default RegulatoryDocuments;
