import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User, Mail, Phone, Building2, Briefcase, Shield, ExternalLink,
  Fingerprint, IdCard, Calendar, Clock, Activity, TrendingUp,
  MapPin, Hash, Globe, Award,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMyPermissions } from '@/hooks/useMyPermissions';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const quickLinks = [
  { label: 'الشحنات', path: '/dashboard/shipments', permission: 'view_shipments' as const },
  { label: 'الشركاء', path: '/dashboard/partners', permission: 'view_partners' as const },
  { label: 'التقارير', path: '/dashboard/reports', permission: 'view_reports' as const },
  { label: 'الحسابات', path: '/dashboard/partner-accounts', permission: 'view_accounts' as const },
  { label: 'السائقين', path: '/dashboard/transporter-drivers', permission: 'view_drivers' as const },
  { label: 'الإعدادات', path: '/dashboard/settings', permission: 'view_settings' as const },
];

const orgTypeLabels: Record<string, string> = {
  generator: 'مُولّد نفايات',
  transporter: 'شركة نقل',
  recycler: 'شركة تدوير',
  disposal: 'جهة تخلص نهائي',
  transport_office: 'مكتب نقل',
  consultant: 'استشاري بيئي',
};

const MyProfileTab = () => {
  const { profile, organization, user } = useAuth();
  const { hasPermission, permissions, isAdmin, isCompanyAdmin } = useMyPermissions();
  const navigate = useNavigate();

  const initials = (profile?.full_name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2);

  // Get position
  const { data: position } = useQuery({
    queryKey: ['my-position', profile?.id],
    queryFn: async () => {
      if (!profile?.user_id) return null;
      const { data } = await supabase
        .from('organization_positions')
        .select('title, title_ar, level, operator_type')
        .eq('assigned_user_id', profile.user_id)
        .maybeSingle();
      return data;
    },
    enabled: !!profile?.user_id,
    staleTime: 1000 * 60 * 10,
  });

  // Activity stats
  const { data: activityStats } = useQuery({
    queryKey: ['my-activity-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return { total: 0, thisMonth: 0, thisWeek: 0, joinDate: '' };
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const weekStart = new Date(now.getTime() - 7 * 86400000).toISOString();

      const [totalRes, monthRes, weekRes] = await Promise.all([
        supabase.from('activity_logs').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('activity_logs').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', monthStart),
        supabase.from('activity_logs').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', weekStart),
      ]);

      return {
        total: totalRes.count || 0,
        thisMonth: monthRes.count || 0,
        thisWeek: weekRes.count || 0,
        joinDate: user.created_at || '',
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  // Weekly activity heatmap (last 7 days)
  const { data: weeklyActivity = [] } = useQuery({
    queryKey: ['my-weekly-heatmap', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
        const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).toISOString();
        const { count } = await supabase.from('activity_logs').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', dayStart).lt('created_at', dayEnd);
        days.push({
          day: date.toLocaleDateString('ar-EG', { weekday: 'short' }),
          count: count || 0,
        });
      }
      return days;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 10,
  });

  const levelLabels: Record<number, string> = { 4: 'رئيس الجهة', 3: 'مساعد', 2: 'وكيل', 1: 'مفوض', 0: 'عضو' };
  const roleLabel = isAdmin ? 'مدير النظام' : isCompanyAdmin ? 'مدير المنظمة' : position?.title_ar || 'عضو';

  const maxHeatmap = Math.max(...weeklyActivity.map(d => d.count), 1);

  const joinDate = activityStats?.joinDate ? new Date(activityStats.joinDate) : null;
  const daysSinceJoin = joinDate ? Math.floor((Date.now() - joinDate.getTime()) / 86400000) : 0;

  const availableLinks = quickLinks.filter(l => hasPermission(l.permission));

  return (
    <div className="space-y-5">
      {/* ─── Profile Hero Card ─── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-primary/10 bg-gradient-to-bl from-primary/5 via-card to-muted/20 overflow-hidden">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <Avatar className="w-24 h-24 border-4 border-primary/20 shadow-xl">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-right">
                <h2 className="text-2xl font-bold">{profile?.full_name || 'عضو'}</h2>
                <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                  <Badge className="bg-primary/10 text-primary border-primary/20 gap-1">
                    <Shield className="w-3 h-3" />
                    {roleLabel}
                  </Badge>
                  <Badge variant="outline" className="gap-1 border-border/50">
                    <Building2 className="w-3 h-3" />
                    {organization?.name}
                  </Badge>
                  {organization?.organization_type && (
                    <Badge variant="secondary" className="text-[10px]">
                      {orgTypeLabels[organization.organization_type as string] || organization.organization_type}
                    </Badge>
                  )}
                </div>
              </div>
              {/* Activity Summary Mini */}
              <div className="flex gap-4 sm:gap-6">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto shadow-lg">
                    <Activity className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <p className="text-lg font-bold mt-1.5">{activityStats?.total || 0}</p>
                  <p className="text-[10px] text-muted-foreground">إجمالي الإجراءات</p>
                </div>
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mx-auto">
                    <Calendar className="w-6 h-6 text-secondary-foreground" />
                  </div>
                  <p className="text-lg font-bold mt-1.5">{daysSinceJoin}</p>
                  <p className="text-[10px] text-muted-foreground">يوم منذ الانضمام</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Activity Stats Row ─── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'هذا الأسبوع', value: activityStats?.thisWeek || 0, icon: TrendingUp, color: 'from-primary/10 to-primary/5' },
          { label: 'هذا الشهر', value: activityStats?.thisMonth || 0, icon: Calendar, color: 'from-secondary/50 to-secondary/20' },
          { label: 'الصلاحيات', value: permissions.length, icon: IdCard, color: 'from-accent/20 to-accent/5' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
            <Card className="border-border/30">
              <CardContent className={`p-4 bg-gradient-to-br ${stat.color} rounded-xl`}>
                <stat.icon className="w-5 h-5 text-primary mb-2" />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ─── Weekly Heatmap ─── */}
      {weeklyActivity.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="border-border/30">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Fingerprint className="w-4 h-4 text-primary" />
                خريطة النشاط — آخر 7 أيام
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 justify-between h-24">
                {weeklyActivity.map((day, i) => {
                  const height = day.count > 0 ? Math.max((day.count / maxHeatmap) * 100, 12) : 4;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] font-bold text-foreground">{day.count}</span>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ duration: 0.6, delay: 0.3 + i * 0.08 }}
                        className={`w-full rounded-t-md transition-colors ${
                          day.count === 0 ? 'bg-muted' :
                          day.count <= 3 ? 'bg-primary/25' :
                          day.count <= 8 ? 'bg-primary/50' :
                          'bg-primary'
                        }`}
                      />
                      <span className="text-[9px] text-muted-foreground">{day.day}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ─── Info Grid ─── */}
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { icon: Mail, label: 'البريد الإلكتروني', value: user?.email },
          { icon: Phone, label: 'الهاتف', value: profile?.phone },
          { icon: Building2, label: 'المنظمة', value: organization?.name },
          { icon: Briefcase, label: 'المنصب', value: position?.title_ar || position?.title },
          { icon: Shield, label: 'المستوى الوظيفي', value: position?.level != null ? levelLabels[position.level] || `مستوى ${position.level}` : undefined },
          { icon: Clock, label: 'تاريخ الانضمام', value: joinDate ? joinDate.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : undefined },
        ].filter(item => item.value).map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 + i * 0.04 }}
          >
            <Card className="border-border/30 hover:border-primary/20 transition-colors h-full">
              <CardContent className="p-3.5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-semibold truncate">{item.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ─── Quick Access ─── */}
      {availableLinks.length > 0 && (
        <Card className="border-primary/10">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Award className="w-4 h-4 text-primary" />
              الوصول السريع — حسب صلاحياتك
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availableLinks.map((link, i) => (
                <motion.div key={link.path} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 + i * 0.04 }}>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 h-10 text-xs hover:bg-primary/5 hover:border-primary/30"
                    onClick={() => navigate(link.path)}
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-primary shrink-0" />
                    {link.label}
                  </Button>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MyProfileTab;
