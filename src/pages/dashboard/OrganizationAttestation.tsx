import DashboardLayout from '@/components/dashboard/DashboardLayout';
import AttestationTabContent from '@/components/attestation/AttestationTabContent';
import { useAuth } from '@/contexts/AuthContext';

const OrganizationAttestation = () => {
  const { organization } = useAuth();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="text-right">
          <h1 className="text-2xl font-bold">إفادة التسجيل والاعتماد الرقمي</h1>
          <p className="text-muted-foreground text-sm">
            وثيقة رسمية تفيد بتسجيل الجهة على المنصة والتزامها بالشروط والأحكام
          </p>
        </div>
        {organization?.id ? (
          <AttestationTabContent organizationId={organization.id} />
        ) : (
          <p className="text-muted-foreground text-center py-8">يرجى اختيار منظمة أولاً</p>
        )}
      </div>
    </DashboardLayout>
  );
};

export default OrganizationAttestation;
