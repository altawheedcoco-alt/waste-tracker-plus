import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3, Send, Users, Wifi, WifiOff, MessageCircle, Building2,
  FileText, Zap, Bot, HeartPulse, Calendar, Smartphone, Settings2,
  ShieldBan, RefreshCw, TrendingUp, CheckCircle2, XCircle, Clock, Activity
} from 'lucide-react';
import WhatsAppNotificationManager from '@/components/whatsapp/WhatsAppNotificationManager';

const WaPilotManagement = () => {
  const { roles } = useAuth();
  const isAdmin = roles.includes('admin');
  const [stats, setStats] = useState({ totalMessages: 0, sent: 0, failed: 0, pending: 0, orgs: 0, users: 0, templates: 0 });
  const [instanceCount, setInstanceCount] = useState(0);
  const [instanceStatus, setInstanceStatus] = useState<'connected' | 'disconnected' | 'loading'>('loading');

  useEffect(() => {
    if (!isAdmin) return;
    fetchQuickStats();
  }, [isAdmin]);

  const fetchQuickStats = async () => {
    // Parallel fetches
    const [msgRes, orgRes, userRes, tplRes, instRes] = await Promise.all([
      supabase.from('whatsapp_messages').select('id, status', { count: 'exact', head: false }).limit(1000),
      supabase.from('organizations').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).not('phone', 'is', null),
      supabase.from('whatsapp_templates').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.functions.invoke('wapilot-proxy', { body: { action: 'list-instances' } }).catch(() => ({ data: [] })),
    ]);

    const msgs = msgRes.data || [];
    setStats({
      totalMessages: msgs.length,
      sent: msgs.filter((m: any) => m.status === 'sent' || m.status === 'delivered').length,
      failed: msgs.filter((m: any) => m.status === 'failed').length,
      pending: msgs.filter((m: any) => m.status === 'pending').length,
      orgs: orgRes.count || 0,
      users: userRes.count || 0,
      templates: tplRes.count || 0,
    });

    const instances = Array.isArray(instRes.data) ? instRes.data : [];
    setInstanceCount(instances.length);
    setInstanceStatus(instances.some((i: any) => i.status === 'active' || i.status === 'connected') ? 'connected' : instances.length > 0 ? 'disconnected' : 'disconnected');
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        هذه الصفحة متاحة لمدير النظام فقط
      </div>
    );
  }

  const deliveryRate = stats.totalMessages > 0 ? Math.round((stats.sent / stats.totalMessages) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageCircle className="h-7 w-7 text-primary" />
            مركز إدارة WaPilot
          </h1>
          <p className="text-muted-foreground text-sm">لوحة تحكم كاملة في نظام إشعارات الواتساب لجميع الجهات والمستخدمين</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
            instanceStatus === 'connected' ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400' :
            instanceStatus === 'loading' ? 'bg-muted text-muted-foreground' :
            'bg-destructive/10 text-destructive'
          }`}>
            {instanceStatus === 'connected' ? <Wifi className="h-4 w-4" /> :
             instanceStatus === 'loading' ? <RefreshCw className="h-4 w-4 animate-spin" /> :
             <WifiOff className="h-4 w-4" />}
            {instanceStatus === 'connected' ? 'متصل' : instanceStatus === 'loading' ? 'جاري الفحص...' : 'غير متصل'}
          </div>
          <Badge variant="outline" className="px-3 py-1.5">
            <Smartphone className="h-3.5 w-3.5 ml-1" />
            {instanceCount} جهاز
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card className="border-primary/20"><CardContent className="pt-4 text-center">
          <Activity className="h-4 w-4 mx-auto mb-1 text-primary" />
          <div className="text-xl font-bold">{stats.totalMessages}</div>
          <p className="text-[10px] text-muted-foreground">إجمالي الرسائل</p>
        </CardContent></Card>
        <Card className="border-green-500/20"><CardContent className="pt-4 text-center">
          <CheckCircle2 className="h-4 w-4 mx-auto mb-1 text-green-600" />
          <div className="text-xl font-bold text-green-600">{stats.sent}</div>
          <p className="text-[10px] text-muted-foreground">تم الإرسال</p>
        </CardContent></Card>
        <Card className="border-destructive/20"><CardContent className="pt-4 text-center">
          <XCircle className="h-4 w-4 mx-auto mb-1 text-destructive" />
          <div className="text-xl font-bold text-destructive">{stats.failed}</div>
          <p className="text-[10px] text-muted-foreground">فشل</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <TrendingUp className="h-4 w-4 mx-auto mb-1 text-primary" />
          <div className="text-xl font-bold">{deliveryRate}%</div>
          <p className="text-[10px] text-muted-foreground">نسبة التسليم</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Building2 className="h-4 w-4 mx-auto mb-1 text-primary" />
          <div className="text-xl font-bold">{stats.orgs}</div>
          <p className="text-[10px] text-muted-foreground">الجهات</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Users className="h-4 w-4 mx-auto mb-1 text-primary" />
          <div className="text-xl font-bold">{stats.users}</div>
          <p className="text-[10px] text-muted-foreground">مستخدمون بواتساب</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <FileText className="h-4 w-4 mx-auto mb-1 text-primary" />
          <div className="text-xl font-bold">{stats.templates}</div>
          <p className="text-[10px] text-muted-foreground">قوالب نشطة</p>
        </CardContent></Card>
      </div>

      {/* Full Manager */}
      <WhatsAppNotificationManager />
    </div>
  );
};

export default WaPilotManagement;
