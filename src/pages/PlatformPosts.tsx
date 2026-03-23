import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Eye, Star, FileText } from 'lucide-react';
import { useEffect } from 'react';

const PlatformPosts = () => {
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['platform-posts-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_posts' as any)
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  // SEO
  useEffect(() => {
    document.title = 'منشورات المنصة | iRecycle';
    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) || document.querySelector(`meta[property="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        name.startsWith('og:') ? el.setAttribute('property', name) : el.setAttribute('name', name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };
    setMeta('description', 'تابع آخر المقالات والإعلانات والتحديثات الرسمية من منصة iRecycle لإدارة المخلفات وإعادة التدوير');
    setMeta('og:title', 'منشورات المنصة | iRecycle');
    setMeta('og:description', 'أحدث المنشورات والمقالات من فريق منصة iRecycle');
    setMeta('og:type', 'website');
    return () => { document.title = 'iRecycle'; };
  }, []);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      <div className="pt-20 pb-12">
        {/* Hero */}
        <div className="bg-gradient-to-b from-primary/5 to-transparent py-12 mb-8">
          <div className="container px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 mb-4">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-primary">منشورات المنصة</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black mb-3">أحدث المنشورات والمقالات</h1>
            <p className="text-muted-foreground max-w-xl mx-auto">تابع آخر الأخبار والمقالات والتحديثات من فريق المنصة</p>
          </div>
        </div>

        <div className="container px-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-72 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">لا توجد منشورات حالياً</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post: any) => (
                <Link key={post.id} to={`/posts/${post.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group h-full">
                    {post.cover_image_url && (
                      <div className="h-44 overflow-hidden">
                        <img
                          src={post.cover_image_url}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="secondary" className="text-xs">{post.category}</Badge>
                        {post.is_featured && (
                          <Badge className="bg-amber-500/10 text-amber-600 text-xs gap-1">
                            <Star className="w-3 h-3" />
                            مميز
                          </Badge>
                        )}
                        {post.badge && <Badge variant="outline" className="text-xs">{post.badge}</Badge>}
                      </div>
                      <h2 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </h2>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {post.excerpt || post.content?.slice(0, 120)}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {post.author_name}
                          </span>
                          {post.published_at && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(post.published_at).toLocaleDateString('ar-EG')}
                            </span>
                          )}
                        </div>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {post.views_count || 0}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PlatformPosts;
