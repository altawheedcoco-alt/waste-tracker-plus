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
  TrendingUp, ArrowUpRight, Loader2, Eye, MapPin, ShieldCheck,
  Activity, Calendar, Zap, Clock, CheckCircle2, AlertTriangle,
  Target, Flame, ArrowRight, Sparkles, Timer, CircleDot,
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface DashboardModule {
  id: string;
  title: string;
  icon: LucideIcon;
  requiredPermissions: string[];
  path: string;
  statKey: string;
  statLabel: string;
}

const MODULES: DashboardModule[] = [
  { id: 'shipments', title: 'الشحنات', icon: Package, requiredPermissions: ['view_shipments', 'create_shipments'], path: '/dashboard/shipments', statKey: 'shipments', statLabel: 'شحنة نشطة' },
  { id: 'financials', title: 'المالية', icon: DollarSign, requiredPermissions: ['view_financials', 'manage_deposits', 'create_invoices'], path: '/dashboard/partner-accounts', statKey: 'deposits', statLabel: 'إيداع' },
  { id: 'partners', title: 'الشركاء', icon: Users, requiredPermissions: ['view_partner_data', 'manage_partners'], path: '/dashboard/partners', statKey: 'partners', statLabel: 'شريك نشط' },
  { id: 'drivers', title: 'الأسطول', icon: Truck, requiredPermissions: ['manage_drivers', 'assign_drivers', 'track_vehicles'], path: '/dashboard/transporter-drivers', statKey: 'drivers', statLabel: 'سائق' },
  { id: 'reports', title: 'التقارير', icon: BarChart3, requiredPermissions: ['view_reports', 'export_data'], path: '/dashboard/reports', statKey: 'reports', statLabel: 'تقرير' },
  { id: 'documents', title: 'المستندات', icon: FileText, requiredPermissions: ['sign_documents', 'issue_certificates', 'manage_templates', 'manage_contracts'], path: '/dashboard/document-center', statKey: 'documents', statLabel: 'مستند' },
];

// Circular progress ring component
const ProgressRing = ({ value, size = 80, strokeWidth = 6, color = 'hsl(var(--primary))' }: { value: number; size?: number; strokeWidth?: number; color?: string }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeLinecap="round" strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />
    </svg>
  );
};

const MyDashboardTab = () => {
  const { user, organization, profile } = useAuth();
  const { permissions, isAdmin, isCompanyAdmin } = useMyPermissions();
  const navigate = useNavigate();

  const hasAny = (perms: string[]) => {
    if (isAdmin || isCompanyAdmin) return true;
    if (permissions.includes('full_access')) return true;
    return perms.some(p => permissions.includes(p));
  };

  const availableModules = MODULES.filter(m => hasAny(m.requiredPermissions));

  // Fetch comprehensive stats
  const { data: stats = {} as any, isLoading } = useQuery({
    queryKey: ['my-dashboard-stats-v2', user?.id, organization?.id],
    queryFn: async () => {
      if (!organization?.id || !user?.id) return {};
      const result: Record<string, number> = {};
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const weekStart = new Date(now.getTime() - 7 * 86400000).toISOString();

      const promises: Promise<any>[] = [];

      // Shipments
      if (hasAny(['view_shipments', 'create_shipments'])) {
        promises.push(
          (supabase.from('shipments') as any).select('id', { count: 'exact', head: true }).eq('organization_id', organization.id).in('status', ['confirmed', 'in_transit', 'pending']).then((r: any) => { result.shipments = r.count || 0; }),
          (supabase.from('shipments') as any).select('id', { count: 'exact', head: true }).eq('organization_id', organization.id).eq('status', 'delivered').gte('created_at', monthStart).then((r: any) => { result.delivered_month = r.count || 0; }),
        );
      }

      // Deposits
      if (hasAny(['view_financials', 'manage_deposits'])) {
        promises.push(
          supabase.from('deposits').select('id', { count: 'exact', head: true }).eq('organization_id', organization.id).then((r: any) => { result.deposits = r.count || 0; }),
        );
      }

      // Partners
      if (hasAny(['view_partner_data', 'manage_partners'])) {
        promises.push(
          (supabase as any).from('partner_relationships').select('id', { count: 'exact', head: true }).eq('organization_id', organization.id).eq('status', 'active').then((r: any) => { result.partners = r.count || 0; }),
        );
      }

      // Drivers
      if (hasAny(['manage_drivers'])) {
        promises.push(
          supabase.from('drivers').select('id', { count: 'exact', head: true }).eq('organization_id', organization.id).then((r: any) => { result.drivers = r.count || 0; }),
        );
      }

      // Activity this week
      promises.push(
        supabase.from('activity_logs').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', weekStart).then((r: any) => { result.week_actions = r.count || 0; }),
        supabase.from('activity_logs').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', monthStart).then((r: any) => { result.month_actions = r.count || 0; }),
      );

      // Unread notifications
      promises.push(
        supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false).then((r: any) => { result.unread_notifs = r.count || 0; }),
      );

      await Promise.all(promises);
      return result;
    },
    enabled: !!organization?.id && !!user?.id,
    staleTime: 1000 * 60 * 2,
  });

  // Recent activity
  const { data: recentActivity = [] } = useQuery({
    queryKey: ['my-dashboard-activity-v2', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('activity_logs')
        .select('id, action, action_type, created_at, resource_type')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(8);
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2,
  });

  // Pending approvals / urgent items
  const { data: urgentItems = [] } = useQuery({
    queryKey: ['my-urgent-items', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('notifications')
        .select('id, title, message, priority, type, created_at')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .in('priority', ['urgent', 'high'])
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  // Calculate productivity score
  const weekActions = stats.week_actions || 0;
  const productivityScore = Math.min(Math.round((weekActions / 30) * 100), 100);
  const deliveredMonth = stats.delivered_month || 0;

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

  const actionIcons: Record<string, LucideIcon> = {
    shipment: Package, deposit: DollarSign, driver: Truck, partner: Users, document: FileText,
  };

  return (
    <div className="space-y-5">
      {/* ─── KPI Hero Strip ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Productivity Score */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-border/30 bg-gradient-to-br from-primary/5 to-card overflow-hidden">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="relative">
                <ProgressRing value={productivityScore} size={64} strokeWidth={5} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold">{productivityScore}%</span>
                </div>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">معدل الإنتاجية</p>
                <p className="text-lg font-bold">{weekActions}</p>
                <p className="text-[10px] text-muted-foreground">إجراء هذا الأسبوع</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Delivered this month */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-border/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-accent-foreground" />
                </div>
                <TrendingUp className="w-4 h-4 text-accent-foreground" />
              </div>
              <p className="text-2xl font-bold">{deliveredMonth}</p>
              <p className="text-[11px] text-muted-foreground">شحنة مكتملة هذا الشهر</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Active tasks */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-border/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Timer className="w-5 h-5 text-secondary-foreground" />
                </div>
                <span className="text-[10px] text-muted-foreground">{stats.month_actions || 0} هذا الشهر</span>
              </div>
              <p className="text-2xl font-bold">{stats.shipments || 0}</p>
              <p className="text-[11px] text-muted-foreground">شحنات نشطة الآن</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Urgent */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className={`border-border/30 ${urgentItems.length > 0 ? 'border-destructive/30 bg-destructive/5' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${urgentItems.length > 0 ? 'bg-destructive/15' : 'bg-muted'}`}>
                  <AlertTriangle className={`w-5 h-5 ${urgentItems.length > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
                </div>
                {urgentItems.length > 0 && <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" /><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive" /></span>}
              </div>
              <p className="text-2xl font-bold">{urgentItems.length}</p>
              <p className="text-[11px] text-muted-foreground">تنبيهات عاجلة</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ─── Urgent Alerts Bar ─── */}
      {urgentItems.length > 0 && (
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          <Card className="border-destructive/20 bg-gradient-to-l from-destructive/5 to-card">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-4 h-4 text-destructive" />
                <span className="text-sm font-bold text-destructive">يتطلب انتباهك الآن</span>
              </div>
              <div className="space-y-1.5">
                {urgentItems.map(item => (
                  <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg bg-card/80 border border-destructive/10">
                    <CircleDot className="w-3.5 h-3.5 text-destructive shrink-0" />
                    <p className="text-xs font-medium truncate flex-1">{item.title}</p>
                    <Badge variant="outline" className="text-[9px] border-destructive/20 text-destructive shrink-0">{item.type || 'عاجل'}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ─── Module Cards Grid ─── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold">أقسامك المتاحة</h3>
          <Badge variant="secondary" className="text-[10px]">{availableModules.length} قسم</Badge>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {availableModules.map((mod, i) => (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
            >
              <Card
                className="border-border/30 hover:border-primary/30 hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden"
                onClick={() => navigate(mod.path)}
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/60 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <mod.icon className="w-5 h-5 text-primary" />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0 translate-x-1" />
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
      </div>

      {/* ─── Quick Actions + Activity Side by Side ─── */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Quick Actions */}
        <Card className="border-primary/10 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4 text-primary" />
              إجراءات سريعة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {hasAny(['create_shipments']) && (
              <Button variant="outline" className="w-full justify-start gap-2 text-xs h-10 hover:bg-primary/5 hover:border-primary/30" onClick={() => navigate('/dashboard/shipments/new')}>
                <Package className="w-4 h-4 text-primary" /> إنشاء شحنة جديدة
              </Button>
            )}
            {hasAny(['manage_deposits']) && (
              <Button variant="outline" className="w-full justify-start gap-2 text-xs h-10 hover:bg-primary/5 hover:border-primary/30" onClick={() => navigate('/dashboard/partner-accounts')}>
                <DollarSign className="w-4 h-4 text-primary" /> إضافة إيداع جديد
              </Button>
            )}
            {hasAny(['track_vehicles']) && (
              <Button variant="outline" className="w-full justify-start gap-2 text-xs h-10 hover:bg-primary/5 hover:border-primary/30" onClick={() => navigate('/dashboard/tracking-center')}>
                <MapPin className="w-4 h-4 text-primary" /> مركز التتبع المباشر
              </Button>
            )}
            {hasAny(['view_reports']) && (
              <Button variant="outline" className="w-full justify-start gap-2 text-xs h-10 hover:bg-primary/5 hover:border-primary/30" onClick={() => navigate('/dashboard/reports')}>
                <BarChart3 className="w-4 h-4 text-primary" /> عرض التقارير
              </Button>
            )}
            {hasAny(['sign_documents']) && (
              <Button variant="outline" className="w-full justify-start gap-2 text-xs h-10 hover:bg-primary/5 hover:border-primary/30" onClick={() => navigate('/dashboard/document-center')}>
                <FileText className="w-4 h-4 text-primary" /> مركز المستندات
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Activity Timeline */}
        <Card className="border-border/30 lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="w-4 h-4 text-primary" />
              آخر نشاطاتك
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">لا توجد نشاطات مسجلة حتى الآن</p>
            ) : (
              <div className="relative pr-4 border-r-2 border-primary/15 space-y-3">
                {recentActivity.map((a, i) => {
                  const IconComp = actionIcons[a.resource_type || ''] || Activity;
                  return (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.04 }}
                      className="relative group"
                    >
                      <div className="absolute -right-[1.4rem] top-1.5 w-2.5 h-2.5 rounded-full bg-primary/50 border-2 border-background group-hover:bg-primary transition-colors" />
                      <div className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center shrink-0 mt-0.5">
                          <IconComp className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate">{a.action}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {new Date(a.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {a.resource_type && (
                          <Badge variant="outline" className="text-[9px] shrink-0 h-5">{a.resource_type}</Badge>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MyDashboardTab;
