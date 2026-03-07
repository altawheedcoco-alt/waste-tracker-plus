import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import { Brain, Loader2, RefreshCw, X, Sparkles, AlertTriangle, Save, History, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

// Import via registry
import { ACTION_CHAINS_REGISTRY } from '@/config/actionChainsRegistry';
import { TRANSPORTER_TAB_BINDINGS, TRANSPORTER_SIDEBAR_BINDINGS, TRANSPORTER_ACTION_BINDINGS } from '@/config/transporter/transporterBindings';
import { GENERATOR_TAB_BINDINGS, GENERATOR_SIDEBAR_BINDINGS } from '@/config/generator/generatorBindings';
import { RECYCLER_TAB_BINDINGS, RECYCLER_SIDEBAR_BINDINGS } from '@/config/recycler/recyclerBindings';
import { DISPOSAL_TAB_BINDINGS, DISPOSAL_SIDEBAR_BINDINGS } from '@/config/disposal/disposalBindings';

interface BindingAuditPanelProps {
  orgType: string;
  tabs?: Array<{ value: string; labelKey?: string }>;
  sidebarItems?: Array<{ key: string; labelAr?: string; labelEn?: string }>;
  className?: string;
}

const ORG_BINDINGS: Record<string, {
  tabBindings: Record<string, any>;
  sidebarBindings: Record<string, any>;
  actionBindings?: Record<string, any>;
}> = {
  transporter: { tabBindings: TRANSPORTER_TAB_BINDINGS, sidebarBindings: TRANSPORTER_SIDEBAR_BINDINGS, actionBindings: TRANSPORTER_ACTION_BINDINGS },
  generator: { tabBindings: GENERATOR_TAB_BINDINGS, sidebarBindings: GENERATOR_SIDEBAR_BINDINGS },
  recycler: { tabBindings: RECYCLER_TAB_BINDINGS, sidebarBindings: RECYCLER_SIDEBAR_BINDINGS },
  disposal: { tabBindings: DISPOSAL_TAB_BINDINGS, sidebarBindings: DISPOSAL_SIDEBAR_BINDINGS },
};

const BindingAuditPanel = ({ orgType, tabs = [], sidebarItems = [], className }: BindingAuditPanelProps) => {
  const { language } = useLanguage();
  const { user, organization } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [report, setReport] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Fetch previous reports
  const { data: previousReports = [], refetch: refetchHistory } = useQuery({
    queryKey: ['binding-audit-reports', organization?.id, orgType],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('binding_audit_reports')
        .select('id, org_type, report_content, audit_metadata, created_at')
        .eq('organization_id', organization.id)
        .eq('org_type', orgType)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id && isOpen,
  });

  const runAudit = useCallback(async () => {
    const orgBindings = ORG_BINDINGS[orgType];
    const orgChains = ACTION_CHAINS_REGISTRY[orgType];
    if (!orgBindings) {
      toast.error(language === 'ar' ? 'نوع الجهة غير مدعوم' : 'Unsupported org type');
      return;
    }

    setIsLoading(true);
    setReport('');
    setIsOpen(true);
    setShowHistory(false);

    abortRef.current = new AbortController();

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error(language === 'ar' ? 'يرجى تسجيل الدخول أولاً' : 'Please log in first');
        setIsLoading(false);
        return;
      }

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/audit-bindings`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            orgType,
            bindings: {
              tabs: orgBindings.tabBindings,
              sidebar: orgBindings.sidebarBindings,
              actions: orgBindings.actionBindings || {},
            },
            chains: orgChains,
            tabs,
            sidebarItems,
          }),
          signal: abortRef.current.signal,
        }
      );

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${resp.status}`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setReport(fullText);
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error('Audit error:', e);
        toast.error(e.message || (language === 'ar' ? 'حدث خطأ' : 'An error occurred'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [orgType, tabs, sidebarItems, language]);

  const saveReport = useCallback(async () => {
    if (!report || !organization?.id || !user?.id) return;
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('No session');

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/audit-bindings`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            orgType,
            saveReport: report,
            organizationId: organization.id,
            bindings: { tabs: {} },
          }),
        }
      );

      if (!resp.ok) throw new Error('Save failed');
      toast.success(language === 'ar' ? 'تم حفظ التقرير' : 'Report saved');
      refetchHistory();
    } catch (e: any) {
      toast.error(e.message || (language === 'ar' ? 'فشل الحفظ' : 'Save failed'));
    } finally {
      setIsSaving(false);
    }
  }, [report, organization?.id, user?.id, orgType, language, refetchHistory]);

  const cancel = () => {
    abortRef.current?.abort();
    setIsLoading(false);
  };

  const loadPreviousReport = (content: string) => {
    setReport(content);
    setShowHistory(false);
  };

  const orgLabels: Record<string, { ar: string; en: string }> = {
    transporter: { ar: 'الناقل', en: 'Transporter' },
    generator: { ar: 'المولد', en: 'Generator' },
    recycler: { ar: 'المدوّر', en: 'Recycler' },
    disposal: { ar: 'التخلص النهائي', en: 'Disposal' },
  };

  const orgLabel = orgLabels[orgType]?.[language === 'ar' ? 'ar' : 'en'] || orgType;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={runAudit}
        disabled={isLoading}
        className="bg-muted/30 border-border/50 hover:bg-muted/50 text-[10px] sm:text-sm gap-1.5"
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
        ) : (
          <Brain className="w-3.5 h-3.5 text-primary" />
        )}
        <span className="truncate">
          {language === 'ar' ? 'مراجعة الارتباطات بالذكاء الاصطناعي' : 'AI Binding Audit'}
        </span>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => { if (!isLoading) setIsOpen(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-3xl max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="flex flex-col overflow-hidden border-primary/20 shadow-xl">
                <CardHeader className="shrink-0 flex flex-row items-center gap-3 py-3 px-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <CardTitle className="text-sm font-bold truncate">
                      {language === 'ar'
                        ? `تقرير مراجعة ارتباطات ${orgLabel}`
                        : `${orgLabel} Binding Audit Report`
                      }
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {isLoading && (
                      <Button variant="ghost" size="icon" onClick={cancel} className="h-7 w-7">
                        <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    )}
                    {report && !isLoading && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={saveReport}
                        disabled={isSaving}
                        className="h-7 w-7"
                        title={language === 'ar' ? 'حفظ التقرير' : 'Save Report'}
                      >
                        {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-primary" />}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowHistory(!showHistory)}
                      className={cn('h-7 w-7', showHistory && 'bg-primary/10')}
                      title={language === 'ar' ? 'التقارير السابقة' : 'Previous Reports'}
                    >
                      <History className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={runAudit} disabled={isLoading} className="h-7 w-7">
                      <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} disabled={isLoading} className="h-7 w-7">
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 overflow-hidden p-0">
                  {/* History Panel */}
                  <AnimatePresence>
                    {showHistory && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-b border-border/50 bg-muted/20 overflow-hidden"
                      >
                        <div className="p-3 space-y-1.5 max-h-[200px] overflow-y-auto">
                          <p className="text-xs font-semibold text-muted-foreground px-1">
                            {language === 'ar' ? `التقارير السابقة (${previousReports.length})` : `Previous Reports (${previousReports.length})`}
                          </p>
                          {previousReports.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-4">
                              {language === 'ar' ? 'لا توجد تقارير محفوظة' : 'No saved reports'}
                            </p>
                          ) : (
                            previousReports.map((r: any) => (
                              <button
                                key={r.id}
                                onClick={() => loadPreviousReport(r.report_content)}
                                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-start hover:bg-muted/50 transition-colors"
                              >
                                <History className="w-3 h-3 text-muted-foreground shrink-0" />
                                <span className="text-xs truncate flex-1">
                                  {format(new Date(r.created_at), 'dd MMM yyyy HH:mm', { locale: language === 'ar' ? ar : undefined })}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {(r.audit_metadata as any)?.chains_count || 0} {language === 'ar' ? 'سلسلة' : 'chains'}
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <ScrollArea className="h-[65vh] px-5 py-4">
                    {isLoading && !report && (
                      <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">
                          {language === 'ar' ? 'جارِ تحليل الارتباطات...' : 'Analyzing bindings...'}
                        </p>
                      </div>
                    )}

                    {report && (
                      <div className="prose prose-sm dark:prose-invert max-w-none
                        prose-headings:text-foreground
                        prose-h1:text-lg prose-h1:font-bold prose-h1:border-b prose-h1:pb-2
                        prose-h2:text-base prose-h2:font-semibold prose-h2:mt-6
                        prose-h3:text-sm prose-h3:font-medium
                        prose-p:text-muted-foreground prose-p:text-sm prose-p:leading-relaxed
                        prose-li:text-sm prose-li:text-muted-foreground
                        prose-strong:text-foreground
                        prose-table:text-xs
                        prose-th:bg-muted/50 prose-th:px-3 prose-th:py-2
                        prose-td:px-3 prose-td:py-1.5
                        prose-code:text-primary prose-code:text-xs
                      ">
                        <ReactMarkdown>{report}</ReactMarkdown>
                      </div>
                    )}

                    {isLoading && report && (
                      <div className="flex items-center gap-2 pt-3 text-primary">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span className="text-xs">{language === 'ar' ? 'جارِ التحليل...' : 'Analyzing...'}</span>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default BindingAuditPanel;
