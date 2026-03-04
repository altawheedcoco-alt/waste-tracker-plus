import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BackButton from '@/components/ui/back-button';
import { Bot, Brain, MessageSquare, ShoppingCart, Settings2, Plus, Trash2, Save, ToggleLeft, ToggleRight, Zap, Globe, Phone, Send, Eye, Clock, TrendingUp, Users, Star, ChevronRight, FileText, HelpCircle, DollarSign, Tag, Sparkles, MessageCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

interface AgentConfig {
  id?: string;
  is_enabled: boolean;
  agent_name: string;
  welcome_message: string;
  tone: string;
  language: string;
  auto_create_orders: boolean;
  notify_on_new_order: boolean;
  working_hours_start: string;
  working_hours_end: string;
  outside_hours_message: string;
  escalation_keywords: string[];
  escalation_message: string;
  whatsapp_enabled: boolean;
  facebook_enabled: boolean;
  telegram_enabled: boolean;
  website_widget_enabled: boolean;
  total_conversations: number;
  total_orders_created: number;
  customer_satisfaction_avg: number;
}

interface KnowledgeItem {
  id: string;
  knowledge_type: string;
  title: string;
  content: string;
  category: string;
  is_active: boolean;
  usage_count: number;
}

interface Conversation {
  id: string;
  channel: string;
  contact_name: string;
  contact_phone: string;
  status: string;
  message_count: number;
  order_created: boolean;
  satisfaction_rating: number | null;
  last_message_at: string;
  created_at: string;
}

interface AgentOrder {
  id: string;
  customer_name: string;
  customer_phone: string;
  order_type: string;
  items: any[];
  total_amount: number | null;
  status: string;
  channel: string;
  created_at: string;
}

const defaultConfig: AgentConfig = {
  is_enabled: false,
  agent_name: 'وكيل ذكي',
  welcome_message: 'مرحباً! كيف يمكنني مساعدتك اليوم؟',
  tone: 'friendly_professional',
  language: 'ar',
  auto_create_orders: true,
  notify_on_new_order: true,
  working_hours_start: '08:00',
  working_hours_end: '22:00',
  outside_hours_message: 'شكراً لتواصلك! سنرد عليك في أقرب وقت.',
  escalation_keywords: ['مدير', 'شكوى'],
  escalation_message: 'سأحولك لأحد المتخصصين فوراً...',
  whatsapp_enabled: false,
  facebook_enabled: false,
  telegram_enabled: false,
  website_widget_enabled: true,
  total_conversations: 0,
  total_orders_created: 0,
  customer_satisfaction_avg: 0,
};

const channelIcons: Record<string, string> = {
  website: '🌐',
  whatsapp: '📱',
  facebook: '📘',
  telegram: '✈️',
  internal: '🏢',
};

const SmartAgentDashboard = () => {
  const { organization } = useAuth();
  const [config, setConfig] = useState<AgentConfig>(defaultConfig);
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [orders, setOrders] = useState<AgentOrder[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [saving, setSaving] = useState(false);
  const [newKnowledge, setNewKnowledge] = useState({ title: '', content: '', knowledge_type: 'faq', category: '' });
  const [showAddKnowledge, setShowAddKnowledge] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [testReply, setTestReply] = useState('');
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (organization?.id) {
      loadData();
    }
  }, [organization?.id]);

  const loadData = async () => {
    if (!organization?.id) return;

    // Load config
    const { data: configData } = await supabase
      .from('ai_agent_configs')
      .select('*')
      .eq('organization_id', organization.id)
      .maybeSingle();

    if (configData) {
      setConfig({
        ...defaultConfig,
        ...configData,
        escalation_keywords: configData.escalation_keywords || [],
      });
    }

    // Load knowledge, conversations, orders in parallel
    const [knowledgeRes, convRes, ordersRes] = await Promise.all([
      supabase.from('ai_agent_knowledge').select('*').eq('organization_id', organization.id).order('created_at', { ascending: false }),
      supabase.from('ai_agent_conversations').select('*').eq('organization_id', organization.id).order('last_message_at', { ascending: false }).limit(50),
      supabase.from('ai_agent_orders').select('*').eq('organization_id', organization.id).order('created_at', { ascending: false }).limit(50),
    ]);

    setKnowledge((knowledgeRes.data || []) as KnowledgeItem[]);
    setConversations((convRes.data || []) as Conversation[]);
    setOrders((ordersRes.data || []) as AgentOrder[]);
  };

  const saveConfig = async () => {
    if (!organization?.id) return;
    setSaving(true);

    const payload = {
      organization_id: organization.id,
      ...config,
    };

    const { error } = config.id
      ? await supabase.from('ai_agent_configs').update(payload).eq('id', config.id)
      : await supabase.from('ai_agent_configs').upsert(payload, { onConflict: 'organization_id' });

    if (error) {
      toast.error('فشل حفظ الإعدادات');
    } else {
      toast.success('تم حفظ الإعدادات بنجاح');
      loadData();
    }
    setSaving(false);
  };

  const addKnowledge = async () => {
    if (!organization?.id || !newKnowledge.title || !newKnowledge.content) return;

    const { error } = await supabase.from('ai_agent_knowledge').insert({
      organization_id: organization.id,
      ...newKnowledge,
    });

    if (error) {
      toast.error('فشل إضافة المعرفة');
    } else {
      toast.success('تمت الإضافة بنجاح');
      setNewKnowledge({ title: '', content: '', knowledge_type: 'faq', category: '' });
      setShowAddKnowledge(false);
      loadData();
    }
  };

  const deleteKnowledge = async (id: string) => {
    await supabase.from('ai_agent_knowledge').delete().eq('id', id);
    toast.success('تم الحذف');
    loadData();
  };

  const testAgent = async () => {
    if (!testMessage.trim() || !organization?.id) return;
    setTesting(true);
    setTestReply('');

    try {
      const { data, error } = await supabase.functions.invoke('smart-agent', {
        body: {
          action: 'chat',
          organization_id: organization.id,
          message: testMessage,
          channel: 'internal',
          contact_info: { name: 'اختبار داخلي' },
        },
      });

      if (error) throw error;
      setTestReply(data.reply || 'لا يوجد رد');
    } catch {
      setTestReply('❌ خطأ في الاتصال بالوكيل');
    }
    setTesting(false);
  };

  const statsCards = [
    { label: 'المحادثات', value: config.total_conversations, icon: MessageSquare, color: 'text-blue-500' },
    { label: 'الأوردرات', value: config.total_orders_created, icon: ShoppingCart, color: 'text-green-500' },
    { label: 'رضا العملاء', value: `${config.customer_satisfaction_avg}/5`, icon: Star, color: 'text-yellow-500' },
    { label: 'قاعدة المعرفة', value: knowledge.length, icon: Brain, color: 'text-purple-500' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Bot className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">الوكيل الذكي</h1>
              <p className="text-sm text-muted-foreground">مساعد ذكي يرد على عملاءك ويأخذ الأوردرات تلقائياً</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="agent-toggle" className="text-sm font-medium">
                {config.is_enabled ? 'مفعّل' : 'معطّل'}
              </Label>
              <Switch
                id="agent-toggle"
                checked={config.is_enabled}
                onCheckedChange={(v) => setConfig(prev => ({ ...prev, is_enabled: v }))}
              />
            </div>
            <Button onClick={saveConfig} disabled={saving}>
              <Save className="w-4 h-4 ml-2" />
              {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statsCards.map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview"><Zap className="w-4 h-4 ml-1" />نظرة عامة</TabsTrigger>
            <TabsTrigger value="knowledge"><Brain className="w-4 h-4 ml-1" />قاعدة المعرفة</TabsTrigger>
            <TabsTrigger value="conversations"><MessageSquare className="w-4 h-4 ml-1" />المحادثات</TabsTrigger>
            <TabsTrigger value="orders"><ShoppingCart className="w-4 h-4 ml-1" />الأوردرات</TabsTrigger>
            <TabsTrigger value="settings"><Settings2 className="w-4 h-4 ml-1" />الإعدادات</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Test Agent */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  اختبر الوكيل الذكي
                </CardTitle>
                <CardDescription>جرب كيف يرد الوكيل على عملاءك</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    placeholder="اكتب رسالة تجريبية... مثلاً: عايز أعرف أسعار جمع المخلفات"
                    onKeyDown={(e) => e.key === 'Enter' && testAgent()}
                  />
                  <Button onClick={testAgent} disabled={testing || !config.is_enabled}>
                    <Send className="w-4 h-4 ml-1" />
                    {testing ? 'يفكر...' : 'إرسال'}
                  </Button>
                </div>
                {!config.is_enabled && (
                  <p className="text-sm text-destructive">⚠️ الوكيل معطّل. فعّله أولاً من الأعلى.</p>
                )}
                {testReply && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-muted rounded-xl">
                    <div className="flex items-start gap-2">
                      <Bot className="w-5 h-5 text-primary mt-1 shrink-0" />
                      <p className="text-sm whitespace-pre-wrap">{testReply}</p>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            {/* Channels */}
            <Card>
              <CardHeader>
                <CardTitle>القنوات المتصلة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'ويدجت الموقع', enabled: config.website_widget_enabled, icon: '🌐' },
                    { label: 'واتساب', enabled: config.whatsapp_enabled, icon: '📱' },
                    { label: 'فيسبوك', enabled: config.facebook_enabled, icon: '📘' },
                    { label: 'تليجرام', enabled: config.telegram_enabled, icon: '✈️' },
                  ].map((ch, i) => (
                    <div key={i} className={`p-4 rounded-xl border-2 text-center ${ch.enabled ? 'border-primary bg-primary/5' : 'border-border opacity-60'}`}>
                      <span className="text-3xl">{ch.icon}</span>
                      <p className="text-sm font-medium mt-2">{ch.label}</p>
                      <Badge variant={ch.enabled ? 'default' : 'secondary'} className="mt-1">
                        {ch.enabled ? 'متصل' : 'غير متصل'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">آخر المحادثات</CardTitle>
                </CardHeader>
                <CardContent>
                  {conversations.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">لا توجد محادثات بعد</p>
                  ) : (
                    <div className="space-y-2">
                      {conversations.slice(0, 5).map(conv => (
                        <div key={conv.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                          <div className="flex items-center gap-2">
                            <span>{channelIcons[conv.channel] || '💬'}</span>
                            <div>
                              <p className="text-sm font-medium">{conv.contact_name || 'زائر'}</p>
                              <p className="text-xs text-muted-foreground">{conv.message_count} رسالة</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {conv.order_created && <Badge variant="default" className="text-xs">طلب</Badge>}
                            <Badge variant={conv.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                              {conv.status === 'active' ? 'نشط' : conv.status === 'escalated' ? 'تصعيد' : 'مغلق'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">آخر الأوردرات</CardTitle>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">لا توجد أوردرات بعد</p>
                  ) : (
                    <div className="space-y-2">
                      {orders.slice(0, 5).map(order => (
                        <div key={order.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                          <div>
                            <p className="text-sm font-medium">{order.customer_name}</p>
                            <p className="text-xs text-muted-foreground">{channelIcons[order.channel]} {order.order_type}</p>
                          </div>
                          <Badge variant={order.status === 'new' ? 'default' : order.status === 'confirmed' ? 'default' : 'secondary'}>
                            {order.status === 'new' ? 'جديد' : order.status === 'confirmed' ? 'مؤكد' : order.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Knowledge Base Tab */}
          <TabsContent value="knowledge" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">قاعدة المعرفة ({knowledge.length} عنصر)</h3>
              <Dialog open={showAddKnowledge} onOpenChange={setShowAddKnowledge}>
                <DialogTrigger asChild>
                  <Button><Plus className="w-4 h-4 ml-1" />إضافة معرفة</Button>
                </DialogTrigger>
                <DialogContent dir="rtl">
                  <DialogHeader>
                    <DialogTitle>إضافة عنصر لقاعدة المعرفة</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>النوع</Label>
                      <Select value={newKnowledge.knowledge_type} onValueChange={(v) => setNewKnowledge(prev => ({ ...prev, knowledge_type: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="faq">سؤال وجواب (FAQ)</SelectItem>
                          <SelectItem value="pricing">أسعار</SelectItem>
                          <SelectItem value="catalog">كتالوج / خدمات</SelectItem>
                          <SelectItem value="policy">سياسة / شروط</SelectItem>
                          <SelectItem value="custom">مخصص</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>التصنيف</Label>
                      <Input value={newKnowledge.category} onChange={(e) => setNewKnowledge(prev => ({ ...prev, category: e.target.value }))} placeholder="مثلاً: جمع النفايات" />
                    </div>
                    <div>
                      <Label>العنوان</Label>
                      <Input value={newKnowledge.title} onChange={(e) => setNewKnowledge(prev => ({ ...prev, title: e.target.value }))} placeholder="مثلاً: ما هي أسعار الجمع؟" />
                    </div>
                    <div>
                      <Label>المحتوى</Label>
                      <Textarea value={newKnowledge.content} onChange={(e) => setNewKnowledge(prev => ({ ...prev, content: e.target.value }))} placeholder="الإجابة التفصيلية..." rows={5} />
                    </div>
                    <Button onClick={addKnowledge} className="w-full">
                      <Save className="w-4 h-4 ml-1" />حفظ
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {knowledge.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Brain className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">قاعدة المعرفة فارغة</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    أضف أسئلة وأجوبة، أسعار، وبيانات خدماتك ليتعلم منها الوكيل الذكي
                  </p>
                  <Button onClick={() => setShowAddKnowledge(true)}>
                    <Plus className="w-4 h-4 ml-1" />ابدأ بإضافة أول عنصر
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {knowledge.map(item => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">
                              {item.knowledge_type === 'faq' ? '❓ FAQ' : 
                               item.knowledge_type === 'pricing' ? '💰 أسعار' : 
                               item.knowledge_type === 'catalog' ? '📦 كتالوج' :
                               item.knowledge_type === 'policy' ? '📋 سياسة' : '📝 مخصص'}
                            </Badge>
                            {item.category && <Badge variant="secondary">{item.category}</Badge>}
                            <span className="text-xs text-muted-foreground">استُخدم {item.usage_count} مرة</span>
                          </div>
                          <h4 className="font-medium">{item.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.content}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => deleteKnowledge(item.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Conversations Tab */}
          <TabsContent value="conversations">
            <Card>
              <CardContent className="p-0">
                {conversations.length === 0 ? (
                  <div className="py-12 text-center">
                    <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">لا توجد محادثات بعد. فعّل الوكيل وانتظر أول عميل!</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="divide-y">
                      {conversations.map(conv => (
                        <div key={conv.id} className="p-4 hover:bg-muted/50 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{channelIcons[conv.channel]}</span>
                              <div>
                                <p className="font-medium">{conv.contact_name || 'زائر'}</p>
                                <p className="text-xs text-muted-foreground">
                                  {conv.contact_phone && `📞 ${conv.contact_phone} · `}
                                  {conv.message_count} رسالة
                                </p>
                              </div>
                            </div>
                            <div className="text-left">
                              <div className="flex items-center gap-1">
                                {conv.order_created && <Badge className="text-xs">🛒 طلب</Badge>}
                                {conv.satisfaction_rating && (
                                  <Badge variant="outline" className="text-xs">⭐ {conv.satisfaction_rating}</Badge>
                                )}
                                <Badge variant={conv.status === 'active' ? 'default' : conv.status === 'escalated' ? 'destructive' : 'secondary'}>
                                  {conv.status === 'active' ? 'نشط' : conv.status === 'escalated' ? 'تصعيد' : 'مغلق'}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(conv.last_message_at).toLocaleDateString('ar-EG')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardContent className="p-0">
                {orders.length === 0 ? (
                  <div className="py-12 text-center">
                    <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">لا توجد أوردرات بعد</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="divide-y">
                      {orders.map(order => (
                        <div key={order.id} className="p-4 hover:bg-muted/50">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-medium">{order.customer_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {channelIcons[order.channel]} {order.customer_phone || 'بدون رقم'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {order.total_amount && (
                                <Badge variant="outline">{order.total_amount} ج.م</Badge>
                              )}
                              <Badge variant={order.status === 'new' ? 'default' : order.status === 'confirmed' ? 'default' : 'secondary'}>
                                {order.status === 'new' ? '🆕 جديد' : order.status === 'confirmed' ? '✅ مؤكد' : order.status === 'processing' ? '⏳ قيد التنفيذ' : order.status}
                              </Badge>
                            </div>
                          </div>
                          {Array.isArray(order.items) && order.items.length > 0 && (
                            <div className="bg-muted/50 rounded-lg p-2 text-xs">
                              {order.items.map((item: any, i: number) => (
                                <span key={i} className="ml-3">
                                  {item.name} {item.quantity && `(${item.quantity})`}
                                </span>
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(order.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            {/* Agent Personality */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">شخصية الوكيل</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>اسم الوكيل</Label>
                    <Input value={config.agent_name} onChange={(e) => setConfig(prev => ({ ...prev, agent_name: e.target.value }))} />
                  </div>
                  <div>
                    <Label>أسلوب الرد</Label>
                    <Select value={config.tone} onValueChange={(v) => setConfig(prev => ({ ...prev, tone: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="friendly_professional">ودود ومهني</SelectItem>
                        <SelectItem value="formal">رسمي</SelectItem>
                        <SelectItem value="casual">عامي وبسيط</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>رسالة الترحيب</Label>
                  <Textarea value={config.welcome_message} onChange={(e) => setConfig(prev => ({ ...prev, welcome_message: e.target.value }))} rows={3} />
                </div>
              </CardContent>
            </Card>

            {/* Automation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">الأتمتة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>إنشاء الأوردرات تلقائياً</Label>
                    <p className="text-xs text-muted-foreground">الوكيل يجمع بيانات العميل ويسجل الطلب تلقائياً</p>
                  </div>
                  <Switch checked={config.auto_create_orders} onCheckedChange={(v) => setConfig(prev => ({ ...prev, auto_create_orders: v }))} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>إشعار عند أوردر جديد</Label>
                    <p className="text-xs text-muted-foreground">إرسال إشعار لجميع أعضاء الجهة</p>
                  </div>
                  <Switch checked={config.notify_on_new_order} onCheckedChange={(v) => setConfig(prev => ({ ...prev, notify_on_new_order: v }))} />
                </div>
              </CardContent>
            </Card>

            {/* Working Hours */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">ساعات العمل</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>بداية العمل</Label>
                    <Input type="time" value={config.working_hours_start} onChange={(e) => setConfig(prev => ({ ...prev, working_hours_start: e.target.value }))} />
                  </div>
                  <div>
                    <Label>نهاية العمل</Label>
                    <Input type="time" value={config.working_hours_end} onChange={(e) => setConfig(prev => ({ ...prev, working_hours_end: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label>رسالة خارج أوقات العمل</Label>
                  <Textarea value={config.outside_hours_message} onChange={(e) => setConfig(prev => ({ ...prev, outside_hours_message: e.target.value }))} rows={2} />
                </div>
              </CardContent>
            </Card>

            {/* Escalation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">التصعيد</CardTitle>
                <CardDescription>كلمات تحول المحادثة لموظف بشري</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>كلمات التصعيد (مفصولة بفاصلة)</Label>
                  <Input
                    value={config.escalation_keywords?.join('، ') || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, escalation_keywords: e.target.value.split(/[,،]/).map(s => s.trim()).filter(Boolean) }))}
                    placeholder="مدير، شكوى، مشكلة كبيرة"
                  />
                </div>
                <div>
                  <Label>رسالة التصعيد</Label>
                  <Input value={config.escalation_message} onChange={(e) => setConfig(prev => ({ ...prev, escalation_message: e.target.value }))} />
                </div>
              </CardContent>
            </Card>

            {/* Channels */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">القنوات الخارجية</CardTitle>
                <CardDescription>ربط الوكيل بقنوات التواصل الخارجية</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🌐</span>
                    <div>
                      <p className="font-medium">ويدجت الموقع</p>
                      <p className="text-xs text-muted-foreground">شات بوت على موقعك أو بوابة العملاء</p>
                    </div>
                  </div>
                  <Switch checked={config.website_widget_enabled} onCheckedChange={(v) => setConfig(prev => ({ ...prev, website_widget_enabled: v }))} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📱</span>
                    <div>
                      <p className="font-medium">واتساب بزنس</p>
                      <p className="text-xs text-muted-foreground">يتطلب ربط WhatsApp Cloud API</p>
                    </div>
                  </div>
                  <Switch checked={config.whatsapp_enabled} onCheckedChange={(v) => setConfig(prev => ({ ...prev, whatsapp_enabled: v }))} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📘</span>
                    <div>
                      <p className="font-medium">فيسبوك ماسنجر</p>
                      <p className="text-xs text-muted-foreground">يتطلب ربط Facebook Page</p>
                    </div>
                  </div>
                  <Switch checked={config.facebook_enabled} onCheckedChange={(v) => setConfig(prev => ({ ...prev, facebook_enabled: v }))} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">✈️</span>
                    <div>
                      <p className="font-medium">تليجرام</p>
                      <p className="text-xs text-muted-foreground">يتطلب إنشاء بوت تليجرام</p>
                    </div>
                  </div>
                  <Switch checked={config.telegram_enabled} onCheckedChange={(v) => setConfig(prev => ({ ...prev, telegram_enabled: v }))} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SmartAgentDashboard;
