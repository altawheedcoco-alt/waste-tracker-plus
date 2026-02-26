import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ReactMarkdown from 'react-markdown';
import { ArrowRight, Calendar, Clock, User, Tag, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

const TEMPLATE_CLASSES: Record<string, { wrapper: string; prose: string }> = {
  standard: {
    wrapper: 'max-w-3xl mx-auto',
    prose: 'prose prose-lg prose-stone dark:prose-invert max-w-none',
  },
  detailed: {
    wrapper: 'max-w-4xl mx-auto',
    prose: 'prose prose-lg prose-stone dark:prose-invert max-w-none prose-headings:border-b prose-headings:pb-2 prose-headings:border-border',
  },
  modern: {
    wrapper: 'max-w-3xl mx-auto',
    prose: 'prose prose-lg prose-stone dark:prose-invert max-w-none prose-headings:text-primary',
  },
  magazine: {
    wrapper: 'max-w-4xl mx-auto',
    prose: 'prose prose-xl prose-stone dark:prose-invert max-w-none prose-p:first-letter:text-4xl prose-p:first-letter:font-bold prose-p:first-letter:text-primary prose-p:first-letter:float-right prose-p:first-letter:ml-2',
  },
  minimal: {
    wrapper: 'max-w-2xl mx-auto',
    prose: 'prose prose-base prose-stone dark:prose-invert max-w-none',
  },
};

const BlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const { data: post, isLoading } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts' as any)
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-16 px-4 max-w-3xl mx-auto">
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </main>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-16 px-4 text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
          <h1 className="text-2xl font-bold mb-2">المقال غير موجود</h1>
          <button onClick={() => navigate('/blog')} className="text-primary hover:underline mt-4">العودة للمدونة</button>
        </main>
      </div>
    );
  }

  const style = TEMPLATE_CLASSES[post.template_style] || TEMPLATE_CLASSES.standard;
  const title = isAr ? post.title : (post.title_en || post.title);
  const content = isAr ? post.content : (post.content_en || post.content);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      <main className="pt-32 pb-16 px-4">
        <div className={style.wrapper}>
          {/* Back */}
          <button onClick={() => navigate('/blog')} className="flex items-center gap-1 text-sm text-primary hover:underline mb-6">
            <ArrowRight className="w-4 h-4" />
            العودة للمدونة
          </button>

          {/* Cover */}
          <div className={`w-full h-48 sm:h-64 rounded-2xl bg-gradient-to-br ${post.cover_gradient} flex items-center justify-center mb-8 shadow-lg`}>
            <BookOpen className="w-16 h-16 text-white/80" />
          </div>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Badge className={`bg-gradient-to-r ${post.cover_gradient} text-white border-0`}>
              {isAr ? post.category : (post.category_en || post.category)}
            </Badge>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(post.published_at || post.created_at)}
            </span>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {post.reading_time_minutes} دقائق قراءة
            </span>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              {post.author_name}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-6 leading-tight">
            {title}
          </h1>

          {/* Tags */}
          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {post.tags.map((tag: string) => (
                <Badge key={tag} variant="outline" className="text-xs gap-1">
                  <Tag className="w-3 h-3" />{tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Content */}
          <article className={style.prose}>
            <ReactMarkdown>{content}</ReactMarkdown>
          </article>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-border text-center">
            <button
              onClick={() => navigate('/blog')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-opacity"
            >
              المزيد من المقالات
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BlogPost;
