import { lazy, Suspense, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMyPermissions } from '@/hooks/useMyPermissions';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import V2TabsNav, { TabItem } from '@/components/dashboard/shared/V2TabsNav';
import DashboardV2Header from '@/components/dashboard/shared/DashboardV2Header';
import { User, ListTodo, ShieldCheck, Trophy, Bell, Loader2 } from 'lucide-react';

const MyProfileTab = lazy(() => import('@/components/workspace/MyProfileTab'));
const MyTasksTab = lazy(() => import('@/components/workspace/MyTasksTab'));
const MyPermissionsTab = lazy(() => import('@/components/workspace/MyPermissionsTab'));
const MyAchievementsTab = lazy(() => import('@/components/workspace/MyAchievementsTab'));
const MyNotificationsTab = lazy(() => import('@/components/workspace/MyNotificationsTab'));

const TabFallback = () => (
  <div className="flex items-center justify-center py-16">
    <Loader2 className="w-6 h-6 text-primary animate-spin" />
  </div>
);

const TABS: TabItem[] = [
  { value: 'profile', label: 'ملفي', icon: User },
  { value: 'tasks', label: 'مهامي', icon: ListTodo },
  { value: 'permissions', label: 'صلاحياتي', icon: ShieldCheck },
  { value: 'achievements', label: 'إنجازاتي', icon: Trophy },
  { value: 'notifications', label: 'إشعاراتي', icon: Bell },
];

const MyWorkspace = () => {
  const { profile, organization } = useAuth();
  const { permissions, isLoading } = useMyPermissions();
  const [activeTab, setActiveTab] = useState('profile');

  const orgType = (organization?.organization_type as string) || '';
  const orgTypeLabels: Record<string, string> = {
    generator: 'مُولّد نفايات',
    transporter: 'شركة نقل',
    recycler: 'شركة تدوير',
    disposal: 'جهة تخلص نهائي',
    transport_office: 'مكتب نقل',
    consultant: 'استشاري بيئي',
    consulting_office: 'مكتب استشاري',
    iso_body: 'جهة أيزو',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <DashboardV2Header
        userName={profile?.full_name || 'عضو'}
        orgName={organization?.name || ''}
        orgLabel={orgTypeLabels[orgType] || 'عضو'}
        icon={User}
        gradient="from-indigo-600 to-purple-600"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
        <V2TabsNav tabs={TABS} />

        <TabsContent value="profile" className="mt-4">
          <Suspense fallback={<TabFallback />}>
            <MyProfileTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="tasks" className="mt-4">
          <Suspense fallback={<TabFallback />}>
            <MyTasksTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="permissions" className="mt-4">
          <Suspense fallback={<TabFallback />}>
            <MyPermissionsTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="achievements" className="mt-4">
          <Suspense fallback={<TabFallback />}>
            <MyAchievementsTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Suspense fallback={<TabFallback />}>
            <MyNotificationsTab />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyWorkspace;
