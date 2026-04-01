/**
 * قسم آخر الأخبار/المدونة من قاعدة البيانات
 */
import { memo, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Newspaper, ArrowLeft, Calendar, Eye } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const BlogPreviewSection = memo(() => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const navigate = useNavigate();

  const { data: articles } = useQuery({
    queryKey: ['landing-blog-preview'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, excerpt, cover_image_url, published_at, views_count, category')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(3);
      if (error) return [];
      return data || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  if (!articles?.length) return null;

  const gradients = [
    'from-primary/10 to-emerald-500/5',
    'from-cyan-500/10 to-blue-500/5',
    'from-amber-500/10 to-orange-500/5',
  ];

  return (
    <section ref={ref} className="py-16 sm:py-24 bg-muted/20">
      <div className="container px-4">
        <motion.div
          className="flex items-center justify-between mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
              <Newspaper className="w-3.5 h-3.5" />
              {isAr ? 'المدونة' : 'Blog'}
            </div>
            <h2 className="text-xl sm:text-3xl font-bold text-foreground">
              {isAr ? 'آخر المقالات' : 'Latest Articles'}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/blog')}
            className="gap-1 text-primary"
          >
            {isAr ? 'عرض الكل' : 'View All'}
            <ArrowLeft className="w-3.5 h-3.5" />
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {articles.map((article, i) => (
            <motion.article
              key={article.id}
              className="group rounded-2xl border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              onClick={() => navigate(`/blog/${article.id}`)}
            >
              {/* Cover */}
              <div className={`h-36 sm:h-44 bg-gradient-to-br ${gradients[i % 3]} flex items-center justify-center overflow-hidden`}>
                {article.cover_image_url ? (
                  <img src={article.cover_image_url} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                ) : (
                  <Newspaper className="w-12 h-12 text-primary/30" />
                )}
              </div>

              <div className="p-4">
                {article.category && (
                  <span className="inline-block text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full mb-2">
                    {article.category}
                  </span>
                )}
                <h3 className="font-bold text-foreground text-sm sm:text-base line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                  {article.title}
                </h3>
                {article.excerpt && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{article.excerpt}</p>
                )}
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  {article.published_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(article.published_at), 'dd MMM yyyy', { locale: isAr ? ar : undefined })}
                    </span>
                  )}
                  {article.views_count != null && (
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {article.views_count}
                    </span>
                  )}
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
});

BlogPreviewSection.displayName = 'BlogPreviewSection';
export default BlogPreviewSection;
