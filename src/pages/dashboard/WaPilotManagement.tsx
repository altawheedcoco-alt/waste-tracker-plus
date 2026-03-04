import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import BackButton from '@/components/ui/back-button';
import {
  MessageCircle, Send, Users, Wifi, WifiOff, Building2,
  FileText, RefreshCw, TrendingUp, CheckCircle2, XCircle, Activity,
  Smartphone, Phone, Copy, Zap, HeartPulse, Shield, Globe,
  BarChart3, Clock, AlertTriangle, ArrowUpRight, ArrowDownRight,
  Radio, Server, Power, QrCode, RotateCcw, Loader2, Megaphone,
  Target, PieChart, CalendarDays, Bot, Hash
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import WhatsAppNotificationManager from '@/components/whatsapp/WhatsAppNotificationManager';
import { toast } from 'sonner';

interface InstanceInfo {
  id: string;
  name?: string;
  status?: string;
  phone?: string;
  me?: { id?: string; pushName?: string };
  [key: string]: any;
}

interface MessageLog {
  id: string;
  status: string;
  direction: string;
  message_type: string;
  created_at: string;
  organization_id: string;
  error_message: string | null;
}

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(142, 76%, 36%)',
  'hsl(var(--destructive))',
  'hsl(38, 92%, 50%)',
  'hsl(262, 83%, 58%)',
  'hsl(199, 89%, 48%)',
];

const WaPilotManagement = () => {
  const { roles } = useAuth();
  const isAdmin = roles.includes('admin');
  const [stats, setStats] = useState({
    totalMessages: 0, sent: 0, failed: 0, pending: 0, delivered: 0,
    orgs: 0, users: 0, templates: 0, campaigns: 0,
    todayMessages: 0, weekMessages: 0,
  });
  const [messages, setMessages] = useState<MessageLog[]>([]);
  const [instances, setInstances] = useState<InstanceInfo[]>([]);
  const [instanceStatus, setInstanceStatus] = useState<'connected' | 'disconnected' | 'loading'>('loading');
  const [connectedPhone, setConnectedPhone] = useState<string | null>(null);
  const [connectedName, setConnectedName] = useState<string | null>(null);
  const [activeInstanceId, setActiveInstanceId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'overview' | 'manager'>('overview');
  const [uptime, setUptime] = useState<number>(0);
  const [connectionDiag, setConnectionDiag] = useState<any>(null);
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [statusMessage, setStatusMessage] = useState<string>('');

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
      const [msgRes, orgRes, userRes, tplRes, instRes, campaignRes, diagRes] = await Promise.all([
        supabase.from('whatsapp_messages').select('id, status, direction, message_type, created_at, organization_id, error_message').order('created_at', { ascending: false }).limit(1000),
        supabase.from('organizations').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).not('phone', 'is', null),
        supabase.from('whatsapp_templates').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.functions.invoke('wapilot-proxy', { body: { action: 'list-instances' } }).catch(() => ({ data: [] })),
        supabase.functions.invoke('wapilot-proxy', { body: { action: 'list-campaigns' } }).catch(() => ({ data: [] })),
        supabase.functions.invoke('wapilot-proxy', { body: { action: 'diagnostics' } }).catch(() => ({ data: null })),
      ]);

      // Diagnostics
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

      const msgs = (msgRes.data || []) as MessageLog[];
      setMessages(msgs);

      const now = new Date();
      const todayMsgs = msgs.filter(m => new Date(m.created_at).toDateString() === now.toDateString());
      const weekAgo = new Date(now.getTime() - 7 * 86400000);
      const weekMsgs = msgs.filter(m => new Date(m.created_at) >= weekAgo);

      // Handle paginated campaign response
      const campaignData = campaignRes?.data;
      const campaigns = Array.isArray(campaignData) ? campaignData :
        (campaignData?.data && Array.isArray(campaignData.data)) ? campaignData.data : [];

      setStats({
        totalMessages: msgs.length,
        sent: msgs.filter(m => m.status === 'sent').length,
        delivered: msgs.filter(m => m.status === 'delivered').length,
        failed: msgs.filter(m => m.status === 'failed').length,
        pending: msgs.filter(m => m.status === 'pending').length,
        orgs: orgRes.count || 0,
        users: userRes.count || 0,
        templates: tplRes.count || 0,
        campaigns: campaigns.length,
        todayMessages: todayMsgs.length,
        weekMessages: weekMsgs.length,
      });

      // Instances
      const rawInst = instRes?.data;
      const instList = Array.isArray(rawInst) ? rawInst : (rawInst && typeof rawInst === 'object' && !rawInst.message ? [rawInst] : []);
      setInstances(instList);

      if (instList.length > 0) {
        const active = instList.find((i: any) => i.status === 'active' || i.status === 'connected') || instList[0];
        setActiveInstanceId(active.id);
        setInstanceStatus(active.status === 'active' || active.status === 'connected' ? 'connected' : 'disconnected');
        const phone = active.phone || active.me?.id?.replace('@c.us', '') || active.owner || null;
        const name = active.me?.pushName || active.name || null;
        setConnectedPhone(phone);
        setConnectedName(name);
      } else {
        setInstanceStatus('disconnected');
      }
    } catch (e) {
      console.error('Fetch error:', e);
      setApiStatus('error');
    }
    setRefreshing(false);
  }, []);

  const executeInstanceAction = async (action: string, label: string) => {
    if (!activeInstanceId) { toast.error('لا يوجد جهاز متصل'); return; }
    setActionLoading(action);
    try {
      const { data, error } = await supabase.functions.invoke('wapilot-proxy', {
        body: { action, instance_id: activeInstanceId },
      });
      if (error) throw error;
      if (action === 'get-qr') {
        const qr = data?.qr || data?.qrcode || data?.data?.qr;
        if (qr) toast.info('QR Code متاح - انتقل لتبويب الأجهزة للمسح');
        else toast.info('الجهاز متصل بالفعل - لا حاجة لـ QR');
      } else {
        toast.success(`تم تنفيذ: ${label}`);
        setTimeout(fetchAllData, 2000);
      }
    } catch (e: any) {
      toast.error(`فشل: ${e.message}`);
    }
    setActionLoading(null);
  };

  // ===== Analytics Computations =====
  const dailyTrend = useMemo(() => {
    const now = new Date();
    const days: { date: string; sent: number; failed: number; pending: number; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const dayStr = d.toLocaleDateString('ar-EG', { weekday: 'short' });
      const dayMsgs = messages.filter(m => new Date(m.created_at).toDateString() === d.toDateString());
      days.push({
        date: dayStr,
        sent: dayMsgs.filter(m => m.status === 'sent' || m.status === 'delivered').length,
        failed: dayMsgs.filter(m => m.status === 'failed').length,
        pending: dayMsgs.filter(m => m.status === 'pending').length,
        total: dayMsgs.length,
      });
    }
    return days;
  }, [messages]);

  const hourlyDistribution = useMemo(() => {
    const hours: Record<number, number> = {};
    messages.forEach(m => {
      const h = new Date(m.created_at).getHours();
      hours[h] = (hours[h] || 0) + 1;
    });
    return Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      count: hours[i] || 0,
    }));
  }, [messages]);

  const statusDistribution = useMemo(() => {
    const s = { sent: 0, delivered: 0, failed: 0, pending: 0 };
    messages.forEach(m => {
      if (m.status === 'sent') s.sent++;
      else if (m.status === 'delivered') s.delivered++;
      else if (m.status === 'failed') s.failed++;
      else if (m.status === 'pending') s.pending++;
    });
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

  const copyPhone = () => {
    if (connectedPhone) { navigator.clipboard.writeText(connectedPhone); toast.success('تم نسخ الرقم'); }
  };

  if (!isAdmin) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">هذه الصفحة متاحة لمدير النظام فقط</div>;
  }

  const formatUptime = (s: number) => {
    const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-5">
      {/* ══════════ HEADER ══════════ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MessageCircle className="h-7 w-7 text-primary" />
              مركز قيادة WaPilot
            </h1>
            <p className="text-muted-foreground text-sm">لوحة تحكم شاملة لنظام إشعارات الواتساب • مراقبة مباشرة • تحليلات • حملات</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Live Status Indicator */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${
            instanceStatus === 'connected' ? 'border-green-500/30 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400' :
            instanceStatus === 'loading' ? 'border-border bg-muted text-muted-foreground' :
            'border-destructive/30 bg-destructive/5 text-destructive'
          }`}>
            {instanceStatus === 'connected' ? <><Radio className="h-3.5 w-3.5 animate-pulse" />مباشر</> :
             instanceStatus === 'loading' ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" />جاري الفحص</> :
             <><WifiOff className="h-3.5 w-3.5" />غير متصل</>}
          </div>
          <Badge variant="outline" className="px-2 py-1.5 text-xs gap-1">
            <Clock className="h-3 w-3" />{formatUptime(uptime)}
          </Badge>
          <div className="flex gap-1">
            <Button
              variant={activeView === 'overview' ? 'default' : 'outline'} size="sm"
              onClick={() => setActiveView('overview')}
            >
              <BarChart3 className="h-3.5 w-3.5 ml-1" />نظرة عامة
            </Button>
            <Button
              variant={activeView === 'manager' ? 'default' : 'outline'} size="sm"
              onClick={() => setActiveView('manager')}
            >
              <Zap className="h-3.5 w-3.5 ml-1" />التحكم الكامل
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={fetchAllData} disabled={refreshing}>
            <RefreshCw className={`h-3.5 w-3.5 ml-1 ${refreshing ? 'animate-spin' : ''}`} />تحديث
          </Button>
        </div>
      </div>

      {/* ══════════ CONNECTION CARD ══════════ */}
      <Card className={`border-2 overflow-hidden ${instanceStatus === 'connected' ? 'border-green-500/20' : 'border-destructive/20'}`}>
        <div className={`h-1 w-full ${instanceStatus === 'connected' ? 'bg-gradient-to-r from-green-500 via-green-400 to-green-500' : 'bg-gradient-to-r from-destructive via-destructive/70 to-destructive'}`} />
        <CardContent className="py-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            {/* Phone Info */}
            <div className="flex items-center gap-4">
              <div className={`relative p-3.5 rounded-2xl ${instanceStatus === 'connected' ? 'bg-green-100 dark:bg-green-900/40' : 'bg-destructive/10'}`}>
                <Phone className={`h-7 w-7 ${instanceStatus === 'connected' ? 'text-green-600' : 'text-destructive'}`} />
                {instanceStatus === 'connected' && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background animate-pulse" />
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">رقم الإرسال المربوط بالنظام</p>
                {connectedPhone ? (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold font-mono tracking-wider" dir="ltr">+{connectedPhone.replace(/^0+/, '')}</span>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={copyPhone}><Copy className="h-3.5 w-3.5" /></Button>
                  </div>
                ) : (
                  <span className="text-lg text-muted-foreground">{instanceStatus === 'loading' ? 'جاري الكشف...' : 'لم يتم الكشف عن الرقم'}</span>
                )}
                {connectedName && <p className="text-sm text-muted-foreground">الحساب: <span className="font-medium text-foreground">{connectedName}</span></p>}
              </div>
            </div>

            {/* Instance Meta */}
            <div className="flex flex-wrap items-center gap-2">
              {activeInstanceId && (
                <div className="text-center bg-muted/50 rounded-lg px-3 py-2 border">
                  <p className="text-[10px] text-muted-foreground">Instance</p>
                  <p className="font-mono text-xs" dir="ltr">{activeInstanceId.slice(0, 12)}...</p>
                </div>
              )}
              <div className="text-center bg-muted/50 rounded-lg px-3 py-2 border">
                <p className="text-[10px] text-muted-foreground">API</p>
                <p className="font-mono text-xs" dir="ltr">v2</p>
              </div>
              <div className="text-center bg-muted/50 rounded-lg px-3 py-2 border">
                <p className="text-[10px] text-muted-foreground">الأجهزة</p>
                <p className="font-bold text-sm">{instances.length}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm" disabled={actionLoading === 'get-qr'} onClick={() => executeInstanceAction('get-qr', 'QR Code')}>
                {actionLoading === 'get-qr' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <QrCode className="h-3.5 w-3.5 ml-1" />}QR
              </Button>
              <Button variant="outline" size="sm" disabled={actionLoading === 'restart-instance'} onClick={() => executeInstanceAction('restart-instance', 'إعادة تشغيل')}>
                {actionLoading === 'restart-instance' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5 ml-1" />}إعادة تشغيل
              </Button>
              <Button
                variant={instanceStatus === 'connected' ? 'destructive' : 'default'} size="sm"
                disabled={actionLoading === 'connect-instance' || actionLoading === 'disconnect-instance'}
                onClick={() => executeInstanceAction(instanceStatus === 'connected' ? 'disconnect-instance' : 'connect-instance', instanceStatus === 'connected' ? 'قطع' : 'اتصال')}
              >
                <Power className="h-3.5 w-3.5 ml-1" />
                {instanceStatus === 'connected' ? 'قطع' : 'اتصال'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {activeView === 'overview' ? (
        <>
          {/* ══════════ KPI CARDS ══════════ */}
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

          {/* ══════════ API CONNECTION DETAILS ══════════ */}
          <Card className="border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Server className="h-4 w-4 text-primary" />
                تفاصيل اتصال WaPilot API
                <Badge variant={apiStatus === 'connected' ? 'default' : apiStatus === 'checking' ? 'secondary' : 'destructive'} className="text-[10px] mr-auto">
                  {apiStatus === 'connected' ? '✓ متصل ويعمل' : apiStatus === 'checking' ? 'جاري الفحص...' : '✗ خطأ'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-muted/40 rounded-lg p-3 space-y-1">
                  <p className="text-[10px] text-muted-foreground">API Token</p>
                  <p className="text-xs font-mono font-medium" dir="ltr">{connectionDiag?.token_preview || '...'}</p>
                  <Badge variant={connectionDiag?.token_configured ? 'default' : 'destructive'} className="text-[9px]">
                    {connectionDiag?.token_configured ? '✓ مُعدّ' : '✗ غير مُعدّ'}
                  </Badge>
                </div>
                <div className="bg-muted/40 rounded-lg p-3 space-y-1">
                  <p className="text-[10px] text-muted-foreground">Instance ID</p>
                  <p className="text-xs font-mono font-medium" dir="ltr">{connectionDiag?.instance_id || activeInstanceId || '—'}</p>
                  <Badge variant={connectionDiag?.instance_id ? 'default' : 'destructive'} className="text-[9px]">
                    {connectionDiag?.instance_id ? '✓ مُعدّ' : '✗ غير مُعدّ'}
                  </Badge>
                </div>
                <div className="bg-muted/40 rounded-lg p-3 space-y-1">
                  <p className="text-[10px] text-muted-foreground">حالة الجهاز</p>
                  <p className="text-xs font-medium">
                    {connectionDiag?.instance_status?.status === 'WORKING' ? '🟢 يعمل' :
                     connectionDiag?.instance_status?.status ? `🟡 ${connectionDiag.instance_status.status}` : '⚪ غير معروف'}
                  </p>
                  <p className="text-[9px] text-muted-foreground">{statusMessage}</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-3 space-y-1">
                  <p className="text-[10px] text-muted-foreground">رقم الواتساب</p>
                  <p className="text-xs font-mono font-medium" dir="ltr">
                    {connectionDiag?.instance_status?.me_id?.replace('@c.us', '') || connectedPhone || '—'}
                  </p>
                </div>
                <div className="bg-muted/40 rounded-lg p-3 space-y-1">
                  <p className="text-[10px] text-muted-foreground">اسم الحساب</p>
                  <p className="text-xs font-medium truncate" title={connectionDiag?.instance_status?.me_push_name || ''}>
                    {connectionDiag?.instance_status?.me_push_name || connectedName || '—'}
                  </p>
                </div>
                <div className="bg-muted/40 rounded-lg p-3 space-y-1">
                  <p className="text-[10px] text-muted-foreground">API Base</p>
                  <p className="text-[10px] font-mono font-medium" dir="ltr">{connectionDiag?.api_base || 'api.wapilot.net/api/v2'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ══════════ SECONDARY STATS ══════════ */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="bg-muted/30"><CardContent className="pt-3 pb-2 flex items-center gap-3">
              <Building2 className="h-5 w-5 text-primary shrink-0" />
              <div><div className="text-lg font-bold">{stats.orgs}</div><p className="text-[10px] text-muted-foreground">جهات مسجلة</p></div>
            </CardContent></Card>
            <Card className="bg-muted/30"><CardContent className="pt-3 pb-2 flex items-center gap-3">
              <Users className="h-5 w-5 text-primary shrink-0" />
              <div><div className="text-lg font-bold">{stats.users}</div><p className="text-[10px] text-muted-foreground">مستخدمون بواتساب</p></div>
            </CardContent></Card>
            <Card className="bg-muted/30"><CardContent className="pt-3 pb-2 flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary shrink-0" />
              <div><div className="text-lg font-bold">{stats.templates}</div><p className="text-[10px] text-muted-foreground">قوالب نشطة</p></div>
            </CardContent></Card>
            <Card className="bg-muted/30"><CardContent className="pt-3 pb-2 flex items-center gap-3">
              <Megaphone className="h-5 w-5 text-primary shrink-0" />
              <div><div className="text-lg font-bold">{stats.campaigns}</div><p className="text-[10px] text-muted-foreground">حملات</p></div>
            </CardContent></Card>
          </div>

          {/* ══════════ CHARTS ROW 1 ══════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Daily Trend Area Chart */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />الاتجاه اليومي (آخر 7 أيام)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={dailyTrend}>
                    <defs>
                      <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="failedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, direction: 'rtl' }} />
                    <Area type="monotone" dataKey="sent" stroke="hsl(142, 76%, 36%)" fillOpacity={1} fill="url(#sentGrad)" name="ناجحة" strokeWidth={2} />
                    <Area type="monotone" dataKey="failed" stroke="hsl(var(--destructive))" fillOpacity={1} fill="url(#failedGrad)" name="فاشلة" strokeWidth={2} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Status Pie Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><PieChart className="h-4 w-4 text-primary" />توزيع الحالات</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={180}>
                  <RePieChart>
                    <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                      {statusDistribution.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, direction: 'rtl' }} />
                  </RePieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 justify-center">
                  {statusDistribution.map((s, i) => (
                    <div key={i} className="flex items-center gap-1 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      {s.name} ({s.value})
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ══════════ CHARTS ROW 2 ══════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Hourly Distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4 text-primary" />توزيع الرسائل بالساعة</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={hourlyDistribution}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="hour" tick={{ fontSize: 9 }} interval={2} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} name="رسائل" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Message Types + Health Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><HeartPulse className="h-4 w-4 text-primary" />ملخص صحة النظام</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Delivery Health Bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">نسبة التسليم الناجح</span>
                    <span className={`font-bold ${deliveryRate >= 90 ? 'text-green-600' : deliveryRate >= 70 ? 'text-amber-600' : 'text-destructive'}`}>{deliveryRate}%</span>
                  </div>
                  <Progress value={deliveryRate} className="h-2.5" />
                </div>
                {/* Failure Rate */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">نسبة الفشل</span>
                    <span className={`font-bold ${failureRate <= 5 ? 'text-green-600' : failureRate <= 15 ? 'text-amber-600' : 'text-destructive'}`}>{failureRate}%</span>
                  </div>
                  <Progress value={failureRate} className="h-2.5" />
                </div>
                {/* Type Badges */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">أنواع الرسائل</p>
                  <div className="flex flex-wrap gap-1.5">
                    {typeDistribution.map((t, i) => (
                      <Badge key={i} variant="outline" className="text-xs gap-1">
                        <Hash className="h-3 w-3" />{t.name} <span className="font-bold">{t.value}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
                {/* Quick Health Indicators */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 bg-muted/40 rounded-lg">
                    <Server className="h-4 w-4 mx-auto mb-1 text-primary" />
                    <p className="text-xs font-medium">{instances.length}</p>
                    <p className="text-[9px] text-muted-foreground">أجهزة</p>
                  </div>
                  <div className="text-center p-2 bg-muted/40 rounded-lg">
                    <Shield className="h-4 w-4 mx-auto mb-1 text-green-600" />
                    <p className="text-xs font-medium">{instanceStatus === 'connected' ? 'آمن' : 'تحذير'}</p>
                    <p className="text-[9px] text-muted-foreground">الأمان</p>
                  </div>
                  <div className="text-center p-2 bg-muted/40 rounded-lg">
                    <Globe className="h-4 w-4 mx-auto mb-1 text-primary" />
                    <p className="text-xs font-medium">v2</p>
                    <p className="text-[9px] text-muted-foreground">API</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ══════════ CTA to Full Manager ══════════ */}
          <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
            <CardContent className="py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Zap className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-semibold">لوحة التحكم الكاملة</p>
                  <p className="text-sm text-muted-foreground">إدارة الأجهزة، الإرسال، القوالب، الأتمتة، الحملات، القائمة السوداء، والمزيد...</p>
                </div>
              </div>
              <Button onClick={() => setActiveView('manager')} className="gap-1.5">
                <Zap className="h-4 w-4" />فتح لوحة التحكم الكاملة
              </Button>
            </CardContent>
          </Card>
        </>
      ) : (
        /* ══════════ FULL MANAGER ══════════ */
        <WhatsAppNotificationManager />
      )}
    </div>
  );
};

export default WaPilotManagement;
