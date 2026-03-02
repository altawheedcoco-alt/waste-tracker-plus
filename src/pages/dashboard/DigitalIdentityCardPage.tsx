import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

const DigitalIdentityCard = lazy(() => import('@/components/dashboard/shared/DigitalIdentityCard'));

const DigitalIdentityCardPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6" dir="rtl">
        <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
          <DigitalIdentityCard />
        </Suspense>
      </div>
    </DashboardLayout>
  );
};

export default DigitalIdentityCardPage;
