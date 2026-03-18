import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Newspaper, Building2, Users, Rss, Image as ImageIcon, Video, Play } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useFollowFeed } from '@/hooks/useFollow';
import PostInteractions from '@/components/organization/PostInteractions';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const orgTypeLabels: Record<string, string> = {
  generator: 'مولّد', transporter: 'ناقل', recycler: 'مدوّر', disposal: 'تخلص',
  consultant: 'استشاري', consulting_office: 'مكتب استشاري', transport_office: 'مكتب نقل',
};

export default function SocialFeedPage() {
  const navigate = useNavigate();
  const { data: feedPosts = [], isLoading } = useFollowFeed();
  const [filter, setFilter] = useState<'all' | 'member' | 'org'>('all');

  const filteredPosts = filter === 'all'
    ? feedPosts
    : feedPosts.filter((p: any) => p._source === filter);

  const renderPostMedia = (post: any) => {
    const urls = post.media_urls;
    if (!urls || urls.length === 0) return null;

    if (post.post_type === 'video' || (urls.length === 1 && (urls[0]?.includes('.mp4') || urls[0]?.includes('.webm')))) {
      return (
        <div className="mt-3 rounded-lg overflow-hidden bg-black">
          <video src={urls[0]} controls className="w-full max-h-[500px] object-contain" />
        </div>
      );
    }

    if (urls.length > 1) {
      return (
        <div className={cn(
          "mt-3 grid gap-1.5 rounded-lg overflow-hidden",
          urls.length === 2 && "grid-cols-2",
          urls.length === 3 && "grid-cols-3",
          urls.length >= 4 && "grid-cols-2",
        )}>
          {urls.slice(0, 4).map((url: string, i: number) => (
            <div key={i} className="relative overflow-hidden cursor-pointer" onClick={() => window.open(url, '_blank')}>
              <img src={url} alt="" className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300" />
              {i === 3 && urls.length > 4 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">+{urls.length - 4}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="mt-3 rounded-lg overflow-hidden cursor-pointer" onClick={() => window.open(urls[0], '_blank')}>
        <img src={urls[0]} alt="" className="w-full max-h-[500px] object-cover hover:scale-[1.02] transition-transform duration-300" />
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 max-w-3xl mx-auto" dir="rtl">
        <BackButton />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rss className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">آخر الأخبار</h1>
          </div>
          <Badge variant="secondary" className="text-xs">{feedPosts.length} منشور</Badge>
        </div>

        {/* Filter tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="all" className="gap-1.5">
              <Newspaper className="w-4 h-4" /> الكل
            </TabsTrigger>
            <TabsTrigger value="member" className="gap-1.5">
              <Users className="w-4 h-4" /> الأعضاء
            </TabsTrigger>
            <TabsTrigger value="org" className="gap-1.5">
              <Building2 className="w-4 h-4" /> الجهات
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Feed */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Rss className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد منشورات في الخلاصة</h3>
              <p className="text-sm text-muted-foreground mb-4">
                تابع أعضاء أو جهات لتظهر منشوراتهم هنا
              </p>
              <Button variant="outline" onClick={() => navigate('/dashboard/partners')}>
                استعراض الجهات المرتبطة
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post: any) => {
              const isMember = post._source === 'member';
              const authorName = isMember
                ? post.author?.full_name || 'عضو'
                : post.organization?.name || 'جهة';
              const authorAvatar = isMember
                ? post.author?.avatar_url
                : post.organization?.logo_url;
              const authorInitials = authorName.split(' ').map((n: string) => n[0]).join('').slice(0, 2);
              const subtitle = isMember
                ? post.author?.position || ''
                : orgTypeLabels[post.organization?.organization_type] || '';

              return (
                <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar
                          className="w-10 h-10 shrink-0 cursor-pointer"
                          onClick={() => {
                            if (isMember && post.author?.id) navigate(`/dashboard/member/${post.author.id}`);
                            else if (!isMember && post.organization?.id) navigate(`/dashboard/org/${post.organization.id}`);
                          }}
                        >
                          <AvatarImage src={authorAvatar || undefined} />
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">{authorInitials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="font-semibold text-sm cursor-pointer hover:underline"
                              onClick={() => {
                                if (isMember && post.author?.id) navigate(`/dashboard/member/${post.author.id}`);
                                else if (!isMember && post.organization?.id) navigate(`/dashboard/org/${post.organization.id}`);
                              }}
                            >
                              {authorName}
                            </span>
                            <Badge variant={isMember ? 'outline' : 'secondary'} className="text-[10px] h-4">
                              {isMember ? <Users className="w-2.5 h-2.5 ml-0.5" /> : <Building2 className="w-2.5 h-2.5 ml-0.5" />}
                              {isMember ? 'عضو' : 'جهة'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {subtitle && <><span>{subtitle}</span><span>•</span></>}
                            <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ar })}</span>
                          </div>

                          {post.content && (
                            <p className="mt-2 whitespace-pre-wrap text-sm">{post.content}</p>
                          )}

                          {renderPostMedia(post)}

                          <div className="mt-3">
                            <PostInteractions postId={post.id} likesCount={post.likes_count || 0} />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
