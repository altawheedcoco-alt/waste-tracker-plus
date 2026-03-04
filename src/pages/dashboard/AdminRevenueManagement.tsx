import { useState, useMemo } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DollarSign, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  Clock, Users, Building2, Search, Calendar, ArrowUpCircle, ArrowDownCircle,
  Bell, Shield, Ban, CreditCard, Receipt, Wallet, BarChart3,
  AlertCircle, XCircle, RefreshCw, FileText, Download, Filter,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { sendBulkDualNotification } from '@/services/unifiedNotifier';
import { format, differenceInDays, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, Area, AreaChart } from 'recharts';

const STATUS_MAP: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  active: { label: 'نشط', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200', icon: CheckCircle2 },
  expired: { label: 'منتهي', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: XCircle },
  grace: { label: 'فترة سماح', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200', icon: Clock },
  cancelled: { label: 'ملغي', color: 'bg-muted text-muted-foreground', icon: Ban },
  pending: { label: 'معلق', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: Clock },
};

const ORG_TYPE_LABELS: Record<string, string> = {
  generator: 'مولد', transporter: 'ناقل', recycler: 'مُدوِّر', disposal: 'تخلص نهائي',
  consultant: 'مستشار بيئي', consulting_office: 'مكتب استشارات', iso_body: 'جهة أيزو',
};

const CHART_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const AdminRevenueManagement = () => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('all');

  // Fetch all organizations
  const { data: organizations = [] } = useQuery({
    queryKey: ['admin-all-orgs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, organization_type, created_at, is_verified')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch all subscriptions
  const { data: subscriptions = [] } = useQuery({
    queryKey: ['admin-all-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*, plan:subscription_plans(name_ar, price_egp, duration_days)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch all payment transactions
  const { data: transactions = [] } = useQuery({
    queryKey: ['admin-all-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch subscription arrears
  const { data: arrears = [] } = useQuery({
    queryKey: ['admin-all-arrears'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_arrears')
        .select('*')
        .is('paid_at', null)
        .order('total_due', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch plans
  const { data: plans = [] } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: async () => {
      const { data } = await supabase.from('subscription_plans').select('*').eq('is_active', true);
      return data || [];
    },
  });

  // Compute analytics
  const analytics = useMemo(() => {
    const now = new Date();
    const subMap = new Map<string, any>();
    subscriptions.forEach(s => {
      if (!subMap.has(s.organization_id) || new Date(s.created_at) > new Date(subMap.get(s.organization_id).created_at)) {
        subMap.set(s.organization_id, s);
      }
    });

    const subscribedOrgIds = new Set(subMap.keys());
    const activeOrgs = [...subMap.values()].filter(s => s.status === 'active' && s.expiry_date && new Date(s.expiry_date) > now);
    const expiredOrgs = [...subMap.values()].filter(s => s.status === 'expired' || (s.expiry_date && new Date(s.expiry_date) <= now));
    const graceOrgs = [...subMap.values()].filter(s => {
      if (!s.expiry_date) return false;
      const exp = new Date(s.expiry_date);
      const graceEnd = new Date(exp.getTime() + (s.grace_period_hours || 72) * 3600000);
      return exp <= now && graceEnd > now;
    });

    const noSubOrgs = organizations.filter(o => !subscribedOrgIds.has(o.id));

    // Revenue calculations
    const completedTx = transactions.filter(t => t.status === 'completed' || t.status === 'success');
    const totalCollected = completedTx.reduce((sum, t) => sum + Number(t.amount || 0), 0);

    // Period-based revenue
    const last30 = completedTx.filter(t => differenceInDays(now, new Date(t.created_at)) <= 30);
    const last90 = completedTx.filter(t => differenceInDays(now, new Date(t.created_at)) <= 90);
    const last365 = completedTx.filter(t => differenceInDays(now, new Date(t.created_at)) <= 365);
    const revenue30 = last30.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const revenue90 = last90.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const revenue365 = last365.reduce((sum, t) => sum + Number(t.amount || 0), 0);

    // Overdue amount
    const totalOverdue = arrears.reduce((sum, a) => sum + Number(a.total_due || 0), 0);

    // Expected future revenue from active subs
    const expectedMonthly = activeOrgs.reduce((sum, s) => {
      const plan = s.plan;
      if (!plan) return sum;
      const monthlyRate = plan.duration_days === 365 ? plan.price_egp / 12 : plan.price_egp;
      return sum + Number(monthlyRate);
    }, 0);

    // Monthly chart data (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = endOfMonth(subMonths(now, i));
      const monthTx = completedTx.filter(t => {
        const d = new Date(t.created_at);
        return d >= monthStart && d <= monthEnd;
      });
      monthlyData.push({
        month: format(monthStart, 'MMM yyyy', { locale: ar }),
        revenue: monthTx.reduce((sum, t) => sum + Number(t.amount || 0), 0),
        count: monthTx.length,
      });
    }

    // Distribution by org type
    const orgTypeRevenue: Record<string, number> = {};
    completedTx.forEach(t => {
      const org = organizations.find(o => o.id === t.organization_id);
      const type = org?.organization_type || 'unknown';
      orgTypeRevenue[type] = (orgTypeRevenue[type] || 0) + Number(t.amount || 0);
    });
    const pieData = Object.entries(orgTypeRevenue).map(([type, value]) => ({
      name: ORG_TYPE_LABELS[type] || type,
      value,
    }));

    return {
      totalOrgs: organizations.length,
      activeOrgs: activeOrgs.length,
      expiredOrgs: expiredOrgs.length,
      graceOrgs: graceOrgs.length,
      noSubOrgs: noSubOrgs.length,
      totalCollected,
      revenue30, revenue90, revenue365,
      totalOverdue,
      expectedMonthly,
      monthlyData,
      pieData,
      subMap,
      noSubOrgsList: noSubOrgs,
      arrearsMap: new Map(arrears.map(a => [a.organization_id, a])),
    };
  }, [organizations, subscriptions, transactions, arrears]);

  // Build org list with enriched data
  const enrichedOrgs = useMemo(() => {
    return organizations.map(org => {
      const sub = analytics.subMap.get(org.id);
      const arrear = analytics.arrearsMap.get(org.id);
      const now = new Date();

      let status = 'no_subscription';
      let daysRemaining = 0;
      let isOverdue = false;

      if (sub) {
        if (sub.status === 'active' && sub.expiry_date && new Date(sub.expiry_date) > now) {
          status = 'active';
          daysRemaining = differenceInDays(new Date(sub.expiry_date), now);
        } else if (sub.expiry_date && new Date(sub.expiry_date) <= now) {
          const graceEnd = new Date(new Date(sub.expiry_date).getTime() + (sub.grace_period_hours || 72) * 3600000);
          status = graceEnd > now ? 'grace' : 'expired';
          isOverdue = true;
        } else {
          status = sub.status || 'pending';
        }
      }

      // org transactions
      const orgTx = transactions.filter(t => t.organization_id === org.id && (t.status === 'completed' || t.status === 'success'));
      const totalPaid = orgTx.reduce((sum, t) => sum + Number(t.amount || 0), 0);
      const lastPayment = orgTx.length > 0 ? orgTx[0].created_at : null;

      return {
        ...org,
        sub,
        arrear,
        status,
        daysRemaining,
        isOverdue,
        totalPaid,
        lastPayment,
        overdueAmount: arrear ? Number(arrear.total_due) : 0,
        planName: sub?.plan?.name_ar || 'بدون اشتراك',
      };
    });
  }, [organizations, analytics, transactions]);

  // Filtered list
  const filteredOrgs = useMemo(() => {
    let list = enrichedOrgs;
    if (filterStatus !== 'all') list = list.filter(o => o.status === filterStatus);
    if (filterType !== 'all') list = list.filter(o => o.organization_type === filterType);
    if (search) list = list.filter(o => o.name.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [enrichedOrgs, filterStatus, filterType, search]);

  // Actions
  const handleSendReminder = async (orgId: string, orgName: string) => {
    try {
      // Create a notification for the org
      const { data: orgUsers } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('organization_id', orgId)
        .limit(50);

      if (orgUsers && orgUsers.length > 0) {
        await sendBulkDualNotification({
          user_ids: orgUsers.map((u: any) => u.user_id),
          title: '⚠️ تنبيه: تجديد الاشتراك مطلوب',
          message: `اشتراككم في منصة iRecycle منتهي أو على وشك الانتهاء. يرجى التجديد لضمان استمرار الخدمة.`,
          type: 'subscription_reminder',
          organization_id: orgId,
        });
      }
      toast.success(`تم إرسال تنبيه لـ ${orgName}`);
    } catch {
      toast.error('فشل إرسال التنبيه');
    }
  };

  const handleSuspendAccess = async (orgId: string, orgName: string) => {
    try {
      await supabase
        .from('user_subscriptions')
        .update({ status: 'suspended' })
        .eq('organization_id', orgId);
      toast.success(`تم تعليق وصول ${orgName}`);
    } catch {
      toast.error('فشل تعليق الوصول');
    }
  };

  const getActionButtons = (org: any) => {
    const actions: { label: string; icon: typeof Bell; variant: 'default' | 'destructive' | 'outline'; action: () => void }[] = [];

    if (org.status === 'no_subscription') {
      actions.push({ label: 'تنبيه بالاشتراك', icon: Bell, variant: 'default', action: () => handleSendReminder(org.id, org.name) });
      actions.push({ label: 'تقييد الوصول', icon: Ban, variant: 'destructive', action: () => handleSuspendAccess(org.id, org.name) });
    } else if (org.status === 'expired') {
      actions.push({ label: 'تنبيه بالتجديد', icon: Bell, variant: 'default', action: () => handleSendReminder(org.id, org.name) });
      actions.push({ label: 'تعليق الحساب', icon: Shield, variant: 'destructive', action: () => handleSuspendAccess(org.id, org.name) });
    } else if (org.status === 'grace') {
      actions.push({ label: 'تذكير عاجل', icon: AlertCircle, variant: 'default', action: () => handleSendReminder(org.id, org.name) });
    } else if (org.status === 'active' && org.daysRemaining <= 7) {
      actions.push({ label: 'تذكير بالتجديد', icon: Clock, variant: 'outline', action: () => handleSendReminder(org.id, org.name) });
    }

    return actions;
  };

  const formatCurrency = (amount: number) => `${amount.toLocaleString('ar-EG')} ج.م`;

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6" dir="rtl">
        <BackButton />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <DollarSign className="w-7 h-7 text-primary" />
              منظومة الإيرادات والاشتراكات
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              تتبع شامل ومباشر لكافة المدفوعات والمستحقات والمديونيات
            </p>
          </div>
          <Badge variant="outline" className="gap-1 text-xs">
            <RefreshCw className="w-3 h-3" />
            تحديث تلقائي لحظي
          </Badge>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <Card className="border-emerald-200 dark:border-emerald-800">
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-emerald-600">{analytics.activeOrgs}</p>
              <p className="text-xs text-muted-foreground">اشتراك نشط</p>
            </CardContent>
          </Card>
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="p-4 text-center">
              <XCircle className="w-6 h-6 text-red-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-red-600">{analytics.expiredOrgs}</p>
              <p className="text-xs text-muted-foreground">منتهي</p>
            </CardContent>
          </Card>
          <Card className="border-amber-200 dark:border-amber-800">
            <CardContent className="p-4 text-center">
              <Clock className="w-6 h-6 text-amber-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-amber-600">{analytics.graceOrgs}</p>
              <p className="text-xs text-muted-foreground">فترة سماح</p>
            </CardContent>
          </Card>
          <Card className="border-destructive/30">
            <CardContent className="p-4 text-center">
              <AlertTriangle className="w-6 h-6 text-destructive mx-auto mb-1" />
              <p className="text-2xl font-bold text-destructive">{analytics.noSubOrgs}</p>
              <p className="text-xs text-muted-foreground">بدون اشتراك</p>
            </CardContent>
          </Card>
          <Card className="border-primary/30">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-6 h-6 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold text-primary">{formatCurrency(analytics.totalCollected)}</p>
              <p className="text-xs text-muted-foreground">إجمالي المحصّل</p>
            </CardContent>
          </Card>
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="p-4 text-center">
              <TrendingDown className="w-6 h-6 text-red-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-red-600">{formatCurrency(analytics.totalOverdue)}</p>
              <p className="text-xs text-muted-foreground">مديونيات متأخرة</p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">آخر 30 يوم</span>
                <Calendar className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-xl font-bold text-foreground">{formatCurrency(analytics.revenue30)}</p>
              <p className="text-xs text-emerald-600 mt-1">محصّلات فعلية</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">آخر 90 يوم</span>
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-xl font-bold text-foreground">{formatCurrency(analytics.revenue90)}</p>
              <p className="text-xs text-blue-600 mt-1">إجمالي ربع سنوي</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">الإيراد الشهري المتوقع</span>
                <Wallet className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-xl font-bold text-foreground">{formatCurrency(analytics.expectedMonthly)}</p>
              <p className="text-xs text-primary mt-1">من الاشتراكات النشطة</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="flex flex-wrap gap-1">
            <TabsTrigger value="overview" className="gap-1"><BarChart3 className="w-3.5 h-3.5" />نظرة عامة</TabsTrigger>
            <TabsTrigger value="detailed" className="gap-1"><FileText className="w-3.5 h-3.5" />السجل التفصيلي</TabsTrigger>
            <TabsTrigger value="overdue" className="gap-1"><AlertTriangle className="w-3.5 h-3.5" />المديونيات</TabsTrigger>
            <TabsTrigger value="no-sub" className="gap-1"><Ban className="w-3.5 h-3.5" />بدون اشتراك</TabsTrigger>
            <TabsTrigger value="transactions" className="gap-1"><Receipt className="w-3.5 h-3.5" />سجل المعاملات</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Monthly Revenue Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">الإيرادات الشهرية (آخر 6 أشهر)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={analytics.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" fontSize={11} />
                      <YAxis fontSize={11} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" name="الإيراد" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Revenue by Org Type */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">توزيع الإيرادات حسب نوع الجهة</CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={analytics.pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {analytics.pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">لا توجد بيانات</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Subscription Distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">توزيع حالات الاشتراك</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { label: 'نشط', count: analytics.activeOrgs, color: 'bg-emerald-500', total: analytics.totalOrgs },
                    { label: 'منتهي', count: analytics.expiredOrgs, color: 'bg-red-500', total: analytics.totalOrgs },
                    { label: 'فترة سماح', count: analytics.graceOrgs, color: 'bg-amber-500', total: analytics.totalOrgs },
                    { label: 'بدون اشتراك', count: analytics.noSubOrgs, color: 'bg-muted-foreground', total: analytics.totalOrgs },
                    { label: 'إجمالي الجهات', count: analytics.totalOrgs, color: 'bg-primary', total: analytics.totalOrgs },
                  ].map(item => (
                    <div key={item.label} className="text-center">
                      <div className="w-full bg-muted rounded-full h-2 mb-2">
                        <div className={`${item.color} h-2 rounded-full`} style={{ width: `${(item.count / Math.max(item.total, 1)) * 100}%` }} />
                      </div>
                      <p className="text-lg font-bold">{item.count}</p>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Detailed Tab */}
          <TabsContent value="detailed" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم..." className="pr-9" dir="rtl" />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40"><SelectValue placeholder="الحالة" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الحالات</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="expired">منتهي</SelectItem>
                  <SelectItem value="grace">فترة سماح</SelectItem>
                  <SelectItem value="no_subscription">بدون اشتراك</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40"><SelectValue placeholder="نوع الجهة" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الأنواع</SelectItem>
                  {Object.entries(ORG_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Orgs Table */}
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="max-h-[600px]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                        <tr className="border-b">
                          <th className="text-right p-3 font-medium">الجهة</th>
                          <th className="text-center p-3 font-medium">النوع</th>
                          <th className="text-center p-3 font-medium">الخطة</th>
                          <th className="text-center p-3 font-medium">الحالة</th>
                          <th className="text-center p-3 font-medium">المتبقي</th>
                          <th className="text-center p-3 font-medium">إجمالي المدفوع</th>
                          <th className="text-center p-3 font-medium">المديونية</th>
                          <th className="text-center p-3 font-medium">آخر دفعة</th>
                          <th className="text-center p-3 font-medium">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrgs.map(org => {
                          const statusInfo = STATUS_MAP[org.status] || { label: 'بدون اشتراك', color: 'bg-muted text-muted-foreground', icon: Ban };
                          const StatusIcon = statusInfo.icon;
                          const actions = getActionButtons(org);

                          return (
                            <tr key={org.id} className="border-b hover:bg-muted/30 transition-colors">
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                                  <span className="font-medium truncate max-w-[180px]">{org.name}</span>
                                </div>
                              </td>
                              <td className="p-3 text-center">
                                <Badge variant="outline" className="text-[10px]">
                                  {ORG_TYPE_LABELS[org.organization_type] || org.organization_type}
                                </Badge>
                              </td>
                              <td className="p-3 text-center text-xs">{org.planName}</td>
                              <td className="p-3 text-center">
                                <Badge className={`${statusInfo.color} gap-1 text-[10px] border-0`}>
                                  <StatusIcon className="w-3 h-3" />
                                  {statusInfo.label}
                                </Badge>
                              </td>
                              <td className="p-3 text-center">
                                {org.status === 'active' ? (
                                  <span className={`text-xs font-medium ${org.daysRemaining <= 7 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                    {org.daysRemaining} يوم
                                  </span>
                                ) : <span className="text-xs text-muted-foreground">-</span>}
                              </td>
                              <td className="p-3 text-center">
                                <span className="text-xs font-medium text-emerald-600">
                                  {org.totalPaid > 0 ? formatCurrency(org.totalPaid) : '-'}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                {org.overdueAmount > 0 ? (
                                  <span className="text-xs font-bold text-red-600">{formatCurrency(org.overdueAmount)}</span>
                                ) : <span className="text-xs text-muted-foreground">-</span>}
                              </td>
                              <td className="p-3 text-center text-xs text-muted-foreground">
                                {org.lastPayment ? format(new Date(org.lastPayment), 'dd/MM/yyyy') : '-'}
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-1 justify-center">
                                  {actions.map((act, i) => {
                                    const Icon = act.icon;
                                    return (
                                      <Button key={i} variant={act.variant} size="sm" className="text-[10px] h-7 px-2 gap-1" onClick={act.action}>
                                        <Icon className="w-3 h-3" />
                                        {act.label}
                                      </Button>
                                    );
                                  })}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {filteredOrgs.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Search className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p>لا توجد نتائج</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Overdue Tab */}
          <TabsContent value="overdue" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  الجهات المتأخرة في السداد ({enrichedOrgs.filter(o => o.isOverdue || o.overdueAmount > 0).length})
                </CardTitle>
                <CardDescription>الجهات التي انتهت اشتراكاتها أو عليها مديونيات متراكمة</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {enrichedOrgs.filter(o => o.isOverdue || o.overdueAmount > 0).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-30 text-emerald-500" />
                    <p>لا توجد مديونيات متأخرة حالياً</p>
                  </div>
                ) : (
                  enrichedOrgs.filter(o => o.isOverdue || o.overdueAmount > 0).map(org => (
                    <div key={org.id} className="flex items-center justify-between p-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{org.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px]">{ORG_TYPE_LABELS[org.organization_type] || org.organization_type}</Badge>
                            {org.arrear && (
                              <span className="text-[10px] text-red-600">
                                متأخر {org.arrear.months_overdue} شهر | غرامة: {formatCurrency(Number(org.arrear.penalty_amount || 0))}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-left">
                          <p className="text-lg font-bold text-red-600">{formatCurrency(org.overdueAmount)}</p>
                          <p className="text-[10px] text-muted-foreground">مبلغ مستحق</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button size="sm" className="text-[10px] h-7 gap-1" onClick={() => handleSendReminder(org.id, org.name)}>
                            <Bell className="w-3 h-3" />تنبيه
                          </Button>
                          <Button variant="destructive" size="sm" className="text-[10px] h-7 gap-1" onClick={() => handleSuspendAccess(org.id, org.name)}>
                            <Ban className="w-3 h-3" />تعليق
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* No Subscription Tab */}
          <TabsContent value="no-sub" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Ban className="w-5 h-5 text-destructive" />
                  جهات بدون اشتراك ({analytics.noSubOrgs})
                </CardTitle>
                <CardDescription>جهات تعمل على المنصة بدون اشتراك فعّال - يجب اتخاذ إجراء</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {analytics.noSubOrgsList.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-30 text-emerald-500" />
                    <p>كل الجهات لديها اشتراكات</p>
                  </div>
                ) : (
                  analytics.noSubOrgsList.map((org: any) => (
                    <div key={org.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{org.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="text-[10px]">{ORG_TYPE_LABELS[org.organization_type] || org.organization_type}</Badge>
                            <span className="text-[10px] text-muted-foreground">
                              انضمت: {format(new Date(org.created_at), 'dd/MM/yyyy')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" className="text-[10px] h-7 gap-1" onClick={() => handleSendReminder(org.id, org.name)}>
                          <Bell className="w-3 h-3" />
                          تنبيه بالاشتراك
                        </Button>
                        <Button variant="destructive" size="sm" className="text-[10px] h-7 gap-1" onClick={() => handleSuspendAccess(org.id, org.name)}>
                          <Ban className="w-3 h-3" />
                          تقييد
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-primary" />
                  سجل المعاملات المالية ({transactions.length})
                </CardTitle>
                <CardDescription>كل المدفوعات من ومن وإلى مَن ومتى وكم</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[500px]">
                  {transactions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Receipt className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p>لا توجد معاملات مسجلة بعد</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {transactions.map(tx => {
                        const org = organizations.find(o => o.id === tx.organization_id);
                        const isSuccess = tx.status === 'completed' || tx.status === 'success';
                        return (
                          <div key={tx.id} className={`flex items-center justify-between p-3 rounded-lg border ${isSuccess ? 'border-emerald-200 dark:border-emerald-800' : 'border-muted'}`}>
                            <div className="flex items-center gap-3">
                              {isSuccess ? (
                                <ArrowDownCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                              ) : (
                                <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                              )}
                              <div>
                                <p className="text-sm font-medium">{org?.name || 'جهة غير معروفة'}</p>
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                  <span>{tx.payment_method || 'غير محدد'}</span>
                                  {tx.provider_transaction_id && <span>#{tx.provider_transaction_id}</span>}
                                </div>
                              </div>
                            </div>
                            <div className="text-left">
                              <p className={`font-bold ${isSuccess ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                                {formatCurrency(Number(tx.amount))}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {format(new Date(tx.created_at), 'dd/MM/yyyy hh:mm a')}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminRevenueManagement;
