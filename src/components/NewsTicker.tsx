import { memo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Newspaper, ExternalLink, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const NewsTicker = memo(() => {
  const { t } = useLanguage();

  const { data: newsItems = [] } = useQuery({
    queryKey: ['platform-news-ticker'],
    queryFn: async () => {
      const { data } = await supabase
        .from('platform_news' as any)
        .select('title, badge')
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
        .limit(10);
      return (data || []).map((item: any) => {
        const emoji = item.badge?.includes('🔥') ? '🔥' : item.badge?.includes('جديد') || item.badge?.includes('New') ? '🆕' : item.badge?.includes('محدّث') || item.badge?.includes('Updated') ? '✅' : '📢';
        return `${emoji} ${item.title}`;
      });
    },
    staleTime: 5 * 60 * 1000,
  });

  const platformPhrases = Array.from({ length: 16 }, (_, i) => 
    t(`newsTicker.phrases.p${i + 1}`)
  );

  const displayItems = newsItems.length > 0 
    ? [...newsItems, ...platformPhrases]
    : platformPhrases;
  const tickerItems = [...displayItems, ...displayItems, ...displayItems];

  // New header heights: version bar (28px) + utility bar (32px desktop) + main nav (52px mobile / 60px desktop)
  // Mobile: 28 + 52 = 80px → top-[80px]
  // Desktop: 28 + 32 + 60 = 120px → sm:top-[120px]

  return (
    <div id="ticker">
      {/* Mobile: version(28) + nav(52) = 80px */}
      <div className="fixed top-[80px] left-0 right-0 w-full overflow-hidden z-40 h-[34px] sm:hidden" dir="rtl">
        <div className="absolute inset-0 bg-background/60 backdrop-blur-xl border-b border-border/30" />
        
        <div className="relative h-full flex items-center">
          <Link
            to="/news"
            className="flex items-center gap-1 px-2.5 shrink-0 z-10 h-full bg-primary/10 border-l border-border/20"
          >
            <Sparkles className="w-3 h-3 text-primary animate-pulse" />
            <span className="text-[10px] font-bold text-primary whitespace-nowrap">{t('newsTicker.latestNews')}</span>
          </Link>

          <div className="overflow-hidden flex-1 h-full flex items-center">
            <div className="whitespace-nowrap flex items-center gap-0.5 text-[11px] font-medium text-foreground/80 animate-ticker">
              {tickerItems.map((item, i) => (
                <span key={i} className="inline-flex items-center">
                  <span className="mx-2 text-primary/50 text-[8px]">✦</span>
                  <span>{item}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: version(28) + utility(32) + nav(60) = 120px */}
      <div className="fixed top-[120px] left-0 right-0 w-full overflow-hidden z-40 h-[38px] hidden sm:block" dir="rtl">
        <div className="absolute inset-0 bg-background/50 backdrop-blur-xl border-b border-border/20" />

        <div className="relative flex items-center h-full">
          <div className="flex items-center gap-2 px-4 h-full bg-primary/10 shrink-0 z-10 border-l border-border/20">
            <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
            <Newspaper className="w-4 h-4 text-primary/70" />
            <span className="text-xs font-black whitespace-nowrap text-primary tracking-wide">{t('newsTicker.latestNews')}</span>
          </div>

          <div className="overflow-hidden flex-1 h-full flex items-center">
            <div className="whitespace-nowrap flex items-center gap-1 text-sm font-medium text-foreground/80 animate-ticker">
              {tickerItems.map((item, i) => (
                <span key={i} className="inline-flex items-center">
                  <span className="mx-3 text-primary/40 text-xs">✦</span>
                  <span>{item}</span>
                </span>
              ))}
            </div>
          </div>

          <Link
            to="/news"
            className="flex items-center gap-1.5 px-4 h-full shrink-0 bg-primary/5 hover:bg-primary/10 transition-all duration-300 z-10 border-r border-border/20 group"
          >
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">{t('newsTicker.allNews')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
});

NewsTicker.displayName = 'NewsTicker';

export default NewsTicker;
