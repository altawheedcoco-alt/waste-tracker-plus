import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { MessageCircle, Send, Settings, Users, BarChart3, Wifi, WifiOff, RefreshCw, Search, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface WaPilotInstance {
  id: string;
  name?: string;
  status?: string;
  phone?: string;
}

interface OrgConfig {
  id: string;
  organization_id: string;
  is_active: boolean;
  auto_send_notifications: boolean;
  auto_send_otp: boolean;
  auto_send_subscription_reminders: boolean;
  auto_send_marketing: boolean;
  organization?: { name: string; name_ar: string };
}

interface MessageLog {
  id: string;
  to_phone: string;
  from_phone: string;
  content: string;
  status: string;
  direction: string;
  message_type: string;
  created_at: string;
  error_message: string | null;
  organization_id: string;
}

const WhatsAppNotificationManager = () => {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [instances, setInstances] = useState<WaPilotInstance[]>([]);
  const [loadingInstances, setLoadingInstances] = useState(false);
  const [orgConfigs, setOrgConfigs] = useState<OrgConfig[]>([]);
  const [messages, setMessages] = useState<MessageLog[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendPhone, setSendPhone] = useState('');
  const [sendMessage, setSendMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [messageStats, setMessageStats] = useState({ total: 0, sent: 0, failed: 0, pending: 0 });

  useEffect(() => {
    fetchOrgConfigs();
    fetchMessages();
    fetchInstances();
  }, []);

  const fetchInstances = async () => {
    setLoadingInstances(true);
    try {
      const { data, error } = await supabase.functions.invoke('wapilot-proxy', {
        body: { action: 'list-instances' },
      });
      if (error) throw error;
      const list = Array.isArray(data) ? data : [];
      setInstances(list);
      if (list.length > 0 && !selectedInstance) {
        setSelectedInstance(list[0].id);
      }
    } catch (e: any) {
      console.error('Error fetching instances:', e);
    } finally {
      setLoadingInstances(false);
    }
  };

  const fetchOrgConfigs = async () => {
    const { data } = await supabase
      .from('whatsapp_config')
      .select('*, organization:organizations(name, name_ar)')
      .order('created_at', { ascending: false });
    if (data) setOrgConfigs(data as any);
  };

  const fetchMessages = async () => {
    setLoadingMessages(true);
    const { data } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (data) {
      setMessages(data as any);
      setMessageStats({
        total: data.length,
        sent: data.filter(m => m.status === 'sent' || m.status === 'delivered').length,
        failed: data.filter(m => m.status === 'failed').length,
        pending: data.filter(m => m.status === 'pending').length,
      });
    }
    setLoadingMessages(false);
  };

  const toggleOrgConfig = async (configId: string, field: string, value: boolean) => {
    const { error } = await supabase
      .from('whatsapp_config')
      .update({ [field]: value })
      .eq('id', configId);
    if (error) {
      toast.error('فشل في تحديث الإعدادات');
    } else {
      toast.success('تم تحديث الإعدادات');
      fetchOrgConfigs();
    }
  };

  const handleSendMessage = async () => {
    if (!sendPhone || !sendMessage) {
      toast.error('يرجى إدخال رقم الهاتف والرسالة');
      return;
    }
    setSendingMessage(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-send', {
        body: {
          action: 'send',
          to_phone: sendPhone,
          message_text: sendMessage,
          instance_id: selectedInstance || undefined,
        },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success('تم إرسال الرسالة بنجاح');
        setSendPhone('');
        setSendMessage('');
        fetchMessages();
      } else {
        toast.error(data?.error || 'فشل في إرسال الرسالة');
      }
    } catch (e: any) {
      toast.error(e.message || 'خطأ في الإرسال');
    } finally {
      setSendingMessage(false);
    }
  };

  const filteredMessages = messages.filter(m =>
    !searchQuery ||
    m.to_phone?.includes(searchQuery) ||
    m.from_phone?.includes(searchQuery) ||
    m.content?.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="gap-2"><BarChart3 className="h-4 w-4" />لوحة التحكم</TabsTrigger>
          <TabsTrigger value="send" className="gap-2"><Send className="h-4 w-4" />إرسال رسالة</TabsTrigger>
          <TabsTrigger value="orgs" className="gap-2"><Settings className="h-4 w-4" />إعدادات المنظمات</TabsTrigger>
          <TabsTrigger value="logs" className="gap-2"><MessageCircle className="h-4 w-4" />سجل الرسائل</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-primary">{messageStats.total}</div>
                <p className="text-sm text-muted-foreground">إجمالي الرسائل</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-green-600">{messageStats.sent}</div>
                <p className="text-sm text-muted-foreground">تم الإرسال</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-red-600">{messageStats.failed}</div>
                <p className="text-sm text-muted-foreground">فشل</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-yellow-600">{messageStats.pending}</div>
                <p className="text-sm text-muted-foreground">قيد الانتظار</p>
              </CardContent>
            </Card>
          </div>

          {/* Instances */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">WaPilot Instances</CardTitle>
              <Button variant="outline" size="sm" onClick={fetchInstances} disabled={loadingInstances}>
                <RefreshCw className={`h-4 w-4 ml-1 ${loadingInstances ? 'animate-spin' : ''}`} />
                تحديث
              </Button>
            </CardHeader>
            <CardContent>
              {instances.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  {loadingInstances ? 'جاري التحميل...' : 'لا توجد Instances متاحة'}
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {instances.map((inst) => (
                    <div key={inst.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      {inst.status === 'active' || inst.status === 'connected' ? (
                        <Wifi className="h-5 w-5 text-green-500" />
                      ) : (
                        <WifiOff className="h-5 w-5 text-red-500" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{inst.name || inst.id}</p>
                        <p className="text-xs text-muted-foreground">{inst.phone || inst.id}</p>
                      </div>
                      <Badge variant={inst.status === 'active' || inst.status === 'connected' ? 'default' : 'secondary'}>
                        {inst.status || 'unknown'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Orgs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5" />المنظمات المفعلة</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{orgConfigs.filter(c => c.is_active).length} <span className="text-sm font-normal text-muted-foreground">/ {orgConfigs.length}</span></p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Send Message Tab */}
        <TabsContent value="send" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>إرسال رسالة واتساب</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {instances.length > 1 && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Instance</label>
                  <Select value={selectedInstance} onValueChange={setSelectedInstance}>
                    <SelectTrigger><SelectValue placeholder="اختر Instance" /></SelectTrigger>
                    <SelectContent>
                      {instances.map(i => (
                        <SelectItem key={i.id} value={i.id}>{i.name || i.id}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <label className="text-sm font-medium mb-1 block">رقم الهاتف (مع رمز الدولة)</label>
                <Input
                  value={sendPhone}
                  onChange={e => setSendPhone(e.target.value)}
                  placeholder="966501234567"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">نص الرسالة</label>
                <Textarea
                  value={sendMessage}
                  onChange={e => setSendMessage(e.target.value)}
                  placeholder="اكتب رسالتك هنا..."
                  rows={4}
                />
              </div>
              <Button onClick={handleSendMessage} disabled={sendingMessage} className="w-full">
                {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Send className="h-4 w-4 ml-2" />}
                إرسال
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Org Configs Tab */}
        <TabsContent value="orgs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات واتساب للمنظمات</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {orgConfigs.map(config => (
                    <div key={config.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{(config as any).organization?.name_ar || (config as any).organization?.name || config.organization_id.slice(0, 8)}</p>
                        </div>
                        <Switch
                          checked={config.is_active}
                          onCheckedChange={v => toggleOrgConfig(config.id, 'is_active', v)}
                        />
                      </div>
                      {config.is_active && (
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <span>إشعارات الشحنات</span>
                            <Switch
                              checked={config.auto_send_notifications}
                              onCheckedChange={v => toggleOrgConfig(config.id, 'auto_send_notifications', v)}
                            />
                          </div>
                          <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <span>رموز OTP</span>
                            <Switch
                              checked={config.auto_send_otp}
                              onCheckedChange={v => toggleOrgConfig(config.id, 'auto_send_otp', v)}
                            />
                          </div>
                          <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <span>تذكير الاشتراكات</span>
                            <Switch
                              checked={config.auto_send_subscription_reminders}
                              onCheckedChange={v => toggleOrgConfig(config.id, 'auto_send_subscription_reminders', v)}
                            />
                          </div>
                          <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <span>رسائل تسويقية</span>
                            <Switch
                              checked={config.auto_send_marketing}
                              onCheckedChange={v => toggleOrgConfig(config.id, 'auto_send_marketing', v)}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {orgConfigs.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">لا توجد منظمات مسجلة</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Message Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>سجل الرسائل</CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="بحث..."
                    className="pr-9 w-48"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={fetchMessages} disabled={loadingMessages}>
                  <RefreshCw className={`h-4 w-4 ${loadingMessages ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الاتجاه</TableHead>
                      <TableHead>الهاتف</TableHead>
                      <TableHead>المحتوى</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>التاريخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMessages.map(msg => (
                      <TableRow key={msg.id}>
                        <TableCell>
                          <Badge variant={msg.direction === 'outbound' ? 'default' : 'secondary'}>
                            {msg.direction === 'outbound' ? 'صادر' : 'وارد'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs" dir="ltr">
                          {msg.direction === 'outbound' ? msg.to_phone : msg.from_phone}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm">{msg.content}</TableCell>
                        <TableCell>
                          <Badge variant={
                            msg.status === 'sent' || msg.status === 'delivered' ? 'default' :
                            msg.status === 'failed' ? 'destructive' : 'secondary'
                          }>
                            {msg.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(msg.created_at).toLocaleString('ar-SA')}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredMessages.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          لا توجد رسائل
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WhatsAppNotificationManager;
