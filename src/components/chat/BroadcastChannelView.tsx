import { useState, memo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radio, Plus, Send, Users, ChevronRight, Search,
  Share2, Forward, Eye, Globe, ShieldCheck,
  Camera, X, Loader2, MessageCircle, Clock, BadgeCheck,
  Bell, BellOff, MoreVertical, Image as ImageIcon, Video,
  Link2, FileText, Heart, ThumbsUp, Smile, Pin, Trash2,
  ChevronDown, ChevronUp, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useBroadcastChannels, type BroadcastChannel } from '@/hooks/useBroadcastChannels';
import { useBroadcastPosts } from '@/hooks/useBroadcastPosts';
import { useBroadcastComments } from '@/hooks/useBroadcastComments';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';

const REACTIONS = [
  { type: 'heart', emoji: '❤️' },
  { type: 'thumbsup', emoji: '👍' },
  { type: 'laugh', emoji: '😂' },
  { type: 'fire', emoji: '🔥' },
  { type: 'clap', emoji: '👏' },
  { type: 'flag', emoji: '🇵🇸' },
];

interface BroadcastChannelViewProps {
  onBack?: () => void;
}

// ═══════════════════════════════════════════════════════════════
// Comment Section
// ═══════════════════════════════════════════════════════════════
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
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="border-t border-border/30 bg-muted/20"
    >
      {/* Comments List */}
      <div className="max-h-60 overflow-y-auto px-4 py-2 space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-3">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : topLevel.length === 0 ? (
          <p className="text-[11px] text-muted-foreground text-center py-2">لا توجد تعليقات بعد</p>
        ) : (
          topLevel.map(comment => (
            <div key={comment.id} className="space-y-1">
              <div className="flex items-start gap-2">
                <Avatar className="w-6 h-6 mt-0.5">
                  {comment.user_avatar && <AvatarImage src={comment.user_avatar} />}
                  <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                    {(comment.user_name || '?').charAt(0)}
                  </AvatarFallback>
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
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(comment.created_at), 'h:mm a', { locale: ar })}
                    </span>
                    {comment.user_id === user?.id && (
                      <button onClick={() => deleteComment(comment.id)} className="text-[10px] text-destructive hover:text-destructive/80">
                        حذف
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {/* Replies */}
              {replies(comment.id).map(reply => (
                <div key={reply.id} className="flex items-start gap-2 mr-8">
                  <Avatar className="w-5 h-5 mt-0.5">
                    {reply.user_avatar && <AvatarImage src={reply.user_avatar} />}
                    <AvatarFallback className="text-[8px] bg-secondary text-secondary-foreground">
                      {(reply.user_name || '?').charAt(0)}
                    </AvatarFallback>
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

      {/* Add Comment */}
      <div className="flex items-center gap-2 px-4 py-2 border-t border-border/20">
        <Input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="أضف تعليقاً..."
          className="text-xs h-8 flex-1 rounded-full"
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        />
        <Button
          size="icon"
          className="h-8 w-8 rounded-full shrink-0"
          disabled={!text.trim() || isAdding}
          onClick={handleSubmit}
        >
          {isAdding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
        </Button>
      </div>
    </motion.div>
  );
});
CommentSection.displayName = 'CommentSection';

// ═══════════════════════════════════════════════════════════════
// Post Card (Enhanced)
// ═══════════════════════════════════════════════════════════════
const PostCard = memo(({ post, channelName, channelAvatar, onReact, myReactions, isMine, onPin, onDelete, onRecordView }: {
  post: any;
  channelName: string;
  channelAvatar?: string;
  onReact: (postId: string, type: string) => void;
  myReactions: Set<string>;
  isMine: boolean;
  onPin?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onRecordView?: (postId: string) => void;
}) => {
  const [showReactions, setShowReactions] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const reactionsData: Record<string, number> = post.reactions_summary || {};
  const totalReactions = post.reactions_count || 0;
  const topReactions = Object.entries(reactionsData)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 4);

  // Record view on mount
  useRef(() => { onRecordView?.(post.id); });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-card rounded-2xl border overflow-hidden",
        post.is_pinned ? "border-primary/30 ring-1 ring-primary/10" : "border-border/30"
      )}
    >
      {/* Pinned indicator */}
      {post.is_pinned && (
        <div className="flex items-center gap-1.5 px-4 py-1.5 bg-primary/5 border-b border-primary/10">
          <Pin className="w-3 h-3 text-primary" />
          <span className="text-[10px] font-medium text-primary">منشور مثبت</span>
        </div>
      )}

      {/* Media */}
      {post.file_url && (
        <div className="relative bg-muted/30">
          {post.post_type === 'video' ? (
            <div className="aspect-video bg-muted/50">
              <video src={post.file_url} className="w-full h-full object-cover" controls />
            </div>
          ) : post.post_type === 'image' ? (
            <img src={post.file_url} alt="" className="w-full max-h-80 object-cover" />
          ) : (
            <div className="p-3 flex items-center gap-3 bg-muted/20">
              <FileText className="w-8 h-8 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{post.file_name || 'ملف مرفق'}</p>
                <p className="text-[10px] text-muted-foreground">
                  {post.post_type === 'document' ? 'مستند' : 'ملف'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Link Preview */}
      {post.link_url && (
        <a href={post.link_url} target="_blank" rel="noreferrer"
          className="flex items-center gap-3 p-3 bg-muted/20 border-b border-border/20 hover:bg-muted/30 transition-colors"
        >
          {post.link_preview_image && (
            <img src={post.link_preview_image} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{post.link_title || channelName}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Link2 className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground truncate" dir="ltr">{new URL(post.link_url).hostname}</span>
            </div>
          </div>
        </a>
      )}

      {/* Content */}
      <div className="p-4" dir="rtl">
        {post.content && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
        )}
        <div className="flex items-center gap-3 mt-3">
          <span className="text-[10px] text-muted-foreground">
            {format(new Date(post.created_at), 'h:mm a', { locale: ar })}
          </span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <Eye className="w-3 h-3" /> {(post.views_count || 0).toLocaleString('ar-EG')}
          </span>
          {post.edited_at && (
            <span className="text-[10px] text-muted-foreground">تم التعديل</span>
          )}
        </div>
      </div>

      {/* Reactions & Actions Bar */}
      <div className="px-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {topReactions.length > 0 && (
              <>
                <div className="flex -space-x-1 rtl:space-x-reverse">
                  {topReactions.map(([type]) => {
                    const r = REACTIONS.find(r => r.type === type);
                    return r ? <span key={type} className="text-base">{r.emoji}</span> : null;
                  })}
                </div>
                <span className="text-[10px] font-medium text-muted-foreground mr-1">
                  {totalReactions.toLocaleString('ar-EG')}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1">
            {(post.comments_count || 0) > 0 && (
              <span className="text-[10px] text-muted-foreground">
                {post.comments_count} تعليق
              </span>
            )}
            {(post.forward_count || 0) > 0 && (
              <span className="text-[10px] text-muted-foreground mr-2">
                {post.forward_count} إعادة توجيه
              </span>
            )}
          </div>
        </div>

        {/* Action buttons row */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/20">
          <button
            onClick={() => setShowReactions(!showReactions)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted/50"
          >
            <Heart className="w-4 h-4" />
            <span>تفاعل</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted/50"
          >
            <MessageCircle className="w-4 h-4" />
            <span>تعليق</span>
          </button>

          <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted/50">
            <Forward className="w-4 h-4" />
            <span>مشاركة</span>
          </button>

          {isMine && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted/50">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => onPin?.(post.id)}>
                  <Pin className="w-3.5 h-3.5 ml-2" />
                  {post.is_pinned ? 'إلغاء التثبيت' : 'تثبيت المنشور'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete?.(post.id)} className="text-destructive">
                  <Trash2 className="w-3.5 h-3.5 ml-2" />
                  حذف المنشور
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Reaction Picker */}
        <AnimatePresence>
          {showReactions && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="flex items-center gap-1 mt-2 p-1.5 rounded-full bg-muted/50 w-fit"
            >
              {REACTIONS.map(r => (
                <button
                  key={r.type}
                  onClick={() => { onReact(post.id, r.type); setShowReactions(false); }}
                  className={cn(
                    'text-lg px-1.5 py-0.5 rounded-full hover:bg-background transition-all hover:scale-125',
                    myReactions.has(`${post.id}-${r.type}`) && 'bg-primary/10 ring-1 ring-primary/30'
                  )}
                >
                  {r.emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && <CommentSection postId={post.id} isOpen={showComments} />}
      </AnimatePresence>
    </motion.div>
  );
});
PostCard.displayName = 'PostCard';

// ═══════════════════════════════════════════════════════════════
// Post Composer (Enhanced)
// ═══════════════════════════════════════════════════════════════
const PostComposer = memo(({ channelId, onPost, isPosting, onUpload }: {
  channelId: string;
  onPost: (data: { content: string; postType?: string; fileUrl?: string; fileName?: string }) => void;
  isPosting: boolean;
  onUpload: (file: File) => Promise<{ url: string; name: string; type: string } | null>;
}) => {
  const [content, setContent] = useState('');
  const [attachedFile, setAttachedFile] = useState<{ url: string; name: string; type: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!content.trim() && !attachedFile) return;
    onPost({
      content,
      postType: attachedFile?.type || 'text',
      fileUrl: attachedFile?.url,
      fileName: attachedFile?.name,
    });
    setContent('');
    setAttachedFile(null);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const result = await onUpload(file);
    if (result) setAttachedFile(result);
    setUploading(false);
    e.target.value = '';
  };

  return (
    <div className="p-3 border-t border-border/50 bg-background">
      {/* Attached file preview */}
      {attachedFile && (
        <div className="flex items-center gap-2 mb-2 p-2 rounded-xl bg-muted/30 border border-border/30">
          {attachedFile.type === 'image' ? (
            <ImageIcon className="w-4 h-4 text-blue-500" />
          ) : attachedFile.type === 'video' ? (
            <Video className="w-4 h-4 text-red-500" />
          ) : (
            <FileText className="w-4 h-4 text-amber-500" />
          )}
          <span className="text-xs flex-1 truncate">{attachedFile.name}</span>
          <button onClick={() => setAttachedFile(null)}>
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="اكتب منشوراً للقناة..."
            className="text-sm resize-none min-h-[44px] max-h-[120px] rounded-2xl"
            dir="rtl"
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit();
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Button
            variant="ghost" size="icon" className="h-8 w-8"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          </Button>
          <Button
            size="icon" className="h-10 w-10 rounded-full"
            onClick={handleSubmit}
            disabled={(!content.trim() && !attachedFile) || isPosting}
          >
            {isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
});
PostComposer.displayName = 'PostComposer';

// ═══════════════════════════════════════════════════════════════
// Channel Profile View
// ═══════════════════════════════════════════════════════════════
const ChannelProfileView = memo(({ channel, onBack, onSubscribeToggle }: {
  channel: BroadcastChannel;
  onBack: () => void;
  onSubscribeToggle: () => void;
}) => {
  return (
    <div className="flex flex-col h-full overflow-y-auto" dir="rtl">
      <div className="flex items-center gap-2 p-3 border-b border-border/50 sticky top-0 bg-background z-10">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
          <ChevronRight className="w-4 h-4" />
        </Button>
        <span className="text-sm font-semibold">معلومات القناة</span>
      </div>

      <div className="relative w-full aspect-[3/1] bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
        {channel.cover_url ? (
          <img src={channel.cover_url} alt="غلاف" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Radio className="w-12 h-12 text-primary/20" />
          </div>
        )}
      </div>

      <div className="flex flex-col items-center -mt-10 relative z-10 px-4">
        <Avatar className="w-20 h-20 border-4 border-background shadow-lg">
          {channel.avatar_url && <AvatarImage src={channel.avatar_url} />}
          <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
            {channel.name.charAt(0)}
          </AvatarFallback>
        </Avatar>

        <div className="flex items-center gap-1.5 mt-2">
          <h2 className="text-lg font-bold">{channel.name}</h2>
          {channel.is_verified && (
            <BadgeCheck className="w-5 h-5 text-blue-500 fill-blue-500/20" />
          )}
        </div>

        <p className="text-xs text-muted-foreground mt-0.5">
          قناة • {channel.subscriber_count?.toLocaleString('ar-EG')} متابعًا
        </p>
      </div>

      <div className="grid grid-cols-4 gap-2 px-4 mt-4">
        {[
          { icon: Search, label: 'بحث' },
          { icon: Share2, label: 'مشاركة' },
          { icon: Forward, label: 'إعادة توجيه' },
          { icon: channel.is_subscribed ? Check : Bell, label: channel.is_subscribed ? 'تتابعها' : 'متابعة', action: onSubscribeToggle },
        ].map((btn, i) => (
          <button
            key={i}
            onClick={btn.action}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors"
          >
            <btn.icon className="w-5 h-5 text-muted-foreground" />
            <span className="text-[11px] font-medium">{btn.label}</span>
          </button>
        ))}
      </div>

      {channel.description && (
        <div className="px-4 mt-4 py-3 border-t border-border/30">
          <p className="text-sm leading-relaxed">{channel.description}</p>
          <p className="text-[10px] text-muted-foreground mt-2">
            أنشئت في {format(new Date(channel.created_at), 'yyyy/M/d', { locale: ar })}
          </p>
        </div>
      )}

      <div className="px-4 mt-2 space-y-0 border-t border-border/30">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <Bell className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">كتم الإشعارات</span>
          </div>
          <div className="w-10 h-5 rounded-full bg-muted relative cursor-pointer">
            <div className="w-4 h-4 rounded-full bg-background shadow absolute top-0.5 right-0.5" />
          </div>
        </div>

        <div className="flex items-center justify-between py-3 border-t border-border/30">
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">قناة عامة</p>
              <p className="text-[10px] text-muted-foreground">يمكن لأي شخص العثور على هذه القناة ورؤية ما تم مشاركته.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
ChannelProfileView.displayName = 'ChannelProfileView';

// ═══════════════════════════════════════════════════════════════
// Create Channel Dialog
// ═══════════════════════════════════════════════════════════════
const CreateBroadcastDialog = memo(({ open, onOpenChange, onCreate }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (data: { name: string; description?: string }) => void;
}) => {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) return;
    onCreate({ name: name.trim(), description: desc.trim() || undefined });
    setName('');
    setDesc('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-primary" />
            إنشاء قناة بث جديدة
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs mb-1.5 block">اسم القناة</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="مثال: أخبار شركة الناقل" className="text-sm" />
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">الوصف (اختياري)</Label>
            <Textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="وصف مختصر للقناة..." className="text-sm min-h-[60px]" />
          </div>
          <Button onClick={handleSubmit} className="w-full" disabled={!name.trim()}>
            إنشاء القناة
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});
CreateBroadcastDialog.displayName = 'CreateBroadcastDialog';

// ═══════════════════════════════════════════════════════════════
// Channel Feed View
// ═══════════════════════════════════════════════════════════════
const ChannelFeedView = memo(({ channel, onBack, onShowProfile }: {
  channel: BroadcastChannel;
  onBack: () => void;
  onShowProfile: () => void;
}) => {
  const { subscribe, unsubscribe } = useBroadcastChannels();
  const {
    posts, isLoading: postsLoading, myReactions,
    createPost, toggleReaction, togglePin, deletePost, recordView, uploadFile, isPosting,
  } = useBroadcastPosts(channel.id);

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Channel Header */}
      <div className="flex items-center gap-2 p-2.5 border-b border-border/50 bg-background sticky top-0 z-10">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
          <ChevronRight className="w-4 h-4" />
        </Button>

        <button onClick={onShowProfile} className="flex items-center gap-2 flex-1 min-w-0">
          <Avatar className="w-9 h-9">
            {channel.avatar_url && <AvatarImage src={channel.avatar_url} />}
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
              {channel.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 text-right">
            <div className="flex items-center gap-1">
              <p className="text-sm font-semibold truncate">{channel.name}</p>
              {channel.is_verified && (
                <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500/20 shrink-0" />
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {channel.subscriber_count?.toLocaleString('ar-EG')} متابع
            </p>
          </div>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={onShowProfile}>معلومات القناة</DropdownMenuItem>
            <DropdownMenuItem>بحث في المنشورات</DropdownMenuItem>
            <DropdownMenuItem>مشاركة القناة</DropdownMenuItem>
            <DropdownMenuSeparator />
            {channel.is_subscribed ? (
              <DropdownMenuItem onClick={() => unsubscribe(channel.id)} className="text-destructive">
                إلغاء المتابعة
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => subscribe(channel.id)}>
                متابعة القناة
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Date Separator */}
      <div className="flex justify-center py-2">
        <span className="text-[10px] text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
          {format(new Date(), 'dd MMMM yyyy', { locale: ar })}
        </span>
      </div>

      {/* Posts Feed */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-3 custom-scrollbar">
        {postsLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <Radio className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">لا توجد منشورات بعد</p>
            {channel.is_mine && (
              <p className="text-xs text-muted-foreground mt-1">ابدأ بنشر أول منشور في قناتك</p>
            )}
          </div>
        ) : (
          posts.map((p: any) => (
            <PostCard
              key={p.id}
              post={p}
              channelName={channel.name}
              channelAvatar={channel.avatar_url || undefined}
              onReact={(postId, type) => toggleReaction({ postId, type })}
              myReactions={myReactions}
              isMine={!!channel.is_mine}
              onPin={togglePin}
              onDelete={deletePost}
              onRecordView={recordView}
            />
          ))
        )}
      </div>

      {/* Post Composer (owner only) */}
      {channel.is_mine && (
        <PostComposer
          channelId={channel.id}
          onPost={createPost}
          isPosting={isPosting}
          onUpload={uploadFile}
        />
      )}
    </div>
  );
});
ChannelFeedView.displayName = 'ChannelFeedView';

// ═══════════════════════════════════════════════════════════════
// Channel List View
// ═══════════════════════════════════════════════════════════════
const ChannelListView = memo(({ channels, isLoading, onSelect, onBack, onCreate }: {
  channels: BroadcastChannel[];
  isLoading: boolean;
  onSelect: (ch: BroadcastChannel) => void;
  onBack?: () => void;
  onCreate: () => void;
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const filtered = channels.filter(ch =>
    !searchQuery || ch.name.includes(searchQuery) || ch.description?.includes(searchQuery)
  );

  // Split into my channels and others
  const myChannels = filtered.filter(ch => ch.is_mine);
  const subscribedChannels = filtered.filter(ch => !ch.is_mine && ch.is_subscribed);
  const discoverChannels = filtered.filter(ch => !ch.is_mine && !ch.is_subscribed);

  const renderChannel = (ch: BroadcastChannel, i: number) => (
    <motion.button
      key={ch.id}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.03 }}
      onClick={() => onSelect(ch)}
      className="w-full flex items-center gap-3 p-3 rounded-2xl border border-border/40 hover:bg-muted/30 transition-all group"
    >
      <Avatar className="w-12 h-12 shrink-0">
        {ch.avatar_url && <AvatarImage src={ch.avatar_url} />}
        <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
          {ch.name.charAt(0)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0 text-right">
        <div className="flex items-center gap-1">
          <p className="text-sm font-semibold truncate">{ch.name}</p>
          {ch.is_verified && (
            <BadgeCheck className="w-3.5 h-3.5 text-blue-500 fill-blue-500/20 shrink-0" />
          )}
        </div>
        <p className="text-[10px] text-muted-foreground truncate mt-0.5">
          {ch.description || 'قناة بث رسمية'}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        {ch.is_mine && (
          <Badge variant="outline" className="text-[9px] h-4 bg-primary/5 border-primary/20 text-primary">
            قناتي
          </Badge>
        )}
        {ch.is_subscribed && !ch.is_mine && (
          <Badge className="text-[9px] h-4 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
            مشترك
          </Badge>
        )}
        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
          <Users className="w-3 h-3" />
          {ch.subscriber_count?.toLocaleString('ar-EG')}
        </span>
      </div>
    </motion.button>
  );

  const SectionHeader = ({ title, count }: { title: string; count: number }) => (
    count > 0 ? (
      <div className="flex items-center gap-2 mt-3 mb-1">
        <span className="text-xs font-semibold text-muted-foreground">{title}</span>
        <Badge variant="secondary" className="text-[9px] h-4">{count}</Badge>
      </div>
    ) : null
  );

  return (
    <div className="flex flex-col h-full" dir="rtl">
      <div className="p-3 border-b border-border/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {onBack && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
            <Radio className="w-5 h-5 text-primary" />
            <h2 className="text-base font-bold">قنوات البث</h2>
            <Badge variant="secondary" className="text-[10px]">{channels.length}</Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowSearch(!showSearch)}>
              <Search className="w-4 h-4" />
            </Button>
            <Button size="sm" className="h-8 text-xs gap-1" onClick={onCreate}>
              <Plus className="w-3.5 h-3.5" />
              إنشاء قناة
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {showSearch && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="ابحث في القنوات..."
                className="text-sm h-9 mt-2"
                autoFocus
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Radio className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'لا توجد نتائج' : 'لا توجد قنوات بث بعد'}
            </p>
            {!searchQuery && (
              <Button variant="outline" size="sm" className="mt-3 gap-1" onClick={onCreate}>
                <Plus className="w-3.5 h-3.5" />
                إنشاء أول قناة
              </Button>
            )}
          </div>
        ) : (
          <>
            <SectionHeader title="قنواتي" count={myChannels.length} />
            {myChannels.map((ch, i) => renderChannel(ch, i))}

            <SectionHeader title="اشتراكاتي" count={subscribedChannels.length} />
            {subscribedChannels.map((ch, i) => renderChannel(ch, i))}

            <SectionHeader title="اكتشف المزيد" count={discoverChannels.length} />
            {discoverChannels.map((ch, i) => renderChannel(ch, i))}
          </>
        )}
      </div>
    </div>
  );
});
ChannelListView.displayName = 'ChannelListView';

// ═══════════════════════════════════════════════════════════════
// Main Broadcast Channel View (Orchestrator)
// ═══════════════════════════════════════════════════════════════
const BroadcastChannelView = memo(({ onBack }: BroadcastChannelViewProps) => {
  const { channels, isLoading, createChannel, subscribe, unsubscribe } = useBroadcastChannels();
  const [selectedChannel, setSelectedChannel] = useState<BroadcastChannel | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const handleSubscribeToggle = () => {
    if (!selectedChannel) return;
    if (selectedChannel.is_subscribed) unsubscribe(selectedChannel.id);
    else subscribe(selectedChannel.id);
  };

  // Profile view
  if (selectedChannel && showProfile) {
    return (
      <ChannelProfileView
        channel={selectedChannel}
        onBack={() => setShowProfile(false)}
        onSubscribeToggle={handleSubscribeToggle}
      />
    );
  }

  // Channel feed view
  if (selectedChannel) {
    return (
      <ChannelFeedView
        channel={selectedChannel}
        onBack={() => setSelectedChannel(null)}
        onShowProfile={() => setShowProfile(true)}
      />
    );
  }

  // Channel list
  return (
    <>
      <ChannelListView
        channels={channels}
        isLoading={isLoading}
        onSelect={setSelectedChannel}
        onBack={onBack}
        onCreate={() => setShowCreate(true)}
      />
      <CreateBroadcastDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreate={createChannel}
      />
    </>
  );
});

BroadcastChannelView.displayName = 'BroadcastChannelView';
export default BroadcastChannelView;
