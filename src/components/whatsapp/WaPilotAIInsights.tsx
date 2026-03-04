import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import {
  Brain, Search, Loader2, User, TrendingUp, TrendingDown,
  ThumbsUp, ThumbsDown, Minus, AlertTriangle, Shield,
  Ban, CheckCircle2, XCircle, Sparkles, MessageSquare,
  ChevronDown, ChevronUp, Eye, Star, Bell, BellOff,
  Truck, FileText, Leaf, HandMetal, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface MessageLog {
  id: string;
  status: string | null;
  direction: string;
  message_type: string;
  created_at: string;
  content: string | null;
  to_phone: string | null;
  from_phone: string | null;
  metadata: any;
}

interface Props {
  messages: MessageLog[];
  onRefresh: () => void;
}

interface ContactAnalysis {
  phone: string;
  contactName?: string;
  analysis?: any;
  loading?: boolean;
  messagesCount: number;
  inboundCount: number;
  preferences?: any;
}

const MESSAGE_CATEGORIES = [
  { key: 'شحنات', label: 'إشعارات الشحنات', icon: Truck, color: 'text-blue-600' },
  { key: 'فواتير', label: 'إشعارات الفواتير', icon: FileText, color: 'text-amber-600' },
  { key: 'تنبيهات', label: 'التنبيهات العامة', icon: Bell, color: 'text-red-600' },
  { key: 'ترحيب', label: 'رسائل الترحيب', icon: HandMetal, color: 'text-green-600' },
  { key: 'بيئية', label: 'التقارير البيئية', icon: Leaf, color: 'text-emerald-600' },
];

const WaPilotAIInsights = ({ messages, onRefresh }: Props) => {
  const [search, setSearch] = useState('');
  const [contacts, setContacts] = useState<ContactAnalysis[]>([]);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [bulkAnalyzing, setBulkAnalyzing] = useState(false);
  const [preferences, setPreferences] = useState<Record<string, any>>({});
  const [savingPref, setSavingPref] = useState<string | null>(null);

  // Build contacts list from messages
  useEffect(() => {
    const contactMap = new Map<string, ContactAnalysis>();
    for (const msg of messages) {
      const phone = msg.direction === 'inbound' ? msg.from_phone : msg.to_phone;
      if (!phone) continue;
      const clean = phone.replace(/[\s\-\+@c.us]/g, '').replace(/^0+/, '');
      if (!clean || clean.length < 8) continue;

      if (!contactMap.has(clean)) {
        contactMap.set(clean, {
          phone: clean,
          contactName: msg.metadata?.profile_name,
          messagesCount: 0,
          inboundCount: 0,
        });
      }
      const c = contactMap.get(clean)!;
      c.messagesCount++;
      if (msg.direction === 'inbound') c.inboundCount++;
      if (msg.metadata?.profile_name && !c.contactName) c.contactName = msg.metadata.profile_name;
    }
    setContacts(Array.from(contactMap.values()).sort((a, b) => b.inboundCount - a.inboundCount));
  }, [messages]);

  // Load existing preferences & analyses
  useEffect(() => {
    loadPreferences();
    loadAnalyses();
  }, []);

  const loadPreferences = async () => {
    const { data } = await supabase.from('whatsapp_contact_preferences').select('*');
    if (data) {
      const map: Record<string, any> = {};
      data.forEach((p: any) => { map[p.phone] = p; });
      setPreferences(map);
    }
  };

  const loadAnalyses = async () => {
    const { data } = await supabase
      .from('whatsapp_ai_analysis')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) {
      setContacts(prev => prev.map(c => {
        const latest = data.find((a: any) => a.phone === c.phone);
        return latest ? { ...c, analysis: latest.raw_analysis } : c;
      }));
    }
  };

  const analyzeContact = useCallback(async (phone: string) => {
    setAnalyzing(phone);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-whatsapp-messages', {
        body: { phone, action: 'analyze-contact' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setContacts(prev => prev.map(c =>
        c.phone === phone ? { ...c, analysis: data.analysis } : c
      ));
      await loadPreferences();
      toast.success('تم التحليل بنجاح ✨');
    } catch (err: any) {
      toast.error(`فشل التحليل: ${err.message}`);
    } finally {
      setAnalyzing(null);
    }
  }, []);

  const toggleCategoryOptOut = useCallback(async (phone: string, category: string) => {
    setSavingPref(phone);
    const current = preferences[phone]?.opted_out_categories || [];
    const updated = current.includes(category)
      ? current.filter((c: string) => c !== category)
      : [...current, category];

    try {
      const { error } = await supabase.from('whatsapp_contact_preferences').upsert({
        phone,
        opted_out_categories: updated,
        opted_out_all: updated.length === MESSAGE_CATEGORIES.length,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'phone' });
      if (error) throw error;
      setPreferences(prev => ({
        ...prev,
        [phone]: { ...prev[phone], phone, opted_out_categories: updated, opted_out_all: updated.length === MESSAGE_CATEGORIES.length },
      }));
      toast.success('تم تحديث التفضيلات');
    } catch (err: any) {
      toast.error(`خطأ: ${err.message}`);
    } finally {
      setSavingPref(null);
    }
  }, [preferences]);

  const toggleAllOptOut = useCallback(async (phone: string, optOut: boolean) => {
    setSavingPref(phone);
    try {
      const { error } = await supabase.from('whatsapp_contact_preferences').upsert({
        phone,
        opted_out_all: optOut,
        opted_out_categories: optOut ? MESSAGE_CATEGORIES.map(c => c.key) : [],
        opted_out_at: optOut ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'phone' });
      if (error) throw error;
      setPreferences(prev => ({
        ...prev,
        [phone]: { ...prev[phone], phone, opted_out_all: optOut, opted_out_categories: optOut ? MESSAGE_CATEGORIES.map(c => c.key) : [] },
      }));
      toast.success(optOut ? 'تم إيقاف جميع الرسائل' : 'تم تفعيل الرسائل');
    } catch (err: any) {
      toast.error(`خطأ: ${err.message}`);
    } finally {
      setSavingPref(null);
    }
  }, []);

  const filteredContacts = useMemo(() => {
    if (!search) return contacts;
    const q = search.toLowerCase();
    return contacts.filter(c =>
      c.phone.includes(q) || c.contactName?.toLowerCase().includes(q)
    );
  }, [contacts, search]);

  const activeContact = useMemo(() => {
    if (!selectedContact) return null;
    return contacts.find(c => c.phone === selectedContact) || null;
  }, [selectedContact, contacts]);

  const getSentimentIcon = (sentiment: string) => {
    if (!sentiment) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (sentiment.includes('إيجابي') || sentiment === 'positive') return <ThumbsUp className="h-4 w-4 text-green-500" />;
    if (sentiment.includes('سلبي') || sentiment === 'negative') return <ThumbsDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-amber-500" />;
  };

  const getSentimentColor = (score: number) => {
    if (score >= 0.5) return 'text-green-600 bg-green-500/10';
    if (score >= 0) return 'text-amber-600 bg-amber-500/10';
    return 'text-red-600 bg-red-500/10';
  };

  // Summary stats
  const stats = useMemo(() => {
    const analyzed = contacts.filter(c => c.analysis);
    const positive = analyzed.filter(c => c.analysis?.sentiment_score > 0.3);
    const negative = analyzed.filter(c => c.analysis?.sentiment_score < -0.3);
    const optedOut = Object.values(preferences).filter((p: any) => p.opted_out_all);
    const partialOptOut = Object.values(preferences).filter((p: any) => !p.opted_out_all && p.opted_out_categories?.length > 0);
    const highRisk = analyzed.filter(c => c.analysis?.risk_level === 'عالي');
    return { analyzed: analyzed.length, positive: positive.length, negative: negative.length, optedOut: optedOut.length, partialOptOut: partialOptOut.length, highRisk: highRisk.length };
  }, [contacts, preferences]);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        <Card className="border-primary/10">
          <CardContent className="p-3 text-center">
            <Brain className="h-4 w-4 mx-auto mb-1 text-primary" />
            <div className="text-xl font-bold">{stats.analyzed}</div>
            <p className="text-[10px] text-muted-foreground">تم تحليلهم</p>
          </CardContent>
        </Card>
        <Card className="border-primary/10">
          <CardContent className="p-3 text-center">
            <ThumbsUp className="h-4 w-4 mx-auto mb-1 text-green-500" />
            <div className="text-xl font-bold text-green-600">{stats.positive}</div>
            <p className="text-[10px] text-muted-foreground">راضون</p>
          </CardContent>
        </Card>
        <Card className="border-primary/10">
          <CardContent className="p-3 text-center">
            <ThumbsDown className="h-4 w-4 mx-auto mb-1 text-destructive" />
            <div className="text-xl font-bold text-destructive">{stats.negative}</div>
            <p className="text-[10px] text-muted-foreground">غير راضين</p>
          </CardContent>
        </Card>
        <Card className="border-primary/10">
          <CardContent className="p-3 text-center">
            <Ban className="h-4 w-4 mx-auto mb-1 text-red-500" />
            <div className="text-xl font-bold text-red-600">{stats.optedOut}</div>
            <p className="text-[10px] text-muted-foreground">إلغاء كامل</p>
          </CardContent>
        </Card>
        <Card className="border-primary/10">
          <CardContent className="p-3 text-center">
            <BellOff className="h-4 w-4 mx-auto mb-1 text-amber-500" />
            <div className="text-xl font-bold text-amber-600">{stats.partialOptOut}</div>
            <p className="text-[10px] text-muted-foreground">إلغاء جزئي</p>
          </CardContent>
        </Card>
        <Card className="border-primary/10">
          <CardContent className="p-3 text-center">
            <AlertTriangle className="h-4 w-4 mx-auto mb-1 text-red-500" />
            <div className="text-xl font-bold text-red-600">{stats.highRisk}</div>
            <p className="text-[10px] text-muted-foreground">خطر فقدان</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 border-primary/10 overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              تحليل ذكي لردود العملاء وتفضيلاتهم
            </CardTitle>
            <Button variant="outline" size="sm" onClick={onRefresh} className="text-[10px] h-7">
              <RefreshCw className="h-3 w-3 ml-1" />تحديث
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex h-[600px]">
            {/* ═══ Contacts List ═══ */}
            <div className="w-[300px] border-l flex flex-col bg-muted/20">
              <div className="p-2 border-b">
                <div className="relative">
                  <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="بحث بالرقم أو الاسم..."
                    value={search} onChange={e => setSearch(e.target.value)}
                    className="pr-8 h-7 text-xs"
                  />
                </div>
              </div>

              <ScrollArea className="flex-1">
                {filteredContacts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                    <User className="h-10 w-10 opacity-30 mb-2" />
                    <p className="text-sm">لا توجد جهات اتصال</p>
                  </div>
                ) : (
                  filteredContacts.map(contact => {
                    const pref = preferences[contact.phone];
                    const isOptedOut = pref?.opted_out_all;
                    const hasPartialOpt = pref?.opted_out_categories?.length > 0 && !isOptedOut;

                    return (
                      <button
                        key={contact.phone}
                        onClick={() => setSelectedContact(contact.phone)}
                        className={`w-full text-right p-2.5 border-b transition-colors hover:bg-muted/50 ${
                          selectedContact === contact.phone ? 'bg-primary/5 border-r-2 border-r-primary' : ''
                        } ${isOptedOut ? 'opacity-60' : ''}`}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                            contact.analysis ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                          }`}>
                            {contact.analysis ? getSentimentIcon(contact.analysis.sentiment) : <User className="h-3.5 w-3.5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <p className="text-xs font-semibold truncate">{contact.contactName || `+${contact.phone}`}</p>
                              <div className="flex items-center gap-1">
                                {isOptedOut && <Ban className="h-3 w-3 text-destructive" />}
                                {hasPartialOpt && <BellOff className="h-3 w-3 text-amber-500" />}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-muted-foreground">↓{contact.inboundCount} واردة</span>
                              {contact.analysis && (
                                <Badge className={`text-[8px] px-1 py-0 ${getSentimentColor(contact.analysis.sentiment_score || 0)}`}>
                                  {contact.analysis.sentiment}
                                </Badge>
                              )}
                              {!contact.analysis && contact.inboundCount > 0 && (
                                <Badge variant="outline" className="text-[8px] px-1 py-0">غير محلل</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </ScrollArea>
            </div>

            {/* ═══ Analysis Detail View ═══ */}
            <div className="flex-1 flex flex-col">
              {activeContact ? (
                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-4">
                    {/* Contact header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          {activeContact.analysis
                            ? getSentimentIcon(activeContact.analysis.sentiment)
                            : <User className="h-5 w-5 text-primary" />
                          }
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{activeContact.contactName || `+${activeContact.phone}`}</p>
                          <p className="text-[10px] text-muted-foreground font-mono" dir="ltr">+{activeContact.phone}</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => analyzeContact(activeContact.phone)}
                        disabled={analyzing === activeContact.phone}
                        size="sm" className="gap-1"
                      >
                        {analyzing === activeContact.phone
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Sparkles className="h-3.5 w-3.5" />
                        }
                        {activeContact.analysis ? 'إعادة التحليل' : 'تحليل بالذكاء الاصطناعي'}
                      </Button>
                    </div>

                    {/* Analysis Results */}
                    {activeContact.analysis ? (
                      <>
                        {/* Sentiment + Score */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <Card>
                            <CardContent className="p-3 text-center">
                              {getSentimentIcon(activeContact.analysis.sentiment)}
                              <p className="text-sm font-bold mt-1">{activeContact.analysis.sentiment}</p>
                              <p className="text-[10px] text-muted-foreground">المشاعر</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-3 text-center">
                              <div className={`text-lg font-bold ${getSentimentColor(activeContact.analysis.sentiment_score || 0)} rounded-lg px-2 py-0.5 inline-block`}>
                                {(activeContact.analysis.sentiment_score || 0).toFixed(2)}
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-1">درجة المشاعر</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-3 text-center">
                              <p className="text-sm font-bold">{activeContact.analysis.engagement_assessment || '—'}</p>
                              <p className="text-[10px] text-muted-foreground">مستوى التفاعل</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-3 text-center">
                              <Badge className={`text-xs ${
                                activeContact.analysis.risk_level === 'عالي' ? 'bg-red-500/10 text-red-700' :
                                activeContact.analysis.risk_level === 'متوسط' ? 'bg-amber-500/10 text-amber-700' :
                                'bg-green-500/10 text-green-700'
                              }`}>
                                {activeContact.analysis.risk_level || 'منخفض'}
                              </Badge>
                              <p className="text-[10px] text-muted-foreground mt-1">خطر الفقدان</p>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Customer Opinion */}
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-xs flex items-center gap-1"><Eye className="h-3.5 w-3.5" />رأي العميل</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm leading-relaxed">{activeContact.analysis.customer_opinion}</p>
                            {activeContact.analysis.is_interested !== undefined && (
                              <div className="mt-2 flex items-center gap-2">
                                {activeContact.analysis.is_interested
                                  ? <Badge className="bg-green-500/10 text-green-700 text-[10px]"><CheckCircle2 className="h-3 w-3 ml-1" />مهتم بالخدمة</Badge>
                                  : <Badge className="bg-red-500/10 text-red-700 text-[10px]"><XCircle className="h-3 w-3 ml-1" />غير مهتم</Badge>
                                }
                                {activeContact.analysis.interest_reason && (
                                  <span className="text-[10px] text-muted-foreground">{activeContact.analysis.interest_reason}</span>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {/* Key Topics + Suggestions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {activeContact.analysis.key_topics?.length > 0 && (
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-xs">المواضيع الرئيسية</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="flex flex-wrap gap-1.5">
                                  {activeContact.analysis.key_topics.map((t: string, i: number) => (
                                    <Badge key={i} variant="outline" className="text-[10px]">{t}</Badge>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          )}
                          {activeContact.analysis.suggestions?.length > 0 && (
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-xs">اقتراحات العميل</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <ul className="space-y-1">
                                  {activeContact.analysis.suggestions.map((s: string, i: number) => (
                                    <li key={i} className="text-xs flex items-start gap-1.5">
                                      <Sparkles className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                                      {s}
                                    </li>
                                  ))}
                                </ul>
                              </CardContent>
                            </Card>
                          )}
                        </div>

                        {/* Recommended Actions */}
                        {activeContact.analysis.recommended_actions?.length > 0 && (
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-xs flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" />إجراءات مقترحة</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-1.5">
                                {activeContact.analysis.recommended_actions.map((a: string, i: number) => (
                                  <li key={i} className="text-xs flex items-start gap-1.5 p-2 bg-primary/5 rounded-lg">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                                    {a}
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
                        )}

                        {/* Opt-out detected alert */}
                        {activeContact.analysis.opt_out_detected && (
                          <Card className="border-destructive/30 bg-destructive/5">
                            <CardContent className="p-3 flex items-center gap-3">
                              <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                              <div>
                                <p className="text-sm font-semibold text-destructive">اكتشف الذكاء الاصطناعي طلب إلغاء اشتراك</p>
                                <p className="text-xs text-muted-foreground">
                                  {activeContact.analysis.opt_out_category
                                    ? `الفئة: ${activeContact.analysis.opt_out_category}`
                                    : 'طلب إلغاء عام'}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </>
                    ) : (
                      <Card className="border-dashed">
                        <CardContent className="py-10 text-center text-muted-foreground">
                          <Brain className="h-12 w-12 mx-auto opacity-20 mb-3" />
                          <p className="font-medium">لم يتم التحليل بعد</p>
                          <p className="text-sm mt-1">اضغط "تحليل بالذكاء الاصطناعي" لتحليل ردود هذا العميل</p>
                          <p className="text-xs mt-2">عدد الرسائل: {activeContact.messagesCount} (واردة: {activeContact.inboundCount})</p>
                        </CardContent>
                      </Card>
                    )}

                    {/* ═══ Opt-out / Category Preferences ═══ */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs flex items-center gap-1">
                          <Shield className="h-3.5 w-3.5" />
                          تفضيلات الرسائل — تحكم بأنواع الرسائل المرسلة لهذا العميل
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Global opt-out */}
                        <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                          <div className="flex items-center gap-2">
                            <Ban className="h-4 w-4 text-destructive" />
                            <div>
                              <p className="text-sm font-medium">إيقاف جميع الرسائل</p>
                              <p className="text-[10px] text-muted-foreground">لن يتلقى العميل أي رسائل من النظام</p>
                            </div>
                          </div>
                          <Switch
                            checked={preferences[activeContact.phone]?.opted_out_all || false}
                            onCheckedChange={(v) => toggleAllOptOut(activeContact.phone, v)}
                            disabled={savingPref === activeContact.phone}
                          />
                        </div>

                        {/* Per-category */}
                        <div className="space-y-2">
                          <p className="text-[10px] text-muted-foreground font-medium">أو إيقاف تصنيفات محددة:</p>
                          {MESSAGE_CATEGORIES.map(cat => {
                            const isOff = preferences[activeContact.phone]?.opted_out_categories?.includes(cat.key) || false;
                            const Icon = cat.icon;
                            return (
                              <div key={cat.key} className="flex items-center justify-between p-2.5 rounded-lg border">
                                <div className="flex items-center gap-2">
                                  <Icon className={`h-4 w-4 ${cat.color}`} />
                                  <div>
                                    <p className="text-xs font-medium">{cat.label}</p>
                                    <p className="text-[9px] text-muted-foreground">تصنيف: {cat.key}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {isOff ? (
                                    <Badge className="text-[8px] bg-red-500/10 text-red-700">متوقف</Badge>
                                  ) : (
                                    <Badge className="text-[8px] bg-green-500/10 text-green-700">مفعّل</Badge>
                                  )}
                                  <Switch
                                    checked={!isOff}
                                    onCheckedChange={() => toggleCategoryOptOut(activeContact.phone, cat.key)}
                                    disabled={savingPref === activeContact.phone || preferences[activeContact.phone]?.opted_out_all}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                  <Brain className="h-16 w-16 opacity-20 mb-4" />
                  <p className="text-lg font-medium mb-1">تحليل ذكي للعملاء</p>
                  <p className="text-sm">اختر جهة اتصال لتحليل ردودها وإدارة تفضيلاتها</p>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-2xl font-bold text-primary">{contacts.length}</p>
                      <p className="text-[10px]">جهة اتصال</p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{stats.analyzed}</p>
                      <p className="text-[10px]">تم تحليلهم</p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{stats.optedOut}</p>
                      <p className="text-[10px]">ألغوا الاشتراك</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WaPilotAIInsights;
