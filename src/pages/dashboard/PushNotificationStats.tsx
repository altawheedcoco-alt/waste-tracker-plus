import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  Bell,
  BellRing,
  Users,
  Smartphone,
  Monitor,
  Globe,
  Search,
  RefreshCcw,
  Send,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  BarChart3,
  Wifi,
  WifiOff,
  Trash2,
  ChevronDown,
  ChevronUp,
  Activity,
  Zap,
  Shield,
  Eye,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Subscriber {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth_key: string;
  created_at: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  org_name?: string;
  org_type?: string;
}

interface NotificationLog {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  priority?: string;
  full_name?: string;
}

const PLATFORM_COLORS: Record<string, string> = {
  'Chrome/FCM': '#4285F4',
  'Firefox': '#FF7139',
  'Safari': '#006CFF',
  'Edge': '#0078D7',
  'أخرى': '#8b5cf6',
};

function detectPlatform(endpoint: string): string {
  if (endpoint.includes('fcm') || endpoint.includes('googleapis')) return 'Chrome/FCM';
  if (endpoint.includes('mozilla') || endpoint.includes('push.services.mozilla')) return 'Firefox';
  if (endpoint.includes('apple') || endpoint.includes('safari') || endpoint.includes('web.push.apple')) return 'Safari';
  if (endpoint.includes('notify.windows') || endpoint.includes('wns')) return 'Edge';
  return 'أخرى';
}

function isEndpointValid(endpoint: string): boolean {
  return !endpoint.includes('permanently-removed') && !endpoint.includes('invalid') && endpoint.startsWith('https://');
}

const PushNotificationStats = () => {
  const { user } = useAuth();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [testTitle, setTestTitle] = useState('🔔 إشعار اختباري');
  const [testBody, setTestBody] = useState('هذا إشعار اختباري من لوحة تحكم المدير');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch push subscriptions with profile info
      const { data: subs, error: subsErr } = await supabase
        .from('push_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (subsErr) throw subsErr;

      // Fetch profile info for subscribers
      const userIds = [...new Set((subs || []).map(s => s.user_id))];
      let profiles: any[] = [];
      if (userIds.length > 0) {
        const { data: p } = await supabase
          .from('profiles')
          .select('user_id, full_name, phone, avatar_url')
          .in('user_id', userIds);
        profiles = p || [];
      }

      // Fetch org info
      let orgMap: Record<string, { name: string; type: string }> = {};
      if (userIds.length > 0) {
        const { data: members } = await supabase
          .from('organization_members')
          .select('user_id, organizations(name, organization_type)')
          .in('user_id', userIds)
          .eq('status', 'active');
        
        (members || []).forEach((m: any) => {
          if (m.organizations) {
            orgMap[m.user_id] = {
              name: m.organizations.name,
              type: m.organizations.organization_type,
            };
          }
        });
      }

      const enriched: Subscriber[] = (subs || []).map(s => {
        const prof = profiles.find(p => p.user_id === s.user_id);
        const org = orgMap[s.user_id];
        return {
          ...s,
          full_name: prof?.full_name || 'غير معروف',
          phone: prof?.phone,
          avatar_url: prof?.avatar_url,
          org_name: org?.name,
          org_type: org?.type,
        };
      });

      setSubscribers(enriched);

      // Fetch recent notification logs
      const { data: logs } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      // Enrich logs with names
      const logUserIds = [...new Set((logs || []).map(l => l.user_id))];
      let logProfiles: any[] = [];
      if (logUserIds.length > 0) {
        const { data: lp } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', logUserIds);
        logProfiles = lp || [];
      }

      setNotificationLogs((logs || []).map(l => ({
        ...l,
        full_name: logProfiles.find(p => p.user_id === l.user_id)?.full_name || 'غير معروف',
      })));

    } catch (err) {
      console.error('Error fetching push stats:', err);
      toast.error('خطأ في جلب البيانات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Computed stats
  const uniqueUsers = [...new Set(subscribers.map(s => s.user_id))];
  const totalDevices = subscribers.length;
  const validSubs = subscribers.filter(s => isEndpointValid(s.endpoint));
  const invalidSubs = subscribers.filter(s => !isEndpointValid(s.endpoint));
  
  const platformStats = subscribers.reduce<Record<string, number>>((acc, s) => {
    const platform = detectPlatform(s.endpoint);
    acc[platform] = (acc[platform] || 0) + 1;
    return acc;
  }, {});

  const platformChartData = Object.entries(platformStats).map(([name, value]) => ({
    name,
    value,
    color: PLATFORM_COLORS[name] || '#8b5cf6',
  }));

  // Group by user
  const userGroups = uniqueUsers.map(uid => {
    const userSubs = subscribers.filter(s => s.user_id === uid);
    const first = userSubs[0];
    return {
      user_id: uid,
      full_name: first?.full_name || 'غير معروف',
      phone: first?.phone,
      avatar_url: first?.avatar_url,
      org_name: first?.org_name,
      org_type: first?.org_type,
      devices: userSubs.length,
      validDevices: userSubs.filter(s => isEndpointValid(s.endpoint)).length,
      platforms: [...new Set(userSubs.map(s => detectPlatform(s.endpoint)))],
      firstSub: userSubs.reduce((min, s) => s.created_at < min ? s.created_at : min, userSubs[0].created_at),
      lastSub: userSubs.reduce((max, s) => s.created_at > max ? s.created_at : max, userSubs[0].created_at),
      subscriptions: userSubs,
    };
  });

  const filteredUsers = userGroups.filter(u =>
    !searchQuery || 
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.phone?.includes(searchQuery) ||
    u.org_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Notification stats
  const notifTypeStats = notificationLogs.reduce<Record<string, number>>((acc, n) => {
    acc[n.type || 'general'] = (acc[n.type || 'general'] || 0) + 1;
    return acc;
  }, {});

  const notifTypeChartData = Object.entries(notifTypeStats).map(([name, value]) => ({
    name: translateType(name),
    value,
  }));

  const readRate = notificationLogs.length > 0
    ? Math.round((notificationLogs.filter(n => n.is_read).length / notificationLogs.length) * 100)
    : 0;

  // Send test notification
  const sendTestPush = async (targetUserId?: string) => {
    setSending(true);
    try {
      const targetIds = targetUserId ? [targetUserId] : uniqueUsers;
      
      const { error } = await supabase.functions.invoke('send-push', {
        body: {
          user_ids: targetIds,
          title: testTitle,
          body: testBody,
        },
      });

      if (error) throw error;
      toast.success(`تم إرسال الإشعار إلى ${targetIds.length} مستخدم`);
    } catch (err) {
      console.error('Error sending test push:', err);
      toast.error('فشل الإرسال');
    } finally {
      setSending(false);
    }
  };

  // Clean invalid subscriptions
  const cleanInvalid = async () => {
    if (invalidSubs.length === 0) {
      toast.info('لا توجد اشتراكات تالفة');
      return;
    }
    try {
      for (const sub of invalidSubs) {
        await supabase.from('push_subscriptions').delete().eq('id', sub.id);
      }
      toast.success(`تم حذف ${invalidSubs.length} اشتراك تالف`);
      fetchData();
    } catch {
      toast.error('خطأ في التنظيف');
    }
  };

  const orgTypeLabel = (type?: string) => {
    const map: Record<string, string> = {
      generator: 'مولّد',
      transporter: 'ناقل',
      recycler: 'مدوّر',
      disposal: 'تخلص',
    };
    return type ? map[type] || type : '-';
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <BackButton />
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
                <BellRing className="h-6 w-6 text-primary" />
                منظومة إشعارات الدفع
              </h1>
              <p className="text-sm text-muted-foreground">إحصائيات ومراقبة المشتركين في الإشعارات الفورية</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCcw className={`h-4 w-4 ml-1 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4 text-center">
                <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold text-foreground">{uniqueUsers.length}</p>
                <p className="text-xs text-muted-foreground">مشتركين فعّالين</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-blue-500/20 bg-blue-500/5">
              <CardContent className="p-4 text-center">
                <Smartphone className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold text-foreground">{totalDevices}</p>
                <p className="text-xs text-muted-foreground">أجهزة مسجلة</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-emerald-500/20 bg-emerald-500/5">
              <CardContent className="p-4 text-center">
                <Wifi className="h-6 w-6 mx-auto mb-2 text-emerald-500" />
                <p className="text-2xl font-bold text-foreground">{validSubs.length}</p>
                <p className="text-xs text-muted-foreground">اشتراكات صالحة</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className={`border-${invalidSubs.length > 0 ? 'destructive' : 'muted'}/20 bg-${invalidSubs.length > 0 ? 'destructive' : 'muted'}/5`}>
              <CardContent className="p-4 text-center">
                <WifiOff className={`h-6 w-6 mx-auto mb-2 ${invalidSubs.length > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
                <p className="text-2xl font-bold text-foreground">{invalidSubs.length}</p>
                <p className="text-xs text-muted-foreground">اشتراكات تالفة</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
          <TabsList className="w-full flex-wrap h-auto gap-1">
            <TabsTrigger value="overview" className="flex items-center gap-1">
              <BarChart3 className="h-3.5 w-3.5" />
              نظرة عامة
            </TabsTrigger>
            <TabsTrigger value="subscribers" className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              المشتركين
            </TabsTrigger>
            <TabsTrigger value="devices" className="flex items-center gap-1">
              <Smartphone className="h-3.5 w-3.5" />
              الأجهزة
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-1">
              <Activity className="h-3.5 w-3.5" />
              سجل الإشعارات
            </TabsTrigger>
            <TabsTrigger value="test" className="flex items-center gap-1">
              <Send className="h-3.5 w-3.5" />
              إرسال اختباري
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Platform Distribution */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    توزيع المنصات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {platformChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={platformChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {platformChartData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">
                      لا توجد بيانات
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notification Types */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Bell className="h-4 w-4 text-primary" />
                    أنواع الإشعارات (آخر 100)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {notifTypeChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={notifTypeChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">
                      لا توجد بيانات
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Read Rate */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Eye className="h-4 w-4 text-primary" />
                    نسبة القراءة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">مقروءة</span>
                    <span className="text-lg font-bold text-foreground">{readRate}%</span>
                  </div>
                  <Progress value={readRate} className="h-3" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{notificationLogs.filter(n => n.is_read).length} مقروءة</span>
                    <span>{notificationLogs.filter(n => !n.is_read).length} غير مقروءة</span>
                  </div>
                </CardContent>
              </Card>

              {/* Health Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    صحة المنظومة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    {invalidSubs.length === 0 ? (
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                    <span className="text-sm">
                      {invalidSubs.length === 0 ? 'جميع الاشتراكات صالحة ✅' : `${invalidSubs.length} اشتراكات تالفة تحتاج تنظيف`}
                    </span>
                  </div>
                  {invalidSubs.length > 0 && (
                    <Button size="sm" variant="destructive" onClick={cleanInvalid} className="w-full">
                      <Trash2 className="h-4 w-4 ml-1" />
                      تنظيف الاشتراكات التالفة
                    </Button>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Zap className="h-3 w-3" />
                      <span>متوسط الأجهزة/مستخدم: {uniqueUsers.length > 0 ? (totalDevices / uniqueUsers.length).toFixed(1) : 0}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <TrendingUp className="h-3 w-3" />
                      <span>نسبة الصلاحية: {totalDevices > 0 ? Math.round((validSubs.length / totalDevices) * 100) : 100}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Subscribers Tab */}
          <TabsContent value="subscribers" className="space-y-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث بالاسم أو الهاتف أو الجهة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Badge variant="outline">{filteredUsers.length} مشترك</Badge>
            </div>

            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredUsers.map((u, i) => (
                    <motion.div
                      key={u.user_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card className="hover:border-primary/30 transition-colors">
                        <CardContent className="p-4">
                          <div
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => setExpandedUser(expandedUser === u.user_id ? null : u.user_id)}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                                  {(u.full_name || '?')[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold text-sm text-foreground">{u.full_name}</p>
                                <div className="flex items-center gap-2 flex-wrap">
                                  {u.org_name && (
                                    <Badge variant="outline" className="text-[10px]">
                                      {u.org_name}
                                    </Badge>
                                  )}
                                  {u.org_type && (
                                    <Badge variant="secondary" className="text-[10px]">
                                      {orgTypeLabel(u.org_type)}
                                    </Badge>
                                  )}
                                  {u.phone && (
                                    <span className="text-[10px] text-muted-foreground">{u.phone}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-center">
                                <p className="text-lg font-bold text-foreground">{u.devices}</p>
                                <p className="text-[10px] text-muted-foreground">جهاز</p>
                              </div>
                              <div className="flex gap-1">
                                {u.platforms.map(p => (
                                  <Badge key={p} variant="outline" className="text-[10px]" style={{ borderColor: PLATFORM_COLORS[p] }}>
                                    {p}
                                  </Badge>
                                ))}
                              </div>
                              {expandedUser === u.user_id ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </div>

                          {/* Expanded Details */}
                          <AnimatePresence>
                            {expandedUser === u.user_id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-4 pt-4 border-t border-border space-y-3">
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                    <div className="bg-muted/50 rounded p-2">
                                      <p className="text-muted-foreground">أول اشتراك</p>
                                      <p className="font-medium">{format(new Date(u.firstSub), 'dd/MM/yyyy HH:mm', { locale: ar })}</p>
                                    </div>
                                    <div className="bg-muted/50 rounded p-2">
                                      <p className="text-muted-foreground">آخر اشتراك</p>
                                      <p className="font-medium">{formatDistanceToNow(new Date(u.lastSub), { locale: ar, addSuffix: true })}</p>
                                    </div>
                                    <div className="bg-muted/50 rounded p-2">
                                      <p className="text-muted-foreground">أجهزة صالحة</p>
                                      <p className="font-medium text-emerald-600">{u.validDevices} / {u.devices}</p>
                                    </div>
                                    <div className="bg-muted/50 rounded p-2">
                                      <p className="text-muted-foreground">User ID</p>
                                      <p className="font-mono text-[9px] break-all">{u.user_id}</p>
                                    </div>
                                  </div>

                                  {/* Endpoints list */}
                                  <div className="space-y-1">
                                    {u.subscriptions.map(sub => (
                                      <div key={sub.id} className="flex items-center gap-2 text-[10px] bg-muted/30 rounded p-2">
                                        {isEndpointValid(sub.endpoint) ? (
                                          <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" />
                                        ) : (
                                          <XCircle className="h-3 w-3 text-destructive shrink-0" />
                                        )}
                                        <span className="font-mono text-muted-foreground truncate flex-1">{sub.endpoint.slice(0, 80)}...</span>
                                        <Badge variant="outline" className="text-[9px]">{detectPlatform(sub.endpoint)}</Badge>
                                      </div>
                                    ))}
                                  </div>

                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      sendTestPush(u.user_id);
                                    }}
                                    disabled={sending}
                                  >
                                    <Send className="h-3 w-3 ml-1" />
                                    إرسال إشعار اختباري لهذا المستخدم
                                  </Button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {filteredUsers.length === 0 && !loading && (
                  <div className="text-center py-12 text-muted-foreground">
                    <BellRing className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>لا يوجد مشتركين</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Devices Tab */}
          <TabsContent value="devices" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(platformStats).map(([platform, count]) => (
                <Card key={platform}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: PLATFORM_COLORS[platform] || '#8b5cf6' }}
                    >
                      {platform === 'Chrome/FCM' ? <Monitor className="h-6 w-6" /> :
                       platform === 'Firefox' ? <Globe className="h-6 w-6" /> :
                       platform === 'Safari' ? <Smartphone className="h-6 w-6" /> :
                       <Monitor className="h-6 w-6" />}
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{platform}</p>
                      <p className="text-sm text-muted-foreground">{count} جهاز ({totalDevices > 0 ? Math.round((count / totalDevices) * 100) : 0}%)</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* All devices table */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">كافة الأجهزة المسجلة</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {subscribers.map(sub => (
                      <div key={sub.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                        <div className="flex items-center gap-1">
                          {isEndpointValid(sub.endpoint) ? (
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{sub.full_name}</p>
                          <p className="text-[10px] font-mono text-muted-foreground truncate">{sub.endpoint.slice(0, 60)}...</p>
                        </div>
                        <Badge variant="outline" className="text-[10px]" style={{ borderColor: PLATFORM_COLORS[detectPlatform(sub.endpoint)] }}>
                          {detectPlatform(sub.endpoint)}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {format(new Date(sub.created_at), 'dd/MM HH:mm')}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  آخر 100 إشعار
                </CardTitle>
                <CardDescription>سجل الإشعارات المرسلة عبر المنصة</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {notificationLogs.map(log => (
                      <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                        <div className="mt-1">
                          {log.is_read ? (
                            <Eye className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <Bell className="h-4 w-4 text-amber-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-foreground">{log.title}</p>
                            <Badge variant={log.is_read ? 'secondary' : 'default'} className="text-[10px]">
                              {log.is_read ? 'مقروء' : 'غير مقروء'}
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">
                              {translateType(log.type)}
                            </Badge>
                            {log.priority && (
                              <Badge variant={log.priority === 'urgent' ? 'destructive' : 'outline'} className="text-[10px]">
                                {log.priority === 'urgent' ? '🔴 عاجل' : log.priority}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{log.message}</p>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                            <span>👤 {log.full_name}</span>
                            <span>•</span>
                            <Clock className="h-3 w-3" />
                            <span>{formatDistanceToNow(new Date(log.created_at), { locale: ar, addSuffix: true })}</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {notificationLogs.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>لا توجد إشعارات مسجلة</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Test Tab */}
          <TabsContent value="test" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Send className="h-4 w-4 text-primary" />
                  إرسال إشعار اختباري
                </CardTitle>
                <CardDescription>أرسل إشعار Push لجميع المشتركين أو مستخدم محدد</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">عنوان الإشعار</label>
                  <Input value={testTitle} onChange={e => setTestTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">نص الإشعار</label>
                  <Input value={testBody} onChange={e => setTestBody(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">المستلم</label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={selectedUserId || ''}
                    onChange={e => setSelectedUserId(e.target.value || null)}
                  >
                    <option value="">جميع المشتركين ({uniqueUsers.length})</option>
                    {userGroups.map(u => (
                      <option key={u.user_id} value={u.user_id}>
                        {u.full_name} ({u.devices} جهاز)
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  className="w-full"
                  onClick={() => sendTestPush(selectedUserId || undefined)}
                  disabled={sending || !testTitle}
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  ) : (
                    <Send className="h-4 w-4 ml-2" />
                  )}
                  {sending ? 'جاري الإرسال...' : 'إرسال الآن'}
                </Button>
              </CardContent>
            </Card>

            {/* Quick send to each user */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">إرسال سريع لكل مستخدم</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {userGroups.map(u => (
                    <div key={u.user_id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                            {(u.full_name || '?')[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{u.full_name}</p>
                          <p className="text-[10px] text-muted-foreground">{u.devices} جهاز</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => sendTestPush(u.user_id)}
                        disabled={sending}
                      >
                        <Send className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

function translateType(type: string): string {
  const map: Record<string, string> = {
    general: 'عام',
    system: 'نظام',
    shipment: 'شحنة',
    deposit: 'إيداع',
    emergency: 'طوارئ',
    message: 'رسالة',
    approval: 'موافقة',
    alert: 'تنبيه',
    partner: 'شريك',
    driver: 'سائق',
  };
  return map[type] || type;
}

export default PushNotificationStats;
