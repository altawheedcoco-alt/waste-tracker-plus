import { useState, useRef, useEffect, lazy, Suspense, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Send, StopCircle, Trash2, Download, Printer, Eye, Save,
  FileText, Sparkles, Bot, User, Loader2, Copy, X, Share2,
  MessageSquare, Archive, LayoutTemplate, Users, Building2,
  BookmarkPlus, MessageCircle, Edit3, Code
} from 'lucide-react';
import { useAIDocumentChat } from '@/hooks/useAIDocumentChat';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { useDocumentService } from '@/hooks/useDocumentService';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BackButton from '@/components/ui/back-button';

const DocumentArchiveTab = lazy(() => import('@/components/ai-studio/DocumentArchiveTab'));
const DocumentTemplatesTab = lazy(() => import('@/components/ai-studio/DocumentTemplatesTab'));
const DocumentSharesTab = lazy(() => import('@/components/ai-studio/DocumentSharesTab'));
const BrandIdentityTab = lazy(() => import('@/components/ai-studio/BrandIdentityTab'));

const TabFallback = () => (
  <div className="space-y-4 p-4">
    <Skeleton className="h-8 w-full" />
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-8 w-2/3" />
  </div>
);

const SUGGESTIONS = [
  // عروض الأسعار والمالية
  { icon: '💰', label: 'عرض سعر نقل', prompt: 'أريد إنشاء عرض سعر احترافي لخدمات نقل المخلفات يتضمن جدول أسعار مفصل حسب نوع المخلف والمسافة والوزن' },
  { icon: '🧾', label: 'فاتورة أولية', prompt: 'أريد إنشاء فاتورة أولية (Proforma Invoice) لخدمات النقل تتضمن تفاصيل الشحنات والأسعار والضرائب' },
  { icon: '📑', label: 'كشف حساب', prompt: 'أريد إنشاء كشف حساب شهري للعميل يتضمن ملخص الشحنات والمبالغ المستحقة والمدفوعة والرصيد' },
  // العقود والاتفاقيات
  { icon: '📋', label: 'عقد نقل مخلفات', prompt: 'أريد إنشاء عقد خدمات نقل مخلفات شامل يتضمن بنود الالتزامات والمسؤوليات والتعويضات والشروط الجزائية' },
  { icon: '🤝', label: 'اتفاقية مستوى خدمة', prompt: 'أريد إنشاء اتفاقية مستوى خدمة (SLA) لنقل المخلفات تتضمن مؤشرات الأداء وأوقات الاستجابة والغرامات' },
  { icon: '📝', label: 'ملحق عقد', prompt: 'أريد إنشاء ملحق عقد لتعديل أو إضافة بنود على عقد نقل مخلفات قائم' },
  // الخطابات الرسمية
  { icon: '📄', label: 'خطاب رسمي', prompt: 'أريد كتابة خطاب رسمي موجه لجهاز تنظيم إدارة المخلفات' },
  { icon: '✉️', label: 'خطاب تعاون', prompt: 'أريد كتابة خطاب طلب تعاون أو شراكة مع شركة لإدارة المخلفات' },
  { icon: '📨', label: 'خطاب ضمان', prompt: 'أريد إنشاء خطاب ضمان لتنفيذ خدمات نقل المخلفات وفق المعايير البيئية' },
  // التقارير والتوثيق
  { icon: '📊', label: 'تقرير شهري', prompt: 'أريد إنشاء تقرير شهري عن عمليات النقل يتضمن إحصائيات الشحنات والأوزان والمسارات ومؤشرات الأداء' },
  { icon: '🔒', label: 'تقرير سلامة', prompt: 'أريد إنشاء تقرير السلامة والصحة المهنية لعمليات نقل المخلفات يتضمن تقييم المخاطر وإجراءات الوقاية' },
  { icon: '🌿', label: 'تقرير بيئي', prompt: 'أريد إنشاء تقرير الأثر البيئي لعمليات النقل يتضمن البصمة الكربونية ونسب إعادة التدوير والامتثال البيئي' },
  // مستندات تشغيلية
  { icon: '🚛', label: 'أمر تشغيل', prompt: 'أريد إنشاء أمر تشغيل لمهمة نقل مخلفات يتضمن بيانات السائق والمركبة والمسار والتعليمات' },
  { icon: '📦', label: 'بوليصة شحن', prompt: 'أريد إنشاء بوليصة شحن (Bill of Lading) لنقل مخلفات تتضمن بيانات المرسل والمستلم والحمولة' },
  { icon: '⚠️', label: 'تصريح نقل خطر', prompt: 'أريد إنشاء تصريح نقل مواد خطرة يتضمن تصنيف المادة وإجراءات السلامة وخطة الطوارئ' },
  { icon: '🔧', label: 'جدول صيانة', prompt: 'أريد إنشاء جدول صيانة دورية لأسطول نقل المخلفات يتضمن المواعيد والبنود والتكاليف المتوقعة' },
  // مستندات إدارية
  { icon: '📢', label: 'إعلان خدمات', prompt: 'أريد تصميم إعلان احترافي لخدمات نقل المخلفات يبرز المزايا التنافسية والتراخيص' },
  { icon: '📃', label: 'سياسة داخلية', prompt: 'أريد إنشاء سياسة داخلية لإدارة عمليات نقل المخلفات تتضمن الإجراءات والمسؤوليات والمعايير' },
  { icon: '🏅', label: 'شهادة إتمام', prompt: 'أريد إنشاء شهادة إتمام خدمة نقل وتسليم مخلفات بنجاح وفق المعايير البيئية' },
  { icon: '📑', label: 'مذكرة داخلية', prompt: 'أريد كتابة مذكرة داخلية للموظفين بخصوص تعليمات السلامة أثناء نقل المخلفات' },
];

const DOC_TYPES = [
  { value: 'quotation', label: 'عرض سعر' },
  { value: 'letter', label: 'خطاب رسمي' },
  { value: 'contract', label: 'عقد' },
  { value: 'report', label: 'تقرير' },
  { value: 'announcement', label: 'إعلان' },
  { value: 'invoice', label: 'فاتورة' },
  { value: 'general', label: 'عام' },
];

export default function AIDocumentStudioPage() {
  const { organization, profile } = useAuth();
  const { language } = useLanguage();
  const [input, setInput] = useState('');
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('chat');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Save dialog
  const [saveDialog, setSaveDialog] = useState<{ html: string; chatMsgs?: any[] } | null>(null);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveType, setSaveType] = useState('general');
  const [saving, setSaving] = useState(false);

  // Share dialog
  const [shareDialog, setShareDialog] = useState<{ docId?: string; html: string } | null>(null);
  const [sharing, setSharing] = useState(false);

  // Edit mode
  const [editHtml, setEditHtml] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<'visual' | 'code'>('visual');
  const editableRef = useRef<HTMLDivElement>(null);

  const orgData = organization ? {
    name: organization.name,
    email: organization.email,
    phone: organization.phone,
    address: (organization as any).address,
    city: (organization as any).city,
    organization_type: organization.organization_type,
    commercial_register: (organization as any).commercial_register,
    representative_name: (organization as any).representative_name,
  } : null;

  const { messages, isStreaming, sendMessage, stopStreaming, clearChat } = useAIDocumentChat({ orgData });
  const { downloadPDF, print } = useDocumentService({ filename: 'document', orientation: 'portrait' });

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput('');
    sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const extractDocumentHtml = (content: string): string | null => {
    const match = content.match(/\|\|\|DOCUMENT_START\|\|\|([\s\S]*?)\|\|\|DOCUMENT_END\|\|\|/);
    return match ? match[1].trim() : null;
  };

  const getCleanText = (content: string): string => {
    return content.replace(/\|\|\|DOCUMENT_START\|\|\|[\s\S]*?\|\|\|DOCUMENT_END\|\|\|/g, '').trim();
  };

  const handlePreview = (html: string) => setPreviewHtml(html);

  const handlePrint = (html: string) => {
    const c = document.createElement('div');
    c.innerHTML = html; c.style.position = 'fixed'; c.style.left = '-9999px';
    document.body.appendChild(c);
    try { print(c); } finally { setTimeout(() => document.body.removeChild(c), 1000); }
  };

  const handleDownloadPDF = async (html: string) => {
    const c = document.createElement('div');
    c.innerHTML = html; c.style.position = 'fixed'; c.style.left = '-9999px'; c.style.width = '794px';
    document.body.appendChild(c);
    try { await downloadPDF(c, { customFilename: `document-${Date.now()}` }); toast.success('تم تحميل المستند'); }
    finally { document.body.removeChild(c); }
  };

  const handleCopyHtml = (html: string) => { navigator.clipboard.writeText(html); toast.success('تم نسخ كود HTML'); };

  // Save document to DB
  const handleSaveDocument = async () => {
    if (!saveDialog || !saveTitle.trim() || !profile?.organization_id) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('ai_documents').insert({
        organization_id: profile.organization_id,
        created_by: profile.id,
        title: saveTitle,
        document_type: saveType,
        html_content: saveDialog.html,
        chat_messages: saveDialog.chatMsgs || null,
        status: 'draft',
      } as any);
      if (error) throw error;
      toast.success('تم حفظ المستند في الأرشيف');
      setSaveDialog(null);
      setSaveTitle('');
    } catch (err) {
      console.error(err);
      toast.error('خطأ في حفظ المستند');
    } finally {
      setSaving(false);
    }
  };

  // Share via WhatsApp
  const handleWhatsAppShare = (html: string) => {
    const text = `📄 مستند من ${organization?.name || 'المنصة'}\nأنشئ عبر استوديو المستندات الذكي`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Create share link
  const handleCreateShareLink = async (html: string) => {
    if (!profile?.id || !profile?.organization_id) return;
    setSharing(true);
    try {
      // First save the document if not saved
      const { data: doc, error: docErr } = await supabase.from('ai_documents').insert({
        organization_id: profile.organization_id,
        created_by: profile.id,
        title: `مستند مشترك - ${new Date().toLocaleDateString('ar')}`,
        document_type: 'general',
        html_content: html,
        status: 'shared',
      } as any).select('id').single();
      if (docErr) throw docErr;

      const { data: share, error: shareErr } = await supabase.from('ai_document_shares').insert({
        document_id: (doc as any).id,
        shared_by: profile.id,
        share_type: 'link',
      } as any).select('share_code').single();
      if (shareErr) throw shareErr;

      const link = `${window.location.origin}/s/doc/${(share as any).share_code}`;
      navigator.clipboard.writeText(link);
      toast.success('تم إنشاء رابط المشاركة ونسخه');
    } catch (err) {
      console.error(err);
      toast.error('خطأ في إنشاء رابط المشاركة');
    } finally {
      setSharing(false);
    }
  };

  // Document action buttons
  const DocumentActions = ({ html, showAll = false }: { html: string; showAll?: boolean }) => (
    <div className="flex items-center gap-0.5 flex-wrap">
      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handlePreview(html)} title="معاينة">
        <Eye className="w-3.5 h-3.5" />
      </Button>
      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handlePrint(html)} title="طباعة">
        <Printer className="w-3.5 h-3.5" />
      </Button>
      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDownloadPDF(html)} title="PDF">
        <Download className="w-3.5 h-3.5" />
      </Button>
      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleCopyHtml(html)} title="نسخ HTML">
        <Copy className="w-3.5 h-3.5" />
      </Button>
      {showAll && (
        <>
          <Button size="icon" variant="ghost" className="h-7 w-7" title="حفظ"
            onClick={() => setSaveDialog({ html, chatMsgs: messages.map(m => ({ role: m.role, content: m.content })) })}>
            <Save className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" title="مشاركة واتساب"
            onClick={() => handleWhatsAppShare(html)}>
            <MessageCircle className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" title="رابط مشاركة"
            onClick={() => handleCreateShareLink(html)}>
            <Share2 className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" title="تحرير"
            onClick={() => setEditHtml(html)}>
            <Edit3 className="w-3.5 h-3.5" />
          </Button>
        </>
      )}
    </div>
  );

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
        <div className="flex items-center gap-3">
          <BackButton fallbackPath="/dashboard" />
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">استوديو المستندات الذكي</h1>
            <p className="text-xs text-muted-foreground">إنشاء وإدارة ومشاركة المستندات الاحترافية</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0" dir="rtl">
        <div className="border-b px-2 overflow-x-auto">
          <TabsList className="h-10 bg-transparent p-0 gap-0 w-max">
            <TabsTrigger value="chat" className="gap-1.5 text-xs data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3">
              <MessageSquare className="w-3.5 h-3.5" />
              محادثة
            </TabsTrigger>
            <TabsTrigger value="archive" className="gap-1.5 text-xs data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3">
              <Archive className="w-3.5 h-3.5" />
              الأرشيف
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-1.5 text-xs data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3">
              <LayoutTemplate className="w-3.5 h-3.5" />
              القوالب
            </TabsTrigger>
            <TabsTrigger value="shared" className="gap-1.5 text-xs data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3">
              <Users className="w-3.5 h-3.5" />
              المشترك
            </TabsTrigger>
            <TabsTrigger value="identity" className="gap-1.5 text-xs data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3">
              <Building2 className="w-3.5 h-3.5" />
              الهوية
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Chat Tab */}
        <TabsContent value="chat" className="flex-1 flex flex-col min-h-0 mt-0">
          <ScrollArea className="flex-1 px-4" ref={scrollRef as any}>
            <div className="max-w-3xl mx-auto py-4 space-y-4">
              {!hasMessages && (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div className="text-center space-y-1">
                    <h2 className="text-lg font-bold text-foreground">مرحباً! أنا مساعدك لإنشاء المستندات</h2>
                    <p className="text-xs text-muted-foreground max-w-md">
                      أخبرني بما تريد إنشاءه وسأقوم بتجهيز مستند احترافي بتنسيق A4
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full max-w-lg">
                    {SUGGESTIONS.map((s, i) => (
                      <button key={i} onClick={() => { setInput(s.prompt); inputRef.current?.focus(); }}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl border bg-card hover:bg-accent/50 transition-colors text-sm text-start">
                        <span className="text-lg">{s.icon}</span>
                        <span className="text-foreground font-medium">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) => {
                const docHtml = msg.role === 'assistant' ? extractDocumentHtml(msg.content) : null;
                const cleanText = msg.role === 'assistant' ? getCleanText(msg.content) : msg.content;

                return (
                  <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 mt-1">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}

                    <div className={`max-w-[85%] space-y-2 ${msg.role === 'user' ? 'order-first' : ''}`}>
                      {msg.role === 'user' ? (
                        <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm">
                          {msg.content}
                        </div>
                      ) : (
                        <>
                          {cleanText && (
                            <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm prose prose-sm max-w-none dark:prose-invert">
                              <ReactMarkdown>{cleanText}</ReactMarkdown>
                            </div>
                          )}
                          {docHtml && (
                            <Card className="overflow-hidden border-2 border-emerald-200 dark:border-emerald-800">
                              <div className="bg-emerald-50 dark:bg-emerald-900/30 px-3 py-2 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-emerald-600" />
                                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">مستند جاهز</span>
                                </div>
                                <DocumentActions html={docHtml} showAll />
                              </div>
                              <div className="relative w-full bg-white overflow-hidden cursor-pointer" style={{ height: '180px' }}
                                onClick={() => handlePreview(docHtml)}>
                                <div style={{ transform: 'scale(0.28)', transformOrigin: 'top center', width: '794px',
                                  position: 'absolute', top: 0, left: '50%', marginLeft: '-397px' }}
                                  dangerouslySetInnerHTML={{ __html: docHtml }} />
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/90 flex items-end justify-center pb-3">
                                  <Badge variant="secondary" className="gap-1 text-xs">
                                    <Eye className="w-3 h-3" /> انقر للمعاينة
                                  </Badge>
                                </div>
                              </div>
                            </Card>
                          )}
                        </>
                      )}
                    </div>

                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                    )}
                  </div>
                );
              })}

              {isStreaming && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Chat Input */}
          <div className="border-t bg-card px-4 py-3">
            <div className="max-w-3xl mx-auto flex gap-2 items-end">
              {hasMessages && (
                <Button variant="ghost" size="icon" className="shrink-0 h-[44px] w-[44px] text-muted-foreground"
                  onClick={clearChat} title="محادثة جديدة">
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              <Textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="اكتب طلبك هنا... مثال: أريد عرض سعر لشركة X"
                className="min-h-[44px] max-h-[120px] resize-none text-sm" rows={1} />
              {isStreaming ? (
                <Button size="icon" variant="destructive" className="shrink-0 h-[44px] w-[44px]" onClick={stopStreaming}>
                  <StopCircle className="w-5 h-5" />
                </Button>
              ) : (
                <Button size="icon" className="shrink-0 h-[44px] w-[44px] bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                  onClick={handleSend} disabled={!input.trim()}>
                  <Send className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Archive Tab */}
        <TabsContent value="archive" className="flex-1 min-h-0 mt-0 px-4 py-3">
          <Suspense fallback={<TabFallback />}>
            <DocumentArchiveTab
              onPreview={handlePreview}
              onEdit={(doc) => setEditHtml(doc.html_content)}
            />
          </Suspense>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="flex-1 min-h-0 mt-0 px-4 py-3">
          <Suspense fallback={<TabFallback />}>
            <DocumentTemplatesTab
              onPreview={handlePreview}
              onUseTemplate={(html, title) => {
                setEditHtml(html);
                toast.info(`تم تحميل قالب: ${title}`);
              }}
            />
          </Suspense>
        </TabsContent>

        {/* Shared Tab */}
        <TabsContent value="shared" className="flex-1 min-h-0 mt-0 px-4 py-3">
          <Suspense fallback={<TabFallback />}>
            <DocumentSharesTab onPreviewDocument={(id) => {}} />
          </Suspense>
        </TabsContent>

        {/* Identity Tab */}
        <TabsContent value="identity" className="flex-1 min-h-0 mt-0 px-4 py-3 overflow-auto">
          <Suspense fallback={<TabFallback />}>
            <BrandIdentityTab />
          </Suspense>
        </TabsContent>
      </Tabs>

      {/* Full-screen Preview Modal */}
      {previewHtml && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-900">
            <Badge variant="secondary" className="gap-1">
              <FileText className="w-3 h-3" /> معاينة المستند
            </Badge>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" className="gap-1.5" onClick={() => handlePrint(previewHtml)}>
                <Printer className="w-4 h-4" /> طباعة
              </Button>
              <Button size="sm" variant="secondary" className="gap-1.5" onClick={() => handleDownloadPDF(previewHtml)}>
                <Download className="w-4 h-4" /> PDF
              </Button>
              <Button size="sm" variant="secondary" className="gap-1.5"
                onClick={() => setSaveDialog({ html: previewHtml })}>
                <Save className="w-4 h-4" /> حفظ
              </Button>
              <Button size="sm" variant="secondary" className="gap-1.5"
                onClick={() => handleWhatsAppShare(previewHtml)}>
                <MessageCircle className="w-4 h-4" /> واتساب
              </Button>
              <Button size="icon" variant="ghost" className="text-white hover:bg-white/20" onClick={() => setPreviewHtml(null)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-auto flex justify-center py-8 bg-gray-700">
            <div ref={previewRef} className="bg-white shadow-2xl" style={{ width: '794px', minHeight: '1123px' }}
              dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>
        </div>
      )}

      {/* Save Dialog */}
      <Dialog open={!!saveDialog} onOpenChange={(o) => !o && setSaveDialog(null)}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>حفظ المستند</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">عنوان المستند</label>
              <Input value={saveTitle} onChange={e => setSaveTitle(e.target.value)}
                placeholder="مثال: عرض سعر شركة X" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">نوع المستند</label>
              <Select value={saveType} onValueChange={setSaveType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSaveDialog(null)}>إلغاء</Button>
            <Button onClick={handleSaveDocument} disabled={!saveTitle.trim() || saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Save className="w-4 h-4 ml-2" />}
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal - Visual + Code */}
      {editHtml !== null && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-900" dir="rtl">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Edit3 className="w-3 h-3" /> تحرير المستند
              </Badge>
              <div className="flex items-center bg-gray-800 rounded-lg p-0.5 gap-0.5">
                <Button size="sm" variant={editMode === 'visual' ? 'secondary' : 'ghost'}
                  className="h-7 text-xs gap-1 text-gray-200" onClick={() => {
                    if (editMode === 'code' && editableRef.current) {
                      // switching to visual - sync html
                    }
                    setEditMode('visual');
                  }}>
                  <Edit3 className="w-3 h-3" /> تحرير مباشر
                </Button>
                <Button size="sm" variant={editMode === 'code' ? 'secondary' : 'ghost'}
                  className="h-7 text-xs gap-1 text-gray-200" onClick={() => {
                    if (editMode === 'visual' && editableRef.current) {
                      setEditHtml(editableRef.current.innerHTML);
                    }
                    setEditMode('code');
                  }}>
                  <Code className="w-3 h-3" /> كود HTML
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" className="gap-1.5" onClick={() => {
                const html = editMode === 'visual' && editableRef.current ? editableRef.current.innerHTML : editHtml;
                handlePreview(html);
              }}>
                <Eye className="w-4 h-4" /> معاينة
              </Button>
              <Button size="sm" variant="secondary" className="gap-1.5" onClick={() => {
                const html = editMode === 'visual' && editableRef.current ? editableRef.current.innerHTML : editHtml;
                handleDownloadPDF(html);
              }}>
                <Download className="w-4 h-4" /> PDF
              </Button>
              <Button size="sm" variant="secondary" className="gap-1.5" onClick={() => {
                const html = editMode === 'visual' && editableRef.current ? editableRef.current.innerHTML : editHtml;
                handlePrint(html);
              }}>
                <Printer className="w-4 h-4" /> طباعة
              </Button>
              <Button size="sm" variant="secondary" className="gap-1.5"
                onClick={() => {
                  const html = editMode === 'visual' && editableRef.current ? editableRef.current.innerHTML : editHtml;
                  setSaveDialog({ html });
                }}>
                <Save className="w-4 h-4" /> حفظ
              </Button>
              <Button size="icon" variant="ghost" className="text-white hover:bg-white/20" onClick={() => { setEditHtml(null); setEditMode('visual'); }}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-auto flex justify-center" style={{ background: '#4b5563' }}>
            {editMode === 'visual' ? (
              <div className="py-8">
                <div
                  ref={editableRef}
                  contentEditable
                  suppressContentEditableWarning
                  className="bg-white shadow-2xl outline-none"
                  style={{ width: '794px', minHeight: '1123px', direction: 'rtl' }}
                  dangerouslySetInnerHTML={{ __html: editHtml }}
                  onBlur={() => {
                    if (editableRef.current) {
                      setEditHtml(editableRef.current.innerHTML);
                    }
                  }}
                />
              </div>
            ) : (
              <div className="flex w-full min-h-0">
                <div className="flex-1 min-h-0">
                  <textarea
                    value={editHtml}
                    onChange={e => setEditHtml(e.target.value)}
                    className="w-full h-full bg-gray-900 text-green-400 font-mono text-xs p-4 resize-none border-none outline-none"
                    dir="ltr"
                    spellCheck={false}
                  />
                </div>
                <div className="flex-1 bg-gray-600 overflow-auto hidden md:flex justify-center py-4">
                  <div className="bg-white shadow-xl" style={{ width: '794px', minHeight: '1123px', transform: 'scale(0.7)', transformOrigin: 'top center' }}
                    dangerouslySetInnerHTML={{ __html: editHtml }} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
