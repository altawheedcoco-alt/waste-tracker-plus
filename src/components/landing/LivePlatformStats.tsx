import { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, Truck, Users, FileText, Activity, 
  UserCheck, Package, TrendingUp
} from 'lucide-react';

interface StatItem {
  icon: typeof Building2;
  valueKey: string;
  labelAr: string;
  labelEn: string;
  gradient: string;
}

const STAT_ITEMS: StatItem[] = [
  { icon: Building2, valueKey: 'organizations', labelAr: 'جهة مسجلة', labelEn: 'Organizations', gradient: 'from-emerald-500 to-teal-600' },
  { icon: Truck, valueKey: 'shipments', labelAr: 'شحنة منجزة', labelEn: 'Shipments', gradient: 'from-blue-500 to-cyan-600' },
  { icon: Users, valueKey: 'users', labelAr: 'مستخدم نشط', labelEn: 'Active Users', gradient: 'from-violet-500 to-purple-600' },
  { icon: UserCheck, valueKey: 'drivers', labelAr: 'سائق مستقل', labelEn: 'Drivers', gradient: 'from-amber-500 to-orange-600' },
  { icon: FileText, valueKey: 'invoices', labelAr: 'فاتورة رقمية', labelEn: 'Invoices', gradient: 'from-rose-500 to-pink-600' },
  { icon: Package, valueKey: 'wasteItems', labelAr: 'منشور محتوى', labelEn: 'Posts', gradient: 'from-teal-500 to-green-600' },
];

const LivePlatformStats = memo(() => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const { data: stats } = useQuery({
    queryKey: ['landing-live-platform-stats'],
    queryFn: async () => {
      const [orgs, shipments, users, drivers, invoices, posts] = await Promise.all([
        supabase.from('organizations').select('id', { count: 'exact', head: true }),
        supabase.from('shipments').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('drivers').select('id', { count: 'exact', head: true }),
        supabase.from('invoices').select('id', { count: 'exact', head: true }),
        supabase.from('platform_posts').select('id', { count: 'exact', head: true }),
      ]);
      return {
        organizations: orgs.count ?? 0,
        shipments: shipments.count ?? 0,
        users: users.count ?? 0,
        drivers: drivers.count ?? 0,
        invoices: invoices.count ?? 0,
        wasteItems: posts.count ?? 0,
      };
    },
    staleTime: 1000 * 60 * 5,
  });

  return (
    <section className="py-10 sm:py-14 bg-gradient-to-b from-background to-muted/30">
      <div className="container px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge variant="outline" className="mb-3 gap-1.5 px-3 py-1 text-xs border-primary/30 text-primary">
            <Activity className="h-3 w-3 animate-pulse" />
            {isAr ? 'إحصائيات حية' : 'Live Stats'}
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            {isAr ? 'المنصة في أرقام' : 'Platform in Numbers'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isAr ? 'بيانات حقيقية من قاعدة البيانات — يتم تحديثها تلقائياً' : 'Real data from the database — auto-refreshed'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 max-w-3xl mx-auto">
          {STAT_ITEMS.map((item) => {
            const Icon = item.icon;
            const value = stats?.[item.valueKey as keyof typeof stats] ?? 0;
            return (
              <div
                key={item.valueKey}
                className="relative overflow-hidden rounded-xl bg-card border border-border/50 p-4 sm:p-5 text-center group hover:shadow-lg transition-all duration-300"
              >
                {/* Gradient accent top */}
                <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${item.gradient}`} />
                
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${item.gradient} mb-3 shadow-sm`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                
                <div className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums">
                  {value.toLocaleString()}
                  <span className="text-primary text-lg">+</span>
                </div>
                
                <div className="text-xs text-muted-foreground mt-1 font-medium">
                  {isAr ? item.labelAr : item.labelEn}
                </div>
              </div>
            );
          })}
        </div>

        {/* Live indicator */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
          </span>
          <span className="text-[11px] text-muted-foreground">
            {isAr ? 'بيانات مباشرة' : 'Live Data'}
          </span>
        </div>
      </div>
    </section>
  );
});

LivePlatformStats.displayName = 'LivePlatformStats';
export default LivePlatformStats;
