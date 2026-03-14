import BackButton from '@/components/ui/back-button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, Users, Package, TrendingUp, AlertTriangle, CheckCircle2, 
  Clock, DollarSign, Truck, Recycle, Shield, Activity, ArrowUpRight,
  ArrowDownRight, Minus, BarChart3, Globe, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, subDays, startOfMonth } from 'date-fns';
import { ar } from 'date-fns/locale';

const ExecutiveDashboard = () => {
  const { profile } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ['executive-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const monthStart = startOfMonth(new Date()).toISOString().split('T')[0];
      const last30 = subDays(new Date(), 30).toISOString();

      const [orgs, profiles, shipments, pendingOrgs, activeShipments, recentShipments] = await Promise.all([
        supabase.from('organizations').select('id, is_verified, is_active, organization_type, created_at', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('shipments').select('id, status, created_at, total_price', { count: 'exact' }),
        supabase.from('organizations').select('id', { count: 'exact' }).eq('is_verified', false),
        supabase.from('shipments').select('id', { count: 'exact' }).in('status', ['new', 'confirmed', 'in_transit', 'collecting']),
        supabase.from('shipments').select('id, created_at', { count: 'exact' }).gte('created_at', last30),
      ]);

      const orgsByType: Record<string, number> = {};
      orgs.data?.forEach((o: any) => {
        orgsByType[o.organization_type] = (orgsByType[o.organization_type] || 0) + 1;
      });

      const newOrgsThisMonth = orgs.data?.filter((o: any) => o.created_at >= monthStart).length || 0;
      const totalRevenue = shipments.data?.reduce((sum: number, s: any) => sum + (s.total_price || 0), 0) || 0;

      return {
        totalOrgs: orgs.count || 0,
        totalUsers: profiles.count || 0,
        totalShipments: shipments.count || 0,
        pendingOrgs: pendingOrgs.count || 0,
        activeShipments: activeShipments.count || 0,
        recentShipments: recentShipments.count || 0,
        newOrgsThisMonth,
        totalRevenue,
        orgsByType,
      };
    },
    staleTime: 1000 * 60 * 5,
  });

  const kpiCards = [
    { 
      title: 'إجمالي المنظمات', value: stats?.totalOrgs || 0, 
      icon: Building2, trend: stats?.newOrgsThisMonth || 0, trendLabel: 'جديدة هذا الشهر',
      color: 'text-blue-500', bg: 'bg-blue-500/10' 
    },
    { 
      title: 'إجمالي المستخدمين', value: stats?.totalUsers || 0, 
      icon: Users, trend: 0, trendLabel: '',
      color: 'text-emerald-500', bg: 'bg-emerald-500/10' 
    },
    { 
      title: 'إجمالي الشحنات', value: stats?.totalShipments || 0, 
      icon: Package, trend: stats?.recentShipments || 0, trendLabel: 'آخر 30 يوم',
      color: 'text-purple-500', bg: 'bg-purple-500/10' 
    },
    { 
      title: 'شحنات نشطة', value: stats?.activeShipments || 0, 
      icon: Activity, trend: 0, trendLabel: 'قيد التنفيذ',
      color: 'text-amber-500', bg: 'bg-amber-500/10' 
    },
    { 
      title: 'بانتظار التفعيل', value: stats?.pendingOrgs || 0, 
      icon: Clock, trend: 0, trendLabel: 'منظمة',
      color: 'text-red-500', bg: 'bg-red-500/10' 
    },
    { 
      title: 'الإيرادات التراكمية', value: `${((stats?.totalRevenue || 0) / 1000).toFixed(1)}K`, 
      icon: DollarSign, trend: 0, trendLabel: 'ج.م',
      color: 'text-green-500', bg: 'bg-green-500/10' 
    },
  ];

  const orgTypeMap: Record<string, { label: string; icon: any; color: string }> = {
    generator: { label: 'مُولّدات', icon: Building2, color: 'bg-blue-500' },
    transporter: { label: 'ناقلين', icon: Truck, color: 'bg-amber-500' },
    recycler: { label: 'مُدوّرين', icon: Recycle, color: 'bg-green-500' },
    disposal: { label: 'تخلص آمن', icon: Shield, color: 'bg-red-500' },
    consultant: { label: 'استشاريين', icon: Users, color: 'bg-purple-500' },
    consulting_office: { label: 'مكاتب استشارية', icon: Globe, color: 'bg-indigo-500' },
    iso_body: { label: 'جهات ISO', icon: CheckCircle2, color: 'bg-teal-500' },
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 md:p-6" dir="rtl">
      <BackButton />
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-lg sm:text-2xl font-bold flex items-center gap-1.5 sm:gap-2">
          <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
          اللوحة التنفيذية
        </h1>
        <p className="text-muted-foreground text-[11px] sm:text-sm truncate">
          نظرة شاملة — {format(new Date(), 'EEEE d MMMM yyyy', { locale: ar })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
        {kpiCards.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-2.5 sm:p-4">
                  <div className={`w-7 h-7 sm:w-10 sm:h-10 rounded-lg ${kpi.bg} flex items-center justify-center mb-1.5 sm:mb-3`}>
                    <Icon className={`w-3.5 h-3.5 sm:w-5 sm:h-5 ${kpi.color}`} />
                  </div>
                  <p className="text-base sm:text-2xl font-bold">{kpi.value}</p>
                  <p className="text-[9px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">{kpi.title}</p>
                  {kpi.trend > 0 && (
                    <div className="flex items-center gap-0.5 mt-1 sm:mt-2 text-[9px] sm:text-xs text-green-600">
                      <ArrowUpRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      +{kpi.trend} {kpi.trendLabel}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Organization Distribution */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              توزيع المنظمات حسب النوع
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(stats?.orgsByType || {}).map(([type, count]) => {
              const info = orgTypeMap[type];
              if (!info) return null;
              const percentage = stats?.totalOrgs ? Math.round(((count as number) / stats.totalOrgs) * 100) : 0;
              return (
                <div key={type} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${info.color}`} />
                      {info.label}
                    </span>
                    <span className="font-medium">{count as number} ({percentage}%)</span>
                  </div>
                  <Progress value={percentage} className="h-1.5" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              تنبيهات تتطلب انتباه
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(stats?.pendingOrgs || 0) > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10">
                <Clock className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="text-sm font-medium">{stats?.pendingOrgs} منظمة بانتظار التفعيل</p>
                  <p className="text-xs text-muted-foreground">يتطلب مراجعة وموافقة</p>
                </div>
              </div>
            )}
            {(stats?.activeShipments || 0) > 10 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10">
                <Package className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">{stats?.activeShipments} شحنة نشطة حالياً</p>
                  <p className="text-xs text-muted-foreground">قيد التنفيذ والتسليم</p>
                </div>
              </div>
            )}
            {(stats?.pendingOrgs || 0) === 0 && (stats?.activeShipments || 0) <= 10 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium">كل شيء يسير بسلاسة</p>
                  <p className="text-xs text-muted-foreground">لا توجد تنبيهات حرجة حالياً</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
