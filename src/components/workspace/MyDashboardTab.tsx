import { useAuth } from '@/contexts/AuthContext';
import { useMyPermissions } from '@/hooks/useMyPermissions';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Package, DollarSign, Users, Truck, FileText, BarChart3,
  TrendingUp, ArrowUpRight, Loader2, Eye, ChevronLeft,
  MapPin, ShieldCheck, Activity, Calendar,
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface DashboardModule {
  id: string;
  title: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  requiredPermissions: string[];
  path: string;
  statKey: string;
  statLabel: string;
}

const MODULES: DashboardModule[] = [
  {
    id: 'shipments',
    title: 'الشحنات',
    icon: Package,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    requiredPermissions: ['view_shipments', 'create_shipments'],
    path: '/dashboard/shipments',
    statKey: 'shipments',
    statLabel: 'شحنة نشطة',
  },
  {
    id: 'financials',
    title: 'المالية والحسابات',
    icon: DollarSign,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-500/10',
    requiredPermissions: ['view_financials', 'manage_deposits', 'create_invoices'],
    path: '/dashboard/partner-accounts',
    statKey: 'deposits',
    statLabel: 'إيداع هذا الشهر',
  },
  {
    id: 'partners',
    title: 'الشركاء',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
    requiredPermissions: ['view_partner_data', 'manage_partners'],
    path: '/dashboard/partners',
    statKey: 'partners',
    statLabel: 'شريك نشط',
  },
  {
    id: 'drivers',
    title: 'السائقين والأسطول',
    icon: Truck,
    color: 'text-amber-600',
    bgColor: 'bg-amber-500/10',
    requiredPermissions: ['manage_drivers', 'assign_drivers', 'track_vehicles'],
    path: '/dashboard/transporter-drivers',
    statKey: 'drivers',
    statLabel: 'سائق',
  },
  {
    id: 'reports',
    title: 'التقارير',
    icon: BarChart3,
    color: 'text-violet-600',
    bgColor: 'bg-violet-500/10',
    requiredPermissions: ['view_reports', 'export_data'],
    path: '/dashboard/reports',
    statKey: 'reports',
    statLabel: 'تقرير',
  },
  {
    id: 'documents',
    title: 'المستندات',
    icon: FileText,
    color: 'text-rose-600',
    bgColor: 'bg-rose-500/10',
    requiredPermissions: ['sign_documents', 'issue_certificates', 'manage_templates', 'manage_contracts'],
    path: '/dashboard/document-center',
    statKey: 'documents',
    statLabel: 'مستند',
  },
];

const MyDashboardTab = () => {
  const { user, organization } = useAuth();
  const { permissions, isAdmin, isCompanyAdmin } = useMyPermissions();
  const navigate = useNavigate();

  const hasAny = (perms: string[]) => {
    if (isAdmin || isCompanyAdmin) return true;
    if (permissions.includes('full_access')) return true;
    return perms.some(p => permissions.includes(p));
  };

  const availableModules = MODULES.filter(m => hasAny(m.requiredPermissions));

  // Fetch stats for available modules
  const { data: stats = {}, isLoading } = useQuery({
    queryKey: ['my-dashboard-stats', user?.id, organization?.id, availableModules.map(m => m.id).join(',')],
    queryFn: async () => {
      if (!organization?.id) return {};
      const result: Record<string, number> = {};

      if (hasAny(['view_shipments', 'create_shipments'])) {
        const r = await (supabase.from('shipments') as any)
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organization.id)
          .in('status', ['confirmed', 'in_transit', 'pending']);
        result.shipments = r.count || 0;
      }

      if (hasAny(['view_financials', 'manage_deposits'])) {
        const r = await supabase.from('deposits')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organization.id);
        result.deposits = r.count || 0;
      }

      if (hasAny(['view_partner_data', 'manage_partners'])) {
        const r = await (supabase.from('partner_relationships') as any)
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organization.id)
          .eq('status', 'active');
        result.partners = r.count || 0;
      }

      if (hasAny(['manage_drivers'])) {
        const r = await supabase.from('drivers')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organization.id);
        result.drivers = r.count || 0;
      }
      return result;
    },
    enabled: !!organization?.id,
    staleTime: 1000 * 60 * 3,
  });

  // Recent activity
  const { data: recentActivity = [] } = useQuery({
    queryKey: ['my-dashboard-activity', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('activity_logs')
        .select('id, action, action_type, created_at, resource_type')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (availableModules.length === 0) {
    return (
      <Card className="border-border/30">
        <CardContent className="p-10 text-center">
          <ShieldCheck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="font-bold text-lg mb-1">لا توجد صلاحيات مفعّلة</h3>
          <p className="text-sm text-muted-foreground">تواصل مع مدير المنظمة لتفعيل الوصول للأقسام المطلوبة</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Module Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {availableModules.map((mod, i) => (
          <motion.div
            key={mod.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Card
              className="border-border/30 hover:border-primary/20 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => navigate(mod.path)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl ${mod.bgColor} flex items-center justify-center`}>
                    <mod.icon className={`w-5 h-5 ${mod.color}`} />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-sm font-bold">{mod.title}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xl font-bold">{stats[mod.statKey] ?? '—'}</span>
                  <span className="text-[10px] text-muted-foreground">{mod.statLabel}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="border-primary/10">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-primary" />
            إجراءات سريعة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {hasAny(['create_shipments']) && (
              <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={() => navigate('/dashboard/shipments/new')}>
                <Package className="w-3.5 h-3.5" /> شحنة جديدة
              </Button>
            )}
            {hasAny(['manage_deposits']) && (
              <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={() => navigate('/dashboard/partner-accounts')}>
                <DollarSign className="w-3.5 h-3.5" /> إيداع جديد
              </Button>
            )}
            {hasAny(['track_vehicles']) && (
              <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={() => navigate('/dashboard/tracking-center')}>
                <MapPin className="w-3.5 h-3.5" /> مركز التتبع
              </Button>
            )}
            {hasAny(['view_reports']) && (
              <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={() => navigate('/dashboard/reports')}>
                <BarChart3 className="w-3.5 h-3.5" /> التقارير
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <Card className="border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="w-4 h-4 text-primary" />
              آخر نشاطاتك
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentActivity.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 border border-border/20"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{a.action}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(a.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {a.resource_type && (
                  <Badge variant="outline" className="text-[9px] shrink-0">{a.resource_type}</Badge>
                )}
              </motion.div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MyDashboardTab;
