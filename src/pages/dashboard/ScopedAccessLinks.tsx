import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import ScopedLinksManager from '@/components/scoped-links/ScopedLinksManager';

const ScopedAccessLinks = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <BackButton />
        <div>
          <h1 className="text-2xl font-bold">روابط الوصول المحدد</h1>
          <p className="text-muted-foreground">
            أنشئ روابط خارجية مخصصة تتيح لأشخاص محددين رؤية شحنات وإيداعات وكشف حساب بين جهات محددة فقط
          </p>
        </div>
        <ScopedLinksManager />
      </div>
    </DashboardLayout>
  );
};

export default ScopedAccessLinks;
