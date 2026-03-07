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
  // Triple for seamless infinite scroll
  const desktopItems = [...displayItems, ...displayItems, ...displayItems];

  return (
    <>
      {/* Mobile */}
      <div className="fixed top-16 left-0 right-0 w-full overflow-hidden z-40 h-[42px] sm:hidden" dir="rtl">
        <div className="absolute inset-0 bg-gradient-to-l from-[hsl(160,64%,20%)] via-[hsl(160,56%,25%)] to-[hsl(170,50%,22%)]" />
        <div className="relative h-full flex items-center justify-between px-3">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <Newspaper className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="text-xs font-semibold text-white/95 truncate">{displayItems[0]}</span>
          </div>
          <Link to="/news" className="ml-2 shrink-0 text-[11px] font-semibold text-amber-300 hover:text-white transition-colors">
            {t('newsTicker.more')}
          </Link>
        </div>
      </div>

      {/* Desktop */}
      <div className="fixed top-16 sm:top-20 left-0 right-0 w-full overflow-hidden z-40 h-[42px] hidden sm:block" dir="rtl">
        <div className="absolute inset-0 bg-gradient-to-l from-[hsl(160,64%,20%)] via-[hsl(160,56%,25%)] to-[hsl(170,50%,22%)]" />

        <div className="relative flex items-center">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 shrink-0 z-10 shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-amber-950 animate-pulse" />
            <Newspaper className="w-4 h-4 text-amber-950" />
            <span className="text-xs font-black whitespace-nowrap text-amber-950 tracking-wide">{t('newsTicker.latestNews')}</span>
          </div>

          <div className="w-0 h-0 border-t-[18px] border-b-[18px] border-r-[12px] border-t-transparent border-b-transparent border-r-amber-500 shrink-0 z-10" />

          <div className="overflow-hidden flex-1 py-2.5">
            <div className="whitespace-nowrap flex items-center gap-1 text-sm font-medium text-white/95 animate-ticker">
              {desktopItems.map((item, i) => (
                <span key={i} className="inline-flex items-center">
                  <span className="mx-3 text-amber-400 text-xs">✦</span>
                  <span className="drop-shadow-sm">{item}</span>
                </span>
              ))}
            </div>
          </div>

          <Link
            to="/news"
            className="flex items-center gap-1.5 px-4 py-2.5 shrink-0 bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-300 z-10 border-r border-white/10 group"
          >
            <ExternalLink className="w-3.5 h-3.5 text-white/80 group-hover:text-amber-400 transition-colors" />
            <span className="text-xs font-semibold text-white/80 group-hover:text-white transition-colors">{t('newsTicker.allNews')}</span>
          </Link>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-l from-amber-400 via-emerald-400 to-amber-400 opacity-60" />
      </div>
    </>
  );
});

NewsTicker.displayName = 'NewsTicker';

export default NewsTicker;