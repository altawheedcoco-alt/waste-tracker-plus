import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ReactMarkdown from 'react-markdown';
import { ArrowRight, Calendar, User, Eye, Star, FileText, Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: post, isLoading } = useQuery({
    queryKey: ['platform-post', id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('platform_posts')
        .select('*')
        .eq('id', id)
        .eq('is_published', true)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Increment views
  useEffect(() => {
    if (!id) return;
    (supabase as any)
      .from('platform_posts')
      .update({ views_count: (post?.views_count || 0) + 1 })
      .eq('id', id)
      .then(() => {});
  }, [id]);

  // SEO Meta Tags + JSON-LD
  useEffect(() => {
    if (!post) return;
    const title = `${post.title} | iRecycle`;
    document.title = title;

    const setMeta = (name: string, content: string | null) => {
      if (!content) return;
      let el = document.querySelector(`meta[name="${name}"]`) || document.querySelector(`meta[property="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        if (name.startsWith('og:') || name.startsWith('article:')) {
          el.setAttribute('property', name);
        } else {
          el.setAttribute('name', name);
        }
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    const desc = post.excerpt || post.content?.slice(0, 160);
    setMeta('description', desc);
    setMeta('og:title', post.title);
    setMeta('og:description', desc);
    setMeta('og:type', 'article');
    setMeta('og:url', window.location.href);
    if (post.cover_image_url) setMeta('og:image', post.cover_image_url);
    setMeta('article:published_time', post.published_at || post.created_at);
    setMeta('article:author', post.author_name);
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', post.title);
    setMeta('twitter:description', desc);
    if (post.tags && post.tags.length > 0) {
      setMeta('keywords', post.tags.join(', '));
    }

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', window.location.href);

    // JSON-LD
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: desc,
      author: { '@type': 'Organization', name: post.author_name || 'iRecycle' },
      datePublished: post.published_at || post.created_at,
      publisher: {
        '@type': 'Organization',
        name: 'iRecycle',
        url: 'https://irecycle21.lovable.app',
      },
      mainEntityOfPage: window.location.href,
      ...(post.cover_image_url && { image: post.cover_image_url }),
    };
    let script = document.querySelector('#post-jsonld') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = 'post-jsonld';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(jsonLd);

    return () => {
      document.title = 'iRecycle';
      const el = document.querySelector('#post-jsonld');
      if (el) el.remove();
    };
  }, [post]);

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: post?.title, url: window.location.href });
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      <div className="pt-20 pb-12">
        <div className="container px-4 max-w-3xl mx-auto">
          {/* Back */}
          <Button variant="ghost" size="sm" className="mb-6 gap-2" onClick={() => navigate('/posts')}>
            <ArrowRight className="w-4 h-4" />
            العودة للمنشورات
          </Button>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-64 w-full rounded-2xl" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-96 w-full" />
            </div>
          ) : !post ? (
            <div className="text-center py-20 text-muted-foreground">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">المنشور غير موجود</p>
            </div>
          ) : (
            <article>
              {/* Cover */}
              {post.cover_image_url && (
                <div className="rounded-2xl overflow-hidden mb-8 shadow-lg">
                  <img
                    src={post.cover_image_url}
                    alt={post.title}
                    className="w-full h-56 sm:h-72 object-cover"
                  />
                </div>
              )}

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge variant="secondary">{post.category}</Badge>
                {post.is_featured && (
                  <Badge className="bg-amber-500/10 text-amber-600 gap-1">
                    <Star className="w-3 h-3" />
                    مميز
                  </Badge>
                )}
                {post.badge && <Badge variant="outline">{post.badge}</Badge>}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-black mb-4 leading-tight">{post.title}</h1>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8 pb-6 border-b border-border">
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  {post.author_name}
                </span>
                {post.published_at && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {formatDate(post.published_at)}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  {post.views_count || 0} مشاهدة
                </span>
                <Button variant="ghost" size="sm" className="gap-1.5 ms-auto" onClick={handleShare}>
                  <Share2 className="w-4 h-4" />
                  مشاركة
                </Button>
              </div>

              {/* Excerpt */}
              {post.excerpt && (
                <p className="text-lg font-medium text-muted-foreground mb-6 leading-relaxed border-r-4 border-primary pr-4">
                  {post.excerpt}
                </p>
              )}

              {/* Content */}
              <div className="prose prose-lg prose-stone dark:prose-invert max-w-none prose-headings:font-bold prose-p:leading-relaxed">
                <ReactMarkdown>{post.content}</ReactMarkdown>
              </div>
            </article>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PostDetail;
