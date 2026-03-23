import { lazy, Suspense, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, BarChart3 } from 'lucide-react';

const AdminPlatformPosts = lazy(() => import('@/components/dashboard/admin/AdminPlatformPosts'));
const AdminPostAnalytics = lazy(() => import('@/components/dashboard/admin/AdminPostAnalytics'));

const PlatformPostsManagerPage = () => {
  return (
    <DashboardLayout>
      <div className="p-4 md:p-6" dir="rtl">
        <BackButton />
        <Tabs defaultValue="posts" className="mt-2">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="posts" className="gap-2">
              <FileText className="w-4 h-4" />
              إدارة المنشورات
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              إحصائيات المشاهدات
            </TabsTrigger>
          </TabsList>
          <TabsContent value="posts">
            <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
              <AdminPlatformPosts />
            </Suspense>
          </TabsContent>
          <TabsContent value="analytics">
            <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
              <AdminPostAnalytics />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default PlatformPostsManagerPage;
