import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { fixStorageUrl } from '@/utils/storageUrl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Image as ImageIcon, 
  Video, 
  Send, 
  MoreVertical, 
  Trash2, 
  Pin, 
  PinOff,
  X,
  Loader2,
  Play,
  Images,
  Share2
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import PostInteractions from './PostInteractions';
import PostShareActions from '@/components/content-generator/PostShareActions';

interface OrganizationPost {
  id: string;
  organization_id: string;
  author_id: string | null;
  content: string | null;
  media_urls: string[];
  post_type: 'text' | 'image' | 'video' | 'gallery';
  is_pinned: boolean;
  likes_count: number;
  created_at: string;
  updated_at: string;
  author?: {
    full_name: string;
    avatar_url: string | null;
    position: string | null;
  };
}

interface OrganizationPostsProps {
  organizationId: string;
  organizationName: string;
  organizationLogo?: string | null;
  isOwnOrganization: boolean;
}

const OrganizationPosts = ({ 
  organizationId, 
  organizationName, 
  organizationLogo,
  isOwnOrganization 
}: OrganizationPostsProps) => {
  const { profile, roles } = useAuth();
  const [posts, setPosts] = useState<OrganizationPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  const isAdmin = roles.includes('admin');
  const canPost = isOwnOrganization && !roles.includes('driver');

  useEffect(() => {
    fetchPosts();
  }, [organizationId]);

  useEffect(() => {
    const urls = selectedFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
    
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [selectedFiles]);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('organization_posts')
        .select(`
          *,
          author:profiles!organization_posts_author_id_fkey(full_name, avatar_url, position)
        `)
        .eq('organization_id', organizationId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPosts((data || []).map(post => ({
        ...post,
        post_type: post.post_type as 'text' | 'image' | 'video' | 'gallery',
        media_urls: Array.isArray(post.media_urls) 
          ? (post.media_urls as unknown as string[])
          : []
      })));
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 10) {
      toast.error('يمكنك رفع 10 ملفات كحد أقصى');
      return;
    }
    
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
      
      if (!isImage && !isVideo) {
        toast.error(`${file.name}: نوع الملف غير مدعوم`);
        return false;
      }
      if (file.size > maxSize) {
        toast.error(`${file.name}: حجم الملف كبير جداً`);
        return false;
      }
      return true;
    });

    setSelectedFiles(prev => [...prev, ...validFiles].slice(0, 10));
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (): Promise<string[]> => {
    const { uploadFile } = await import('@/utils/optimizedUpload');
    
    // رفع جميع الملفات بالتوازي بدلاً من التسلسل
    const results = await Promise.all(
      selectedFiles.map((file) => {
        const ext = file.name.split('.').pop();
        const fileName = `${organizationId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        return uploadFile(file, {
          bucket: 'organization-posts',
          path: fileName,
          compress: file.type.startsWith('image/'), // ضغط الصور فقط
        });
      })
    );

    return results.map((r) => r.publicUrl);
  };

  const determinePostType = (): 'text' | 'image' | 'video' | 'gallery' => {
    if (selectedFiles.length === 0) return 'text';
    if (selectedFiles.length > 1) return 'gallery';
    
    const file = selectedFiles[0];
    if (file.type.startsWith('video/')) return 'video';
    return 'image';
  };

  const handleSubmit = async () => {
    if (!newPostContent.trim() && selectedFiles.length === 0) {
      toast.error('يرجى إضافة محتوى أو وسائط');
      return;
    }

    if (!profile?.id) {
      toast.error('يجب تسجيل الدخول');
      return;
    }

    setUploading(true);
    try {
      let mediaUrls: string[] = [];
      
      if (selectedFiles.length > 0) {
        mediaUrls = await uploadFiles();
      }

      const { error } = await supabase
        .from('organization_posts')
        .insert({
          organization_id: organizationId,
          author_id: profile.id,
          content: newPostContent.trim() || null,
          media_urls: mediaUrls,
          post_type: determinePostType(),
        });

      if (error) throw error;

      toast.success('تم نشر المنشور بنجاح');
      setNewPostContent('');
      setSelectedFiles([]);
      fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('حدث خطأ أثناء النشر');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!postToDelete) return;

    try {
      const { error } = await supabase
        .from('organization_posts')
        .delete()
        .eq('id', postToDelete);

      if (error) throw error;

      toast.success('تم حذف المنشور');
      setPosts(prev => prev.filter(p => p.id !== postToDelete));
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('حدث خطأ أثناء الحذف');
    } finally {
      setDeleteDialogOpen(false);
      setPostToDelete(null);
    }
  };

  const handleTogglePin = async (postId: string, currentlyPinned: boolean) => {
    try {
      const { error } = await supabase
        .from('organization_posts')
        .update({ is_pinned: !currentlyPinned })
        .eq('id', postId);

      if (error) throw error;

      toast.success(currentlyPinned ? 'تم إلغاء التثبيت' : 'تم تثبيت المنشور');
      fetchPosts();
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast.error('حدث خطأ');
    }
  };

  const handleVideoPlay = (postId: string, videoElement: HTMLVideoElement) => {
    // Pause all other videos when a new one starts playing
    if (activeVideoId && activeVideoId !== postId) {
      const previousVideo = videoRefs.current.get(activeVideoId);
      if (previousVideo) {
        previousVideo.pause();
      }
    }
    setActiveVideoId(postId);
  };

  const renderMedia = (post: OrganizationPost) => {
    if (!post.media_urls || post.media_urls.length === 0) return null;

    if (post.post_type === 'video') {
      const videoUrl = fixStorageUrl(post.media_urls[0]);
      return (
        <div className="mt-3 rounded-lg overflow-hidden bg-black">
          <video 
            ref={(el) => {
              if (el) videoRefs.current.set(post.id, el);
            }}
            src={videoUrl} 
            controls 
            playsInline
            preload="metadata"
            className="w-full max-h-[500px] object-contain"
            onPlay={(e) => handleVideoPlay(post.id, e.currentTarget)}
            onError={(e) => console.error('Video load error:', videoUrl, e)}
          />
        </div>
      );
    }

    if (post.post_type === 'gallery') {
      return (
        <div className={`mt-3 grid gap-2 ${
          post.media_urls.length === 2 ? 'grid-cols-2' :
          post.media_urls.length === 3 ? 'grid-cols-3' :
          post.media_urls.length >= 4 ? 'grid-cols-2' : ''
        }`}>
          {post.media_urls.slice(0, 4).map((url, index) => (
            <div 
              key={index} 
              className={`relative rounded-lg overflow-hidden ${
                post.media_urls.length === 3 && index === 0 ? 'col-span-3' : ''
              }`}
            >
              {url.includes('.mp4') || url.includes('.webm') || url.includes('.mov') ? (
                <video src={fixStorageUrl(url)} className="w-full h-48 object-contain bg-black/5" playsInline preload="auto" controls />
              ) : (
                <img src={fixStorageUrl(url)} alt="" className="w-full h-48 object-contain bg-black/5" />
              )}
              {index === 3 && post.media_urls.length > 4 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">+{post.media_urls.length - 4}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="mt-3 rounded-lg overflow-hidden">
        <img 
          src={fixStorageUrl(post.media_urls[0])} 
          alt="" 
          className="w-full max-h-[500px] object-contain"
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      {canPost && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Avatar>
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback>{profile?.full_name?.charAt(0) || 'م'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <Textarea
                  placeholder="شارك منشوراً مع شركائك..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="min-h-[80px] resize-none"
                />
                
                {previewUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        {selectedFiles[index]?.type.startsWith('video/') ? (
                          <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                            <Play className="h-8 w-8 text-muted-foreground" />
                          </div>
                        ) : (
                          <img 
                            src={url} 
                            alt="" 
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        )}
                        <button
                          onClick={() => removeFile(index)}
                          className="absolute -top-2 -left-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Button type="button" variant="ghost" size="sm" asChild>
                        <span>
                          <ImageIcon className="h-4 w-4 ml-1" />
                          صورة
                        </span>
                      </Button>
                    </label>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setSelectedFiles([file]);
                          }
                        }}
                        className="hidden"
                      />
                      <Button type="button" variant="ghost" size="sm" asChild>
                        <span>
                          <Video className="h-4 w-4 ml-1" />
                          فيديو
                        </span>
                      </Button>
                    </label>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Button type="button" variant="ghost" size="sm" asChild>
                        <span>
                          <Images className="h-4 w-4 ml-1" />
                          معرض
                        </span>
                      </Button>
                    </label>
                  </div>
                  
                  <Button 
                    onClick={handleSubmit} 
                    disabled={uploading || (!newPostContent.trim() && selectedFiles.length === 0)}
                    size="sm"
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4 ml-1" />
                        نشر
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {posts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>لا توجد منشورات بعد</p>
            {canPost && <p className="text-sm mt-1">كن أول من ينشر محتوى!</p>}
          </CardContent>
        </Card>
      ) : (
        posts.map(post => (
          <Card key={post.id} className={post.is_pinned ? 'border-primary/50 bg-primary/5' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar>
                  <AvatarImage src={post.author?.avatar_url || organizationLogo || ''} />
                  <AvatarFallback>
                    {post.author?.full_name?.charAt(0) || organizationName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {post.author?.full_name || organizationName}
                        </span>
                        {post.is_pinned && (
                          <Badge variant="outline" className="text-xs">
                            <Pin className="h-3 w-3 ml-1" />
                            مثبت
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {post.author?.position && (
                          <>
                            <span>{post.author.position}</span>
                            <span>•</span>
                          </>
                        )}
                        <span>
                          {formatDistanceToNow(new Date(post.created_at), {
                            addSuffix: true,
                            locale: ar
                          })}
                        </span>
                      </div>
                    </div>

                    {(isOwnOrganization || isAdmin) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleTogglePin(post.id, post.is_pinned)}>
                            {post.is_pinned ? (
                              <>
                                <PinOff className="h-4 w-4 ml-2" />
                                إلغاء التثبيت
                              </>
                            ) : (
                              <>
                                <Pin className="h-4 w-4 ml-2" />
                                تثبيت المنشور
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => {
                              setPostToDelete(post.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 ml-2" />
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  {post.content && (
                    <p className="mt-2 whitespace-pre-wrap">{post.content}</p>
                  )}

                  {renderMedia(post)}
                  
                  <div className="flex items-center justify-between mt-3">
                    <PostInteractions postId={post.id} likesCount={post.likes_count || 0} />
                    <PostShareActions 
                      content={post.content || ''}
                      postId={post.id}
                      variant="icon"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المنشور</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا المنشور؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OrganizationPosts;
