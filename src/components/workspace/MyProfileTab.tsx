import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, Building2, Briefcase, Shield, ExternalLink, Fingerprint, IdCard } from 'lucide-react';
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

const MyProfileTab = () => {
  const { profile, organization, user } = useAuth();
  const { hasPermission, permissions } = useMyPermissions();
  const navigate = useNavigate();

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

  // Get recent activity count
  const { data: activityCount } = useQuery({
    queryKey: ['my-activity-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count } = await supabase
        .from('activity_logs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      return count || 0;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  const levelLabels: Record<number, string> = {
    4: 'رئيس الجهة',
    3: 'مساعد',
    2: 'وكيل',
    1: 'مفوض',
    0: 'عضو',
  };

  const infoItems = [
    { icon: Mail, label: 'البريد الإلكتروني', value: user?.email },
    { icon: Phone, label: 'الهاتف', value: profile?.phone },
    { icon: Building2, label: 'المنظمة', value: organization?.name },
    { icon: Briefcase, label: 'المنصب', value: position?.title_ar || position?.title },
    { icon: Shield, label: 'المستوى الوظيفي', value: position?.level != null ? levelLabels[position.level] || `مستوى ${position.level}` : undefined },
    { icon: IdCard, label: 'عدد الصلاحيات', value: `${permissions.length} صلاحية` },
  ].filter(item => item.value);

  const availableLinks = quickLinks.filter(l => hasPermission(l.permission));

  return (
    <div className="space-y-6">
      {/* Info Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {infoItems.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="border-border/30 hover:border-primary/20 transition-colors h-full">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-semibold truncate">{item.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      {availableLinks.length > 0 && (
        <Card className="border-primary/10">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Fingerprint className="w-5 h-5 text-primary" />
              الوصول السريع — حسب صلاحياتك
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availableLinks.map((link, i) => (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 h-11 text-sm hover:bg-primary/5 hover:border-primary/30"
                    onClick={() => navigate(link.path)}
                  >
                    <ExternalLink className="w-4 h-4 text-primary shrink-0" />
                    {link.label}
                  </Button>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Summary */}
      <Card className="border-border/30">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">إجمالي الإجراءات المسجلة</p>
              <p className="text-3xl font-bold mt-1">{activityCount || 0}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <User className="w-7 h-7 text-primary-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyProfileTab;
