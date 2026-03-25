import { memo } from 'react';
import { usePageTitle } from "@/hooks/usePageTitle";
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  Newspaper, ArrowLeft, Sparkles, Calendar,
  Users, ShieldCheck, Megaphone, Award, 
  Recycle, Truck, BarChart3, FileCheck, Globe, BookOpen, Bell,
  Star, Zap
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import PageNavBar from '@/components/ui/page-nav-bar';

const ICON_MAP: Record<string, any> = {
  Newspaper, Users, ShieldCheck, Megaphone, Award, Recycle, Truck,
  BarChart3, FileCheck, Globe, BookOpen, Bell, Sparkles, Star, Zap,
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
};

const News = memo(() => {
  const navigate = useNavigate();
  usePageTitle('الأخبار والتحديثات');

  const { data: newsItems = [], isLoading } = useQuery({
    queryKey: ['platform-news'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_news' as any)
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000,
  });

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <Header />
      
      <main className="pt-32 sm:pt-36 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <PageNavBar className="mb-6" />
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-5 py-2 rounded-full text-sm font-bold mb-4 border border-primary/20">
              <Sparkles className="h-4 w-4" />
              آخر الأخبار والتحديثات
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3">
              <Newspaper className="inline-block w-8 h-8 ml-2 text-primary" />
              أخبار المنصة
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              تابع أحدث المميزات والخدمات والتحديثات التي نضيفها باستمرار لتطوير تجربتك
            </p>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
            </div>
          )}

          {/* News Grid */}
          <div className="space-y-5">
            {newsItems.map((item: any) => {
              const IconComp = ICON_MAP[item.icon_name] || Newspaper;
              return (
                <div
                  key={item.id}
                  className="group relative bg-card border border-border rounded-2xl p-6 hover:shadow-xl hover:border-primary/30 transition-all duration-300 cursor-pointer overflow-hidden"
                  onClick={() => navigate(item.link || '/')}
                >
                  <div className={`absolute -top-20 -left-20 w-48 h-48 bg-gradient-to-br ${item.color_gradient} opacity-0 group-hover:opacity-10 rounded-full blur-3xl transition-opacity duration-500`} />
                  
                  <div className="relative z-10 flex flex-col sm:flex-row gap-4 items-start">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.color_gradient} flex items-center justify-center shadow-lg shrink-0`}>
                      <IconComp className="w-7 h-7 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full bg-gradient-to-r ${item.color_gradient} text-white shadow-sm`}>
                          {item.badge}
                        </span>
                        <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {item.category}
                        </span>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(item.published_at || item.created_at)}
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                        {item.title}
                      </h2>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary shrink-0 self-center group-hover:gap-2 transition-all">
                      التفاصيل
                      <ArrowLeft className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {!isLoading && newsItems.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Newspaper className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">لا توجد أخبار حالياً</p>
            </div>
          )}

          {/* Back button */}
          <div className="text-center mt-10">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-opacity"
            >
              العودة للرئيسية
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
});

News.displayName = 'News';

export default News;
