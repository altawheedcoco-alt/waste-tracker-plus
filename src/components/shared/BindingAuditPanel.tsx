import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import { Brain, Loader2, RefreshCw, X, Sparkles, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

// Import all binding & chain data
import { TRANSPORTER_TAB_BINDINGS, TRANSPORTER_SIDEBAR_BINDINGS, TRANSPORTER_ACTION_BINDINGS } from '@/config/transporter/transporterBindings';
import { GENERATOR_TAB_BINDINGS, GENERATOR_SIDEBAR_BINDINGS } from '@/config/generator/generatorBindings';
import { RECYCLER_TAB_BINDINGS, RECYCLER_SIDEBAR_BINDINGS } from '@/config/recycler/recyclerBindings';
import { DISPOSAL_TAB_BINDINGS, DISPOSAL_SIDEBAR_BINDINGS } from '@/config/disposal/disposalBindings';
import { TRANSPORTER_CHAINS } from '@/config/transporter/transporterChains';
import { GENERATOR_CHAINS } from '@/config/generator/generatorChains';
import { RECYCLER_CHAINS } from '@/config/recycler/recyclerChains';
import { DISPOSAL_CHAINS } from '@/config/disposal/disposalChains';

interface BindingAuditPanelProps {
  orgType: string;
  tabs?: Array<{ value: string; labelKey?: string }>;
  sidebarItems?: Array<{ key: string; labelAr?: string; labelEn?: string }>;
  className?: string;
}

const ORG_DATA: Record<string, {
  tabBindings: Record<string, any>;
  sidebarBindings: Record<string, any>;
  actionBindings?: Record<string, any>;
  chains: any;
}> = {
  transporter: {
    tabBindings: TRANSPORTER_TAB_BINDINGS,
    sidebarBindings: TRANSPORTER_SIDEBAR_BINDINGS,
    actionBindings: TRANSPORTER_ACTION_BINDINGS,
    chains: TRANSPORTER_CHAINS,
  },
  generator: {
    tabBindings: GENERATOR_TAB_BINDINGS,
    sidebarBindings: GENERATOR_SIDEBAR_BINDINGS,
    chains: GENERATOR_CHAINS,
  },
  recycler: {
    tabBindings: RECYCLER_TAB_BINDINGS,
    sidebarBindings: RECYCLER_SIDEBAR_BINDINGS,
    chains: RECYCLER_CHAINS,
  },
  disposal: {
    tabBindings: DISPOSAL_TAB_BINDINGS,
    sidebarBindings: DISPOSAL_SIDEBAR_BINDINGS,
    chains: DISPOSAL_CHAINS,
  },
};

const BindingAuditPanel = ({ orgType, tabs = [], sidebarItems = [], className }: BindingAuditPanelProps) => {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const runAudit = useCallback(async () => {
    const orgData = ORG_DATA[orgType];
    if (!orgData) {
      toast.error(language === 'ar' ? 'نوع الجهة غير مدعوم' : 'Unsupported org type');
      return;
    }

    setIsLoading(true);
    setReport('');
    setIsOpen(true);

    abortRef.current = new AbortController();

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/audit-bindings`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            orgType,
            bindings: {
              tabs: orgData.tabBindings,
              sidebar: orgData.sidebarBindings,
              actions: orgData.actionBindings || {},
            },
            chains: orgData.chains,
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

  const cancel = () => {
    abortRef.current?.abort();
    setIsLoading(false);
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
      {/* Trigger Button */}
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

      {/* Report Panel */}
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
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isLoading && (
                      <Button variant="ghost" size="icon" onClick={cancel} className="h-7 w-7">
                        <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={runAudit}
                      disabled={isLoading}
                      className="h-7 w-7"
                    >
                      <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsOpen(false)}
                      disabled={isLoading}
                      className="h-7 w-7"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 overflow-hidden p-0">
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
