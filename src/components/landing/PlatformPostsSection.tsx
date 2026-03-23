import { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, ArrowLeft, Calendar, User, Star } from 'lucide-react';

const PlatformPostsSection = memo(() => {
  const { data: posts = [] } = useQuery({
    queryKey: ['platform-posts-homepage'],
    queryFn: async () => {
      const { data } = await supabase
        .from('platform_posts' as any)
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(3);
      return (data || []) as any[];
    },
    staleTime: 5 * 60 * 1000,
  });

  if (posts.length === 0) return null;

  return (
    <section className="py-16 bg-gradient-to-b from-muted/30 to-transparent" dir="rtl">
      <div className="container px-4">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 mb-4">
            <FileText className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-primary">منشورات المنصة</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black">أحدث المنشورات</h2>
          <p className="text-muted-foreground mt-2">تابع آخر الأخبار والمقالات من فريق المنصة</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {posts.map((post: any) => (
            <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
              {post.cover_image_url && (
                <div className="h-40 overflow-hidden">
                  <img
                    src={post.cover_image_url}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              )}
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-[10px]">{post.category}</Badge>
                  {post.is_featured && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                </div>
                <h3 className="font-bold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                  {post.excerpt || post.content?.slice(0, 100)}
                </p>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
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
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button asChild variant="outline" className="gap-2">
            <Link to="/posts">
              عرض جميع المنشورات
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
});

PlatformPostsSection.displayName = 'PlatformPostsSection';
export default PlatformPostsSection;
