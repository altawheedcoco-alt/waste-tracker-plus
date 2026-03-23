import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ReactMarkdown from 'react-markdown';
import { ArrowRight, Calendar, User, Eye, Star, FileText, Share2, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import { usePostLike } from '@/hooks/usePostLikes';
import { cn } from '@/lib/utils';

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  const { liked, likesCount, setLikesCount, toggleLike, loading: likeLoading } = usePostLike(id || '');

  // Sync likes count from post data
  useEffect(() => {
    if (post) setLikesCount(post.likes_count || 0);
  }, [post, setLikesCount]);

  // Track view with IP via Edge Function
  useEffect(() => {
    if (!id) return;
    const visitorId = localStorage.getItem('visitor_id') || (() => {
      const vid = crypto.randomUUID();
      localStorage.setItem('visitor_id', vid);
      return vid;
    })();
    const ua = navigator.userAgent;
    const getBrowser = (u: string) => {
      if (u.includes('Firefox')) return 'Firefox';
      if (u.includes('Edg')) return 'Edge';
      if (u.includes('Chrome')) return 'Chrome';
      if (u.includes('Safari')) return 'Safari';
      return 'Other';
    };
    const getOS = (u: string) => {
      if (u.includes('Windows')) return 'Windows';
      if (u.includes('Mac')) return 'macOS';
      if (u.includes('Android')) return 'Android';
      if (u.includes('iPhone') || u.includes('iPad')) return 'iOS';
      if (u.includes('Linux')) return 'Linux';
      return 'Other';
    };
    const w = window.innerWidth;
    const deviceType = w < 768 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop';

    supabase.functions.invoke('track-post-view', {
      body: {
        post_id: id,
        visitor_id: visitorId,
        user_agent: ua,
        device_type: deviceType,
        browser: getBrowser(ua),
        os: getOS(ua),
        referrer: document.referrer || null,
      },
    }).then(() => {
      queryClient.invalidateQueries({ queryKey: ['platform-post', id] });
    });
  }, [id, queryClient]);

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

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', window.location.href);

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

  const handleLike = async () => {
    await toggleLike();
    queryClient.invalidateQueries({ queryKey: ['platform-posts-public'] });
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      <div className="pt-20 pb-12">
        <div className="container px-4 max-w-3xl mx-auto">
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
              {post.cover_image_url && (
                <div className="rounded-2xl overflow-hidden mb-8 shadow-lg">
                  <img src={post.cover_image_url} alt={post.title} className="w-full h-56 sm:h-72 object-cover" />
                </div>
              )}

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

              <h1 className="text-2xl sm:text-3xl font-black mb-4 leading-tight">{post.title}</h1>

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
                <div className="flex items-center gap-2 ms-auto">
                  {/* Like Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLike}
                    disabled={likeLoading}
                    className={cn(
                      'gap-1.5 rounded-full transition-all',
                      liked ? 'text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20' : 'text-muted-foreground hover:text-red-500'
                    )}
                  >
                    <Heart className={cn('w-4 h-4 transition-all', liked && 'fill-current scale-110')} />
                    <span className="text-xs font-bold">{likesCount}</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1.5" onClick={handleShare}>
                    <Share2 className="w-4 h-4" />
                    مشاركة
                  </Button>
                </div>
              </div>

              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {post.tags.map((tag: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">#{tag}</Badge>
                  ))}
                </div>
              )}

              {post.excerpt && (
                <p className="text-lg font-medium text-muted-foreground mb-6 leading-relaxed border-r-4 border-primary pr-4">
                  {post.excerpt}
                </p>
              )}

              <div className="prose prose-lg prose-stone dark:prose-invert max-w-none prose-headings:font-bold prose-p:leading-relaxed">
                <ReactMarkdown>{post.content}</ReactMarkdown>
              </div>

              {/* Bottom Like Bar */}
              <div className="mt-10 pt-6 border-t border-border flex items-center justify-center gap-4">
                <Button
                  variant={liked ? "default" : "outline"}
                  size="lg"
                  onClick={handleLike}
                  disabled={likeLoading}
                  className={cn(
                    'gap-2 rounded-full px-8 transition-all',
                    liked && 'bg-red-500 hover:bg-red-600 text-white border-red-500'
                  )}
                >
                  <Heart className={cn('w-5 h-5', liked && 'fill-current')} />
                  {liked ? 'أعجبني' : 'إعجاب'}
                  <span className="font-bold">({likesCount})</span>
                </Button>
                <Button variant="outline" size="lg" className="gap-2 rounded-full px-8" onClick={handleShare}>
                  <Share2 className="w-5 h-5" />
                  مشاركة
                </Button>
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
