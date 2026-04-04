import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import BackButton from '@/components/ui/back-button';
import {
  MessageCircle, RefreshCw, TrendingUp, CheckCircle2, XCircle, Activity,
  Building2, FileText, BarChart3, Clock, AlertTriangle, ArrowUpRight, ArrowDownRight,
  Radio, Server, WifiOff, Globe, HeartPulse, Shield, Zap, Megaphone, Brain,
  Target, PieChart, CalendarDays, Hash, BookOpen, ExternalLink, Users
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import WhatsAppNotificationManager from '@/components/whatsapp/WhatsAppNotificationManager';
import WaPilotMessageLog from '@/components/whatsapp/WaPilotMessageLog';
import WaPilotInbox from '@/components/whatsapp/WaPilotInbox';
import WaPilotAIInsights from '@/components/whatsapp/WaPilotAIInsights';
import WaPilotConnectionCard from '@/components/whatsapp/WaPilotConnectionCard';
import WaPilotQuickSend from '@/components/whatsapp/WaPilotQuickSend';
import { toast } from 'sonner';
import type { InstanceInfo, MessageLog, OrgInfo, WaPilotStats } from '@/components/whatsapp/WaPilotTypes';
import { CHART_COLORS, parseWaPilotMessages } from '@/components/whatsapp/WaPilotTypes';

const WaPilotManagement = () => {
  const { roles } = useAuth();
  const isAdmin = roles.includes('admin');
  const [stats, setStats] = useState<WaPilotStats>({
    totalMessages: 0, sent: 0, failed: 0, pending: 0, delivered: 0,
    orgs: 0, users: 0, templates: 0, campaigns: 0, todayMessages: 0, weekMessages: 0,
  });
  const [messages, setMessages] = useState<MessageLog[]>([]);
  const [orgs, setOrgs] = useState<OrgInfo[]>([]);
  const [instances, setInstances] = useState<InstanceInfo[]>([]);
  const [instanceStatus, setInstanceStatus] = useState<'connected' | 'disconnected' | 'loading'>('loading');
  const [connectedPhone, setConnectedPhone] = useState<string | null>(null);
  const [connectedName, setConnectedName] = useState<string | null>(null);
  const [activeInstanceId, setActiveInstanceId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'overview' | 'inbox' | 'ai-insights' | 'manager'>('overview');
  const [uptime, setUptime] = useState<number>(0);
  const [connectionDiag, setConnectionDiag] = useState<any>(null);
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
  const [endpointStatuses, setEndpointStatuses] = useState<Record<string, 'ok' | 'error' | 'checking'>>({});

  useEffect(() => {
    if (!isAdmin) return;
    fetchAllData();
    const interval = setInterval(() => setUptime(p => p + 1), 1000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  const fetchAllData = useCallback(async () => {
    setRefreshing(true);
    setApiStatus('checking');
    try {
      const [msgRes, orgRes, userRes, tplRes, instRes, campaignRes, diagRes, orgListRes, wapilotMsgRes] = await Promise.all([
        supabase.from('whatsapp_messages').select('*').order('created_at', { ascending: false }).limit(1000),
        supabase.from('organizations').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).not('phone', 'is', null),
        supabase.from('whatsapp_templates').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.functions.invoke('wapilot-proxy', { body: { action: 'list-instances' } }).catch(() => ({ data: [] })),
        supabase.functions.invoke('wapilot-proxy', { body: { action: 'list-campaigns' } }).catch(() => ({ data: [] })),
        supabase.functions.invoke('wapilot-proxy', { body: { action: 'diagnostics' } }).catch(() => ({ data: null })),
        supabase.from('organizations').select('id, name, name_en').limit(1000),
        supabase.functions.invoke('wapilot-proxy', { body: { action: 'list-messages', limit: 500 } }).catch(() => ({ data: null })),
      ]);

      if (diagRes?.data) {
        setConnectionDiag(diagRes.data);
        const instStatus = diagRes.data.instance_status;
        if (instStatus?.success && instStatus?.status === 'WORKING') {
          setApiStatus('connected');
          setStatusMessage(instStatus.status_message || 'Everything is fine');
        } else {
          setApiStatus('error');
          setStatusMessage(instStatus?.status_message || 'Connection issue');
        }
      }

      const dbMsgs = (msgRes.data || []) as MessageLog[];
      const apiMsgs = parseWaPilotMessages(wapilotMsgRes?.data);
      const dbMsgIds = new Set(dbMsgs.map(m => m.meta_message_id).filter(Boolean));
      const uniqueApiMsgs = apiMsgs.filter(m => !m.meta_message_id || !dbMsgIds.has(m.meta_message_id));
      const msgs = [...dbMsgs, ...uniqueApiMsgs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setMessages(msgs);
      setOrgs((orgListRes?.data || []) as OrgInfo[]);

      const now = new Date();
      const todayMsgs = msgs.filter(m => new Date(m.created_at).toDateString() === now.toDateString());
      const weekAgo = new Date(now.getTime() - 7 * 86400000);
      const weekMsgs = msgs.filter(m => new Date(m.created_at) >= weekAgo);
      const campaignData = campaignRes?.data;
      const campaigns = Array.isArray(campaignData) ? campaignData : (campaignData?.data && Array.isArray(campaignData.data)) ? campaignData.data : [];

      setStats({
        totalMessages: msgs.length, sent: msgs.filter(m => m.status === 'sent').length,
        delivered: msgs.filter(m => m.status === 'delivered').length, failed: msgs.filter(m => m.status === 'failed').length,
        pending: msgs.filter(m => m.status === 'pending').length, orgs: orgRes.count || 0, users: userRes.count || 0,
        templates: tplRes.count || 0, campaigns: campaigns.length, todayMessages: todayMsgs.length, weekMessages: weekMsgs.length,
      });

      const rawInst = instRes?.data;
      const instList = Array.isArray(rawInst) ? rawInst : (rawInst && typeof rawInst === 'object' && !rawInst.message ? [rawInst] : []);
      setInstances(instList);
      if (instList.length > 0) {
        const active = instList.find((i: any) => i.status === 'active' || i.status === 'connected') || instList[0];
        setActiveInstanceId(active.id);
        setInstanceStatus(active.status === 'active' || active.status === 'connected' ? 'connected' : 'disconnected');
        setConnectedPhone(active.phone || active.me?.id?.replace('@c.us', '') || active.owner || null);
        setConnectedName(active.me?.pushName || active.name || null);
      } else {
        setInstanceStatus('disconnected');
      }

      // Subscription
      try {
        const { data: subData } = await supabase.from('user_subscriptions')
          .select('*, plan:subscription_plans(name, name_ar, duration_days)')
          .in('status', ['active', 'grace_period', 'trial']).order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (subData) {
          const startDate = subData.start_date ? new Date(subData.start_date) : null;
          const expiryDate = subData.expiry_date ? new Date(subData.expiry_date) : null;
          let daysRemaining: number | null = null, totalDays: number | null = null, progress = 0;
          if (startDate && expiryDate) {
            totalDays = Math.ceil((expiryDate.getTime() - startDate.getTime()) / 86400000);
            daysRemaining = Math.max(0, Math.ceil((expiryDate.getTime() - now.getTime()) / 86400000));
            progress = totalDays > 0 ? Math.round(((totalDays - daysRemaining) / totalDays) * 100) : 0;
          }
          setSubscriptionInfo({
            status: subData.status, plan_name: (subData.plan as any)?.name_ar || (subData.plan as any)?.name || null,
            start_date: subData.start_date, expiry_date: subData.expiry_date, days_remaining: daysRemaining,
            total_days: totalDays, progress, auto_renew: subData.auto_renew ?? false,
            total_seats: subData.total_seats || 1, total_amount: subData.total_amount || 0,
          });
        } else { setSubscriptionInfo(null); }
      } catch { /* ignore */ }

      // Endpoints
      const endpoints = [
        { name: 'wapilot-proxy', body: { action: 'diagnostics' } },
        { name: 'whatsapp-send', body: { action: 'health-check' } },
        { name: 'whatsapp-event', body: { event_type: 'health-check' } },
        { name: 'whatsapp-webhook', body: {} },
      ];
      const epStatuses: Record<string, 'ok' | 'error' | 'checking'> = {};
      endpoints.forEach(ep => { epStatuses[ep.name] = 'checking'; });
      setEndpointStatuses({ ...epStatuses });
      await Promise.all(endpoints.map(async ep => {
        try { const { error } = await supabase.functions.invoke(ep.name, { body: ep.body }); epStatuses[ep.name] = error ? 'error' : 'ok'; }
        catch { epStatuses[ep.name] = 'error'; }
      }));
      setEndpointStatuses({ ...epStatuses });
    } catch (e) { console.error('Fetch error:', e); setApiStatus('error'); }
    setRefreshing(false);
  }, []);

  const executeInstanceAction = async (action: string, label: string) => {
    if (!activeInstanceId) { toast.error('لا يوجد جهاز متصل'); return; }
    setActionLoading(action);
    try {
      const { data, error } = await supabase.functions.invoke('wapilot-proxy', { body: { action, instance_id: activeInstanceId } });
      if (error) throw error;
      if (action === 'get-qr') {
        const qr = data?.qr || data?.qrcode || data?.data?.qr;
        if (qr) toast.info('QR Code متاح - انتقل لتبويب الأجهزة للمسح');
        else toast.info('الجهاز متصل بالفعل - لا حاجة لـ QR');
      } else { toast.success(`تم تنفيذ: ${label}`); setTimeout(fetchAllData, 2000); }
    } catch (e: any) { toast.error(`فشل: ${e.message}`); }
    setActionLoading(null);
  };

  // Analytics
  const dailyTrend = useMemo(() => {
    const now = new Date();
    const days: { date: string; sent: number; failed: number; pending: number; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const dayStr = d.toLocaleDateString('ar-EG', { weekday: 'short' });
      const dayMsgs = messages.filter(m => new Date(m.created_at).toDateString() === d.toDateString());
      days.push({ date: dayStr, sent: dayMsgs.filter(m => m.status === 'sent' || m.status === 'delivered').length, failed: dayMsgs.filter(m => m.status === 'failed').length, pending: dayMsgs.filter(m => m.status === 'pending').length, total: dayMsgs.length });
    }
    return days;
  }, [messages]);

  const hourlyDistribution = useMemo(() => {
    const hours: Record<number, number> = {};
    messages.forEach(m => { const h = new Date(m.created_at).getHours(); hours[h] = (hours[h] || 0) + 1; });
    return Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, count: hours[i] || 0 }));
  }, [messages]);

  const statusDistribution = useMemo(() => {
    const s = { sent: 0, delivered: 0, failed: 0, pending: 0 };
    messages.forEach(m => { if (m.status === 'sent') s.sent++; else if (m.status === 'delivered') s.delivered++; else if (m.status === 'failed') s.failed++; else if (m.status === 'pending') s.pending++; });
    return [
      { name: 'مرسلة', value: s.sent, color: 'hsl(var(--primary))' },
      { name: 'مسلّمة', value: s.delivered, color: 'hsl(142, 76%, 36%)' },
      { name: 'فاشلة', value: s.failed, color: 'hsl(var(--destructive))' },
      { name: 'قيد الانتظار', value: s.pending, color: 'hsl(38, 92%, 50%)' },
    ].filter(d => d.value > 0);
  }, [messages]);

  const typeDistribution = useMemo(() => {
    const types: Record<string, number> = {};
    messages.forEach(m => { types[m.message_type || 'text'] = (types[m.message_type || 'text'] || 0) + 1; });
    return Object.entries(types).map(([name, value], i) => ({ name, value, color: CHART_COLORS[i % CHART_COLORS.length] }));
  }, [messages]);

  const deliveryRate = stats.totalMessages > 0 ? Math.round(((stats.sent + stats.delivered) / stats.totalMessages) * 100) : 0;
  const failureRate = stats.totalMessages > 0 ? Math.round((stats.failed / stats.totalMessages) * 100) : 0;

  if (!isAdmin) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">هذه الصفحة متاحة لمدير النظام فقط</div>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BackButton />
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2"><MessageCircle className="h-7 w-7 text-primary" />مركز قيادة WaPilot</h1>
              <p className="text-muted-foreground text-sm">لوحة تحكم شاملة لنظام إشعارات الواتساب</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${
              instanceStatus === 'connected' ? 'border-green-500/30 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400' :
              instanceStatus === 'loading' ? 'border-border bg-muted text-muted-foreground' :
              'border-destructive/30 bg-destructive/5 text-destructive'
            }`}>
              {instanceStatus === 'connected' ? <><Radio className="h-3.5 w-3.5 animate-pulse" />مباشر</> :
               instanceStatus === 'loading' ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" />جاري الفحص</> :
               <><WifiOff className="h-3.5 w-3.5" />غير متصل</>}
            </div>
            <div className="flex gap-1">
              {(['overview', 'inbox', 'ai-insights', 'manager'] as const).map(v => (
                <Button key={v} variant={activeView === v ? 'default' : 'outline'} size="sm" onClick={() => setActiveView(v)}>
                  {v === 'overview' ? <><BarChart3 className="h-3.5 w-3.5 ml-1" />نظرة عامة</> :
                   v === 'inbox' ? <><MessageCircle className="h-3.5 w-3.5 ml-1" />المحادثات</> :
                   v === 'ai-insights' ? <><Brain className="h-3.5 w-3.5 ml-1" />تحليل ذكي</> :
                   <><Zap className="h-3.5 w-3.5 ml-1" />التحكم الكامل</>}
                </Button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={fetchAllData} disabled={refreshing}>
              <RefreshCw className={`h-3.5 w-3.5 ml-1 ${refreshing ? 'animate-spin' : ''}`} />تحديث
            </Button>
          </div>
        </div>

        {/* CONNECTION CARD */}
        <WaPilotConnectionCard
          instanceStatus={instanceStatus} connectedPhone={connectedPhone} connectedName={connectedName}
          activeInstanceId={activeInstanceId} instances={instances} actionLoading={actionLoading}
          uptime={uptime} onAction={executeInstanceAction}
        />

        {/* QUICK SEND */}
        <WaPilotQuickSend instanceStatus={instanceStatus} orgs={orgs} onRefresh={fetchAllData} />

        {/* VIEW CONTENT */}
        {activeView === 'inbox' ? (
          <WaPilotInbox messages={messages} orgs={orgs} loading={refreshing} instanceStatus={instanceStatus} onRefresh={fetchAllData} />
        ) : activeView === 'ai-insights' ? (
          <WaPilotAIInsights messages={messages} onRefresh={fetchAllData} />
        ) : activeView === 'overview' ? (
          <>
            {/* KPI CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'إجمالي الرسائل', value: stats.totalMessages, icon: Activity, color: 'text-primary' },
                { label: 'اليوم', value: stats.todayMessages, icon: CalendarDays, color: 'text-primary', trend: stats.weekMessages > 0 ? Math.round((stats.todayMessages / (stats.weekMessages / 7)) * 100 - 100) : 0 },
                { label: 'تم التسليم', value: stats.sent + stats.delivered, icon: CheckCircle2, color: 'text-green-600' },
                { label: 'فشل', value: stats.failed, icon: XCircle, color: 'text-destructive' },
                { label: 'نسبة التسليم', value: `${deliveryRate}%`, icon: Target, color: deliveryRate >= 90 ? 'text-green-600' : deliveryRate >= 70 ? 'text-amber-600' : 'text-destructive' },
                { label: 'قيد الانتظار', value: stats.pending, icon: Clock, color: 'text-amber-600' },
              ].map((kpi, i) => (
                <Card key={i} className="border">
                  <CardContent className="pt-4 pb-3 text-center space-y-1">
                    <kpi.icon className={`h-5 w-5 mx-auto ${kpi.color}`} />
                    <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
                    <p className="text-[10px] text-muted-foreground leading-tight">{kpi.label}</p>
                    {kpi.trend !== undefined && kpi.trend !== 0 && (
                      <div className={`flex items-center justify-center gap-0.5 text-[10px] ${kpi.trend > 0 ? 'text-green-600' : 'text-destructive'}`}>
                        {kpi.trend > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {Math.abs(kpi.trend)}% عن المعدل
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* API STATUS + ENDPOINTS + SUBSCRIPTION + CHARTS — simplified inline */}
            <Card className="border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Server className="h-4 w-4 text-primary" />تفاصيل اتصال WaPilot API
                  <Badge variant={apiStatus === 'connected' ? 'default' : apiStatus === 'checking' ? 'secondary' : 'destructive'} className="text-[10px] mr-auto">
                    {apiStatus === 'connected' ? '✓ متصل ويعمل' : apiStatus === 'checking' ? 'جاري الفحص...' : '✗ خطأ'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { label: 'API Token', value: connectionDiag?.token_preview || '...', ok: connectionDiag?.token_configured },
                    { label: 'Instance ID', value: connectionDiag?.instance_id || activeInstanceId || '—', ok: !!connectionDiag?.instance_id },
                    { label: 'حالة الجهاز', value: connectionDiag?.instance_status?.status === 'WORKING' ? '🟢 يعمل' : '🟡 غير معروف', ok: null },
                    { label: 'رقم الواتساب', value: connectionDiag?.instance_status?.me_id?.replace('@c.us', '') || connectedPhone || '—', ok: null },
                    { label: 'اسم الحساب', value: connectionDiag?.instance_status?.me_push_name || connectedName || '—', ok: null },
                    { label: 'API Base', value: connectionDiag?.api_base || 'api.wapilot.net/api/v2', ok: null },
                  ].map((item, i) => (
                    <div key={i} className="bg-muted/40 rounded-lg p-3 space-y-1">
                      <p className="text-[10px] text-muted-foreground">{item.label}</p>
                      <p className="text-xs font-mono font-medium truncate" dir="ltr">{item.value}</p>
                      {item.ok !== null && (
                        <Badge variant={item.ok ? 'default' : 'destructive'} className="text-[9px]">{item.ok ? '✓ مُعدّ' : '✗ غير مُعدّ'}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* ENDPOINTS STATUS */}
            <Card className="border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />حالة API Endpoints
                  <Badge variant="secondary" className="text-[10px] mr-auto">{Object.values(endpointStatuses).filter(s => s === 'ok').length}/{Object.keys(endpointStatuses).length} متاح</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { name: 'wapilot-proxy', label: 'WaPilot Proxy', desc: 'البوابة الرئيسية' },
                    { name: 'whatsapp-send', label: 'WhatsApp Send', desc: 'إرسال الرسائل' },
                    { name: 'whatsapp-event', label: 'WhatsApp Event', desc: 'محرك الأحداث' },
                    { name: 'whatsapp-webhook', label: 'WhatsApp Webhook', desc: 'استقبال الردود' },
                  ].map(ep => {
                    const status = endpointStatuses[ep.name] || 'checking';
                    return (
                      <div key={ep.name} className={`rounded-xl border p-4 space-y-2 transition-all ${
                        status === 'ok' ? 'border-green-500/20 bg-green-50/50 dark:bg-green-950/10' :
                        status === 'error' ? 'border-destructive/20 bg-destructive/5' : 'border-border bg-muted/20'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold font-mono" dir="ltr">{ep.label}</span>
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                            status === 'ok' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                            status === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {status === 'ok' ? <><CheckCircle2 className="h-2.5 w-2.5" />متاح</> :
                             status === 'error' ? <><XCircle className="h-2.5 w-2.5" />خطأ</> :
                             <><RefreshCw className="h-2.5 w-2.5 animate-spin" />فحص</>}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">{ep.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* SECONDARY STATS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Building2, value: stats.orgs, label: 'جهات مسجلة' },
                { icon: Users, value: stats.users, label: 'مستخدمون بواتساب' },
                { icon: FileText, value: stats.templates, label: 'قوالب نشطة' },
                { icon: Megaphone, value: stats.campaigns, label: 'حملات' },
              ].map((s, i) => (
                <Card key={i} className="bg-muted/30">
                  <CardContent className="pt-3 pb-2 flex items-center gap-3">
                    <s.icon className="h-5 w-5 text-primary shrink-0" />
                    <div><div className="text-lg font-bold">{s.value}</div><p className="text-[10px] text-muted-foreground">{s.label}</p></div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />الاتجاه اليومي (آخر 7 أيام)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={dailyTrend}>
                      <defs>
                        <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0}/></linearGradient>
                        <linearGradient id="failedGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, direction: 'rtl' }} />
                      <Area type="monotone" dataKey="sent" stroke="hsl(142, 76%, 36%)" fillOpacity={1} fill="url(#sentGrad)" name="ناجحة" strokeWidth={2} />
                      <Area type="monotone" dataKey="failed" stroke="hsl(var(--destructive))" fillOpacity={1} fill="url(#failedGrad)" name="فاشلة" strokeWidth={2} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><PieChart className="h-4 w-4 text-primary" />توزيع الحالات</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={180}>
                    <RePieChart>
                      <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                        {statusDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, direction: 'rtl' }} />
                    </RePieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {statusDistribution.map((s, i) => (
                      <div key={i} className="flex items-center gap-1 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />{s.name} ({s.value})
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4 text-primary" />توزيع الرسائل بالساعة</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={hourlyDistribution}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="hour" tick={{ fontSize: 9 }} interval={2} /><YAxis tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} name="رسائل" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><HeartPulse className="h-4 w-4 text-primary" />ملخص صحة النظام</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">نسبة التسليم الناجح</span><span className={`font-bold ${deliveryRate >= 90 ? 'text-green-600' : deliveryRate >= 70 ? 'text-amber-600' : 'text-destructive'}`}>{deliveryRate}%</span></div>
                    <Progress value={deliveryRate} className="h-2.5" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">نسبة الفشل</span><span className={`font-bold ${failureRate <= 5 ? 'text-green-600' : failureRate <= 15 ? 'text-amber-600' : 'text-destructive'}`}>{failureRate}%</span></div>
                    <Progress value={failureRate} className="h-2.5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">أنواع الرسائل</p>
                    <div className="flex flex-wrap gap-1.5">
                      {typeDistribution.map((t, i) => <Badge key={i} variant="outline" className="text-xs gap-1"><Hash className="h-3 w-3" />{t.name} <span className="font-bold">{t.value}</span></Badge>)}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 bg-muted/40 rounded-lg"><Server className="h-4 w-4 mx-auto mb-1 text-primary" /><p className="text-xs font-medium">{instances.length}</p><p className="text-[9px] text-muted-foreground">أجهزة</p></div>
                    <div className="text-center p-2 bg-muted/40 rounded-lg"><Shield className="h-4 w-4 mx-auto mb-1 text-green-600" /><p className="text-xs font-medium">{instanceStatus === 'connected' ? 'آمن' : 'تحذير'}</p><p className="text-[9px] text-muted-foreground">الأمان</p></div>
                    <div className="text-center p-2 bg-muted/40 rounded-lg"><Globe className="h-4 w-4 mx-auto mb-1 text-primary" /><p className="text-xs font-medium">v2</p><p className="text-[9px] text-muted-foreground">API</p></div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <WaPilotMessageLog messages={messages} orgs={orgs} loading={refreshing} />

            <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
              <CardContent className="py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3"><Zap className="h-6 w-6 text-primary" /><div><p className="font-semibold">لوحة التحكم الكاملة</p><p className="text-sm text-muted-foreground">إدارة الأجهزة، الإرسال، القوالب، الأتمتة، الحملات</p></div></div>
                <Button onClick={() => setActiveView('manager')} className="gap-1.5"><Zap className="h-4 w-4" />فتح لوحة التحكم الكاملة</Button>
              </CardContent>
            </Card>
          </>
        ) : (
          <WhatsAppNotificationManager />
        )}
      </div>
    </DashboardLayout>
  );
};

export default WaPilotManagement;
