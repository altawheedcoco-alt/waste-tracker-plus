import React, { Suspense } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Skeleton } from '@/components/ui/skeleton';

const LevelProgressCard = React.lazy(() => import('@/components/gamification/LevelProgressCard'));
const AchievementsGrid = React.lazy(() => import('@/components/gamification/AchievementsGrid'));
const PersonalStatsCard = React.lazy(() => import('@/components/gamification/PersonalStatsCard'));
const UserPublicProfile = React.lazy(() => import('@/components/gamification/UserPublicProfile'));
const Leaderboard = React.lazy(() => import('@/components/gamification/Leaderboard'));

const Fallback = () => <Skeleton className="h-48 w-full rounded-xl" />;

const GamificationPage = () => (
  <DashboardLayout>
    <div className="space-y-6 p-4 md:p-6" dir="rtl">
      <div className="flex items-center gap-3">
        <BackButton />
        <div>
          <h1 className="text-2xl font-bold">ملفي الشخصي والإنجازات</h1>
          <p className="text-sm text-muted-foreground">تابع تقدمك وإنجازاتك في المنصة</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Suspense fallback={<Fallback />}>
            <LevelProgressCard />
          </Suspense>
          <Suspense fallback={<Fallback />}>
            <AchievementsGrid />
          </Suspense>
          <Suspense fallback={<Fallback />}>
            <Leaderboard />
          </Suspense>
        </div>
        <div className="space-y-6">
          <Suspense fallback={<Fallback />}>
            <UserPublicProfile />
          </Suspense>
          <Suspense fallback={<Fallback />}>
            <PersonalStatsCard />
          </Suspense>
        </div>
      </div>
    </div>
  </DashboardLayout>
);

export default GamificationPage;
