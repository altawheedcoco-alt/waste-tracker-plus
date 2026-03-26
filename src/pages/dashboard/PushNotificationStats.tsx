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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Bell, BellRing, Users, Smartphone, Monitor, Globe, Search, RefreshCcw, Send,
  Loader2, CheckCircle, XCircle, Clock, TrendingUp, BarChart3, Wifi, WifiOff,
  Trash2, ChevronDown, ChevronUp, Activity, Zap, Shield, Eye, Ban, Megaphone,
  Target, UserX, History, Link, AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Subscriber {
  id: string; user_id: string; endpoint: string; p256dh: string; auth_key: string;
  created_at: string; full_name?: string; phone?: string; avatar_url?: string;
  org_name?: string; org_type?: string;
}

interface NotificationLog {
  id: string; user_id: string; title: string; message: string; type: string;
  is_read: boolean; created_at: string; priority?: string; full_name?: string;
}

interface Campaign {
  id: string; sender_id: string; title: string; body: string; type: string;
  priority: string; target_type: string; target_ids: string[] | null;
  target_org_type: string | null; total_sent: number; total_failed: number;
  url: string | null; created_at: string; sender_name?: string;
}

interface BlacklistEntry {
  id: string; user_id: string; blocked_by: string | null; reason: string | null;
  created_at: string; full_name?: string;
}

const PLATFORM_COLORS: Record<string, string> = {
  'Chrome/FCM': '#4285F4', 'Firefox': '#FF7139', 'Safari': '#006CFF',
  'Edge': '#0078D7', 'أخرى': '#8b5cf6',
};

function detectPlatform(endpoint: string): string {
  if (endpoint.includes('fcm') || endpoint.includes('googleapis')) return 'Chrome/FCM';
  if (endpoint.includes('mozilla') || endpoint.includes('push.services.mozilla')) return 'Firefox';
  if (endpoint.includes('apple') || endpoint.includes('safari')) return 'Safari';
  if (endpoint.includes('notify.windows') || endpoint.includes('wns')) return 'Edge';
  return 'أخرى';
}

function isEndpointValid(endpoint: string): boolean {
  return !endpoint.includes('permanently-removed') && !endpoint.includes('invalid') && endpoint.startsWith('https://');
}

const ORG_TYPES: Record<string, string> = {
  generator: 'مولّد نفايات', transporter: 'ناقل', recycler: 'مدوّر',
  disposal: 'تخلص نهائي', transport_office: 'مكتب نقل',
};

const NOTIF_TYPES = [
  { value: 'general', label: 'عام' }, { value: 'system', label: 'نظام' },
  { value: 'shipment', label: 'شحنة' }, { value: 'emergency', label: 'طوارئ 🚨' },
  { value: 'marketing', label: 'تسويقي 📢' }, { value: 'alert', label: 'تنبيه' },
];

const PRIORITIES = [
  { value: 'normal', label: 'عادي' }, { value: 'important', label: '⚡ مهم' },
  { value: 'urgent', label: '🔴 عاجل' },
];

const PushNotificationStats = () => {
  const { user } = useAuth();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  // Send center state
  const [campTitle, setCampTitle] = useState('');
  const [campBody, setCampBody] = useState('');
  const [campType, setCampType] = useState('general');
  const [campPriority, setCampPriority] = useState('normal');
  const [campTargetType, setCampTargetType] = useState('all');
  const [campTargetIds, setCampTargetIds] = useState<string[]>([]);
  const [campOrgType, setCampOrgType] = useState('');
  const [campUrl, setCampUrl] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: subs } = await supabase.from('push_subscriptions').select('*').order('created_at', { ascending: false });
      const userIds = [...new Set((subs || []).map(s => s.user_id))];
      let profiles: any[] = [];
      if (userIds.length > 0) {
        const { data: p } = await supabase.from('profiles').select('user_id, full_name, phone, avatar_url').in('user_id', userIds);
        profiles = p || [];
      }
      let orgMap: Record<string, { name: string; type: string }> = {};
      if (userIds.length > 0) {
        const { data: members } = await supabase
          .from('organization_members')
          .select('user_id, organizations(name, organization_type)')
          .in('user_id', userIds).eq('status', 'active');
        (members || []).forEach((m: any) => {
          if (m.organizations) orgMap[m.user_id] = { name: m.organizations.name, type: m.organizations.organization_type };
        });
      }
      setSubscribers((subs || []).map(s => {
        const prof = profiles.find(p => p.user_id === s.user_id);
        const org = orgMap[s.user_id];
        return { ...s, full_name: prof?.full_name || 'غير معروف', phone: prof?.phone, avatar_url: prof?.avatar_url, org_name: org?.name, org_type: org?.type };
      }));

      const { data: logs } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(100);
      const logUserIds = [...new Set((logs || []).map(l => l.user_id))];
      let logProfiles: any[] = [];
      if (logUserIds.length > 0) {
        const { data: lp } = await supabase.from('profiles').select('user_id, full_name').in('user_id', logUserIds);
        logProfiles = lp || [];
      }
      setNotificationLogs((logs || []).map(l => ({
        ...l, full_name: logProfiles.find(p => p.user_id === l.user_id)?.full_name || 'غير معروف',
      })));

      // Fetch campaigns
      const { data: camps } = await supabase.from('push_campaigns').select('*').order('created_at', { ascending: false }).limit(50);
      const campSenderIds = [...new Set((camps || []).map(c => c.sender_id).filter(Boolean))];
      let campProfiles: any[] = [];
      if (campSenderIds.length > 0) {
        const { data: cp } = await supabase.from('profiles').select('user_id, full_name').in('user_id', campSenderIds);
        campProfiles = cp || [];
      }
      setCampaigns((camps || []).map(c => ({
        ...c, sender_name: campProfiles.find(p => p.user_id === c.sender_id)?.full_name || 'نظام',
      })));

      // Fetch blacklist
      const { data: bl } = await supabase.from('push_blacklist').select('*').order('created_at', { ascending: false });
      const blUserIds = [...new Set((bl || []).map(b => b.user_id))];
      let blProfiles: any[] = [];
      if (blUserIds.length > 0) {
        const { data: bp } = await supabase.from('profiles').select('user_id, full_name').in('user_id', blUserIds);
        blProfiles = bp || [];
      }
      setBlacklist((bl || []).map(b => ({
        ...b, full_name: blProfiles.find(p => p.user_id === b.user_id)?.full_name || 'غير معروف',
      })));
    } catch (err) {
      console.error('Error fetching push stats:', err);
      toast.error('خطأ في جلب البيانات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Computed
  const uniqueUsers = [...new Set(subscribers.map(s => s.user_id))];
  const totalDevices = subscribers.length;
  const validSubs = subscribers.filter(s => isEndpointValid(s.endpoint));
  const invalidSubs = subscribers.filter(s => !isEndpointValid(s.endpoint));
  const blacklistedIds = new Set(blacklist.map(b => b.user_id));

  const platformStats = subscribers.reduce<Record<string, number>>((acc, s) => {
    const p = detectPlatform(s.endpoint);
    acc[p] = (acc[p] || 0) + 1; return acc;
  }, {});
  const platformChartData = Object.entries(platformStats).map(([name, value]) => ({
    name, value, color: PLATFORM_COLORS[name] || '#8b5cf6',
  }));

  const userGroups = uniqueUsers.map(uid => {
    const userSubs = subscribers.filter(s => s.user_id === uid);
    const first = userSubs[0];
    return {
      user_id: uid, full_name: first?.full_name || 'غير معروف',
      phone: first?.phone, org_name: first?.org_name, org_type: first?.org_type,
      devices: userSubs.length, validDevices: userSubs.filter(s => isEndpointValid(s.endpoint)).length,
      platforms: [...new Set(userSubs.map(s => detectPlatform(s.endpoint)))],
      firstSub: userSubs.reduce((min, s) => s.created_at < min ? s.created_at : min, userSubs[0].created_at),
      lastSub: userSubs.reduce((max, s) => s.created_at > max ? s.created_at : max, userSubs[0].created_at),
      subscriptions: userSubs,
      isBlacklisted: blacklistedIds.has(uid),
    };
  });

  const filteredUsers = userGroups.filter(u =>
    !searchQuery || u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.phone?.includes(searchQuery) || u.org_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const notifTypeStats = notificationLogs.reduce<Record<string, number>>((acc, n) => {
    acc[n.type || 'general'] = (acc[n.type || 'general'] || 0) + 1; return acc;
  }, {});
  const notifTypeChartData = Object.entries(notifTypeStats).map(([name, value]) => ({ name: translateType(name), value }));
  const readRate = notificationLogs.length > 0
    ? Math.round((notificationLogs.filter(n => n.is_read).length / notificationLogs.length) * 100) : 0;

  // === Actions ===
  const sendCampaign = async () => {
    if (!campTitle || !campBody) { toast.error('أدخل العنوان والنص'); return; }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-push', {
        body: {
          action: 'campaign',
          sender_id: user?.id,
          title: campTitle, body: campBody,
          type: campType, priority: campPriority,
          target_type: campTargetType,
          target_ids: campTargetType === 'specific' ? campTargetIds : campTargetType === 'organization' ? campTargetIds : undefined,
          target_org_type: campTargetType === 'org_type' ? campOrgType : undefined,
          url: campUrl || undefined,
        },
      });
      if (error) throw error;
      toast.success(`✅ تم الإرسال: ${data?.sent || 0} نجح، ${data?.failed || 0} فشل`);
      setCampTitle(''); setCampBody(''); setCampUrl('');
      fetchData();
    } catch (err: any) {
      toast.error('فشل الإرسال: ' + (err.message || 'خطأ'));
    } finally { setSending(false); }
  };

  const toggleBlacklist = async (userId: string, userName: string) => {
    if (blacklistedIds.has(userId)) {
      await supabase.from('push_blacklist').delete().eq('user_id', userId);
      toast.success(`تم رفع الحظر عن ${userName}`);
    } else {
      await supabase.from('push_blacklist').insert({ user_id: userId, blocked_by: user?.id, reason: 'حظر يدوي' } as any);
      toast.success(`تم حظر ${userName} من الإشعارات`);
    }
    fetchData();
  };

  const cleanInvalid = async () => {
    if (invalidSubs.length === 0) { toast.info('لا توجد اشتراكات تالفة'); return; }
    for (const sub of invalidSubs) { await supabase.from('push_subscriptions').delete().eq('id', sub.id); }
    toast.success(`تم حذف ${invalidSubs.length} اشتراك تالف`);
    fetchData();
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
                مركز إدارة الإشعارات
              </h1>
              <p className="text-sm text-muted-foreground">تحكم كامل في إرسال وإدارة إشعارات الدفع</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCcw className={`h-4 w-4 ml-1 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { icon: Users, value: uniqueUsers.length, label: 'مشتركين', color: 'text-primary', bg: 'bg-primary/5 border-primary/20' },
            { icon: Smartphone, value: totalDevices, label: 'أجهزة مسجلة', color: 'text-blue-500', bg: 'bg-blue-500/5 border-blue-500/20' },
            { icon: Wifi, value: validSubs.length, label: 'اشتراكات صالحة', color: 'text-emerald-500', bg: 'bg-emerald-500/5 border-emerald-500/20' },
            { icon: Ban, value: blacklist.length, label: 'محظورين', color: 'text-amber-500', bg: 'bg-amber-500/5 border-amber-500/20' },
            { icon: Megaphone, value: campaigns.length, label: 'حملات مرسلة', color: 'text-purple-500', bg: 'bg-purple-500/5 border-purple-500/20' },
          ].map((kpi, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className={kpi.bg}>
                <CardContent className="p-3 text-center">
                  <kpi.icon className={`h-5 w-5 mx-auto mb-1 ${kpi.color}`} />
                  <p className="text-xl font-bold text-foreground">{kpi.value}</p>
                  <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
          <TabsList className="w-full flex-wrap h-auto gap-1">
            <TabsTrigger value="overview" className="flex items-center gap-1 text-xs">
              <BarChart3 className="h-3.5 w-3.5" /> نظرة عامة
            </TabsTrigger>
            <TabsTrigger value="send" className="flex items-center gap-1 text-xs">
              <Megaphone className="h-3.5 w-3.5" /> مركز الإرسال
            </TabsTrigger>
            <TabsTrigger value="subscribers" className="flex items-center gap-1 text-xs">
              <Users className="h-3.5 w-3.5" /> التحكم بالمشتركين
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="flex items-center gap-1 text-xs">
              <History className="h-3.5 w-3.5" /> سجل الحملات
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-1 text-xs">
              <Activity className="h-3.5 w-3.5" /> سجل الإشعارات
            </TabsTrigger>
          </TabsList>

          {/* ===== Overview Tab ===== */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" /> توزيع المنصات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {platformChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={platformChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {platformChartData.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">لا توجد بيانات</div>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Bell className="h-4 w-4 text-primary" /> أنواع الإشعارات (آخر 100)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {notifTypeChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={notifTypeChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" /> <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                        <Tooltip /> <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">لا توجد بيانات</div>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Eye className="h-4 w-4 text-primary" /> نسبة القراءة
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

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" /> صحة المنظومة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    {invalidSubs.length === 0 ? <CheckCircle className="h-5 w-5 text-emerald-500" /> : <XCircle className="h-5 w-5 text-destructive" />}
                    <span className="text-sm">{invalidSubs.length === 0 ? 'جميع الاشتراكات صالحة ✅' : `${invalidSubs.length} تالفة`}</span>
                  </div>
                  {invalidSubs.length > 0 && (
                    <Button size="sm" variant="destructive" onClick={cleanInvalid} className="w-full">
                      <Trash2 className="h-4 w-4 ml-1" /> تنظيف التالفة
                    </Button>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Zap className="h-3 w-3" />
                      <span>أجهزة/مستخدم: {uniqueUsers.length > 0 ? (totalDevices / uniqueUsers.length).toFixed(1) : 0}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <TrendingUp className="h-3 w-3" />
                      <span>صلاحية: {totalDevices > 0 ? Math.round((validSubs.length / totalDevices) * 100) : 100}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ===== Send Center Tab ===== */}
          <TabsContent value="send" className="space-y-4 mt-4">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-primary" /> مركز الإرسال المتقدم
                </CardTitle>
                <CardDescription>أرسل إشعار Push + In-App لجمهورك المستهدف</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">عنوان الإشعار *</label>
                    <Input value={campTitle} onChange={e => setCampTitle(e.target.value)} placeholder="🔔 عنوان الإشعار" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">رابط (اختياري)</label>
                    <div className="relative">
                      <Link className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input value={campUrl} onChange={e => setCampUrl(e.target.value)} placeholder="https://..." className="pr-10" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">نص الإشعار *</label>
                  <Textarea value={campBody} onChange={e => setCampBody(e.target.value)} placeholder="محتوى الإشعار..." rows={3} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">نوع الإشعار</label>
                    <Select value={campType} onValueChange={setCampType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {NOTIF_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">الأولوية</label>
                    <Select value={campPriority} onValueChange={setCampPriority}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">المستلمين</label>
                    <Select value={campTargetType} onValueChange={setCampTargetType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">🌍 جميع المشتركين ({uniqueUsers.length})</SelectItem>
                        <SelectItem value="specific">👤 مستخدمين محددين</SelectItem>
                        <SelectItem value="org_type">🏢 حسب نوع الجهة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {campTargetType === 'specific' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">اختر المستخدمين</label>
                    <div className="max-h-48 overflow-y-auto border border-border rounded-lg p-2 space-y-1">
                      {userGroups.map(u => (
                        <label key={u.user_id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer">
                          <input type="checkbox" checked={campTargetIds.includes(u.user_id)}
                            onChange={e => {
                              if (e.target.checked) setCampTargetIds(prev => [...prev, u.user_id]);
                              else setCampTargetIds(prev => prev.filter(id => id !== u.user_id));
                            }}
                            className="rounded border-input"
                          />
                          <span className="text-sm">{u.full_name}</span>
                          {u.org_name && <Badge variant="outline" className="text-[10px]">{u.org_name}</Badge>}
                          {u.isBlacklisted && <Badge variant="destructive" className="text-[10px]">محظور</Badge>}
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">تم اختيار {campTargetIds.length} مستخدم</p>
                  </div>
                )}

                {campTargetType === 'org_type' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">نوع الجهة</label>
                    <Select value={campOrgType} onValueChange={setCampOrgType}>
                      <SelectTrigger><SelectValue placeholder="اختر نوع الجهة" /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(ORG_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Preview */}
                {(campTitle || campBody) && (
                  <Card className="bg-muted/50 border-dashed">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-2">معاينة الإشعار:</p>
                      <div className="bg-background rounded-lg p-3 border shadow-sm">
                        <p className="font-bold text-sm">{campTitle || '(بدون عنوان)'}</p>
                        <p className="text-xs text-muted-foreground mt-1">{campBody || '(بدون نص)'}</p>
                        {campUrl && <p className="text-[10px] text-primary mt-1">🔗 {campUrl}</p>}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Button className="w-full" size="lg" onClick={sendCampaign}
                  disabled={sending || !campTitle || !campBody}>
                  {sending ? <Loader2 className="h-5 w-5 animate-spin ml-2" /> : <Send className="h-5 w-5 ml-2" />}
                  {sending ? 'جاري الإرسال...' : `إرسال الآن (${campTargetType === 'all' ? uniqueUsers.length : campTargetType === 'specific' ? campTargetIds.length : '؟'} مستلم)`}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== Subscriber Control Tab ===== */}
          <TabsContent value="subscribers" className="space-y-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="بحث بالاسم أو الهاتف أو الجهة..." value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)} className="pr-10" />
              </div>
              <Badge variant="outline">{filteredUsers.length} مشترك</Badge>
              <Badge variant="destructive" className="text-[10px]">{blacklist.length} محظور</Badge>
            </div>

            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredUsers.map((u, i) => (
                    <motion.div key={u.user_id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                      <Card className={`transition-colors ${u.isBlacklisted ? 'border-destructive/30 bg-destructive/5' : 'hover:border-primary/30'}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between cursor-pointer"
                            onClick={() => setExpandedUser(expandedUser === u.user_id ? null : u.user_id)}>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className={`font-bold text-sm ${u.isBlacklisted ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                                  {(u.full_name || '?')[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-sm text-foreground">{u.full_name}</p>
                                  {u.isBlacklisted && <Badge variant="destructive" className="text-[10px]"><Ban className="h-3 w-3 ml-0.5" /> محظور</Badge>}
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  {u.org_name && <Badge variant="outline" className="text-[10px]">{u.org_name}</Badge>}
                                  {u.org_type && <Badge variant="secondary" className="text-[10px]">{ORG_TYPES[u.org_type] || u.org_type}</Badge>}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-center">
                                <p className="text-lg font-bold text-foreground">{u.devices}</p>
                                <p className="text-[10px] text-muted-foreground">جهاز</p>
                              </div>
                              {/* Blacklist toggle */}
                              <div onClick={e => e.stopPropagation()}>
                                <Switch
                                  checked={!u.isBlacklisted}
                                  onCheckedChange={() => toggleBlacklist(u.user_id, u.full_name)}
                                  className="data-[state=unchecked]:bg-destructive"
                                />
                              </div>
                              {expandedUser === u.user_id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                            </div>
                          </div>

                          <AnimatePresence>
                            {expandedUser === u.user_id && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
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
                                      <p className="text-muted-foreground">الحالة</p>
                                      <p className={`font-medium ${u.isBlacklisted ? 'text-destructive' : 'text-emerald-600'}`}>
                                        {u.isBlacklisted ? '🚫 محظور' : '✅ نشط'}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    {u.subscriptions.map(sub => (
                                      <div key={sub.id} className="flex items-center gap-2 text-[10px] bg-muted/30 rounded p-2">
                                        {isEndpointValid(sub.endpoint) ? <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" /> : <XCircle className="h-3 w-3 text-destructive shrink-0" />}
                                        <span className="font-mono text-muted-foreground truncate flex-1">{sub.endpoint.slice(0, 80)}...</span>
                                        <Badge variant="outline" className="text-[9px]">{detectPlatform(sub.endpoint)}</Badge>
                                      </div>
                                    ))}
                                  </div>
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

          {/* ===== Campaigns Log Tab ===== */}
          <TabsContent value="campaigns" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" /> سجل الحملات المرسلة
                </CardTitle>
                <CardDescription>تتبع كل حملة: مَن أرسلها، لمَن، ونتيجتها</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {campaigns.map(c => (
                      <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-bold text-sm text-foreground">{c.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">{c.body}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={c.priority === 'urgent' ? 'destructive' : c.priority === 'important' ? 'default' : 'secondary'} className="text-[10px]">
                                {PRIORITIES.find(p => p.value === c.priority)?.label || c.priority}
                              </Badge>
                              <Badge variant="outline" className="text-[10px]">
                                {NOTIF_TYPES.find(t => t.value === c.type)?.label || c.type}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <Target className="h-3 w-3" />
                              {c.target_type === 'all' ? 'الجميع' : c.target_type === 'specific' ? `${c.target_ids?.length || 0} مستخدم` : c.target_org_type ? ORG_TYPES[c.target_org_type] || c.target_org_type : c.target_type}
                            </span>
                            <span className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-emerald-500" /> {c.total_sent} نجح
                            </span>
                            {c.total_failed > 0 && (
                              <span className="flex items-center gap-1">
                                <XCircle className="h-3 w-3 text-destructive" /> {c.total_failed} فشل
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(c.created_at), { locale: ar, addSuffix: true })}
                            </span>
                            <span>👤 {c.sender_name}</span>
                            {c.url && <span className="flex items-center gap-1 text-primary"><Link className="h-3 w-3" /> {c.url.slice(0, 40)}</span>}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {campaigns.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>لم يتم إرسال أي حملة بعد</p>
                        <p className="text-xs mt-1">استخدم "مركز الإرسال" لبدء حملتك الأولى</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== Notification Logs Tab ===== */}
          <TabsContent value="logs" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" /> آخر 100 إشعار
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {notificationLogs.map(log => (
                      <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                        <div className="mt-1">
                          {log.is_read ? <Eye className="h-4 w-4 text-emerald-500" /> : <Bell className="h-4 w-4 text-amber-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-foreground">{log.title}</p>
                            <Badge variant={log.is_read ? 'secondary' : 'default'} className="text-[10px]">
                              {log.is_read ? 'مقروء' : 'غير مقروء'}
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">{translateType(log.type)}</Badge>
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
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

function translateType(type: string): string {
  const map: Record<string, string> = {
    general: 'عام', system: 'نظام', shipment: 'شحنة', deposit: 'إيداع',
    emergency: 'طوارئ', message: 'رسالة', approval: 'موافقة', alert: 'تنبيه',
    partner: 'شريك', driver: 'سائق', marketing: 'تسويقي',
  };
  return map[type] || type;
}

export default PushNotificationStats;
