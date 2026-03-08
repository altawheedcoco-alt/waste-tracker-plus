import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import BackButton from '@/components/ui/back-button';
import {
  MessageCircle, Send, Users, Wifi, WifiOff, Building2,
  FileText, RefreshCw, TrendingUp, CheckCircle2, XCircle, Activity,
  Smartphone, Phone, Copy, Zap, HeartPulse, Shield, Globe,
  BarChart3, Clock, AlertTriangle, ArrowUpRight, ArrowDownRight,
  Radio, Server, Power, QrCode, RotateCcw, Loader2, Megaphone, Brain,
  Target, PieChart, CalendarDays, Bot, Hash, BookOpen, Code2, ExternalLink,
  Paperclip, Image, Video, Mic, FileUp, X, File
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import WhatsAppNotificationManager from '@/components/whatsapp/WhatsAppNotificationManager';
import WaPilotMessageLog from '@/components/whatsapp/WaPilotMessageLog';
import WaPilotInbox from '@/components/whatsapp/WaPilotInbox';
import WaPilotAIInsights from '@/components/whatsapp/WaPilotAIInsights';
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
  content: string | null;
  to_phone: string | null;
  from_phone: string | null;
  template_id: string | null;
  attachment_url: string | null;
  sent_by: string | null;
  meta_message_id: string | null;
  metadata: any;
  interactive_buttons: any;
  broadcast_group_id: string | null;
}

interface OrgInfo {
  id: string;
  name: string;
  name_en?: string | null;
}

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(142, 76%, 36%)',
  'hsl(var(--destructive))',
  'hsl(38, 92%, 50%)',
  'hsl(262, 83%, 58%)',
  'hsl(199, 89%, 48%)',
];

  // Parse WaPilot API messages into MessageLog format
  const parseWaPilotMessages = (data: any): MessageLog[] => {
    if (!data) return [];
    // Handle different response structures from WaPilot API
    const rawMessages = Array.isArray(data) ? data : 
      (data?.data && Array.isArray(data.data)) ? data.data :
      (data?.messages && Array.isArray(data.messages)) ? data.messages : [];
    
    return rawMessages.map((msg: any, idx: number) => {
      const isFromMe = msg.fromMe ?? msg.from_me ?? (msg.key?.fromMe) ?? false;
      const remoteJid = msg.key?.remoteJid || msg.chatId || msg.chat_id || msg.from || msg.to || '';
      const phone = remoteJid.replace('@c.us', '').replace('@s.whatsapp.net', '').replace(/[\s\-\+]/g, '');
      const content = msg.body || msg.text || msg.message?.conversation || 
        msg.message?.extendedTextMessage?.text || msg.content || '';
      const timestamp = msg.timestamp ? new Date(msg.timestamp * 1000).toISOString() :
        msg.created_at || msg.messageTimestamp ? new Date((msg.messageTimestamp || 0) * 1000).toISOString() :
        new Date().toISOString();
      const msgId = msg.key?.id || msg.id || msg.message_id || `wapilot-${idx}-${Date.now()}`;
      
      return {
        id: `wapilot-api-${msgId}`,
        status: msg.ack === 3 ? 'read' : msg.ack === 2 ? 'delivered' : msg.ack === 1 ? 'sent' : 
          msg.status || (isFromMe ? 'sent' : 'received'),
        direction: isFromMe ? 'outbound' : 'inbound',
        message_type: msg.type || (msg.hasMedia ? 'media' : 'text'),
        created_at: timestamp,
        organization_id: null,
        error_message: null,
        content: content || `[${msg.type || 'message'}]`,
        to_phone: isFromMe ? phone : null,
        from_phone: isFromMe ? null : phone,
        template_id: null,
        attachment_url: msg.mediaUrl || msg.media_url || null,
        sent_by: null,
        meta_message_id: msgId,
        metadata: { 
          profile_name: msg.notifyName || msg.pushName || msg.senderName || msg.contact_name || null,
          source: 'wapilot_api',
          ack: msg.ack,
        },
        interactive_buttons: null,
        broadcast_group_id: null,
      } as MessageLog;
    }).filter((m: MessageLog) => {
      // Filter out status/system messages
      const phone = m.to_phone || m.from_phone || '';
      return phone.length >= 8 && !phone.includes('status');
    });
  };

const WaPilotManagement = () => {
  const { roles } = useAuth();
  const isAdmin = roles.includes('admin');
  const [stats, setStats] = useState({
    totalMessages: 0, sent: 0, failed: 0, pending: 0, delivered: 0,
    orgs: 0, users: 0, templates: 0, campaigns: 0,
    todayMessages: 0, weekMessages: 0,
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
  const [subscriptionInfo, setSubscriptionInfo] = useState<{
    status: string;
    plan_name: string | null;
    start_date: string | null;
    expiry_date: string | null;
    days_remaining: number | null;
    total_days: number | null;
    progress: number;
    auto_renew: boolean;
    total_seats: number;
    total_amount: number;
  } | null>(null);
  const [endpointStatuses, setEndpointStatuses] = useState<Record<string, 'ok' | 'error' | 'checking'>>({});
  const [quickPhone, setQuickPhone] = useState('');
  const [quickMessage, setQuickMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [quickAttachment, setQuickAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [sendProgress, setSendProgress] = useState<{ current: number; total: number } | null>(null);

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

      // Merge DB messages with WaPilot API real messages
      const dbMsgs = (msgRes.data || []) as MessageLog[];
      const apiMsgs = parseWaPilotMessages(wapilotMsgRes?.data);
      
      // Deduplicate: prefer DB messages over API messages
      const dbMsgIds = new Set(dbMsgs.map(m => m.meta_message_id).filter(Boolean));
      const uniqueApiMsgs = apiMsgs.filter(m => !m.meta_message_id || !dbMsgIds.has(m.meta_message_id));
      const msgs = [...dbMsgs, ...uniqueApiMsgs].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      console.log(`📨 Messages: ${dbMsgs.length} DB + ${apiMsgs.length} API (${uniqueApiMsgs.length} unique) = ${msgs.length} total`);
      setMessages(msgs);
      setOrgs((orgListRes?.data || []) as OrgInfo[]);

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

      // Fetch subscription info
      try {
        const { data: subData } = await supabase
          .from('user_subscriptions')
          .select('*, plan:subscription_plans(name, name_ar, duration_days)')
          .in('status', ['active', 'grace_period', 'trial'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (subData) {
          const now = new Date();
          const startDate = subData.start_date ? new Date(subData.start_date) : null;
          const expiryDate = subData.expiry_date ? new Date(subData.expiry_date) : null;
          let daysRemaining: number | null = null;
          let totalDays: number | null = null;
          let progress = 0;

          if (startDate && expiryDate) {
            totalDays = Math.ceil((expiryDate.getTime() - startDate.getTime()) / 86400000);
            daysRemaining = Math.max(0, Math.ceil((expiryDate.getTime() - now.getTime()) / 86400000));
            progress = totalDays > 0 ? Math.round(((totalDays - daysRemaining) / totalDays) * 100) : 0;
          }

          setSubscriptionInfo({
            status: subData.status,
            plan_name: (subData.plan as any)?.name_ar || (subData.plan as any)?.name || null,
            start_date: subData.start_date,
            expiry_date: subData.expiry_date,
            days_remaining: daysRemaining,
            total_days: totalDays,
            progress,
            auto_renew: subData.auto_renew ?? false,
            total_seats: subData.total_seats || 1,
            total_amount: subData.total_amount || 0,
          });
        } else {
          setSubscriptionInfo(null);
        }
      } catch { /* ignore */ }

      // Check API endpoints health
      const endpoints = [
        { name: 'wapilot-proxy', body: { action: 'diagnostics' } },
        { name: 'whatsapp-send', body: { action: 'health-check' } },
        { name: 'whatsapp-event', body: { event_type: 'health-check' } },
        { name: 'whatsapp-webhook', body: {} },
      ];
      const epStatuses: Record<string, 'ok' | 'error' | 'checking'> = {};
      endpoints.forEach(ep => { epStatuses[ep.name] = 'checking'; });
      setEndpointStatuses({ ...epStatuses });

      await Promise.all(endpoints.map(async (ep) => {
        try {
          const { error } = await supabase.functions.invoke(ep.name, { body: ep.body });
          epStatuses[ep.name] = error ? 'error' : 'ok';
        } catch {
          epStatuses[ep.name] = 'error';
        }
      }));
      setEndpointStatuses({ ...epStatuses });

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

  const handleAttachmentChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSize = 16 * 1024 * 1024; // 16MB
    if (file.size > maxSize) {
      toast.error('حجم الملف يتجاوز 16 ميجا');
      return;
    }
    setQuickAttachment(file);
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setAttachmentPreview(url);
    } else {
      setAttachmentPreview(null);
    }
  }, []);

  const clearAttachment = useCallback(() => {
    setQuickAttachment(null);
    if (attachmentPreview) URL.revokeObjectURL(attachmentPreview);
    setAttachmentPreview(null);
  }, [attachmentPreview]);

  const handleQuickSend = useCallback(async () => {
    if (!quickPhone.trim() || (!quickMessage.trim() && !quickAttachment)) {
      toast.error('يرجى إدخال رقم الهاتف ونص الرسالة أو إرفاق ملف');
      return;
    }
    // Parse multiple phones (comma, newline, or semicolon separated)
    const phones = quickPhone
      .split(/[,;\n]+/)
      .map(p => p.replace(/[\s\-\+]/g, '').replace(/^0+/, ''))
      .filter(p => p.length >= 8);

    if (phones.length === 0) {
      toast.error('يرجى إدخال رقم هاتف صحيح');
      return;
    }

    setSendingMessage(true);
    setSendProgress({ current: 0, total: phones.length });

    let mediaUrl: string | null = null;
    let mediaFilename: string | null = null;

    // Upload attachment to storage if exists
    if (quickAttachment) {
      try {
        const ext = quickAttachment.name.split('.').pop() || 'bin';
        const path = `wapilot-media/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('documents')
          .upload(path, quickAttachment, { contentType: quickAttachment.type });
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path);
        mediaUrl = urlData.publicUrl;
        mediaFilename = quickAttachment.name;
      } catch (err: any) {
        toast.error(`فشل رفع الملف: ${err.message}`);
        setSendingMessage(false);
        setSendProgress(null);
        return;
      }
    }

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < phones.length; i++) {
      const phone = phones[i];
      const chatId = phone.includes('@') ? phone : `${phone}@c.us`;
      setSendProgress({ current: i + 1, total: phones.length });
      try {
        if (mediaUrl) {
          // Send media
          const { data, error } = await supabase.functions.invoke('wapilot-proxy', {
            body: {
              action: 'send-media',
              chat_id: chatId,
              media_url: mediaUrl,
              filename: mediaFilename,
              caption: quickMessage || undefined,
            },
          });
          if (error) throw error;
          if (data?.error) throw new Error(data.error);
        } else {
          // Send text only
          const { data, error } = await supabase.functions.invoke('wapilot-proxy', {
            body: { action: 'send-message', chat_id: chatId, text: quickMessage },
          });
          if (error) throw error;
          if (data?.error) throw new Error(data.error);
        }
        successCount++;
        // Log to DB
        await supabase.from('whatsapp_messages').insert({
          to_phone: phone,
          content: quickMessage || `[${quickAttachment?.type?.split('/')[0] || 'ملف'}]`,
          message_type: mediaUrl ? 'media' : 'text',
          status: 'sent',
          direction: 'outbound',
          organization_id: orgs[0]?.id || '',
          attachment_url: mediaUrl,
          metadata: { source: 'wapilot_dashboard_quick_send', filename: mediaFilename },
        });
      } catch (err: any) {
        failCount++;
        console.error(`Failed to send to ${phone}:`, err);
      }
      // Small delay between messages to avoid rate limiting
      if (phones.length > 1 && i < phones.length - 1) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    if (successCount > 0) {
      toast.success(`تم إرسال ${successCount} رسالة بنجاح ✓${failCount > 0 ? ` (فشل ${failCount})` : ''}`);
      setQuickMessage('');
      clearAttachment();
    } else {
      toast.error('فشل إرسال جميع الرسائل');
    }
    setSendingMessage(false);
    setSendProgress(null);
    fetchAllData();
  }, [quickPhone, quickMessage, quickAttachment, orgs, fetchAllData, clearAttachment]);

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
              variant={activeView === 'inbox' ? 'default' : 'outline'} size="sm"
              onClick={() => setActiveView('inbox')}
            >
              <MessageCircle className="h-3.5 w-3.5 ml-1" />المحادثات
            </Button>
            <Button
              variant={activeView === 'ai-insights' ? 'default' : 'outline'} size="sm"
              onClick={() => setActiveView('ai-insights')}
            >
              <Brain className="h-3.5 w-3.5 ml-1" />تحليل ذكي
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

      {/* ══════════ QUICK SEND MESSAGE ══════════ */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Send className="h-4 w-4 text-primary" />
            إرسال رسالة سريعة
            {instanceStatus === 'connected' && (
              <Badge variant="default" className="text-[10px] mr-auto">الجهاز متصل ✓</Badge>
            )}
          </CardTitle>
          <CardDescription className="text-xs">اختر رسالة جاهزة أو اكتب رسالة مخصصة • أرسل واتساب مباشرة من لوحة التحكم</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Quick Message Templates */}
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block">رسائل جاهزة حسب التصنيف</label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { cat: '🚛 شحنات', messages: [
                  { label: 'تأكيد شحنة', text: 'مرحباً، نود إبلاغكم بأنه تم تسجيل شحنة جديدة وسيتم التواصل معكم لتحديد موعد الاستلام. شكراً لثقتكم بمنصة آي ريسايكل.' },
                  { label: 'موعد استلام', text: 'السلام عليكم، نود تأكيد موعد استلام الشحنة. يرجى التواصل معنا لتنسيق الوقت المناسب.' },
                  { label: 'تم التسليم', text: 'تم تسليم الشحنة بنجاح ✅ شكراً لتعاونكم. يمكنكم مراجعة التفاصيل عبر المنصة.' },
                ]},
                { cat: '💰 مالية', messages: [
                  { label: 'فاتورة جديدة', text: 'تم إصدار فاتورة جديدة لحسابكم. يرجى مراجعتها عبر المنصة واتخاذ اللازم.' },
                  { label: 'تأكيد دفع', text: 'تم استلام الدفعة المالية بنجاح ✅ شكراً لالتزامكم.' },
                  { label: 'تذكير سداد', text: 'تذكير ودي: لديكم مستحقات مالية معلقة. يرجى السداد في أقرب وقت لتجنب التأخير.' },
                ]},
                { cat: '👋 ترحيب', messages: [
                  { label: 'عميل جديد', text: 'مرحباً بك في منصة آي ريسايكل! 🌱 نحن سعداء بانضمامك. فريقنا جاهز لمساعدتك في إدارة النفايات بكفاءة واستدامة.' },
                  { label: 'شريك جديد', text: 'أهلاً وسهلاً بكم كشريك في منصة آي ريسايكل. نتطلع لتعاون مثمر ومستدام 🤝' },
                ]},
                { cat: '⚠️ تنبيهات', messages: [
                  { label: 'تجديد رخصة', text: 'تنبيه: رخصتكم البيئية تقترب من تاريخ الانتهاء. يرجى المبادرة بالتجديد لتجنب توقف الخدمة.' },
                  { label: 'صيانة النظام', text: 'إشعار: سيتم إجراء صيانة مجدولة للنظام. قد تتأثر بعض الخدمات مؤقتاً. نعتذر عن أي إزعاج.' },
                  { label: 'تحديث بيانات', text: 'يرجى تحديث بيانات منشأتكم على المنصة لضمان استمرارية الخدمة وتوافقها مع الاشتراطات.' },
                ]},
                { cat: '♻️ بيئية', messages: [
                  { label: 'تقرير بيئي', text: 'تقريركم البيئي الشهري جاهز للمراجعة على المنصة. يتضمن ملخص الكميات المعاد تدويرها والأثر البيئي.' },
                  { label: 'شهادة تدوير', text: 'تم إصدار شهادة إعادة التدوير الخاصة بمنشأتكم ✅ يمكنكم تحميلها من المنصة.' },
                ]},
              ].map(cat => (
                <div key={cat.cat} className="flex items-center gap-1">
                  <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">{cat.cat}</span>
                  {cat.messages.map(msg => (
                    <Button
                      key={msg.label}
                      variant={quickMessage === msg.text ? 'default' : 'outline'}
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      onClick={() => setQuickMessage(msg.text)}
                      disabled={sendingMessage || instanceStatus !== 'connected'}
                    >
                      {msg.label}
                    </Button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Phone + Message + Attachment */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-shrink-0 sm:w-64">
                <label className="text-[11px] text-muted-foreground mb-1 block">أرقام الواتساب (مع كود الدولة) — افصل بين الأرقام بفاصلة أو سطر جديد</label>
                <Textarea
                  dir="ltr"
                  placeholder={"201XXXXXXXXX\n201YYYYYYYYY\n966XXXXXXXXX"}
                  value={quickPhone}
                  onChange={(e) => setQuickPhone(e.target.value)}
                  className="font-mono text-sm min-h-[60px] max-h-[120px] resize-none"
                  disabled={sendingMessage || instanceStatus !== 'connected'}
                  rows={2}
                />
                {quickPhone.split(/[,;\n]+/).filter(p => p.replace(/[\s\-\+]/g, '').replace(/^0+/, '').length >= 8).length > 1 && (
                  <p className="text-[10px] text-primary mt-1 flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    سيتم الإرسال لـ {quickPhone.split(/[,;\n]+/).filter(p => p.replace(/[\s\-\+]/g, '').replace(/^0+/, '').length >= 8).length} أرقام
                  </p>
                )}
              </div>
              <div className="flex-1">
                <label className="text-[11px] text-muted-foreground mb-1 block">نص الرسالة</label>
                <div className="flex gap-2">
                  <div className="flex-1 space-y-2">
                    <Textarea
                      placeholder={quickAttachment ? "أضف تعليقاً على المرفق (اختياري)..." : "اكتب رسالتك هنا أو اختر من الرسائل الجاهزة أعلاه..."}
                      value={quickMessage}
                      onChange={(e) => setQuickMessage(e.target.value)}
                      className="min-h-[60px] max-h-[120px] text-sm resize-none"
                      disabled={sendingMessage || instanceStatus !== 'connected'}
                      rows={2}
                    />
                    {/* Attachment Controls */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <input
                        type="file"
                        id="wapilot-attach"
                        className="hidden"
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
                        onChange={handleAttachmentChange}
                        disabled={sendingMessage || instanceStatus !== 'connected'}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px] gap-1"
                        onClick={() => document.getElementById('wapilot-attach')?.click()}
                        disabled={sendingMessage || instanceStatus !== 'connected'}
                      >
                        <Paperclip className="h-3 w-3" />
                        إرفاق ملف
                      </Button>
                      <span className="text-[9px] text-muted-foreground">PDF, صور, فيديو, صوت, مستندات (حد أقصى 16MB)</span>
                    </div>
                    {/* Attachment Preview */}
                    {quickAttachment && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border">
                        {attachmentPreview ? (
                          <img src={attachmentPreview} alt="preview" className="h-10 w-10 rounded object-cover" />
                        ) : quickAttachment.type.startsWith('video/') ? (
                          <Video className="h-5 w-5 text-primary" />
                        ) : quickAttachment.type.startsWith('audio/') ? (
                          <Mic className="h-5 w-5 text-primary" />
                        ) : (
                          <File className="h-5 w-5 text-primary" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{quickAttachment.name}</p>
                          <p className="text-[10px] text-muted-foreground">{(quickAttachment.size / 1024).toFixed(0)} KB</p>
                        </div>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={clearAttachment}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 self-end">
                    <Button
                      onClick={handleQuickSend}
                      disabled={sendingMessage || instanceStatus !== 'connected' || !quickPhone.trim() || (!quickMessage.trim() && !quickAttachment)}
                      className="gap-1.5"
                    >
                      {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      إرسال
                    </Button>
                    {(quickMessage || quickAttachment) && !sendingMessage && (
                      <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => { setQuickMessage(''); clearAttachment(); }}>
                        مسح الكل
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* Send Progress */}
            {sendProgress && (
              <div className="flex items-center gap-2">
                <Progress value={(sendProgress.current / sendProgress.total) * 100} className="flex-1 h-2" />
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{sendProgress.current}/{sendProgress.total}</span>
              </div>
            )}
          </div>
          {instanceStatus !== 'connected' && (
            <p className="text-xs text-destructive mt-2 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              يجب أن يكون الجهاز متصلاً لإرسال الرسائل
            </p>
          )}
        </CardContent>
      </Card>

      {activeView === 'inbox' ? (
        <WaPilotInbox
          messages={messages}
          orgs={orgs}
          loading={refreshing}
          instanceStatus={instanceStatus}
          onRefresh={fetchAllData}
        />
      ) : activeView === 'ai-insights' ? (
        <WaPilotAIInsights
          messages={messages}
          onRefresh={fetchAllData}
        />
      ) : activeView === 'overview' ? (
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

          {/* ══════════ API ENDPOINTS STATUS ══════════ */}
          <Card className="border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                حالة API Endpoints
                <Badge variant="secondary" className="text-[10px] mr-auto">
                  {Object.values(endpointStatuses).filter(s => s === 'ok').length}/{Object.keys(endpointStatuses).length} متاح
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { name: 'wapilot-proxy', label: 'WaPilot Proxy', desc: 'البوابة الرئيسية لـ WaPilot API - إدارة الأجهزة، الحملات، التشخيصات', actions: ['diagnostics', 'list-instances', 'send-message', 'list-campaigns', 'get-qr', 'restart-instance'] },
                  { name: 'whatsapp-send', label: 'WhatsApp Send', desc: 'إرسال الرسائل الفردية والجماعية عبر WaPilot', actions: ['send-single', 'send-bulk', 'send-template'] },
                  { name: 'whatsapp-event', label: 'WhatsApp Event', desc: 'محرك الأحداث التلقائية - إشعارات الشحنات، الفواتير، OTP', actions: ['shipment_created', 'invoice_generated', 'otp_verification'] },
                  { name: 'whatsapp-webhook', label: 'WhatsApp Webhook', desc: 'استقبال الردود والرسائل الواردة من WhatsApp', actions: ['inbound-message', 'status-update'] },
                ].map(ep => {
                  const status = endpointStatuses[ep.name] || 'checking';
                  return (
                    <div key={ep.name} className={`rounded-xl border p-4 space-y-2.5 transition-all ${
                      status === 'ok' ? 'border-green-500/20 bg-green-50/50 dark:bg-green-950/10' :
                      status === 'error' ? 'border-destructive/20 bg-destructive/5' :
                      'border-border bg-muted/20'
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
                      <p className="text-[10px] text-muted-foreground leading-relaxed">{ep.desc}</p>
                      <div className="space-y-1">
                        <p className="text-[9px] text-muted-foreground font-medium">الإجراءات المدعومة:</p>
                        <div className="flex flex-wrap gap-1">
                          {ep.actions.map(a => (
                            <span key={a} className="inline-block px-1.5 py-0.5 bg-muted rounded text-[9px] font-mono">{a}</span>
                          ))}
                        </div>
                      </div>
                      <div className="pt-1 border-t">
                        <p className="text-[9px] font-mono text-muted-foreground" dir="ltr">
                          /functions/v1/{ep.name}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* ══════════ WAPILOT API DOCUMENTATION ══════════ */}
          <Card className="border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                توثيق WaPilot API
                <Button variant="outline" size="sm" className="text-[10px] h-6 mr-auto gap-1" onClick={() => window.open('/dashboard/api', '_blank')}>
                  <ExternalLink className="h-3 w-3" />صفحة API العامة
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Base URL */}
              <div>
                <p className="text-xs font-medium mb-1.5">عنوان API الأساسي (WaPilot Proxy)</p>
                <code className="block p-2.5 bg-muted rounded-lg text-xs font-mono break-all" dir="ltr">
                  {`${window.location.origin.replace('id-preview--', '')}/functions/v1/wapilot-proxy`}
                </code>
              </div>

              {/* Auth */}
              <div>
                <p className="text-xs font-medium mb-1.5">المصادقة</p>
                <code className="block p-2.5 bg-muted rounded-lg text-xs font-mono" dir="ltr">
                  Authorization: Bearer {'<JWT_TOKEN>'}
                </code>
                <p className="text-[10px] text-muted-foreground mt-1">يتطلب توكن JWT صالح من نظام المصادقة</p>
              </div>

              {/* WaPilot Endpoints */}
              <div>
                <p className="text-xs font-medium mb-2">نقاط الوصول المتاحة (Actions)</p>
                <div className="space-y-1.5">
                  {[
                    { action: 'diagnostics', method: 'POST', desc: 'تشخيص الاتصال وحالة النظام', category: 'نظام' },
                    { action: 'list-instances', method: 'POST', desc: 'عرض الأجهزة المتصلة', category: 'أجهزة' },
                    { action: 'instance-status', method: 'POST', desc: 'حالة جهاز محدد', category: 'أجهزة' },
                    { action: 'instance-info', method: 'POST', desc: 'معلومات تفصيلية عن الجهاز', category: 'أجهزة' },
                    { action: 'connect-instance', method: 'POST', desc: 'اتصال بالجهاز', category: 'أجهزة' },
                    { action: 'disconnect-instance', method: 'POST', desc: 'قطع اتصال الجهاز', category: 'أجهزة' },
                    { action: 'restart-instance', method: 'POST', desc: 'إعادة تشغيل الجهاز', category: 'أجهزة' },
                    { action: 'get-qr', method: 'POST', desc: 'الحصول على رمز QR للربط', category: 'أجهزة' },
                    { action: 'send-message', method: 'POST', desc: 'إرسال رسالة نصية', category: 'رسائل' },
                    { action: 'send-list', method: 'POST', desc: 'إرسال رسالة تفاعلية (قائمة)', category: 'رسائل' },
                    { action: 'list-messages', method: 'POST', desc: 'عرض الرسائل', category: 'رسائل' },
                    { action: 'list-campaigns', method: 'POST', desc: 'عرض الحملات', category: 'حملات' },
                    { action: 'create-campaign', method: 'POST', desc: 'إنشاء حملة جديدة', category: 'حملات' },
                    { action: 'bulk-add-messages', method: 'POST', desc: 'إضافة رسائل جماعية لحملة', category: 'حملات' },
                    { action: 'start-campaign', method: 'POST', desc: 'تشغيل حملة', category: 'حملات' },
                    { action: 'campaign-stats', method: 'POST', desc: 'إحصائيات حملة', category: 'حملات' },
                  ].map(ep => (
                    <div key={ep.action} className="flex items-center justify-between p-2 bg-muted/40 rounded-lg text-xs">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-mono text-[9px] w-12 justify-center">{ep.method}</Badge>
                        <code className="font-mono text-[11px]" dir="ltr">{ep.action}</code>
                        <span className="text-muted-foreground hidden sm:inline">{ep.desc}</span>
                      </div>
                      <Badge variant="outline" className="text-[9px]">{ep.category}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Other Endpoints */}
              <div>
                <p className="text-xs font-medium mb-2">نقاط الوصول المباشرة الأخرى</p>
                <div className="space-y-1.5">
                  {[
                    { path: '/functions/v1/whatsapp-send', method: 'POST', desc: 'إرسال رسائل واتساب (فردية/جماعية) مع تسجيل تلقائي', scope: 'رسائل' },
                    { path: '/functions/v1/whatsapp-event', method: 'POST', desc: 'محرك الأحداث التلقائية (شحنات، فواتير، OTP)', scope: 'أحداث' },
                    { path: '/functions/v1/whatsapp-webhook', method: 'POST', desc: 'استقبال الرسائل الواردة وتحديثات الحالة', scope: 'Webhook' },
                    { path: '/functions/v1/public-api', method: 'GET/POST', desc: 'API العام للتكامل الخارجي (شحنات، فواتير، تقارير)', scope: 'عام' },
                  ].map(ep => (
                    <div key={ep.path} className="flex items-center justify-between p-2 bg-muted/40 rounded-lg text-xs">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-mono text-[9px] min-w-[50px] justify-center">{ep.method}</Badge>
                        <code className="font-mono text-[10px]" dir="ltr">{ep.path}</code>
                        <span className="text-muted-foreground hidden sm:inline">{ep.desc}</span>
                      </div>
                      <Badge variant="outline" className="text-[9px]">{ep.scope}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Example Request */}
              <div>
                <p className="text-xs font-medium mb-1.5">مثال: إرسال رسالة عبر WaPilot Proxy</p>
                <pre className="p-3 bg-muted rounded-lg text-[10px] font-mono overflow-x-auto whitespace-pre-wrap" dir="ltr">
{`// JavaScript / TypeScript
const { data, error } = await supabase.functions.invoke('wapilot-proxy', {
  body: {
    action: 'send-message',
    chat_id: '201XXXXXXXXX@c.us',
    text: 'مرحباً! هذه رسالة تجريبية من النظام'
  }
});`}
                </pre>
              </div>

              {/* Example whatsapp-send */}
              <div>
                <p className="text-xs font-medium mb-1.5">مثال: إرسال عبر whatsapp-send مع تسجيل تلقائي</p>
                <pre className="p-3 bg-muted rounded-lg text-[10px] font-mono overflow-x-auto whitespace-pre-wrap" dir="ltr">
{`const { data, error } = await supabase.functions.invoke('whatsapp-send', {
  body: {
    to_phone: '201XXXXXXXXX',
    message: 'تم إنشاء شحنة جديدة رقم #12345',
    organization_id: 'org-uuid-here',
    message_type: 'notification'
  }
});`}
                </pre>
              </div>

              {/* Rate Limits */}
              <div className="bg-muted/30 rounded-lg p-3 border">
                <p className="text-xs font-medium mb-1">ملاحظات مهمة</p>
                <ul className="text-[10px] text-muted-foreground space-y-0.5">
                  <li>• جميع الطلبات تتطلب JWT Token صالح (باستثناء Webhook)</li>
                  <li>• يتم تسجيل كل رسالة مُرسلة تلقائياً في جدول whatsapp_messages</li>
                  <li>• الـ Instance ID يتم تحديده تلقائياً من إعدادات النظام</li>
                  <li>• الحد الأقصى للإرسال الجماعي: يعتمد على خطة WaPilot</li>
                  <li>• Public API يستخدم مفاتيح API منفصلة (x-api-key)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* ══════════ SUBSCRIPTION STATUS ══════════ */}
          <Card className={`border ${subscriptionInfo ? (subscriptionInfo.days_remaining !== null && subscriptionInfo.days_remaining <= 7 ? 'border-amber-500/30' : 'border-green-500/20') : 'border-destructive/20'}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                حالة اشتراك المنصة
                {subscriptionInfo ? (
                  <Badge variant={subscriptionInfo.days_remaining !== null && subscriptionInfo.days_remaining <= 7 ? 'destructive' : 'default'} className="text-[10px] mr-auto">
                    {subscriptionInfo.status === 'active' ? '✓ نشط' : subscriptionInfo.status === 'grace_period' ? '⚠ فترة سماح' : subscriptionInfo.status}
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-[10px] mr-auto">✗ لا يوجد اشتراك</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {subscriptionInfo ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="bg-muted/40 rounded-lg p-3 space-y-1">
                      <p className="text-[10px] text-muted-foreground">الخطة</p>
                      <p className="text-xs font-medium">{subscriptionInfo.plan_name || 'غير محدد'}</p>
                    </div>
                    <div className="bg-muted/40 rounded-lg p-3 space-y-1">
                      <p className="text-[10px] text-muted-foreground">تاريخ البدء</p>
                      <p className="text-xs font-medium">{subscriptionInfo.start_date ? new Date(subscriptionInfo.start_date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</p>
                    </div>
                    <div className="bg-muted/40 rounded-lg p-3 space-y-1">
                      <p className="text-[10px] text-muted-foreground">تاريخ الانتهاء</p>
                      <p className={`text-xs font-medium ${subscriptionInfo.days_remaining !== null && subscriptionInfo.days_remaining <= 7 ? 'text-destructive' : ''}`}>
                        {subscriptionInfo.expiry_date ? new Date(subscriptionInfo.expiry_date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                      </p>
                    </div>
                    <div className="bg-muted/40 rounded-lg p-3 space-y-1">
                      <p className="text-[10px] text-muted-foreground">الأيام المتبقية</p>
                      <p className={`text-lg font-bold ${
                        subscriptionInfo.days_remaining === null ? 'text-muted-foreground' :
                        subscriptionInfo.days_remaining <= 3 ? 'text-destructive' :
                        subscriptionInfo.days_remaining <= 7 ? 'text-amber-600' :
                        'text-green-600'
                      }`}>
                        {subscriptionInfo.days_remaining !== null ? `${subscriptionInfo.days_remaining} يوم` : '—'}
                      </p>
                    </div>
                    <div className="bg-muted/40 rounded-lg p-3 space-y-1">
                      <p className="text-[10px] text-muted-foreground">المقاعد</p>
                      <p className="text-xs font-medium">{subscriptionInfo.total_seats}</p>
                    </div>
                    <div className="bg-muted/40 rounded-lg p-3 space-y-1">
                      <p className="text-[10px] text-muted-foreground">التجديد التلقائي</p>
                      <p className="text-xs font-medium">{subscriptionInfo.auto_renew ? '✓ مفعّل' : '✗ معطّل'}</p>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  {subscriptionInfo.total_days && subscriptionInfo.days_remaining !== null && (
                    <div>
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                        <span>مضى {subscriptionInfo.total_days - subscriptionInfo.days_remaining} يوم من {subscriptionInfo.total_days}</span>
                        <span>{subscriptionInfo.progress}%</span>
                      </div>
                      <Progress value={subscriptionInfo.progress} className="h-2" />
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-3">لا يوجد اشتراك نشط حالياً</p>
              )}
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

          {/* ══════════ MESSAGE LOG ══════════ */}
          <WaPilotMessageLog messages={messages} orgs={orgs} loading={refreshing} />

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
