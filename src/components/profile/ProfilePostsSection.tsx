import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { getTabChannelName } from '@/lib/tabSession';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Plus,
  MessageSquare,
  Image as ImageIcon,
  Video,
  Link as LinkIcon,
  MoreVertical,
  Trash2,
  Pin,
  PinOff,
  Eye,
  Loader2,
  FileText,
  ExternalLink,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import CreateProfilePostDialog from './CreateProfilePostDialog';

interface ProfilePost {
  id: string;
  user_id: string;
  organization_id: string | null;
  content_type: 'text' | 'image' | 'video' | 'link';
  content: string | null;
  media_url: string | null;
  title: string | null;
  is_pinned: boolean;
  views_count: number;
  created_at: string;
  user_profile?: {
    full_name: string;
    avatar_url: string | null;
  } | null;
}

interface ProfilePostsSectionProps {
  userId?: string;
  isOwnProfile?: boolean;
  className?: string;
}

export default function ProfilePostsSection({
  userId,
  isOwnProfile = false,
  className,
}: ProfilePostsSectionProps) {
  const { user, profile, organization } = useAuth();
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const targetUserId = userId || user?.id;

  useEffect(() => {
    if (targetUserId) {
      fetchPosts();
      subscribeToRealtime();
    }
  }, [targetUserId]);

  const fetchPosts = async () => {
    if (!targetUserId) return;

    try {
      // First get posts
      const { data: postsData, error: postsError } = await supabase
        .from('profile_posts')
        .select('*')
        .eq('user_id', targetUserId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Then get user profile separately
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', targetUserId)
        .single();

      const postsWithProfile = (postsData || []).map(post => ({
        ...post,
        content_type: post.content_type as 'text' | 'image' | 'video' | 'link',
        user_profile: profileData,
      }));

      setPosts(postsWithProfile);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToRealtime = () => {
    const channel = supabase
      .channel(getTabChannelName('profile-posts-changes'))
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profile_posts',
          filter: `user_id=eq.${targetUserId}`,
        },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const post = posts.find(p => p.id === postId);
      
      // Delete media from storage if exists
      if (post?.media_url) {
        const path = post.media_url.split('/profile-media/')[1];
        if (path) {
          await supabase.storage.from('profile-media').remove([path]);
        }
      }

      const { error } = await supabase
        .from('profile_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      toast.success('تم حذف المنشور');
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('فشل في حذف المنشور');
    }
  };

  const handleTogglePin = async (postId: string, currentPinned: boolean) => {
    try {
      const { error } = await supabase
        .from('profile_posts')
        .update({ is_pinned: !currentPinned })
        .eq('id', postId);

      if (error) throw error;
      toast.success(currentPinned ? 'تم إلغاء التثبيت' : 'تم التثبيت');
      fetchPosts();
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast.error('فشل في تغيير حالة التثبيت');
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <MessageSquare className="h-4 w-4" />;
      case 'image':
        return <ImageIcon className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'link':
        return <LinkIcon className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getContentTypeBadge = (type: string) => {
    const config = {
      text: { label: 'نص', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
      image: { label: 'صورة', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
      video: { label: 'فيديو', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
      link: { label: 'رابط', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    };
    const { label, color } = config[type as keyof typeof config] || config.text;
    return (
      <Badge variant="secondary" className={cn('gap-1', color)}>
        {getContentTypeIcon(type)}
        {label}
      </Badge>
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return date.toLocaleDateString('en-US');
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          المنشورات
          {posts.length > 0 && (
            <Badge variant="secondary" className="mr-2">
              {posts.length}
            </Badge>
          )}
        </CardTitle>
        {isOwnProfile && (
          <Button size="sm" onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            منشور جديد
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">لا توجد منشورات</p>
            {isOwnProfile && (
              <p className="text-sm mt-1">ابدأ بإضافة منشور جديد ليراه زملاؤك</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className={cn(
                  'p-4 rounded-lg border bg-card transition-colors',
                  post.is_pinned && 'border-primary/50 bg-primary/5'
                )}
              >
                {/* Post Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.user_profile?.avatar_url || ''} />
                      <AvatarFallback>
                        {post.user_profile?.full_name?.charAt(0) || 'م'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{post.user_profile?.full_name || 'مستخدم'}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatDate(post.created_at)}</span>
                        {post.is_pinned && (
                          <Badge variant="outline" className="gap-1 text-xs py-0">
                            <Pin className="h-3 w-3" />
                            مثبت
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getContentTypeBadge(post.content_type)}
                    
                    {isOwnProfile && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleTogglePin(post.id, post.is_pinned)}
                          >
                            {post.is_pinned ? (
                              <>
                                <PinOff className="h-4 w-4 ml-2" />
                                إلغاء التثبيت
                              </>
                            ) : (
                              <>
                                <Pin className="h-4 w-4 ml-2" />
                                تثبيت
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeletePost(post.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 ml-2" />
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>

                {/* Post Title */}
                {post.title && (
                  <h4 className="font-semibold mb-2">{post.title}</h4>
                )}

                {/* Post Content */}
                {post.content_type === 'text' && post.content && (
                  <p className="text-sm whitespace-pre-wrap">{post.content}</p>
                )}

                {post.content_type === 'link' && post.content && (
                  <a
                    href={post.content}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {post.content}
                  </a>
                )}

                {post.content_type === 'image' && post.media_url && (
                  <div className="mt-2 rounded-lg overflow-hidden">
                    <img
                      src={post.media_url}
                      alt={post.title || 'صورة'}
                      className="max-w-full max-h-[400px] object-contain mx-auto"
                    />
                  </div>
                )}

                {post.content_type === 'video' && post.media_url && (
                  <div className="mt-2 rounded-lg overflow-hidden bg-black">
                    <video
                      src={post.media_url}
                      controls
                      playsInline
                      preload="metadata"
                      className="max-w-full max-h-[400px] mx-auto"
                    />
                  </div>
                )}

                {/* Post Footer */}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {post.views_count} مشاهدة
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <CreateProfilePostDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        organizationId={organization?.id}
        onSuccess={fetchPosts}
      />
    </Card>
  );
}
