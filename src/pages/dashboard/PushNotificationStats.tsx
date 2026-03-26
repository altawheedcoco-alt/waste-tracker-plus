import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow, subDays } from 'date-fns';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Bell, BellRing, Users, Smartphone, Monitor, Globe, Search, RefreshCcw, Send,
  Loader2, CheckCircle, XCircle, Clock, TrendingUp, BarChart3, Wifi, WifiOff,
  Trash2, ChevronDown, ChevronUp, Activity, Zap, Shield, Eye, Ban, Megaphone,
  Target, UserX, History, Link, AlertTriangle, FileText, Download, RotateCcw,
  Plus, Save, BookTemplate, Calendar, Filter, X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

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
  status?: string; scheduled_at?: string; template_id?: string;
}

interface CampaignRecipient {
  id: string; campaign_id: string; user_id: string; status: string;
  error_message: string | null; delivered_at: string | null; created_at: string;
  full_name?: string;
}

interface BlacklistEntry {
  id: string; user_id: string; blocked_by: string | null; reason: string | null;
  created_at: string; full_name?: string;
}

interface PushTemplate {
  id: string; name: string; title: string; body: string; type: string;
  priority: string; url: string | null; icon: string | null;
  created_by: string | null; is_default: boolean; created_at: string;
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
  const [templates, setTemplates] = useState<PushTemplate[]>([]);
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
  const [campScheduled, setCampScheduled] = useState(false);
  const [campScheduleDate, setCampScheduleDate] = useState('');

  // Template dialog
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<PushTemplate | null>(null);

  // Campaign detail dialog
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [campaignRecipients, setCampaignRecipients] = useState<CampaignRecipient[]>([]);
  const [retrying, setRetrying] = useState(false);

  // Log filters
  const [logFilterType, setLogFilterType] = useState('all');
  const [logFilterRead, setLogFilterRead] = useState('all');

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

      const { data: logs } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(200);
      const logUserIds = [...new Set((logs || []).map(l => l.user_id))];
      let logProfiles: any[] = [];
      if (logUserIds.length > 0) {
        const { data: lp } = await supabase.from('profiles').select('user_id, full_name').in('user_id', logUserIds);
        logProfiles = lp || [];
      }
      setNotificationLogs((logs || []).map(l => ({
        ...l, full_name: logProfiles.find(p => p.user_id === l.user_id)?.full_name || 'غير معروف',
      })));

      const { data: camps } = await (supabase.from('push_campaigns') as any).select('*').order('created_at', { ascending: false }).limit(50);
      const campSenderIds = [...new Set((camps || []).map((c: any) => c.sender_id).filter(Boolean))];
      let campProfiles: any[] = [];
      if (campSenderIds.length > 0) {
        const { data: cp } = await supabase.from('profiles').select('user_id, full_name').in('user_id', campSenderIds);
        campProfiles = cp || [];
      }
      setCampaigns((camps || []).map((c: any) => ({
        ...c, sender_name: campProfiles.find(p => p.user_id === c.sender_id)?.full_name || 'نظام',
      })));

      const { data: bl } = await supabase.from('push_blacklist').select('*').order('created_at', { ascending: false });
      const blUserIds = [...new Set((bl || []).map((b: any) => b.user_id))];
      let blProfiles: any[] = [];
      if (blUserIds.length > 0) {
        const { data: bp } = await supabase.from('profiles').select('user_id, full_name').in('user_id', blUserIds);
        blProfiles = bp || [];
      }
      setBlacklist((bl || []).map((b: any) => ({
        ...b, full_name: blProfiles.find(p => p.user_id === b.user_id)?.full_name || 'غير معروف',
      })));

      // Fetch templates
      const { data: tmpl } = await (supabase.from('push_templates') as any).select('*').order('created_at', { ascending: false });
      setTemplates(tmpl || []);
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

  // Campaign timeline chart
  const campaignTimelineData = (() => {
    const last14 = Array.from({ length: 14 }, (_, i) => {
      const d = subDays(new Date(), 13 - i);
      const key = format(d, 'MM/dd');
      const dayCamps = campaigns.filter(c => format(new Date(c.created_at), 'MM/dd') === key);
      return { date: key, حملات: dayCamps.length, نجح: dayCamps.reduce((s, c) => s + c.total_sent, 0), فشل: dayCamps.reduce((s, c) => s + c.total_failed, 0) };
    });
    return last14;
  })();

  // Filtered logs
  const filteredLogs = notificationLogs.filter(l => {
    if (logFilterType !== 'all' && l.type !== logFilterType) return false;
    if (logFilterRead === 'read' && !l.is_read) return false;
    if (logFilterRead === 'unread' && l.is_read) return false;
    return true;
  });

  // === Actions ===
  const sendCampaign = async () => {
    if (!campTitle || !campBody) { toast.error('أدخل العنوان والنص'); return; }
    if (campScheduled && !campScheduleDate) { toast.error('حدد تاريخ الجدولة'); return; }
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
          scheduled_at: campScheduled ? campScheduleDate : undefined,
        },
      });
      if (error) throw error;
      if (data?.scheduled) {
        toast.success(`📅 تم جدولة الحملة: ${data.recipients} مستلم`);
      } else {
        toast.success(`✅ تم الإرسال: ${data?.sent || 0} نجح، ${data?.failed || 0} فشل`);
      }
      setCampTitle(''); setCampBody(''); setCampUrl(''); setCampScheduled(false); setCampScheduleDate('');
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

  // Template actions
  const saveTemplate = async () => {
    if (!templateName || !campTitle || !campBody) { toast.error('أدخل اسم القالب والعنوان والنص'); return; }
    const templateData = {
      name: templateName, title: campTitle, body: campBody,
      type: campType, priority: campPriority, url: campUrl || null,
      icon: null, created_by: user?.id, is_default: false,
    };
    if (editingTemplate) {
      await (supabase.from('push_templates') as any).update(templateData).eq('id', editingTemplate.id);
      toast.success('تم تحديث القالب');
    } else {
      await (supabase.from('push_templates') as any).insert(templateData);
      toast.success('تم حفظ القالب');
    }
    setShowTemplateDialog(false); setTemplateName(''); setEditingTemplate(null);
    fetchData();
  };

  const applyTemplate = (t: PushTemplate) => {
    setCampTitle(t.title); setCampBody(t.body); setCampType(t.type);
    setCampPriority(t.priority); setCampUrl(t.url || '');
    setActiveTab('send');
    toast.success(`تم تحميل قالب "${t.name}"`);
  };

  const deleteTemplate = async (id: string) => {
    await (supabase.from('push_templates') as any).delete().eq('id', id);
    toast.success('تم حذف القالب');
    fetchData();
  };

  // Campaign details
  const viewCampaignDetails = async (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    const { data: recipients } = await (supabase.from('push_campaign_recipients') as any)
      .select('*').eq('campaign_id', campaign.id).order('created_at', { ascending: false });
    const recipientUserIds = [...new Set((recipients || []).map((r: any) => r.user_id))];
    let recProfiles: any[] = [];
    if (recipientUserIds.length > 0) {
      const { data: rp } = await supabase.from('profiles').select('user_id, full_name').in('user_id', recipientUserIds);
      recProfiles = rp || [];
    }
    setCampaignRecipients((recipients || []).map((r: any) => ({
      ...r, full_name: recProfiles.find(p => p.user_id === r.user_id)?.full_name || 'غير معروف',
    })));
  };

  const retryFailed = async (campaignId: string) => {
    setRetrying(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-push', {
        body: { action: 'retry_failed', campaign_id: campaignId },
      });
      if (error) throw error;
      toast.success(`✅ إعادة الإرسال: ${data?.sent || 0} نجح، ${data?.failed || 0} فشل`);
      if (selectedCampaign) viewCampaignDetails(selectedCampaign);
      fetchData();
    } catch (err: any) {
      toast.error('فشل إعادة الإرسال: ' + (err.message || 'خطأ'));
    } finally { setRetrying(false); }
  };

  // Export CSV
  const exportSubscribersCSV = () => {
    const bom = '\uFEFF';
    const headers = ['الاسم', 'الهاتف', 'الجهة', 'نوع الجهة', 'الأجهزة', 'المنصة', 'الحالة', 'تاريخ الاشتراك'];
    const rows = userGroups.map(u => [
      u.full_name, u.phone || '', u.org_name || '', ORG_TYPES[u.org_type || ''] || '',
      u.devices, u.platforms.join(', '), u.isBlacklisted ? 'محظور' : 'نشط',
      format(new Date(u.firstSub), 'yyyy-MM-dd HH:mm'),
    ]);
    const csv = bom + [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `push-subscribers-${format(new Date(), 'yyyy-MM-dd')}.csv`; a.click();
    toast.success('تم تصدير المشتركين');
  };

  const exportCampaignsCSV = () => {
    const bom = '\uFEFF';
    const headers = ['العنوان', 'النص', 'النوع', 'الأولوية', 'المستهدف', 'نجح', 'فشل', 'المرسل', 'التاريخ', 'الحالة'];
    const rows = campaigns.map(c => [
      c.title, c.body, c.type, c.priority, c.target_type,
      c.total_sent, c.total_failed, c.sender_name || '',
      format(new Date(c.created_at), 'yyyy-MM-dd HH:mm'), c.status || 'sent',
    ]);
    const csv = bom + [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `push-campaigns-${format(new Date(), 'yyyy-MM-dd')}.csv`; a.click();
    toast.success('تم تصدير سجل الحملات');
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
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { icon: Users, value: uniqueUsers.length, label: 'مشتركين', color: 'text-primary', bg: 'bg-primary/5 border-primary/20' },
            { icon: Smartphone, value: totalDevices, label: 'أجهزة مسجلة', color: 'text-blue-500', bg: 'bg-blue-500/5 border-blue-500/20' },
            { icon: Wifi, value: validSubs.length, label: 'صالحة', color: 'text-emerald-500', bg: 'bg-emerald-500/5 border-emerald-500/20' },
            { icon: Ban, value: blacklist.length, label: 'محظورين', color: 'text-amber-500', bg: 'bg-amber-500/5 border-amber-500/20' },
            { icon: Megaphone, value: campaigns.length, label: 'حملات', color: 'text-purple-500', bg: 'bg-purple-500/5 border-purple-500/20' },
            { icon: FileText, value: templates.length, label: 'قوالب', color: 'text-cyan-500', bg: 'bg-cyan-500/5 border-cyan-500/20' },
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
            <TabsTrigger value="templates" className="flex items-center gap-1 text-xs">
              <FileText className="h-3.5 w-3.5" /> القوالب
            </TabsTrigger>
            <TabsTrigger value="subscribers" className="flex items-center gap-1 text-xs">
              <Users className="h-3.5 w-3.5" /> المشتركين
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="flex items-center gap-1 text-xs">
              <History className="h-3.5 w-3.5" /> الحملات
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-1 text-xs">
              <Activity className="h-3.5 w-3.5" /> السجل
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
                    <TrendingUp className="h-4 w-4 text-primary" /> أداء الحملات (14 يوم)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={campaignTimelineData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="نجح" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="فشل" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
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

                {/* Scheduling */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div className="flex items-center gap-2 flex-1">
                    <label className="text-sm font-medium">جدولة الإرسال</label>
                    <Switch checked={campScheduled} onCheckedChange={setCampScheduled} />
                  </div>
                  {campScheduled && (
                    <Input type="datetime-local" value={campScheduleDate}
                      onChange={e => setCampScheduleDate(e.target.value)}
                      className="w-auto text-sm" />
                  )}
                </div>

                {/* Mobile Preview */}
                {(campTitle || campBody) && (
                  <div className="flex justify-center">
                    <div className="w-[320px] bg-gradient-to-b from-muted/80 to-muted/40 rounded-[20px] p-3 border border-border shadow-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-[10px] text-muted-foreground">iRecycle • الآن</span>
                      </div>
                      <div className="bg-background rounded-xl p-3 border shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <BellRing className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-foreground">{campTitle || '(بدون عنوان)'}</p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{campBody || '(بدون نص)'}</p>
                            {campUrl && <p className="text-[10px] text-primary mt-1 truncate">🔗 {campUrl}</p>}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between mt-2 px-2">
                        <span className="text-[9px] text-muted-foreground">📱 معاينة إشعار الهاتف</span>
                        <Badge variant="outline" className="text-[9px]">{NOTIF_TYPES.find(t => t.value === campType)?.label}</Badge>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button className="flex-1" size="lg" onClick={sendCampaign}
                    disabled={sending || !campTitle || !campBody}>
                    {sending ? <Loader2 className="h-5 w-5 animate-spin ml-2" /> : campScheduled ? <Calendar className="h-5 w-5 ml-2" /> : <Send className="h-5 w-5 ml-2" />}
                    {sending ? 'جاري الإرسال...' : campScheduled ? 'جدولة الحملة' : `إرسال الآن (${campTargetType === 'all' ? uniqueUsers.length : campTargetType === 'specific' ? campTargetIds.length : '؟'} مستلم)`}
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => {
                    setTemplateName(''); setEditingTemplate(null); setShowTemplateDialog(true);
                  }} disabled={!campTitle || !campBody} title="حفظ كقالب">
                    <Save className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== Templates Tab ===== */}
          <TabsContent value="templates" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> قوالب الإشعارات الجاهزة
              </h3>
              <Button size="sm" variant="outline" onClick={() => {
                setCampTitle(''); setCampBody(''); setCampType('general'); setCampPriority('normal'); setCampUrl('');
                setTemplateName(''); setEditingTemplate(null); setShowTemplateDialog(true); setActiveTab('send');
              }}>
                <Plus className="h-4 w-4 ml-1" /> قالب جديد
              </Button>
            </div>
            {templates.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>لا توجد قوالب بعد</p>
                  <p className="text-xs mt-1">أنشئ إشعاراً في "مركز الإرسال" ثم احفظه كقالب</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {templates.map(t => (
                  <Card key={t.id} className="hover:border-primary/30 transition-colors">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-sm text-foreground">{t.name}</p>
                          <div className="flex gap-1 mt-1">
                            <Badge variant="outline" className="text-[10px]">{NOTIF_TYPES.find(n => n.value === t.type)?.label || t.type}</Badge>
                            <Badge variant="secondary" className="text-[10px]">{PRIORITIES.find(p => p.value === t.priority)?.label || t.priority}</Badge>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" className="text-destructive h-7 w-7 p-0" onClick={() => deleteTemplate(t.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-2">
                        <p className="text-xs font-semibold">{t.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{t.body}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1 h-8 text-xs" onClick={() => applyTemplate(t)}>
                          <Send className="h-3 w-3 ml-1" /> استخدم القالب
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => {
                          setCampTitle(t.title); setCampBody(t.body); setCampType(t.type);
                          setCampPriority(t.priority); setCampUrl(t.url || '');
                          setTemplateName(t.name); setEditingTemplate(t); setShowTemplateDialog(true);
                        }}>
                          تعديل
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ===== Subscriber Control Tab ===== */}
          <TabsContent value="subscribers" className="space-y-4 mt-4">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="بحث بالاسم أو الهاتف أو الجهة..." value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)} className="pr-10" />
              </div>
              <Badge variant="outline">{filteredUsers.length} مشترك</Badge>
              <Badge variant="destructive" className="text-[10px]">{blacklist.length} محظور</Badge>
              <Button size="sm" variant="outline" onClick={exportSubscribersCSV}>
                <Download className="h-4 w-4 ml-1" /> CSV
              </Button>
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
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <History className="h-4 w-4 text-primary" /> سجل الحملات المرسلة
              </CardTitle>
              <Button size="sm" variant="outline" onClick={exportCampaignsCSV}>
                <Download className="h-4 w-4 ml-1" /> CSV
              </Button>
            </div>
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {campaigns.map(c => (
                  <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Card className="hover:border-primary/30 transition-colors cursor-pointer" onClick={() => viewCampaignDetails(c)}>
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-bold text-sm text-foreground">{c.title}</p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{c.body}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {c.status === 'scheduled' && <Badge variant="secondary" className="text-[10px]">📅 مجدولة</Badge>}
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
                          {c.url && <span className="flex items-center gap-1 text-primary"><Link className="h-3 w-3" /> رابط</span>}
                        </div>
                        {c.total_failed > 0 && (
                          <div className="flex justify-end" onClick={e => e.stopPropagation()}>
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => retryFailed(c.id)} disabled={retrying}>
                              {retrying ? <Loader2 className="h-3 w-3 animate-spin ml-1" /> : <RotateCcw className="h-3 w-3 ml-1" />}
                              إعادة إرسال الفاشلة
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
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
          </TabsContent>

          {/* ===== Notification Logs Tab ===== */}
          <TabsContent value="logs" className="space-y-4 mt-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={logFilterType} onValueChange={setLogFilterType}>
                <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الأنواع</SelectItem>
                  {NOTIF_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={logFilterRead} onValueChange={setLogFilterRead}>
                <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="read">مقروء</SelectItem>
                  <SelectItem value="unread">غير مقروء</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="outline" className="text-[10px]">{filteredLogs.length} نتيجة</Badge>
            </div>
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {filteredLogs.map(log => (
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
                {filteredLogs.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>لا توجد إشعارات مطابقة</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Template Save Dialog */}
        <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? 'تعديل القالب' : 'حفظ كقالب'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">اسم القالب</label>
                <Input value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="مثال: إشعار ترحيب، تحديث شحنة..." />
              </div>
              <div className="bg-muted/30 rounded-lg p-3 text-sm">
                <p className="font-semibold">{campTitle || '(بدون عنوان)'}</p>
                <p className="text-xs text-muted-foreground mt-1">{campBody || '(بدون نص)'}</p>
                <div className="flex gap-1 mt-2">
                  <Badge variant="outline" className="text-[10px]">{NOTIF_TYPES.find(t => t.value === campType)?.label}</Badge>
                  <Badge variant="secondary" className="text-[10px]">{PRIORITIES.find(p => p.value === campPriority)?.label}</Badge>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>إلغاء</Button>
              <Button onClick={saveTemplate} disabled={!templateName}>
                <Save className="h-4 w-4 ml-1" /> {editingTemplate ? 'تحديث' : 'حفظ'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Campaign Detail Dialog */}
        <Dialog open={!!selectedCampaign} onOpenChange={() => setSelectedCampaign(null)}>
          <DialogContent dir="rtl" className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-primary" />
                تفاصيل الحملة
              </DialogTitle>
            </DialogHeader>
            {selectedCampaign && (
              <div className="space-y-4">
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="font-bold text-sm">{selectedCampaign.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{selectedCampaign.body}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <span>👤 {selectedCampaign.sender_name}</span>
                    <span>•</span>
                    <span>{format(new Date(selectedCampaign.created_at), 'dd/MM/yyyy HH:mm', { locale: ar })}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-emerald-500/10 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-emerald-600">{selectedCampaign.total_sent}</p>
                    <p className="text-[10px] text-muted-foreground">نجح</p>
                  </div>
                  <div className="bg-destructive/10 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-destructive">{selectedCampaign.total_failed}</p>
                    <p className="text-[10px] text-muted-foreground">فشل</p>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-primary">{selectedCampaign.total_sent + selectedCampaign.total_failed}</p>
                    <p className="text-[10px] text-muted-foreground">الإجمالي</p>
                  </div>
                </div>

                {campaignRecipients.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2">المستلمين ({campaignRecipients.length})</p>
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-1">
                        {campaignRecipients.map(r => (
                          <div key={r.id} className="flex items-center gap-2 p-2 rounded bg-muted/30 text-xs">
                            {r.status === 'sent' ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> :
                              r.status === 'failed' ? <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" /> :
                                <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                            <span className="flex-1">{r.full_name}</span>
                            <Badge variant={r.status === 'sent' ? 'secondary' : r.status === 'failed' ? 'destructive' : 'outline'} className="text-[9px]">
                              {r.status === 'sent' ? 'وصل' : r.status === 'failed' ? 'فشل' : 'معلق'}
                            </Badge>
                            {r.error_message && <span className="text-destructive text-[9px] truncate max-w-[100px]">{r.error_message}</span>}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {selectedCampaign.total_failed > 0 && (
                  <Button className="w-full" variant="outline" onClick={() => retryFailed(selectedCampaign.id)} disabled={retrying}>
                    {retrying ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <RotateCcw className="h-4 w-4 ml-1" />}
                    إعادة إرسال الفاشلة ({selectedCampaign.total_failed})
                  </Button>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
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
