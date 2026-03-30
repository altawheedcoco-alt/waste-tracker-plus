import { lazy, Suspense, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMyPermissions } from '@/hooks/useMyPermissions';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import V2TabsNav, { TabItem } from '@/components/dashboard/shared/V2TabsNav';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  User, ListTodo, ShieldCheck, Trophy, Bell,
  Building2, Clock, Package, Zap, CalendarDays, LayoutDashboard, Settings, LogOut,
  Gauge, Cog, Calendar, FileText, BarChart3,
} from 'lucide-react';
import TabFallback from '@/components/dashboard/shared/TabFallback';

const MyProfileTab = lazy(() => import('@/components/workspace/MyProfileTab'));
const MyTasksTab = lazy(() => import('@/components/workspace/MyTasksTab'));
const MyPermissionsTab = lazy(() => import('@/components/workspace/MyPermissionsTab'));
const MyAchievementsTab = lazy(() => import('@/components/workspace/MyAchievementsTab'));
const MyNotificationsTab = lazy(() => import('@/components/workspace/MyNotificationsTab'));
const MyDashboardTab = lazy(() => import('@/components/workspace/MyDashboardTab'));
const MySettingsTab = lazy(() => import('@/components/workspace/MySettingsTab'));
const MyCalendarTab = lazy(() => import('@/components/workspace/MyCalendarTab'));
const MyDocumentsTab = lazy(() => import('@/components/workspace/MyDocumentsTab'));
const MyStatsTab = lazy(() => import('@/components/workspace/MyStatsTab'));

const TABS: TabItem[] = [
  { value: 'dashboard', label: 'لوحة التحكم', icon: Gauge },
  { value: 'overview', label: 'ملفي', icon: User },
  { value: 'stats', label: 'الإحصائيات', icon: BarChart3 },
  { value: 'tasks', label: 'مهامي', icon: ListTodo },
  { value: 'calendar', label: 'التقويم', icon: Calendar },
  { value: 'documents', label: 'المستندات', icon: FileText },
  { value: 'permissions', label: 'صلاحياتي', icon: ShieldCheck },
  { value: 'achievements', label: 'إنجازاتي', icon: Trophy },
  { value: 'notifications', label: 'إشعاراتي', icon: Bell },
  { value: 'settings', label: 'الإعدادات', icon: Cog },
];

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

const MyWorkspace = () => {
  const { profile, organization, user, signOut } = useAuth();
  const { permissions, isLoading: permsLoading } = useMyPermissions();
  const [activeTab, setActiveTab] = useState('dashboard');
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    toast.success('تم تسجيل الخروج بنجاح');
    navigate('/auth', { replace: true });
  };

  const orgType = (organization?.organization_type as string) || '';
  const initials = (profile?.full_name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2);

  // Quick stats for header
  const { data: quickStats } = useQuery({
    queryKey: ['workspace-quick-stats', user?.id, organization?.id],
    queryFn: async () => {
      if (!user?.id || !organization?.id) return { unread: 0, shipments: 0 };
      const [notifRes, shipRes] = await Promise.all([
        supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false),
        (supabase.from('shipments') as any).select('id', { count: 'exact', head: true }).eq('organization_id', organization.id).in('status', ['confirmed', 'in_transit']),
      ]);
      return { unread: notifRes.count || 0, shipments: shipRes.count || 0 };
    },
    enabled: !!user?.id && !!organization?.id,
    staleTime: 1000 * 60,
  });

  // Position
  const { data: position } = useQuery({
    queryKey: ['my-position-header', profile?.id],
    queryFn: async () => {
      if (!profile?.user_id) return null;
      const { data } = await supabase.from('organization_positions').select('title_ar, title, level, operator_type, dashboard_mode').eq('assigned_user_id', profile.user_id).maybeSingle();
      return data;
    },
    enabled: !!profile?.user_id,
    staleTime: 1000 * 60 * 10,
  });

  if (permsLoading) {
    return <TabFallback />;
  }

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'صباح الخير' : hour < 17 ? 'مساء الخير' : 'مساء النور';

  return (
    <div className="space-y-6" dir="rtl">
      {/* ─── Hero Header ─── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-bl from-primary/5 via-card to-muted/30 p-5 sm:p-6"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Avatar */}
          <Avatar className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-primary/20 shadow-lg">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="text-xl sm:text-2xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">{greeting} 👋</p>
            <h1 className="text-xl sm:text-2xl font-bold truncate">{profile?.full_name || 'عضو'}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              {position?.title_ar && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <User className="w-3 h-3" />
                  {position.title_ar}
                </Badge>
              )}
              <Badge variant="outline" className="gap-1 text-xs border-primary/20">
                <Building2 className="w-3 h-3" />
                {organization?.name} • {orgTypeLabels[orgType] || orgType}
              </Badge>
              {position?.operator_type === 'ai' && (
                <Badge className="bg-accent text-accent-foreground text-xs">🤖 AI</Badge>
              )}
            </div>
            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs h-8 hover:bg-primary/5 hover:border-primary/30"
                onClick={() => navigate('/dashboard/my-profile')}
              >
                <User className="w-3.5 h-3.5" />
                صفحتي الشخصية
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs h-8 hover:bg-primary/5 hover:border-primary/30"
                onClick={() => navigate('/dashboard')}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                لوحة التحكم
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs h-8 hover:bg-primary/5 hover:border-primary/30"
                onClick={() => navigate('/dashboard/settings')}
              >
                <Settings className="w-3.5 h-3.5" />
                الإعدادات
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs h-8 text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                onClick={handleLogout}
              >
                <LogOut className="w-3.5 h-3.5" />
                تسجيل الخروج
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-3 sm:gap-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <p className="text-lg font-bold mt-1">{quickStats?.shipments || 0}</p>
              <p className="text-[10px] text-muted-foreground">شحنات نشطة</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mx-auto">
                <Bell className="w-5 h-5 text-destructive" />
              </div>
              <p className="text-lg font-bold mt-1">{quickStats?.unread || 0}</p>
              <p className="text-[10px] text-muted-foreground">غير مقروء</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mx-auto">
                <ShieldCheck className="w-5 h-5 text-secondary-foreground" />
              </div>
              <p className="text-lg font-bold mt-1">{permissions.length}</p>
              <p className="text-[10px] text-muted-foreground">صلاحية</p>
            </div>
          </div>
        </div>

        {/* Time */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-3 pt-3 border-t border-border/20">
          <Clock className="w-3 h-3" />
          <span>{now.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          <span className="mx-1">•</span>
          <CalendarDays className="w-3 h-3" />
          <span>{now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </motion.div>

      {/* ─── Tabs ─── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
        <V2TabsNav tabs={TABS} />

        <TabsContent value="dashboard" className="mt-4">
          <Suspense fallback={<TabFallback />}>
            <MyDashboardTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="overview" className="mt-4">
          <Suspense fallback={<TabFallback />}>
            <MyProfileTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="stats" className="mt-4">
          <Suspense fallback={<TabFallback />}>
            <MyStatsTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="tasks" className="mt-4">
          <Suspense fallback={<TabFallback />}>
            <MyTasksTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <Suspense fallback={<TabFallback />}>
            <MyCalendarTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <Suspense fallback={<TabFallback />}>
            <MyDocumentsTab />
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

        <TabsContent value="settings" className="mt-4">
          <Suspense fallback={<TabFallback />}>
            <MySettingsTab />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyWorkspace;
