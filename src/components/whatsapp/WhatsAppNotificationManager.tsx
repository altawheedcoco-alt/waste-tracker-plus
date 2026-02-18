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
import { motion } from 'framer-motion';
import {
  MessageSquare, Settings2, Send, Loader2, CheckCircle2, AlertTriangle,
  XCircle, Clock, Zap, FileText, Plus, Phone, Eye, RefreshCw,
  Link2, Unlink, BarChart3, ArrowUpDown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const WhatsAppNotificationManager = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Check WhatsApp config
  const { data: waConfig, isLoading: configLoading } = useQuery({
    queryKey: ['whatsapp-config', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const { data, error } = await supabase
        .from('whatsapp_config')
        .select('*')
        .eq('organization_id', organization.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });

  // Load templates
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['whatsapp-templates', organization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .or(`organization_id.eq.${organization?.id},is_system.eq.true`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id,
  });

  // Load message history
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['whatsapp-messages', organization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('organization_id', organization?.id || '')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id,
  });

  // Update config
  const updateConfig = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      if (waConfig?.id) {
        const { error } = await supabase
          .from('whatsapp_config')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', waConfig.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('whatsapp_config')
          .insert({ organization_id: organization!.id, ...updates });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-config'] });
      toast.success('تم تحديث إعدادات الواتساب');
    },
    onError: () => toast.error('فشل في تحديث الإعدادات'),
  });

  // Send test message
  const handleSendTest = async () => {
    if (!testPhone.trim()) {
      toast.error('أدخل رقم الهاتف');
      return;
    }
    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-send', {
        body: {
          action: 'send',
          to_phone: testPhone,
          organization_id: organization?.id,
          message_text: testMessage || '✅ رسالة تجريبية من منصة آي ريسايكل - الواتساب يعمل بنجاح!',
          message_type: 'text',
        },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success('تم إرسال الرسالة التجريبية بنجاح');
        setTestPhone('');
        setTestMessage('');
        queryClient.invalidateQueries({ queryKey: ['whatsapp-messages'] });
      } else {
        toast.error(data?.error?.message || data?.error || 'فشل في الإرسال');
      }
    } catch (e: any) {
      toast.error(e.message || 'خطأ في الإرسال');
    } finally {
      setIsSending(false);
    }
  };

  const isConnected = !!waConfig?.phone_number_id;
  const isActive = waConfig?.is_active !== false;

  const statusColor = isConnected && isActive ? 'bg-green-500' : isConnected ? 'bg-amber-500' : 'bg-destructive';
  const statusText = isConnected && isActive ? 'متصل ونشط' : isConnected ? 'متصل ومتوقف' : 'غير متصل';

  const getMessageStatusBadge = (status: string | null) => {
    switch (status) {
      case 'sent': return <Badge variant="secondary" className="gap-1 text-xs"><CheckCircle2 className="h-3 w-3" />مرسلة</Badge>;
      case 'delivered': return <Badge className="gap-1 text-xs bg-green-600"><CheckCircle2 className="h-3 w-3" />تم التسليم</Badge>;
      case 'read': return <Badge className="gap-1 text-xs bg-blue-600"><Eye className="h-3 w-3" />مقروءة</Badge>;
      case 'failed': return <Badge variant="destructive" className="gap-1 text-xs"><XCircle className="h-3 w-3" />فشلت</Badge>;
      default: return <Badge variant="outline" className="gap-1 text-xs"><Clock className="h-3 w-3" />معلقة</Badge>;
    }
  };

  // Stats
  const totalSent = messages?.filter(m => m.status === 'sent' || m.status === 'delivered' || m.status === 'read').length || 0;
  const totalFailed = messages?.filter(m => m.status === 'failed').length || 0;
  const totalDelivered = messages?.filter(m => m.status === 'delivered' || m.status === 'read').length || 0;

  if (configLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Status */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-green-100 dark:bg-green-950/30">
            <MessageSquare className="h-7 w-7 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold">نظام إشعارات الواتساب</h2>
            <p className="text-sm text-muted-foreground">إدارة وإرسال الإشعارات عبر WhatsApp Cloud API</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`h-3 w-3 rounded-full ${statusColor} animate-pulse`} />
          <span className="text-sm font-medium">{statusText}</span>
          {isConnected && (
            <Switch
              checked={isActive}
              onCheckedChange={(v) => updateConfig.mutate({ is_active: v })}
            />
          )}
        </div>
      </motion.div>

      {/* Connection Banner */}
      {!isConnected && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
            <CardContent className="py-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40">
                  <Unlink className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="font-semibold text-amber-800 dark:text-amber-300">واتساب غير متصل</h3>
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    لتفعيل نظام إشعارات الواتساب، يلزم إعداد مفتاح WhatsApp Cloud API من Meta Business Suite.
                  </p>
                  <div className="space-y-1 text-xs text-amber-600 dark:text-amber-500">
                    <p>📌 المتطلبات:</p>
                    <ul className="list-disc list-inside space-y-1 mr-4">
                      <li>حساب Meta Business مفعّل</li>
                      <li>تطبيق Meta Developer</li>
                      <li>رقم هاتف مسجّل كـ Business API</li>
                      <li>معرف رقم الهاتف (Phone Number ID)</li>
                      <li>رمز وصول دائم (Access Token)</li>
                    </ul>
                  </div>
                  <div className="pt-2 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" className="gap-2 border-amber-300" onClick={() => {
                      window.open('https://business.facebook.com/', '_blank');
                    }}>
                      <Link2 className="h-3.5 w-3.5" />
                      فتح Meta Business
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'إجمالي المرسل', value: totalSent, icon: Send, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/20' },
          { label: 'تم التسليم', value: totalDelivered, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/20' },
          { label: 'فشل الإرسال', value: totalFailed, icon: XCircle, color: 'text-destructive', bg: 'bg-red-50 dark:bg-red-950/20' },
          { label: 'القوالب', value: templates?.length || 0, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/20' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card>
              <CardContent className="py-4 px-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="config" dir="rtl">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="config" className="gap-1.5 text-xs sm:text-sm">
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">الإعدادات</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5 text-xs sm:text-sm">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">القوالب</span>
          </TabsTrigger>
          <TabsTrigger value="send" className="gap-1.5 text-xs sm:text-sm">
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">إرسال</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5 text-xs sm:text-sm">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">السجل</span>
          </TabsTrigger>
        </TabsList>

        {/* Config Tab */}
        <TabsContent value="config" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                إعدادات الاتصال
              </CardTitle>
              <CardDescription>إعداد معلومات حساب WhatsApp Cloud API</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>معرف رقم الهاتف (Phone Number ID)</Label>
                  <Input
                    dir="ltr"
                    placeholder="مثال: 123456789012345"
                    value={waConfig?.phone_number_id || ''}
                    onChange={() => {}}
                    onBlur={(e) => updateConfig.mutate({ phone_number_id: e.target.value })}
                    defaultValue={waConfig?.phone_number_id || ''}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label>رقم الهاتف المعروض</Label>
                  <Input
                    dir="ltr"
                    placeholder="+201234567890"
                    defaultValue={waConfig?.display_phone_number || ''}
                    onBlur={(e) => updateConfig.mutate({ display_phone_number: e.target.value })}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label>معرف حساب الأعمال (Business Account ID)</Label>
                  <Input
                    dir="ltr"
                    placeholder="مثال: 987654321098765"
                    defaultValue={waConfig?.business_account_id || ''}
                    onBlur={(e) => updateConfig.mutate({ business_account_id: e.target.value })}
                    className="font-mono"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="font-semibold">الإرسال التلقائي</Label>
                {[
                  { key: 'auto_send_notifications', label: 'إشعارات تحديث الشحنات', desc: 'إرسال تلقائي عند تغير حالة الشحنة' },
                  { key: 'auto_send_otp', label: 'رموز التحقق (OTP)', desc: 'إرسال رموز التحقق عبر واتساب' },
                  { key: 'auto_send_subscription_reminders', label: 'تذكير الاشتراكات', desc: 'تذكير قبل انتهاء الاشتراك' },
                  { key: 'auto_send_marketing', label: 'رسائل تسويقية', desc: 'إرسال عروض وأخبار النظام' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch
                      checked={waConfig?.[item.key as keyof typeof waConfig] as boolean || false}
                      onCheckedChange={(v) => updateConfig.mutate({ [item.key]: v })}
                      disabled={!isConnected}
                    />
                  </div>
                ))}
              </div>

              {!isConnected && (
                <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>يتطلب إضافة مفتاح <strong>WHATSAPP_ACCESS_TOKEN</strong> و <strong>WHATSAPP_PHONE_NUMBER_ID</strong> كأسرار في إعدادات النظام لتفعيل الإرسال الفعلي</span>
                </div>
              )}
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
                  <CardDescription>قوالب الرسائل المعتمدة من Meta للإرسال التلقائي</CardDescription>
                </div>
                <Button size="sm" variant="outline" className="gap-2" onClick={() => queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] })}>
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
                            <Badge variant={t.is_active ? 'default' : 'secondary'} className="text-[10px]">
                              {t.is_active ? 'نشط' : 'معطل'}
                            </Badge>
                            {t.is_system && <Badge variant="outline" className="text-[10px]">نظام</Badge>}
                          </div>
                          <Badge variant="outline" className="text-[10px]">
                            {t.category === 'utility' ? 'خدمي' : t.category === 'marketing' ? 'تسويقي' : t.category === 'authentication' ? 'تحقق' : t.category}
                          </Badge>
                        </div>
                        {t.header_text && <p className="text-xs text-muted-foreground mb-1">📌 {t.header_text}</p>}
                        <p className="text-sm bg-muted/50 p-2 rounded">{t.body_text}</p>
                        {t.footer_text && <p className="text-xs text-muted-foreground mt-1">📎 {t.footer_text}</p>}
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                          <span>اللغة: {t.template_language || 'ar'}</span>
                          {t.meta_status && <span>حالة Meta: {t.meta_status}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>لا توجد قوالب بعد</p>
                  <p className="text-xs mt-1">أنشئ قوالب الرسائل من لوحة تحكم Meta Business</p>
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
              <CardDescription>اختبر الاتصال بإرسال رسالة واتساب مباشرة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Phone className="h-4 w-4" />رقم الهاتف</Label>
                <Input
                  dir="ltr"
                  placeholder="+201234567890"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label>نص الرسالة (اختياري)</Label>
                <Textarea
                  placeholder="اتركه فارغاً لإرسال رسالة افتراضية..."
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  rows={3}
                />
              </div>
              <Button
                onClick={handleSendTest}
                disabled={isSending || !testPhone}
                className="w-full gap-2"
              >
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {isSending ? 'جاري الإرسال...' : 'إرسال رسالة تجريبية'}
              </Button>

              {!isConnected && (
                <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  لن يتم الإرسال فعلياً حتى يتم ربط مفتاح WHATSAPP_ACCESS_TOKEN
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    سجل الرسائل
                  </CardTitle>
                  <CardDescription>آخر 50 رسالة واتساب مرسلة</CardDescription>
                </div>
                <Button size="sm" variant="outline" className="gap-2" onClick={() => queryClient.invalidateQueries({ queryKey: ['whatsapp-messages'] })}>
                  <RefreshCw className="h-3.5 w-3.5" />
                  تحديث
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
                          <TableCell className="font-mono text-xs">{msg.to_phone || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">
                              {msg.message_type === 'template' ? 'قالب' : msg.message_type === 'text' ? 'نص' : msg.message_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs max-w-[200px] truncate">{msg.content || '-'}</TableCell>
                          <TableCell>{getMessageStatusBadge(msg.status)}</TableCell>
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
