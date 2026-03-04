import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import {
  MessageCircle, Send, Settings, Users, BarChart3, Wifi, WifiOff, RefreshCw,
  Search, Loader2, Building2, FileText, ListChecks, BellRing, Eye, EyeOff,
  Phone, CheckCircle2, XCircle, Clock, Filter, Plus, Trash2, Zap, Bot,
  HeartPulse, Calendar
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import WaPilotAnalytics from './WaPilotAnalytics';
import WaPilotScheduler from './WaPilotScheduler';
import WaPilotQuickActions from './WaPilotQuickActions';
import WaPilotAIComposer from './WaPilotAIComposer';
import WaPilotHealthMonitor from './WaPilotHealthMonitor';

const ORG_TYPE_LABELS: Record<string, string> = {
  generator: 'مولّد نفايات',
  transporter: 'جهة نقل',
  recycler: 'جهة تدوير',
  disposal: 'تخلص نهائي',
  consultant: 'استشاري',
  consulting_office: 'مكتب استشاري',
  iso_body: 'جهة اعتماد',
};

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
  organization?: { name: string; name_ar: string; organization_type: string; phone: string };
}

interface OrgInfo {
  id: string;
  name: string;
  name_en: string | null;
  organization_type: string;
  phone: string | null;
  email: string | null;
  city: string | null;
}

interface UserInfo {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  organization_id: string | null;
  organization?: { name: string; name_ar: string; organization_type: string } | null;
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
  interactive_buttons: any;
  attachment_url: string | null;
}

interface TemplateInfo {
  id: string;
  template_name: string;
  category: string;
  header_text: string | null;
  body_text: string;
  footer_text: string | null;
  buttons: any;
  interactive_type: string | null;
  is_active: boolean;
  is_system: boolean;
}

const WhatsAppNotificationManager = () => {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Dashboard
  const [instances, setInstances] = useState<WaPilotInstance[]>([]);
  const [loadingInstances, setLoadingInstances] = useState(false);
  const [messageStats, setMessageStats] = useState({ total: 0, sent: 0, failed: 0, pending: 0 });

  // Orgs & Users Directory
  const [orgs, setOrgs] = useState<OrgInfo[]>([]);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [orgConfigs, setOrgConfigs] = useState<OrgConfig[]>([]);
  const [orgSearch, setOrgSearch] = useState('');
  const [orgTypeFilter, setOrgTypeFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');

  // Send Message
  const [selectedInstance, setSelectedInstance] = useState('');
  const [sendMode, setSendMode] = useState<'single' | 'bulk' | 'template'>('single');
  const [sendPhone, setSendPhone] = useState('');
  const [sendMessage, setSendMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<Set<string>>(new Set());
  const [recipientType, setRecipientType] = useState<'orgs' | 'users'>('users');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [interactiveButtons, setInteractiveButtons] = useState<{ id: string; title: string }[]>([]);
  const [attachmentUrl, setAttachmentUrl] = useState('');

  // Templates
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    template_name: '', category: 'notification', header_text: '', body_text: '',
    footer_text: '', interactive_type: 'none', buttons: [] as any[], survey_options: [] as string[]
  });

  // Logs
  const [messages, setMessages] = useState<MessageLog[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Visibility
  const [visibilityMap, setVisibilityMap] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = () => {
    fetchInstances();
    fetchOrgConfigs();
    fetchOrgs();
    fetchUsers();
    fetchMessages();
    fetchTemplates();
    fetchVisibility();
  };

  const fetchInstances = async () => {
    setLoadingInstances(true);
    try {
      const { data, error } = await supabase.functions.invoke('wapilot-proxy', {
        body: { action: 'list-instances' },
      });
      if (error) throw error;
      const list = Array.isArray(data) ? data : [];
      setInstances(list);
      if (list.length > 0 && !selectedInstance) setSelectedInstance(list[0].id);
    } catch (e: any) {
      console.error('Error fetching instances:', e);
    } finally {
      setLoadingInstances(false);
    }
  };

  const fetchOrgs = async () => {
    const { data } = await supabase
      .from('organizations')
      .select('id, name, name_en, organization_type, phone, email, city')
      .order('name');
    if (data) setOrgs(data as OrgInfo[]);
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, phone, email, organization_id, organization:organizations(name, name_ar, organization_type)')
      .order('full_name')
      .limit(500);
    if (data) setUsers(data as any);
  };

  const fetchOrgConfigs = async () => {
    const { data } = await supabase
      .from('whatsapp_config')
      .select('*, organization:organizations(name, name_ar, organization_type, phone)')
      .order('created_at', { ascending: false });
    if (data) setOrgConfigs(data as any);
  };

  const fetchMessages = async () => {
    setLoadingMessages(true);
    const { data } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(300);
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

  const fetchTemplates = async () => {
    const { data } = await supabase
      .from('whatsapp_templates')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setTemplates(data as any);
  };

  const fetchVisibility = async () => {
    const { data } = await supabase
      .from('partner_visibility_settings')
      .select('*');
    if (data) {
      const map: Record<string, any> = {};
      data.forEach((v: any) => {
        map[`${v.organization_id}_${v.partner_organization_id}`] = v;
      });
      setVisibilityMap(map);
    }
  };

  const toggleOrgConfig = async (configId: string, field: string, value: boolean) => {
    const { error } = await supabase
      .from('whatsapp_config')
      .update({ [field]: value })
      .eq('id', configId);
    if (error) toast.error('فشل في تحديث الإعدادات');
    else { toast.success('تم تحديث الإعدادات'); fetchOrgConfigs(); }
  };

  const isVisibilityBlocked = (fromOrgId: string, toOrgId: string): boolean => {
    const key = `${fromOrgId}_${toOrgId}`;
    const vis = visibilityMap[key];
    if (vis && vis.can_receive_notifications === false) return true;
    return false;
  };

  // Smart Send
  const handleSendMessage = async () => {
    if (sendMode === 'single') {
      if (!sendPhone || !sendMessage) { toast.error('يرجى إدخال رقم الهاتف والرسالة'); return; }
      setSendingMessage(true);
      try {
        const { data, error } = await supabase.functions.invoke('whatsapp-send', {
          body: {
            action: 'send',
            to_phone: sendPhone,
            message_text: sendMessage,
            instance_id: selectedInstance || undefined,
            interactive_buttons: interactiveButtons.length > 0 ? interactiveButtons : undefined,
            attachment_url: attachmentUrl || undefined,
          },
        });
        if (error) throw error;
        if (data?.success) {
          toast.success('تم إرسال الرسالة بنجاح');
          setSendPhone(''); setSendMessage(''); setInteractiveButtons([]); setAttachmentUrl('');
          fetchMessages();
        } else toast.error(data?.error || 'فشل في إرسال الرسالة');
      } catch (e: any) { toast.error(e.message || 'خطأ في الإرسال'); }
      finally { setSendingMessage(false); }
    } else if (sendMode === 'bulk') {
      if (selectedRecipients.size === 0) { toast.error('يرجى تحديد المستلمين'); return; }
      const messageText = selectedTemplate
        ? templates.find(t => t.id === selectedTemplate)?.body_text || sendMessage
        : sendMessage;
      if (!messageText) { toast.error('يرجى إدخال نص الرسالة أو اختيار قالب'); return; }

      setSendingMessage(true);
      try {
        let recipients: { phone: string; user_id?: string }[] = [];

        if (recipientType === 'users') {
          recipients = users
            .filter(u => selectedRecipients.has(u.id) && u.phone)
            .map(u => ({ phone: u.phone!, user_id: u.id }));
        } else {
          recipients = orgs
            .filter(o => selectedRecipients.has(o.id) && o.phone)
            .map(o => ({ phone: o.phone! }));
        }

        const { data, error } = await supabase.functions.invoke('whatsapp-send', {
          body: {
            action: 'bulk',
            message_text: messageText,
            recipients,
            instance_id: selectedInstance || undefined,
            template_name: selectedTemplate ? templates.find(t => t.id === selectedTemplate)?.template_name : undefined,
            interactive_buttons: interactiveButtons.length > 0 ? interactiveButtons : undefined,
            attachment_url: attachmentUrl || undefined,
          },
        });
        if (error) throw error;
        const successCount = data?.results?.filter((r: any) => r.success).length || 0;
        toast.success(`تم إرسال ${successCount} من ${recipients.length} رسالة`);
        setSelectedRecipients(new Set());
        fetchMessages();
      } catch (e: any) { toast.error(e.message); }
      finally { setSendingMessage(false); }
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplate.template_name || !newTemplate.body_text) {
      toast.error('يرجى إدخال اسم القالب ونص الرسالة');
      return;
    }
    const { error } = await supabase.from('whatsapp_templates').insert({
      template_name: newTemplate.template_name,
      category: newTemplate.category,
      header_text: newTemplate.header_text || null,
      body_text: newTemplate.body_text,
      footer_text: newTemplate.footer_text || null,
      interactive_type: newTemplate.interactive_type,
      buttons: newTemplate.buttons.length > 0 ? newTemplate.buttons : null,
      survey_options: newTemplate.survey_options.length > 0 ? newTemplate.survey_options : null,
      is_active: true,
      is_system: false,
    } as any);
    if (error) toast.error('فشل في إنشاء القالب');
    else {
      toast.success('تم إنشاء القالب');
      setShowTemplateDialog(false);
      setNewTemplate({ template_name: '', category: 'notification', header_text: '', body_text: '', footer_text: '', interactive_type: 'none', buttons: [], survey_options: [] });
      fetchTemplates();
    }
  };

  const addButton = () => {
    setInteractiveButtons(prev => [...prev, { id: `btn_${Date.now()}`, title: '' }]);
  };
  const removeButton = (id: string) => {
    setInteractiveButtons(prev => prev.filter(b => b.id !== id));
  };
  const updateButtonTitle = (id: string, title: string) => {
    setInteractiveButtons(prev => prev.map(b => b.id === id ? { ...b, title } : b));
  };

  const toggleRecipient = (id: string) => {
    setSelectedRecipients(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAllFiltered = (items: { id: string }[]) => {
    setSelectedRecipients(new Set(items.map(i => i.id)));
  };
  const clearSelection = () => setSelectedRecipients(new Set());

  // Filtered data
  const filteredOrgs = useMemo(() => orgs.filter(o =>
    (orgTypeFilter === 'all' || o.organization_type === orgTypeFilter) &&
    (!orgSearch || o.name?.includes(orgSearch) || o.name_en?.includes(orgSearch) || o.phone?.includes(orgSearch))
  ), [orgs, orgTypeFilter, orgSearch]);

  const filteredUsers = useMemo(() => users.filter(u =>
    !userSearch ||
    u.full_name?.includes(userSearch) ||
    u.phone?.includes(userSearch) ||
    u.email?.includes(userSearch)
  ), [users, userSearch]);

  const filteredMessages = messages.filter(m =>
    !searchQuery || m.to_phone?.includes(searchQuery) || m.from_phone?.includes(searchQuery) || m.content?.includes(searchQuery)
  );

  const orgConfigMap = useMemo(() => {
    const map: Record<string, OrgConfig> = {};
    orgConfigs.forEach(c => { map[c.organization_id] = c; });
    return map;
  }, [orgConfigs]);

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 md:grid-cols-10 h-auto">
          <TabsTrigger value="dashboard" className="gap-1 text-xs px-1"><BarChart3 className="h-3.5 w-3.5" />لوحة التحكم</TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1 text-xs px-1"><BarChart3 className="h-3.5 w-3.5" />التحليلات</TabsTrigger>
          <TabsTrigger value="directory" className="gap-1 text-xs px-1"><Building2 className="h-3.5 w-3.5" />الدليل</TabsTrigger>
          <TabsTrigger value="send" className="gap-1 text-xs px-1"><Send className="h-3.5 w-3.5" />إرسال</TabsTrigger>
          <TabsTrigger value="ai" className="gap-1 text-xs px-1"><Bot className="h-3.5 w-3.5" />AI</TabsTrigger>
          <TabsTrigger value="quick" className="gap-1 text-xs px-1"><Zap className="h-3.5 w-3.5" />سريع</TabsTrigger>
          <TabsTrigger value="scheduler" className="gap-1 text-xs px-1"><Calendar className="h-3.5 w-3.5" />الجدولة</TabsTrigger>
          <TabsTrigger value="templates" className="gap-1 text-xs px-1"><FileText className="h-3.5 w-3.5" />القوالب</TabsTrigger>
          <TabsTrigger value="health" className="gap-1 text-xs px-1"><HeartPulse className="h-3.5 w-3.5" />الصحة</TabsTrigger>
          <TabsTrigger value="logs" className="gap-1 text-xs px-1"><MessageCircle className="h-3.5 w-3.5" />السجل</TabsTrigger>
        </TabsList>

        {/* ==================== DASHBOARD ==================== */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-primary">{messageStats.total}</div>
              <p className="text-sm text-muted-foreground">إجمالي الرسائل</p>
            </CardContent></Card>
            <Card><CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-green-600">{messageStats.sent}</div>
              <p className="text-sm text-muted-foreground">تم الإرسال</p>
            </CardContent></Card>
            <Card><CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-destructive">{messageStats.failed}</div>
              <p className="text-sm text-muted-foreground">فشل</p>
            </CardContent></Card>
            <Card><CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-yellow-600">{messageStats.pending}</div>
              <p className="text-sm text-muted-foreground">قيد الانتظار</p>
            </CardContent></Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">WaPilot Instances</CardTitle>
                <Button variant="outline" size="sm" onClick={fetchInstances} disabled={loadingInstances}>
                  <RefreshCw className={`h-4 w-4 ml-1 ${loadingInstances ? 'animate-spin' : ''}`} />تحديث
                </Button>
              </CardHeader>
              <CardContent>
                {instances.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">{loadingInstances ? 'جاري التحميل...' : 'لا توجد Instances'}</p>
                ) : (
                  <div className="space-y-2">
                    {instances.map(inst => (
                      <div key={inst.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        {inst.status === 'active' || inst.status === 'connected' ? <Wifi className="h-5 w-5 text-green-500" /> : <WifiOff className="h-5 w-5 text-destructive" />}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{inst.name || inst.id}</p>
                          <p className="text-xs text-muted-foreground">{inst.phone || inst.id}</p>
                        </div>
                        <Badge variant={inst.status === 'active' || inst.status === 'connected' ? 'default' : 'secondary'}>{inst.status || 'unknown'}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5" />ملخص النظام</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <span className="text-sm">إجمالي الجهات</span>
                  <Badge variant="outline">{orgs.length}</Badge>
                </div>
                <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <span className="text-sm">جهات مفعّل الواتساب</span>
                  <Badge>{orgConfigs.filter(c => c.is_active).length}</Badge>
                </div>
                <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <span className="text-sm">إجمالي المستخدمين</span>
                  <Badge variant="outline">{users.length}</Badge>
                </div>
                <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <span className="text-sm">مستخدمون بأرقام واتساب</span>
                  <Badge>{users.filter(u => u.phone).length}</Badge>
                </div>
                <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <span className="text-sm">قوالب نشطة</span>
                  <Badge variant="outline">{templates.filter(t => t.is_active).length}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ==================== DIRECTORY ==================== */}
        <TabsContent value="directory" className="space-y-4">
          <Tabs defaultValue="orgs-dir">
            <TabsList>
              <TabsTrigger value="orgs-dir"><Building2 className="h-4 w-4 ml-1" />الجهات ({orgs.length})</TabsTrigger>
              <TabsTrigger value="users-dir"><Users className="h-4 w-4 ml-1" />المستخدمون ({users.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="orgs-dir">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap gap-2">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input value={orgSearch} onChange={e => setOrgSearch(e.target.value)} placeholder="بحث بالاسم أو الهاتف..." className="pr-9" />
                    </div>
                    <Select value={orgTypeFilter} onValueChange={setOrgTypeFilter}>
                      <SelectTrigger className="w-[180px]"><SelectValue placeholder="نوع الجهة" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الأنواع</SelectItem>
                        {Object.entries(ORG_TYPE_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>الجهة</TableHead>
                          <TableHead>النوع</TableHead>
                          <TableHead>الهاتف</TableHead>
                          <TableHead>المدينة</TableHead>
                          <TableHead>واتساب</TableHead>
                          <TableHead>الرؤية</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOrgs.map(org => {
                          const config = orgConfigMap[org.id];
                          return (
                            <TableRow key={org.id}>
                              <TableCell className="font-medium">{org.name}</TableCell>
                              <TableCell><Badge variant="outline" className="text-xs">{ORG_TYPE_LABELS[org.organization_type] || org.organization_type}</Badge></TableCell>
                              <TableCell className="font-mono text-xs" dir="ltr">{org.phone || '—'}</TableCell>
                              <TableCell className="text-sm">{org.city || '—'}</TableCell>
                              <TableCell>
                                {config ? (
                                  config.is_active
                                    ? <Badge className="bg-green-100 text-green-800 text-xs">مفعّل</Badge>
                                    : <Badge variant="secondary" className="text-xs">معطّل</Badge>
                                ) : <Badge variant="outline" className="text-xs">غير مسجل</Badge>}
                              </TableCell>
                              <TableCell>
                                {Object.values(visibilityMap).some((v: any) =>
                                  (v.organization_id === org.id || v.partner_organization_id === org.id) &&
                                  (v.can_view_recycler_info === false || v.can_view_generator_info === false)
                                ) ? (
                                  <div className="flex items-center gap-1 text-amber-600"><EyeOff className="h-3.5 w-3.5" /><span className="text-xs">حجب نشط</span></div>
                                ) : (
                                  <div className="flex items-center gap-1 text-muted-foreground"><Eye className="h-3.5 w-3.5" /><span className="text-xs">مفتوح</span></div>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users-dir">
              <Card>
                <CardHeader className="pb-2">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="بحث بالاسم، الهاتف، أو البريد..." className="pr-9" />
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>الاسم</TableHead>
                          <TableHead>الجهة</TableHead>
                          <TableHead>الهاتف</TableHead>
                          <TableHead>البريد</TableHead>
                          <TableHead>واتساب</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map(user => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.full_name || '—'}</TableCell>
                            <TableCell className="text-sm">
                              {user.organization ? (
                                <div>
                                  <span>{(user.organization as any)?.name_ar || (user.organization as any)?.name}</span>
                                  <Badge variant="outline" className="text-xs mr-1">{ORG_TYPE_LABELS[(user.organization as any)?.organization_type] || ''}</Badge>
                                </div>
                              ) : '—'}
                            </TableCell>
                            <TableCell className="font-mono text-xs" dir="ltr">{user.phone || '—'}</TableCell>
                            <TableCell className="text-xs">{user.email || '—'}</TableCell>
                            <TableCell>
                              {user.phone
                                ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                                : <XCircle className="h-4 w-4 text-muted-foreground" />}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* ==================== SEND MESSAGE ==================== */}
        <TabsContent value="send" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>إرسال رسالة واتساب</CardTitle>
              <CardDescription>إرسال فردي أو جماعي مع دعم القوالب والأزرار التفاعلية والمرفقات</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mode Selection */}
              <div className="flex gap-2">
                <Button variant={sendMode === 'single' ? 'default' : 'outline'} size="sm" onClick={() => setSendMode('single')}>
                  <Phone className="h-4 w-4 ml-1" />فردي
                </Button>
                <Button variant={sendMode === 'bulk' ? 'default' : 'outline'} size="sm" onClick={() => setSendMode('bulk')}>
                  <Users className="h-4 w-4 ml-1" />جماعي
                </Button>
              </div>

              {/* Instance selector */}
              {instances.length > 1 && (
                <div>
                  <Label>Instance</Label>
                  <Select value={selectedInstance} onValueChange={setSelectedInstance}>
                    <SelectTrigger><SelectValue placeholder="اختر Instance" /></SelectTrigger>
                    <SelectContent>{instances.map(i => <SelectItem key={i.id} value={i.id}>{i.name || i.id}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}

              {sendMode === 'single' && (
                <div>
                  <Label>رقم الهاتف (مع رمز الدولة)</Label>
                  <Input value={sendPhone} onChange={e => setSendPhone(e.target.value)} placeholder="966501234567" dir="ltr" />
                </div>
              )}

              {sendMode === 'bulk' && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Button variant={recipientType === 'users' ? 'default' : 'outline'} size="sm" onClick={() => { setRecipientType('users'); clearSelection(); }}>
                      مستخدمون
                    </Button>
                    <Button variant={recipientType === 'orgs' ? 'default' : 'outline'} size="sm" onClick={() => { setRecipientType('orgs'); clearSelection(); }}>
                      جهات
                    </Button>
                  </div>

                  {recipientType === 'orgs' && (
                    <Select value={orgTypeFilter} onValueChange={setOrgTypeFilter}>
                      <SelectTrigger className="w-[200px]"><SelectValue placeholder="تصفية بالنوع" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الأنواع</SelectItem>
                        {Object.entries(ORG_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}

                  <div className="flex gap-2 items-center">
                    <Badge>{selectedRecipients.size} محدد</Badge>
                    <Button variant="ghost" size="sm" onClick={() => selectAllFiltered(recipientType === 'users' ? filteredUsers.filter(u => u.phone) : filteredOrgs.filter(o => o.phone))}>
                      تحديد الكل
                    </Button>
                    <Button variant="ghost" size="sm" onClick={clearSelection}>مسح التحديد</Button>
                  </div>

                  <ScrollArea className="h-[200px] border rounded-md p-2">
                    {recipientType === 'users' ? (
                      filteredUsers.filter(u => u.phone).map(u => (
                        <div key={u.id} className="flex items-center gap-2 py-1.5 px-2 hover:bg-muted/50 rounded">
                          <Checkbox checked={selectedRecipients.has(u.id)} onCheckedChange={() => toggleRecipient(u.id)} />
                          <span className="text-sm flex-1">{u.full_name || u.email}</span>
                          <span className="text-xs text-muted-foreground font-mono" dir="ltr">{u.phone}</span>
                        </div>
                      ))
                    ) : (
                      filteredOrgs.filter(o => o.phone).map(o => (
                        <div key={o.id} className="flex items-center gap-2 py-1.5 px-2 hover:bg-muted/50 rounded">
                          <Checkbox checked={selectedRecipients.has(o.id)} onCheckedChange={() => toggleRecipient(o.id)} />
                          <span className="text-sm flex-1">{o.name}</span>
                          <Badge variant="outline" className="text-xs">{ORG_TYPE_LABELS[o.organization_type] || o.organization_type}</Badge>
                          <span className="text-xs text-muted-foreground font-mono" dir="ltr">{o.phone}</span>
                        </div>
                      ))
                    )}
                  </ScrollArea>
                </div>
              )}

              {/* Template selector */}
              <div>
                <Label>قالب الرسالة (اختياري)</Label>
                <Select value={selectedTemplate} onValueChange={v => {
                  setSelectedTemplate(v);
                  const tpl = templates.find(t => t.id === v);
                  if (tpl) setSendMessage(tpl.body_text);
                }}>
                  <SelectTrigger><SelectValue placeholder="اختر قالب أو اكتب يدوياً" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون قالب</SelectItem>
                    {templates.filter(t => t.is_active).map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.template_name} — {t.category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Message text */}
              <div>
                <Label>نص الرسالة</Label>
                <Textarea value={sendMessage} onChange={e => setSendMessage(e.target.value)} placeholder="اكتب رسالتك هنا... استخدم {{1}} {{2}} للمتغيرات" rows={4} />
              </div>

              {/* Attachment */}
              <div>
                <Label>رابط مرفق (اختياري)</Label>
                <Input value={attachmentUrl} onChange={e => setAttachmentUrl(e.target.value)} placeholder="https://example.com/file.pdf" dir="ltr" />
              </div>

              {/* Interactive Buttons */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>أزرار تفاعلية (اختياري)</Label>
                  <Button variant="outline" size="sm" onClick={addButton} disabled={interactiveButtons.length >= 3}>
                    <Plus className="h-3.5 w-3.5 ml-1" />إضافة زر
                  </Button>
                </div>
                {interactiveButtons.map(btn => (
                  <div key={btn.id} className="flex gap-2 items-center">
                    <Input
                      value={btn.title}
                      onChange={e => updateButtonTitle(btn.id, e.target.value)}
                      placeholder="عنوان الزر (مثل: موافق، رفض)"
                      className="flex-1"
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeButton(btn.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button onClick={handleSendMessage} disabled={sendingMessage} className="w-full">
                {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Send className="h-4 w-4 ml-2" />}
                {sendMode === 'bulk' ? `إرسال جماعي (${selectedRecipients.size})` : 'إرسال'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== TEMPLATES ==================== */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>قوالب الرسائل</CardTitle>
              <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 ml-1" />قالب جديد</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader><DialogTitle>إنشاء قالب رسالة</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label>اسم القالب</Label>
                      <Input value={newTemplate.template_name} onChange={e => setNewTemplate(p => ({ ...p, template_name: e.target.value }))} placeholder="shipment_confirmation" dir="ltr" />
                    </div>
                    <div>
                      <Label>التصنيف</Label>
                      <Select value={newTemplate.category} onValueChange={v => setNewTemplate(p => ({ ...p, category: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="notification">إشعار</SelectItem>
                          <SelectItem value="otp">رمز تحقق</SelectItem>
                          <SelectItem value="marketing">تسويقي</SelectItem>
                          <SelectItem value="survey">استطلاع رأي</SelectItem>
                          <SelectItem value="confirmation">تأكيد</SelectItem>
                          <SelectItem value="reminder">تذكير</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>العنوان</Label>
                      <Input value={newTemplate.header_text} onChange={e => setNewTemplate(p => ({ ...p, header_text: e.target.value }))} placeholder="عنوان الرسالة" />
                    </div>
                    <div>
                      <Label>نص الرسالة</Label>
                      <Textarea value={newTemplate.body_text} onChange={e => setNewTemplate(p => ({ ...p, body_text: e.target.value }))} placeholder="مرحباً {{1}}، شحنتك {{2}} تم تحديثها." rows={4} />
                    </div>
                    <div>
                      <Label>التذييل</Label>
                      <Input value={newTemplate.footer_text} onChange={e => setNewTemplate(p => ({ ...p, footer_text: e.target.value }))} placeholder="iRecycle - منصة إدارة المخلفات" />
                    </div>
                    <div>
                      <Label>النوع التفاعلي</Label>
                      <Select value={newTemplate.interactive_type} onValueChange={v => setNewTemplate(p => ({ ...p, interactive_type: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">بدون</SelectItem>
                          <SelectItem value="buttons">أزرار</SelectItem>
                          <SelectItem value="survey">استطلاع رأي</SelectItem>
                          <SelectItem value="list">قائمة</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleCreateTemplate} className="w-full">إنشاء القالب</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {templates.map(tpl => (
                    <div key={tpl.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{tpl.template_name}</span>
                          <Badge variant="outline" className="text-xs">{tpl.category}</Badge>
                          {tpl.is_system && <Badge className="text-xs">نظام</Badge>}
                        </div>
                        <Badge variant={tpl.is_active ? 'default' : 'secondary'}>{tpl.is_active ? 'نشط' : 'معطّل'}</Badge>
                      </div>
                      {tpl.header_text && <p className="text-sm font-semibold text-primary">{tpl.header_text}</p>}
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{tpl.body_text}</p>
                      {tpl.footer_text && <p className="text-xs text-muted-foreground italic">{tpl.footer_text}</p>}
                      {tpl.interactive_type && tpl.interactive_type !== 'none' && (
                        <Badge variant="outline" className="text-xs"><ListChecks className="h-3 w-3 ml-1" />{tpl.interactive_type}</Badge>
                      )}
                    </div>
                  ))}
                  {templates.length === 0 && <p className="text-center text-muted-foreground py-8">لا توجد قوالب</p>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== ORG SETTINGS ==================== */}
        <TabsContent value="orgs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات واتساب للمنظمات</CardTitle>
              <CardDescription>التحكم في الإشعارات التلقائية لكل جهة مع مراعاة قواعد الرؤية والحجب</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {orgConfigs.map(config => (
                    <div key={config.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{(config as any).organization?.name_ar || (config as any).organization?.name || config.organization_id.slice(0, 8)}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{ORG_TYPE_LABELS[(config as any).organization?.organization_type] || ''}</Badge>
                            {(config as any).organization?.phone && (
                              <span className="text-xs text-muted-foreground font-mono" dir="ltr">{(config as any).organization.phone}</span>
                            )}
                          </div>
                        </div>
                        <Switch checked={config.is_active} onCheckedChange={v => toggleOrgConfig(config.id, 'is_active', v)} />
                      </div>
                      {config.is_active && (
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {[
                            { field: 'auto_send_notifications', label: 'إشعارات الشحنات', icon: BellRing },
                            { field: 'auto_send_otp', label: 'رموز OTP', icon: CheckCircle2 },
                            { field: 'auto_send_subscription_reminders', label: 'تذكير الاشتراكات', icon: Clock },
                            { field: 'auto_send_marketing', label: 'رسائل تسويقية', icon: Send },
                          ].map(({ field, label, icon: Icon }) => (
                            <div key={field} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                              <span className="flex items-center gap-1"><Icon className="h-3.5 w-3.5" />{label}</span>
                              <Switch
                                checked={(config as any)[field]}
                                onCheckedChange={v => toggleOrgConfig(config.id, field, v)}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {orgConfigs.length === 0 && <p className="text-center text-muted-foreground py-8">لا توجد منظمات مسجلة</p>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== MESSAGE LOGS ==================== */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>سجل الرسائل</CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="بحث..." className="pr-9 w-48" />
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
                      <TableHead>النوع</TableHead>
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
                        <TableCell><Badge variant="outline" className="text-xs">{msg.message_type}</Badge></TableCell>
                        <TableCell>
                          <Badge variant={
                            msg.status === 'sent' || msg.status === 'delivered' ? 'default' :
                            msg.status === 'failed' ? 'destructive' : 'secondary'
                          }>{msg.status}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(msg.created_at).toLocaleString('ar-EG')}</TableCell>
                      </TableRow>
                    ))}
                    {filteredMessages.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">لا توجد رسائل</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== ANALYTICS ==================== */}
        <TabsContent value="analytics">
          <WaPilotAnalytics messages={messages as any} orgs={orgs as any} />
        </TabsContent>

        {/* ==================== AI COMPOSER ==================== */}
        <TabsContent value="ai">
          <WaPilotAIComposer onUseMessage={(text) => { setSendMessage(text); setActiveTab('send'); }} />
        </TabsContent>

        {/* ==================== QUICK ACTIONS ==================== */}
        <TabsContent value="quick">
          <WaPilotQuickActions />
        </TabsContent>

        {/* ==================== SCHEDULER ==================== */}
        <TabsContent value="scheduler">
          <WaPilotScheduler />
        </TabsContent>

        {/* ==================== HEALTH MONITOR ==================== */}
        <TabsContent value="health">
          <WaPilotHealthMonitor messages={messages as any} orgs={orgs as any} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WhatsAppNotificationManager;
