import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Eye, Heart, FileText } from 'lucide-react';
import { useMemo } from 'react';

const PlatformPostsEmbed = () => {
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['platform-posts-embed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_posts' as any)
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(12);
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  if (isLoading) {
    return <div className="grid gap-3">{[1,2,3].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}</div>;
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm">لا توجد منشورات حالياً</p>
      </div>
    );
  }

  const categoryColors: Record<string, string> = {
    'بيئة': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    'تقنية': 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    'قوانين': 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    'نصائح': 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    'شراكات': 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
    'إنجازات': 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
    'تحديثات': 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
    'عام': 'bg-muted text-muted-foreground',
    'بصمة_كربونية': 'bg-green-500/10 text-green-600 dark:text-green-400',
  };

  return (
    <div className="grid gap-3">
      {posts.map((post: any) => (
        <Link key={post.id} to={`/posts/${post.id}`}>
          <Card className="border-border/40 hover:border-primary/30 transition-colors group cursor-pointer">
            <CardContent className="p-3 flex gap-3">
              {post.cover_image_url && (
                <img src={post.cover_image_url} alt="" className="w-20 h-16 sm:w-24 sm:h-18 rounded-lg object-cover flex-shrink-0" loading="lazy" />
              )}
              <div className="flex-1 min-w-0 space-y-1">
                <h3 className="text-xs sm:text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h3>
                {post.excerpt && <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1">{post.excerpt}</p>}
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  {post.category && (
                    <Badge variant="secondary" className={`text-[9px] h-4 px-1.5 ${categoryColors[post.category] || ''}`}>
                      {post.category}
                    </Badge>
                  )}
                  <span className="flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" />{post.views_count || 0}</span>
                  <span className="flex items-center gap-0.5"><Heart className="h-2.5 w-2.5" />{post.likes_count || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
};

export default PlatformPostsEmbed;
