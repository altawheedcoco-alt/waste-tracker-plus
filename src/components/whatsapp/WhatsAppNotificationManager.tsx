import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { motion } from 'framer-motion';
import {
  MessageSquare, Settings2, Send, Loader2, CheckCircle2, AlertTriangle,
  XCircle, Clock, FileText, Phone, Eye, RefreshCw,
  Link2, Unlink, BarChart3, Building2, Users, Globe, Shield,
  Bell, Megaphone, Plus, Trash2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';

const WhatsAppNotificationManager = () => {
  const { organization, user } = useAuth();
  const { isSystemAdmin } = useSubscriptionStatus();
  const queryClient = useQueryClient();
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedOrgFilter, setSelectedOrgFilter] = useState<string>('all');
  const [broadcastDialogOpen, setBroadcastDialogOpen] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastTargetOrgs, setBroadcastTargetOrgs] = useState<string[]>([]);
  const [broadcastTemplate, setBroadcastTemplate] = useState<string>('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Current org config (for non-admin or fallback)
  const currentOrgId = organization?.id;

  // Admin: Load ALL organizations
  const { data: allOrgs } = useQuery({
    queryKey: ['all-organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, organization_type, logo_url')
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: isSystemAdmin,
  });

  // Admin: Load ALL whatsapp configs
  const { data: allConfigs, isLoading: configLoading } = useQuery({
    queryKey: ['whatsapp-configs-all', isSystemAdmin],
    queryFn: async () => {
      if (isSystemAdmin) {
        const { data, error } = await supabase
          .from('whatsapp_config')
          .select('*');
        if (error) throw error;
        return data || [];
      } else {
        if (!currentOrgId) return [];
        const { data, error } = await supabase
          .from('whatsapp_config')
          .select('*')
          .eq('organization_id', currentOrgId);
        if (error) throw error;
        return data || [];
      }
    },
  });

  // Current config (filtered)
  const waConfig = isSystemAdmin && selectedOrgFilter !== 'all'
    ? allConfigs?.find(c => c.organization_id === selectedOrgFilter) || null
    : allConfigs?.find(c => c.organization_id === currentOrgId) || null;

  // Load templates
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['whatsapp-templates-all', isSystemAdmin],
    queryFn: async () => {
      let query = supabase.from('whatsapp_templates').select('*').order('created_at', { ascending: false });
      if (!isSystemAdmin && currentOrgId) {
        query = query.or(`organization_id.eq.${currentOrgId},is_system.eq.true`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Load message history (admin sees all, user sees own org)
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['whatsapp-messages-all', selectedOrgFilter, isSystemAdmin],
    queryFn: async () => {
      let query = supabase.from('whatsapp_messages').select('*').order('created_at', { ascending: false }).limit(100);
      if (!isSystemAdmin && currentOrgId) {
        query = query.eq('organization_id', currentOrgId);
      } else if (isSystemAdmin && selectedOrgFilter !== 'all') {
        query = query.eq('organization_id', selectedOrgFilter);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Admin: Load notification channels for all users
  const { data: allChannels } = useQuery({
    queryKey: ['all-notification-channels', isSystemAdmin],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_channels')
        .select('*')
        .eq('channel_type', 'whatsapp')
        .eq('is_enabled', true);
      if (error) throw error;
      return data || [];
    },
    enabled: isSystemAdmin,
  });

  // Update config
  const updateConfig = useMutation({
    mutationFn: async ({ orgId, updates }: { orgId: string; updates: Record<string, any> }) => {
      const existing = allConfigs?.find(c => c.organization_id === orgId);
      if (existing?.id) {
        const { error } = await supabase
          .from('whatsapp_config')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('whatsapp_config')
          .insert({ organization_id: orgId, ...updates });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-configs-all'] });
      toast.success('تم تحديث إعدادات الواتساب');
    },
    onError: () => toast.error('فشل في تحديث الإعدادات'),
  });

  // Send test
  const handleSendTest = async () => {
    if (!testPhone.trim()) { toast.error('أدخل رقم الهاتف'); return; }
    setIsSending(true);
    try {
      const targetOrg = isSystemAdmin && selectedOrgFilter !== 'all' ? selectedOrgFilter : currentOrgId;
      const { data, error } = await supabase.functions.invoke('whatsapp-send', {
        body: {
          action: 'send',
          to_phone: testPhone,
          organization_id: targetOrg,
          message_text: testMessage || '✅ رسالة تجريبية - الواتساب يعمل بنجاح!',
          message_type: 'text',
        },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success('تم إرسال الرسالة التجريبية');
        setTestPhone('');
        setTestMessage('');
        queryClient.invalidateQueries({ queryKey: ['whatsapp-messages-all'] });
      } else {
        toast.error(data?.error?.message || data?.error || 'فشل في الإرسال');
      }
    } catch (e: any) {
      toast.error(e.message || 'خطأ في الإرسال');
    } finally {
      setIsSending(false);
    }
  };

  // Admin broadcast
  const handleBroadcast = async () => {
    if (!broadcastMessage.trim() && !broadcastTemplate) {
      toast.error('أدخل نص الرسالة أو اختر قالب');
      return;
    }
    setIsBroadcasting(true);
    try {
      // Get all users with WhatsApp enabled in target orgs
      let targetChannels = allChannels || [];
      if (broadcastTargetOrgs.length > 0) {
        targetChannels = targetChannels.filter(ch => broadcastTargetOrgs.includes(ch.organization_id || ''));
      }

      if (targetChannels.length === 0) {
        toast.error('لا يوجد مستخدمين مفعلين لاستقبال الواتساب في الجهات المحددة');
        setIsBroadcasting(false);
        return;
      }

      const recipients = targetChannels.map(ch => ({
        phone: ch.phone_number,
        user_id: ch.user_id,
      }));

      const { data, error } = await supabase.functions.invoke('whatsapp-send', {
        body: {
          action: 'bulk',
          recipients,
          message_text: broadcastMessage || undefined,
          template_name: broadcastTemplate || undefined,
          message_type: 'text',
        },
      });

      if (error) throw error;

      const successCount = data?.results?.filter((r: any) => r.success).length || 0;
      const failCount = data?.results?.filter((r: any) => !r.success).length || 0;

      toast.success(`تم الإرسال: ${successCount} ناجح، ${failCount} فشل`);
      setBroadcastDialogOpen(false);
      setBroadcastMessage('');
      setBroadcastTargetOrgs([]);
      queryClient.invalidateQueries({ queryKey: ['whatsapp-messages-all'] });
    } catch (e: any) {
      toast.error(e.message || 'خطأ في الإرسال الجماعي');
    } finally {
      setIsBroadcasting(false);
    }
  };

  const getOrgName = (orgId: string | null) => {
    if (!orgId) return '-';
    return allOrgs?.find(o => o.id === orgId)?.name || orgId.slice(0, 8);
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'sent': return <Badge variant="secondary" className="gap-1 text-[10px]"><CheckCircle2 className="h-3 w-3" />مرسلة</Badge>;
      case 'delivered': return <Badge className="gap-1 text-[10px] bg-green-600"><CheckCircle2 className="h-3 w-3" />مسلّمة</Badge>;
      case 'read': return <Badge className="gap-1 text-[10px] bg-blue-600"><Eye className="h-3 w-3" />مقروءة</Badge>;
      case 'failed': return <Badge variant="destructive" className="gap-1 text-[10px]"><XCircle className="h-3 w-3" />فشلت</Badge>;
      default: return <Badge variant="outline" className="gap-1 text-[10px]"><Clock className="h-3 w-3" />معلقة</Badge>;
    }
  };

  // Stats
  const totalSent = messages?.filter(m => ['sent', 'delivered', 'read'].includes(m.status || '')).length || 0;
  const totalFailed = messages?.filter(m => m.status === 'failed').length || 0;
  const totalDelivered = messages?.filter(m => ['delivered', 'read'].includes(m.status || '')).length || 0;
  const connectedOrgs = allConfigs?.filter(c => c.phone_number_id && c.is_active).length || 0;
  const activeUsers = allChannels?.length || 0;

  // Check global connection
  const hasGlobalKey = !!waConfig?.phone_number_id;

  if (configLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-green-100 dark:bg-green-950/30">
            <MessageSquare className="h-7 w-7 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              نظام إشعارات الواتساب
              {isSystemAdmin && (
                <Badge variant="outline" className="gap-1 text-[10px] border-amber-300 text-amber-600">
                  <Shield className="h-3 w-3" />
                  مدير النظام
                </Badge>
              )}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isSystemAdmin ? 'تحكم كامل بإشعارات الواتساب لكل الجهات' : 'إدارة إشعارات الواتساب الخاصة بمنظمتك'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isSystemAdmin && (
            <Dialog open={broadcastDialogOpen} onOpenChange={setBroadcastDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Megaphone className="h-4 w-4" />
                  إرسال جماعي
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg" dir="rtl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Megaphone className="h-5 w-5" />
                    إرسال جماعي عبر الواتساب
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Target orgs */}
                  <div className="space-y-2">
                    <Label>الجهات المستهدفة</Label>
                    <ScrollArea className="max-h-[150px] border rounded-lg p-2">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-1">
                          <Checkbox
                            checked={broadcastTargetOrgs.length === 0}
                            onCheckedChange={() => setBroadcastTargetOrgs([])}
                          />
                          <span className="text-sm font-medium">جميع الجهات</span>
                        </div>
                        {allOrgs?.map(org => (
                          <div key={org.id} className="flex items-center gap-2 p-1">
                            <Checkbox
                              checked={broadcastTargetOrgs.includes(org.id)}
                              onCheckedChange={(checked) => {
                                if (checked) setBroadcastTargetOrgs(prev => [...prev, org.id]);
                                else setBroadcastTargetOrgs(prev => prev.filter(id => id !== org.id));
                              }}
                            />
                            <span className="text-sm">{org.name}</span>
                            <Badge variant="outline" className="text-[10px] mr-auto">{org.organization_type}</Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Template or custom */}
                  <div className="space-y-2">
                    <Label>القالب (اختياري)</Label>
                    <Select value={broadcastTemplate} onValueChange={setBroadcastTemplate}>
                      <SelectTrigger>
                        <SelectValue placeholder="بدون قالب - رسالة مخصصة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">بدون قالب</SelectItem>
                        {templates?.filter(t => t.is_active).map(t => (
                          <SelectItem key={t.id} value={t.template_name}>{t.template_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {!broadcastTemplate && (
                    <div className="space-y-2">
                      <Label>نص الرسالة</Label>
                      <Textarea
                        placeholder="اكتب رسالتك هنا..."
                        value={broadcastMessage}
                        onChange={(e) => setBroadcastMessage(e.target.value)}
                        rows={4}
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    <Users className="h-4 w-4 shrink-0" />
                    <span>
                      سيتم الإرسال لـ {broadcastTargetOrgs.length > 0
                        ? `${allChannels?.filter(ch => broadcastTargetOrgs.includes(ch.organization_id || '')).length || 0} مستخدم`
                        : `${activeUsers} مستخدم مفعّل`}
                    </span>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setBroadcastDialogOpen(false)}>إلغاء</Button>
                  <Button onClick={handleBroadcast} disabled={isBroadcasting} className="gap-2">
                    {isBroadcasting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    إرسال
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </motion.div>

      {/* Admin: Org filter */}
      {isSystemAdmin && (
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm whitespace-nowrap">عرض بيانات:</Label>
              <Select value={selectedOrgFilter} onValueChange={setSelectedOrgFilter}>
                <SelectTrigger className="max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الجهات</SelectItem>
                  {allOrgs?.map(org => (
                    <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connection Banner */}
      {!hasGlobalKey && !isSystemAdmin && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40">
                <Unlink className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold text-amber-800 dark:text-amber-300">واتساب غير متصل</h3>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  تواصل مع مدير النظام لتفعيل إشعارات الواتساب لمنظمتك.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'إجمالي المرسل', value: totalSent, icon: Send, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/20' },
          { label: 'تم التسليم', value: totalDelivered, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/20' },
          { label: 'فشل الإرسال', value: totalFailed, icon: XCircle, color: 'text-destructive', bg: 'bg-red-50 dark:bg-red-950/20' },
          ...(isSystemAdmin ? [
            { label: 'جهات متصلة', value: connectedOrgs, icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/20' },
            { label: 'مستخدمين مفعّلين', value: activeUsers, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/20' },
          ] : [
            { label: 'القوالب', value: templates?.length || 0, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/20' },
          ]),
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="py-4 px-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue={isSystemAdmin ? 'orgs' : 'config'} dir="rtl">
        <TabsList className={`grid w-full ${isSystemAdmin ? 'grid-cols-5' : 'grid-cols-4'}`}>
          {isSystemAdmin && (
            <TabsTrigger value="orgs" className="gap-1.5 text-xs">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">الجهات</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="config" className="gap-1.5 text-xs">
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">الإعدادات</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5 text-xs">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">القوالب</span>
          </TabsTrigger>
          <TabsTrigger value="send" className="gap-1.5 text-xs">
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">إرسال</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5 text-xs">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">السجل</span>
          </TabsTrigger>
        </TabsList>

        {/* Admin: Organizations Control Tab */}
        {isSystemAdmin && (
          <TabsContent value="orgs" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  تحكم الواتساب لكل جهة
                </CardTitle>
                <CardDescription>تفعيل/تعطيل واتساب وضبط الإشعارات لكل منظمة</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[500px]">
                  <div className="space-y-3">
                    {allOrgs?.map(org => {
                      const orgConfig = allConfigs?.find(c => c.organization_id === org.id);
                      const isOrgActive = orgConfig?.is_active ?? false;
                      const hasPhoneId = !!orgConfig?.phone_number_id;
                      return (
                        <div key={org.id} className={`p-4 border rounded-lg transition-colors ${isOrgActive ? 'border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-950/10' : ''}`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                                {org.name?.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{org.name}</p>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-[10px]">{org.organization_type}</Badge>
                                  {hasPhoneId && <Badge className="text-[10px] bg-green-600">متصل</Badge>}
                                </div>
                              </div>
                            </div>
                            <Switch
                              checked={isOrgActive}
                              onCheckedChange={(v) => updateConfig.mutate({ orgId: org.id, updates: { is_active: v } })}
                            />
                          </div>
                          {isOrgActive && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                              {[
                                { key: 'auto_send_notifications', label: 'إشعارات الشحنات' },
                                { key: 'auto_send_otp', label: 'رموز التحقق' },
                                { key: 'auto_send_subscription_reminders', label: 'تذكير الاشتراكات' },
                                { key: 'auto_send_marketing', label: 'رسائل تسويقية' },
                              ].map(item => (
                                <div key={item.key} className="flex items-center gap-2 p-2 rounded border bg-background">
                                  <Switch
                                    className="scale-75"
                                    checked={(orgConfig as any)?.[item.key] ?? false}
                                    onCheckedChange={(v) => updateConfig.mutate({ orgId: org.id, updates: { [item.key]: v } })}
                                  />
                                  <span className="text-[11px]">{item.label}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Config Tab */}
        <TabsContent value="config" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                إعدادات الاتصال
              </CardTitle>
              <CardDescription>
                {isSystemAdmin ? 'إعداد مفاتيح WhatsApp Cloud API (مدير النظام فقط)' : 'عرض حالة الاتصال'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isSystemAdmin ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>معرف رقم الهاتف (Phone Number ID)</Label>
                      <Input
                        dir="ltr"
                        placeholder="123456789012345"
                        defaultValue={waConfig?.phone_number_id || ''}
                        onBlur={(e) => {
                          const orgId = selectedOrgFilter !== 'all' ? selectedOrgFilter : currentOrgId;
                          if (orgId) updateConfig.mutate({ orgId, updates: { phone_number_id: e.target.value } });
                        }}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>رقم الهاتف المعروض</Label>
                      <Input
                        dir="ltr"
                        placeholder="+201234567890"
                        defaultValue={waConfig?.display_phone_number || ''}
                        onBlur={(e) => {
                          const orgId = selectedOrgFilter !== 'all' ? selectedOrgFilter : currentOrgId;
                          if (orgId) updateConfig.mutate({ orgId, updates: { display_phone_number: e.target.value } });
                        }}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>معرف حساب الأعمال</Label>
                      <Input
                        dir="ltr"
                        placeholder="987654321098765"
                        defaultValue={waConfig?.business_account_id || ''}
                        onBlur={(e) => {
                          const orgId = selectedOrgFilter !== 'all' ? selectedOrgFilter : currentOrgId;
                          if (orgId) updateConfig.mutate({ orgId, updates: { business_account_id: e.target.value } });
                        }}
                        className="font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>يلزم إضافة <strong>WHATSAPP_ACCESS_TOKEN</strong> كسر في إعدادات النظام للتفعيل الفعلي</span>
                  </div>
                </>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Shield className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="font-medium">إعدادات الاتصال يديرها مدير النظام</p>
                  <p className="text-xs mt-1">تواصل مع المدير لتعديل إعدادات الواتساب</p>
                </div>
              )}

              <Separator />

              <div className="space-y-3">
                <Label className="font-semibold">أنواع الإشعارات التلقائية</Label>
                {[
                  { key: 'auto_send_notifications', label: 'إشعارات تحديث الشحنات', desc: 'إرسال تلقائي عند تغير حالة الشحنة', icon: Bell },
                  { key: 'auto_send_otp', label: 'رموز التحقق (OTP)', desc: 'إرسال رموز التحقق عبر واتساب', icon: Shield },
                  { key: 'auto_send_subscription_reminders', label: 'تذكير الاشتراكات', desc: 'تذكير قبل انتهاء الاشتراك', icon: Clock },
                  { key: 'auto_send_marketing', label: 'رسائل تسويقية', desc: 'إرسال عروض وأخبار النظام', icon: Megaphone },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                    {isSystemAdmin ? (
                      <Switch
                        checked={(waConfig as any)?.[item.key] ?? false}
                        onCheckedChange={(v) => {
                          const orgId = selectedOrgFilter !== 'all' ? selectedOrgFilter : currentOrgId;
                          if (orgId) updateConfig.mutate({ orgId, updates: { [item.key]: v } });
                        }}
                      />
                    ) : (
                      <Badge variant={waConfig?.[item.key as keyof typeof waConfig] ? 'default' : 'secondary'} className="text-[10px]">
                        {waConfig?.[item.key as keyof typeof waConfig] ? 'مفعّل' : 'معطّل'}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    قوالب الرسائل
                  </CardTitle>
                  <CardDescription>قوالب Meta المعتمدة للإرسال التلقائي</CardDescription>
                </div>
                <Button size="sm" variant="outline" className="gap-2" onClick={() => queryClient.invalidateQueries({ queryKey: ['whatsapp-templates-all'] })}>
                  <RefreshCw className="h-3.5 w-3.5" />
                  تحديث
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {templatesLoading ? (
                <div className="py-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
              ) : templates && templates.length > 0 ? (
                <ScrollArea className="max-h-[400px]">
                  <div className="space-y-3">
                    {templates.map(t => (
                      <div key={t.id} className="p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-semibold">{t.template_name}</span>
                            <Badge variant={t.is_active ? 'default' : 'secondary'} className="text-[10px]">{t.is_active ? 'نشط' : 'معطل'}</Badge>
                            {t.is_system && <Badge variant="outline" className="text-[10px]">نظام</Badge>}
                          </div>
                          <Badge variant="outline" className="text-[10px]">
                            {t.category === 'utility' ? 'خدمي' : t.category === 'marketing' ? 'تسويقي' : t.category === 'authentication' ? 'تحقق' : t.category}
                          </Badge>
                        </div>
                        <p className="text-sm bg-muted/50 p-2 rounded">{t.body_text}</p>
                        {isSystemAdmin && t.organization_id && (
                          <p className="text-[10px] text-muted-foreground mt-1">🏢 {getOrgName(t.organization_id)}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>لا توجد قوالب بعد</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Send Tab */}
        <TabsContent value="send" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Send className="h-5 w-5" />
                إرسال رسالة تجريبية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Phone className="h-4 w-4" />رقم الهاتف</Label>
                <Input dir="ltr" placeholder="+201234567890" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} className="font-mono" />
              </div>
              <div className="space-y-2">
                <Label>نص الرسالة (اختياري)</Label>
                <Textarea placeholder="رسالة تجريبية افتراضية..." value={testMessage} onChange={(e) => setTestMessage(e.target.value)} rows={3} />
              </div>
              <Button onClick={handleSendTest} disabled={isSending || !testPhone} className="w-full gap-2">
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {isSending ? 'جاري الإرسال...' : 'إرسال رسالة تجريبية'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  سجل الرسائل
                </CardTitle>
                <Button size="sm" variant="outline" className="gap-2" onClick={() => queryClient.invalidateQueries({ queryKey: ['whatsapp-messages-all'] })}>
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {messagesLoading ? (
                <div className="py-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
              ) : messages && messages.length > 0 ? (
                <ScrollArea className="max-h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">الوقت</TableHead>
                        {isSystemAdmin && <TableHead className="text-right">الجهة</TableHead>}
                        <TableHead className="text-right">إلى</TableHead>
                        <TableHead className="text-right">النوع</TableHead>
                        <TableHead className="text-right">المحتوى</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {messages.map(msg => (
                        <TableRow key={msg.id}>
                          <TableCell className="text-xs whitespace-nowrap">
                            {format(new Date(msg.created_at), 'dd/MM HH:mm', { locale: ar })}
                          </TableCell>
                          {isSystemAdmin && (
                            <TableCell className="text-xs">{getOrgName(msg.organization_id)}</TableCell>
                          )}
                          <TableCell className="font-mono text-xs">{msg.to_phone || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">
                              {msg.message_type === 'template' ? 'قالب' : 'نص'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs max-w-[150px] truncate">{msg.content || '-'}</TableCell>
                          <TableCell>{getStatusBadge(msg.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>لا توجد رسائل بعد</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WhatsAppNotificationManager;
