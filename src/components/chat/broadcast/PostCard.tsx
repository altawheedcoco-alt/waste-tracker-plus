import { useState, memo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Eye, Forward,
  X, Loader2, MessageCircle,
  MoreVertical, Image as ImageIcon, Video,
  Link2, FileText, Heart, Pin, Trash2,
  Copy, Flag, Share2, Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useBroadcastComments } from '@/hooks/useBroadcastComments';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import type { InternalSharePayload } from './ShareToChatDialog';

export const REACTIONS = [
  { type: 'heart', emoji: '❤️' },
  { type: 'thumbsup', emoji: '👍' },
  { type: 'laugh', emoji: '😂' },
  { type: 'fire', emoji: '🔥' },
  { type: 'clap', emoji: '👏' },
  { type: 'flag', emoji: '🇵🇸' },
];

// AutoPlay Video
const AutoPlayVideo = ({ src }: { src: string }) => {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setHasError(false);
    el.muted = muted;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.play().catch(() => {}); } else { el.pause(); } },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [src, muted]);

  if (hasError) {
    return (
      <a href={src} target="_blank" rel="noreferrer"
        className="flex items-center gap-3 p-4 bg-muted/20 rounded-xl border border-border/30 hover:bg-muted/40 transition-colors">
        <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
          <Play className="w-6 h-6 text-red-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">فيديو مرفق</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">اضغط لتشغيل الفيديو في نافذة جديدة</p>
        </div>
        <Forward className="w-4 h-4 text-primary rotate-90 shrink-0" />
      </a>
    );
  }

  return (
    <div className="relative group">
      <video ref={ref} src={src} className="w-full object-contain max-h-[500px]" muted={muted} loop playsInline preload="metadata" controls onError={() => setHasError(true)} />
      <button type="button" onClick={() => setMuted((m) => !m)}
        className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm rounded-full p-1.5 text-white transition-opacity text-[10px] px-2.5">
        {muted ? '🔇 اضغط لتشغيل الصوت' : '🔊 صوت'}
      </button>
    </div>
  );
};

// Inline PDF Viewer
const InlinePdfViewer = ({ url, name, height = '500px' }: { url: string; name: string; height?: string }) => {
  const googleViewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;
  return (
    <div className="rounded-xl border border-border/50 overflow-hidden">
      <iframe src={googleViewerUrl} className="w-full border-0" style={{ height }} title={name || 'PDF'} allow="autoplay" sandbox="allow-scripts allow-same-origin allow-popups" />
      <a href={url} target="_blank" rel="noreferrer"
        className="flex items-center gap-2 p-2 bg-muted/20 border-t border-border/30 hover:bg-muted/40 transition-colors">
        <FileText className="w-4 h-4 text-red-500" />
        <span className="text-xs font-medium truncate flex-1">{name || 'ملف PDF'}</span>
        <span className="text-[10px] text-muted-foreground">فتح في نافذة جديدة</span>
      </a>
    </div>
  );
};

// Comment Section
const CommentSection = memo(({ postId, isOpen }: { postId: string; isOpen: boolean }) => {
  const { user } = useAuth();
  const { comments, isLoading, addComment, deleteComment, toggleLike, isAdding } = useBroadcastComments(postId);
  const [text, setText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!text.trim()) return;
    addComment({ content: text.trim() });
    setText('');
  };

  const topLevel = comments.filter(c => !c.parent_comment_id);
  const replies = (parentId: string) => comments.filter(c => c.parent_comment_id === parentId);

  return (
    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-border/30 bg-muted/20">
      <div className="max-h-60 overflow-y-auto px-4 py-2 space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-3"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
        ) : topLevel.length === 0 ? (
          <p className="text-[11px] text-muted-foreground text-center py-2">لا توجد تعليقات بعد</p>
        ) : (
          topLevel.map(comment => (
            <div key={comment.id} className="space-y-1">
              <div className="flex items-start gap-2">
                <Avatar className="w-6 h-6 mt-0.5">
                  {comment.user_avatar && <AvatarImage src={comment.user_avatar} />}
                  <AvatarFallback className="text-[9px] bg-primary/10 text-primary">{(comment.user_name || '?').charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="bg-background rounded-xl px-3 py-1.5">
                    <p className="text-[11px] font-semibold">{comment.user_name}</p>
                    <p className="text-xs leading-relaxed">{comment.content}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 px-1">
                    <button onClick={() => toggleLike(comment.id)} className="text-[10px] text-muted-foreground hover:text-primary transition-colors">
                      إعجاب {comment.likes_count > 0 && `(${comment.likes_count})`}
                    </button>
                    <span className="text-[10px] text-muted-foreground">{format(new Date(comment.created_at), 'h:mm a', { locale: ar })}</span>
                    {comment.user_id === user?.id && (
                      <button onClick={() => deleteComment(comment.id)} className="text-[10px] text-destructive">حذف</button>
                    )}
                  </div>
                </div>
              </div>
              {replies(comment.id).map(reply => (
                <div key={reply.id} className="flex items-start gap-2 mr-8">
                  <Avatar className="w-5 h-5 mt-0.5">
                    {reply.user_avatar && <AvatarImage src={reply.user_avatar} />}
                    <AvatarFallback className="text-[8px] bg-secondary text-secondary-foreground">{(reply.user_name || '?').charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="bg-background rounded-xl px-2.5 py-1">
                      <p className="text-[10px] font-semibold">{reply.user_name}</p>
                      <p className="text-[11px]">{reply.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
      <div className="flex items-center gap-2 px-4 py-2 border-t border-border/20">
        <Input value={text} onChange={e => setText(e.target.value)} placeholder="أضف تعليقاً..."
          className="text-xs h-8 flex-1 rounded-full" onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        <Button size="icon" className="h-8 w-8 rounded-full shrink-0" disabled={!text.trim() || isAdding} onClick={handleSubmit}>
          {isAdding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
        </Button>
      </div>
    </motion.div>
  );
});
CommentSection.displayName = 'CommentSection';

// Main PostCard
const PostCard = memo(({ post, channelId, channelName, channelAvatar, onReact, myReactions, isMine, allowComments, allowReactions, onPin, onDelete, onReport, onView, onShare }: {
  post: any;
  channelId: string;
  channelName: string;
  channelAvatar?: string | null;
  onReact: (postId: string, type: string) => void;
  myReactions: Set<string>;
  isMine: boolean;
  allowComments: boolean;
  allowReactions: boolean;
  onPin?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onReport?: (postId: string) => void;
  onView?: (postId: string) => void;
  onShare?: (payload: InternalSharePayload) => void;
}) => {
  const [showReactions, setShowReactions] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [fullscreenMedia, setFullscreenMedia] = useState(false);
  const [fullscreenUrl, setFullscreenUrl] = useState('');
  const postRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = postRef.current;
    if (!el || !onView) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { onView(post.id); observer.disconnect(); } },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [post.id, onView]);

  const reactionsData: Record<string, number> = post.reactions_summary || {};
  const totalReactions = post.reactions_count || 0;
  const topReactions = Object.entries(reactionsData).sort(([, a], [, b]) => (b as number) - (a as number)).slice(0, 4);

  const renderContent = (text: string) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) =>
      urlRegex.test(part) ? (
        <a key={i} href={part} target="_blank" rel="noreferrer" className="text-primary hover:underline break-all" dir="ltr">{part}</a>
      ) : part
    );
  };

  const allMediaUrls: string[] = (post as any).media_urls?.length > 0 ? (post as any).media_urls : (post.file_url ? [post.file_url] : []);
  const allMediaTypes: string[] = (post as any).media_types?.length > 0 ? (post as any).media_types : (post.file_url ? [post.post_type] : []);
  const allMediaNames: string[] = (post as any).media_names?.length > 0 ? (post as any).media_names : (post.file_name ? [post.file_name] : []);

  const mediaImages = allMediaUrls.filter((_, i) => allMediaTypes[i] === 'image');
  const mediaVideos = allMediaUrls.filter((_, i) => allMediaTypes[i] === 'video');
  const mediaDocs = allMediaUrls.filter((_, i) => allMediaTypes[i] !== 'image' && allMediaTypes[i] !== 'video');
  const mediaDocNames = allMediaNames.filter((_, i) => allMediaTypes[i] !== 'image' && allMediaTypes[i] !== 'video');

  const openFullscreen = (url: string) => { setFullscreenUrl(url); setFullscreenMedia(true); };

  const isMultiMedia = allMediaUrls.length > 1;
  const isImagePost = !isMultiMedia && post.post_type === 'image' && post.file_url;
  const isVideoPost = !isMultiMedia && post.post_type === 'video' && post.file_url;
  const isDocPost = !isMultiMedia && post.file_url && !isImagePost && !isVideoPost;
  const fileExt = post.file_name?.split('.').pop()?.toLowerCase() || '';
  const isPdf = fileExt === 'pdf';
  const isDocFile = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(fileExt);

  const getImageGridClass = (count: number) => {
    if (count === 1) return 'grid-cols-1';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 9) return 'grid-cols-3';
    return 'grid-cols-4';
  };

  return (
    <>
      <motion.div ref={postRef} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        data-post-id={post.id}
        className={cn("bg-card rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-shadow",
          post.is_pinned ? "border-primary/40 ring-2 ring-primary/10" : "border-border/30")}>
        {post.is_pinned && (
          <div className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-l from-primary/5 to-primary/10 border-b border-primary/10">
            <Pin className="w-3 h-3 text-primary fill-primary/20" />
            <span className="text-[10px] font-semibold text-primary">منشور مثبت</span>
          </div>
        )}

        {/* Channel Header */}
        <div className="flex items-center gap-2.5 px-4 pt-3 pb-1">
          <Avatar className="w-9 h-9 ring-2 ring-primary/10">
            {channelAvatar && <AvatarImage src={channelAvatar} />}
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-sm font-bold">{channelName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold truncate">{channelName}</p>
            <p className="text-[10px] text-muted-foreground">{format(new Date(post.created_at), 'dd MMM yyyy • h:mm a', { locale: ar })}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[140px]">
              {isMine ? (
                <>
                  <DropdownMenuItem onClick={() => onPin?.(post.id)}>
                    <Pin className="w-3.5 h-3.5 ml-2" />{post.is_pinned ? 'إلغاء التثبيت' : 'تثبيت المنشور'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(post.content || ''); toast.success('تم النسخ'); }}>
                    <Copy className="w-3.5 h-3.5 ml-2" /> نسخ النص
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onDelete?.(post.id)} className="text-destructive">
                    <Trash2 className="w-3.5 h-3.5 ml-2" /> حذف المنشور
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(post.content || ''); toast.success('تم النسخ'); }}>
                    <Copy className="w-3.5 h-3.5 ml-2" /> نسخ النص
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onReport?.(post.id)} className="text-destructive">
                    <Flag className="w-3.5 h-3.5 ml-2" /> إبلاغ عن المحتوى
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Text */}
        {post.content && (
          <div className="px-4 py-2" dir="rtl">
            <p className="text-sm leading-[1.8] whitespace-pre-wrap text-foreground/90">{renderContent(post.content)}</p>
          </div>
        )}

        {/* Multi-media images */}
        {isMultiMedia && mediaImages.length > 0 && (
          <div className={cn("grid gap-0.5 mt-1", getImageGridClass(mediaImages.length))}>
            {mediaImages.map((url, i) => (
              <div key={`img-${i}`} className="relative group cursor-pointer overflow-hidden" onClick={() => openFullscreen(url)}>
                <img src={url} alt={`صورة ${i + 1}`} className="w-full object-cover aspect-square" loading="lazy" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="bg-black/50 backdrop-blur-sm rounded-full p-1.5"><Eye className="w-4 h-4 text-white" /></div>
                </div>
                {i === 0 && mediaImages.length > 1 && (
                  <Badge className="absolute top-1.5 right-1.5 text-[9px] bg-black/60 text-white border-0">📷 {mediaImages.length}</Badge>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Multi-media videos */}
        {isMultiMedia && mediaVideos.length > 0 && (
          <div className="space-y-1 mt-1">
            {mediaVideos.map((url, i) => (<div key={`vid-${i}`} className="relative bg-black"><AutoPlayVideo src={url} /></div>))}
          </div>
        )}

        {/* Multi-media docs */}
        {isMultiMedia && mediaDocs.length > 0 && (
          <div className="px-4 mt-2 space-y-1.5">
            {mediaDocs.map((url, i) => {
              const name = mediaDocNames[i] || 'ملف مرفق';
              const ext = name.split('.').pop()?.toLowerCase() || '';
              const docIsPdf = ext === 'pdf';
              const docIsOffice = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext);
              return (
                <div key={`doc-${i}`}>
                  {docIsPdf ? <InlinePdfViewer url={url} name={name} height="350px" /> : (
                    <a href={url} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border/50 hover:border-primary/30 bg-muted/10 transition-colors">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", docIsOffice ? "bg-blue-500/10" : "bg-primary/10")}>
                        <FileText className={cn("w-5 h-5", docIsOffice ? "text-blue-500" : "text-primary")} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{name}</p>
                        <p className="text-[9px] text-muted-foreground uppercase" dir="ltr">{ext.toUpperCase()}</p>
                      </div>
                      <Forward className="w-3.5 h-3.5 text-primary rotate-90 shrink-0" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Legacy single image */}
        {!isMultiMedia && isImagePost && (
          <div className="relative group cursor-pointer mt-1" onClick={() => openFullscreen(post.file_url!)}>
            {!imageLoaded && (
              <div className="aspect-video bg-muted/30 animate-pulse flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
              </div>
            )}
            <img src={post.file_url!} alt={post.file_name || 'صورة'}
              className={cn("w-full object-contain transition-transform", !imageLoaded && "hidden")}
              onLoad={() => setImageLoaded(true)} />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="bg-black/50 backdrop-blur-sm rounded-full p-2"><Eye className="w-5 h-5 text-white" /></div>
            </div>
          </div>
        )}

        {/* Legacy single video */}
        {!isMultiMedia && isVideoPost && (<div className="relative mt-1 bg-black"><AutoPlayVideo src={post.file_url!} /></div>)}

        {/* Legacy single document */}
        {!isMultiMedia && isDocPost && (
          <div className="mx-4 my-2">
            {isPdf ? <InlinePdfViewer url={post.file_url!} name={post.file_name || 'ملف PDF'} height="400px" /> : (
              <a href={post.file_url!} target="_blank" rel="noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-gradient-to-l from-muted/30 to-transparent hover:from-muted/50 transition-colors">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", isDocFile ? "bg-blue-500/10" : "bg-primary/10")}>
                  <FileText className={cn("w-6 h-6", isDocFile ? "text-blue-500" : "text-primary")} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{post.file_name || 'ملف مرفق'}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 uppercase" dir="ltr">{fileExt.toUpperCase()} • اضغط للتحميل</p>
                </div>
                <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Forward className="w-4 h-4 text-primary rotate-90" />
                </div>
              </a>
            )}
          </div>
        )}

        {/* Link Preview */}
        {post.link_url && (
          <a href={post.link_url} target="_blank" rel="noreferrer"
            className="block mx-4 my-2 rounded-xl border border-border/50 overflow-hidden hover:border-primary/30 transition-all group">
            {post.link_preview_image && (
              <div className="aspect-video bg-muted/20 overflow-hidden">
                <img src={post.link_preview_image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
            )}
            <div className="p-3 bg-gradient-to-l from-muted/30 to-transparent">
              <p className="text-sm font-semibold truncate">{post.link_title || 'رابط خارجي'}</p>
              <div className="flex items-center gap-1 mt-1">
                <Link2 className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground truncate" dir="ltr">
                  {(() => { try { return new URL(post.link_url).hostname; } catch { return post.link_url; } })()}
                </span>
              </div>
            </div>
          </a>
        )}

        {/* Stats & Action Bar */}
        <div className="px-4 pb-2 mt-1">
          {(totalReactions > 0 || (post.comments_count || 0) > 0 || (post.views_count || 0) > 0) && (
            <div className="flex items-center justify-between py-1.5 border-b border-border/20 mb-1">
              <div className="flex items-center gap-1.5">
                {topReactions.length > 0 && (
                  <>
                    <div className="flex -space-x-0.5 rtl:space-x-reverse">
                      {topReactions.map(([type]) => { const r = REACTIONS.find(r => r.type === type); return r ? <span key={type} className="text-sm">{r.emoji}</span> : null; })}
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground">{totalReactions.toLocaleString('ar-EG')}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                {(post.comments_count || 0) > 0 && <span className="flex items-center gap-0.5"><MessageCircle className="w-3 h-3" /> {post.comments_count}</span>}
                <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" /> {(post.views_count || 0).toLocaleString('ar-EG')}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-around">
            {allowReactions && (
              <button onClick={() => setShowReactions(!showReactions)}
                className={cn("flex items-center gap-1.5 text-[11px] font-medium py-2 px-3 rounded-lg transition-all",
                  showReactions ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
                <Heart className={cn("w-[18px] h-[18px]", showReactions && "fill-primary/20")} /><span>تفاعل</span>
              </button>
            )}
            {allowComments && (
              <button onClick={() => setShowComments(!showComments)}
                className={cn("flex items-center gap-1.5 text-[11px] font-medium py-2 px-3 rounded-lg transition-all",
                  showComments ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
                <MessageCircle className={cn("w-[18px] h-[18px]", showComments && "fill-primary/20")} /><span>تعليق</span>
              </button>
            )}
            <button onClick={() => {
              const postLink = `${window.location.origin}/dashboard/broadcast-channels?channel=${channelId}&post=${post.id}`;
              const previewText = post.content?.trim() || post.file_name || 'منشور من قناة البث';
              onShare?.({ title: `منشور من ${channelName}`, preview: previewText, message: `📢 تمت مشاركة منشور من قناة "${channelName}"\n\n${previewText}\n\n${postLink}`, link: postLink });
            }}
              className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground py-2 px-3 rounded-lg hover:bg-muted/50 transition-all">
              <Share2 className="w-[18px] h-[18px]" /><span>مشاركة</span>
            </button>
          </div>

          <AnimatePresence>
            {showReactions && (
              <motion.div initial={{ opacity: 0, scale: 0.9, y: 6 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 6 }}
                className="flex items-center gap-0.5 mt-1.5 p-2 rounded-2xl bg-card border border-border/50 shadow-lg w-fit mx-auto">
                {REACTIONS.map(r => (
                  <motion.button key={r.type} whileHover={{ scale: 1.35, y: -4 }} whileTap={{ scale: 0.95 }}
                    onClick={() => { onReact(post.id, r.type); setShowReactions(false); }}
                    className={cn('text-xl px-2 py-1 rounded-full transition-colors',
                      myReactions.has(`${post.id}-${r.type}`) && 'bg-primary/10 ring-2 ring-primary/30')}>
                    {r.emoji}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {showComments && <CommentSection postId={post.id} isOpen={showComments} />}
        </AnimatePresence>
      </motion.div>

      {/* Fullscreen Image Viewer */}
      <Dialog open={fullscreenMedia} onOpenChange={setFullscreenMedia}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 border-0 bg-black/95 overflow-hidden">
          <button onClick={() => setFullscreenMedia(false)}
            className="absolute top-3 right-3 z-50 bg-black/60 backdrop-blur-sm rounded-full p-2 text-white hover:bg-black/80">
            <X className="w-5 h-5" />
          </button>
          {fullscreenUrl && <img src={fullscreenUrl} alt="" className="w-full h-full object-contain max-h-[90vh]" />}
        </DialogContent>
      </Dialog>
    </>
  );
});
PostCard.displayName = 'PostCard';

export default PostCard;
