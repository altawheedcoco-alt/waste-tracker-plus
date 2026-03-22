import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  MessageSquare,
  Image as ImageIcon,
  Video,
  Link as LinkIcon,
  Eye,
  Loader2,
  FileText,
  ExternalLink,
  Pin,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfilePost {
  id: string;
  user_id: string;
  content_type: 'text' | 'image' | 'video' | 'link';
  content: string | null;
  media_url: string | null;
  title: string | null;
  is_pinned: boolean;
  views_count: number;
  created_at: string;
}

interface EmployeePostsViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string | null;
}

export default function EmployeePostsViewer({
  open,
  onOpenChange,
  employeeId,
  employeeName,
  employeeAvatar,
}: EmployeePostsViewerProps) {
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && employeeId) {
      fetchPosts();
    }
  }, [open, employeeId]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profile_posts')
        .select('*')
        .eq('user_id', employeeId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setPosts((data || []).map(p => ({
        ...p,
        content_type: p.content_type as ProfilePost['content_type'],
      })));
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
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
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={employeeAvatar || ''} />
              <AvatarFallback>
                {employeeName?.charAt(0) || <User className="h-5 w-5" />}
              </AvatarFallback>
            </Avatar>
            <div>
              <span>منشورات {employeeName}</span>
              {posts.length > 0 && (
                <Badge variant="secondary" className="mr-2">
                  {posts.length}
                </Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">لا توجد منشورات</p>
              <p className="text-sm">لم يقم هذا الموظف بنشر أي محتوى بعد</p>
            </div>
          ) : (
            <div className="space-y-4 p-1">
              {posts.map((post) => (
                <Card
                  key={post.id}
                  className={cn(
                    'transition-colors',
                    post.is_pinned && 'border-primary/50 bg-primary/5'
                  )}
                >
                  <CardContent className="p-4">
                    {/* Post Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getContentTypeBadge(post.content_type)}
                        {post.is_pinned && (
                          <Badge variant="outline" className="gap-1 text-xs">
                            <Pin className="h-3 w-3" />
                            مثبت
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(post.created_at)}
                      </span>
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
                          className="max-w-full max-h-[300px] object-contain mx-auto"
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
                          className="max-w-full max-h-[300px] mx-auto"
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
