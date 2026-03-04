import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import BackButton from '@/components/ui/back-button';
import {
  MessageCircle, Send, Users, Wifi, WifiOff, Building2,
  FileText, RefreshCw, TrendingUp, CheckCircle2, XCircle, Activity,
  Smartphone, Phone, Copy, ExternalLink
} from 'lucide-react';
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

const WaPilotManagement = () => {
  const { roles } = useAuth();
  const isAdmin = roles.includes('admin');
  const [stats, setStats] = useState({ totalMessages: 0, sent: 0, failed: 0, pending: 0, orgs: 0, users: 0, templates: 0 });
  const [instances, setInstances] = useState<InstanceInfo[]>([]);
  const [instanceStatus, setInstanceStatus] = useState<'connected' | 'disconnected' | 'loading'>('loading');
  const [connectedPhone, setConnectedPhone] = useState<string | null>(null);
  const [connectedName, setConnectedName] = useState<string | null>(null);
  const [activeInstanceId, setActiveInstanceId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    fetchQuickStats();
  }, [isAdmin]);

  const fetchQuickStats = async () => {
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

    const instList = Array.isArray(instRes.data) ? instRes.data : [];
    setInstances(instList);

    if (instList.length > 0) {
      const active = instList.find((i: any) => i.status === 'active' || i.status === 'connected') || instList[0];
      setActiveInstanceId(active.id);
      setInstanceStatus(active.status === 'active' || active.status === 'connected' ? 'connected' : 'disconnected');

      // Extract phone from instance data
      const phone = active.phone || active.me?.id?.replace('@c.us', '') || active.owner || null;
      const name = active.me?.pushName || active.name || null;
      setConnectedPhone(phone);
      setConnectedName(name);

      // If no phone found, try fetching instance status for more details
      if (!phone && active.id) {
        try {
          const { data: statusData } = await supabase.functions.invoke('wapilot-proxy', {
            body: { action: 'instance-status', instance_id: active.id },
          });
          if (statusData) {
            const detailPhone = statusData.phone || statusData.me?.id?.replace('@c.us', '') || statusData.owner || null;
            const detailName = statusData.me?.pushName || statusData.pushname || statusData.name || null;
            if (detailPhone) setConnectedPhone(detailPhone);
            if (detailName) setConnectedName(detailName);
          }
        } catch {}
      }
    } else {
      setInstanceStatus('disconnected');
    }
  };

  const copyPhone = () => {
    if (connectedPhone) {
      navigator.clipboard.writeText(connectedPhone);
      toast.success('تم نسخ الرقم');
    }
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
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MessageCircle className="h-7 w-7 text-primary" />
              مركز إدارة WaPilot
            </h1>
            <p className="text-muted-foreground text-sm">لوحة تحكم كاملة في نظام إشعارات الواتساب لجميع الجهات والمستخدمين</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
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
            {instances.length} جهاز
          </Badge>
        </div>
      </div>

      {/* ★ Connected Phone Number Card */}
      <Card className={`border-2 ${instanceStatus === 'connected' ? 'border-green-500/30 bg-gradient-to-r from-green-50/50 to-background dark:from-green-950/20' : 'border-destructive/30 bg-gradient-to-r from-destructive/5 to-background'}`}>
        <CardContent className="py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${instanceStatus === 'connected' ? 'bg-green-100 dark:bg-green-900/40' : 'bg-destructive/10'}`}>
                <Phone className={`h-6 w-6 ${instanceStatus === 'connected' ? 'text-green-600' : 'text-destructive'}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">رقم الإرسال المربوط بـ API</p>
                {connectedPhone ? (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold font-mono tracking-wider" dir="ltr">
                      +{connectedPhone.replace(/^0+/, '')}
                    </span>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={copyPhone}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <span className="text-lg text-muted-foreground">
                    {instanceStatus === 'loading' ? 'جاري الكشف...' : 'لم يتم الكشف عن الرقم'}
                  </span>
                )}
                {connectedName && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    الاسم: <span className="font-medium text-foreground">{connectedName}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 text-sm">
              {activeInstanceId && (
                <div className="text-center bg-muted/50 rounded-lg px-4 py-2">
                  <p className="text-[10px] text-muted-foreground">Instance ID</p>
                  <p className="font-mono text-xs" dir="ltr">{activeInstanceId}</p>
                </div>
              )}
              <div className="text-center bg-muted/50 rounded-lg px-4 py-2">
                <p className="text-[10px] text-muted-foreground">API Endpoint</p>
                <p className="font-mono text-xs" dir="ltr">api.wapilot.net/api/v2</p>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={fetchQuickStats}>
                <RefreshCw className="h-3.5 w-3.5" />
                تحديث
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
