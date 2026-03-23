import { lazy, Suspense } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Skeleton } from '@/components/ui/skeleton';

const AdminPlatformPosts = lazy(() => import('@/components/dashboard/admin/AdminPlatformPosts'));

const PlatformPostsManagerPage = () => {
  return (
    <DashboardLayout>
      <div className="p-4 md:p-6">
        <BackButton />
        <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
          <AdminPlatformPosts />
        </Suspense>
      </div>
    </DashboardLayout>
  );
};

export default PlatformPostsManagerPage;
