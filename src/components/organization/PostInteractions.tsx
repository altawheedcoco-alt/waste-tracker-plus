import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ThumbsUp, MessageCircle, Send, Trash2, User, 
  Reply, Heart, ChevronDown, ChevronUp, Share2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// ─── Facebook-style reaction definitions ────────────────
const REACTIONS = [
  { type: 'like', emoji: '👍', label: 'أعجبني', color: 'text-blue-500' },
  { type: 'love', emoji: '❤️', label: 'أحببته', color: 'text-red-500' },
  { type: 'haha', emoji: '😂', label: 'هاها', color: 'text-amber-500' },
  { type: 'wow', emoji: '😮', label: 'واو', color: 'text-amber-500' },
  { type: 'sad', emoji: '😢', label: 'حزين', color: 'text-amber-500' },
  { type: 'angry', emoji: '😡', label: 'غاضب', color: 'text-orange-600' },
];

const getReactionEmoji = (type: string) => REACTIONS.find(r => r.type === type)?.emoji || '👍';
const getReactionColor = (type: string) => REACTIONS.find(r => r.type === type)?.color || 'text-blue-500';

interface PostInteractionsProps {
  postId: string;
  likesCount: number;
  showComments?: boolean;
}

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  parent_id?: string | null;
  profile?: {
    full_name: string;
    avatar_url: string | null;
  };
  likesCount?: number;
  userLiked?: boolean;
  replies?: Comment[];
}

interface ReactionSummary {
  type: string;
  count: number;
}

const PostInteractions = ({ postId, likesCount, showComments = true }: PostInteractionsProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showAllComments, setShowAllComments] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  // ─── Fetch reactions for this post ────────────────────
  const { data: reactionsData } = useQuery({
    queryKey: ['post-reactions', postId],
    queryFn: async () => {
      const { data } = await supabase
        .from('post_reactions')
        .select('*')
        .eq('post_id', postId);
      return data || [];
    },
  });

  const userReaction = reactionsData?.find(r => r.user_id === user?.id);
  const reactionSummary = useMemo((): ReactionSummary[] => {
    if (!reactionsData?.length) return [];
    const counts = new Map<string, number>();
    reactionsData.forEach(r => counts.set(r.reaction_type, (counts.get(r.reaction_type) || 0) + 1));
    return Array.from(counts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }, [reactionsData]);

  const totalReactions = reactionsData?.length || 0;

  // ─── Fetch comments ───────────────────────────────────
  const { data: comments = [] } = useQuery({
    queryKey: ['post-comments', postId],
    queryFn: async () => {
      const { data: commentsData, error } = await supabase
        .from('organization_post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const userIds = [...new Set(commentsData?.map(c => c.user_id) || [])];
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      const profilesMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Get comment likes
      const commentIds = commentsData?.map(c => c.id) || [];
      let commentLikesMap = new Map<string, { count: number; userLiked: boolean }>();
      
      if (commentIds.length > 0) {
        const { data: cLikes } = await supabase
          .from('comment_likes')
          .select('*')
          .in('comment_id', commentIds);
        
        (cLikes || []).forEach(cl => {
          const existing = commentLikesMap.get(cl.comment_id) || { count: 0, userLiked: false };
          existing.count++;
          if (cl.user_id === user?.id) existing.userLiked = true;
          commentLikesMap.set(cl.comment_id, existing);
        });
      }

      const allComments = (commentsData || []).map(comment => ({
        ...comment,
        profile: profilesMap.get(comment.user_id),
        likesCount: commentLikesMap.get(comment.id)?.count || 0,
        userLiked: commentLikesMap.get(comment.id)?.userLiked || false,
      })) as Comment[];

      // Build threaded comments
      const topLevel = allComments.filter(c => !c.parent_id);
      const replies = allComments.filter(c => !!c.parent_id);
      
      return topLevel.map(c => ({
        ...c,
        replies: replies.filter(r => r.parent_id === c.id),
      }));
    },
    enabled: isCommentsOpen,
  });

  const commentsCount = useMemo(() => {
    return comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);
  }, [comments]);

  // ─── React mutation ───────────────────────────────────
  const reactMutation = useMutation({
    mutationFn: async (reactionType: string) => {
      if (!user?.id) throw new Error('يجب تسجيل الدخول');

      if (userReaction) {
        if (userReaction.reaction_type === reactionType) {
          // Remove reaction
          await supabase.from('post_reactions').delete().eq('id', userReaction.id);
        } else {
          // Change reaction
          await supabase.from('post_reactions')
            .update({ reaction_type: reactionType })
            .eq('id', userReaction.id);
        }
      } else {
        // Add reaction
        await supabase.from('post_reactions')
          .insert({ post_id: postId, user_id: user.id, reaction_type: reactionType });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-reactions', postId] });
      setShowReactionPicker(false);
    },
  });

  // ─── Comment mutation ─────────────────────────────────
  const commentMutation = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId?: string }) => {
      if (!user?.id) throw new Error('يجب تسجيل الدخول');
      const { error } = await supabase
        .from('organization_post_comments')
        .insert({ 
          post_id: postId, 
          user_id: user.id, 
          content,
          ...(parentId ? { parent_id: parentId } : {}),
        });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewComment('');
      setReplyText('');
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
    },
  });

  // ─── Delete comment ───────────────────────────────────
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from('organization_post_comments')
        .delete()
        .eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
      toast.success('تم حذف التعليق');
    },
  });

  // ─── Like comment ─────────────────────────────────────
  const likeCommentMutation = useMutation({
    mutationFn: async ({ commentId, liked }: { commentId: string; liked: boolean }) => {
      if (!user?.id) throw new Error('يجب تسجيل الدخول');
      if (liked) {
        await supabase.from('comment_likes').delete()
          .eq('comment_id', commentId).eq('user_id', user.id);
      } else {
        await supabase.from('comment_likes')
          .insert({ comment_id: commentId, user_id: user.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
    },
  });

  const handleQuickLike = () => {
    if (!user?.id) { toast.error('يجب تسجيل الدخول'); return; }
    reactMutation.mutate(userReaction ? userReaction.reaction_type : 'like');
  };

  const visibleComments = showAllComments ? comments : comments.slice(0, 3);

  return (
    <div className="space-y-2">
      {/* ─── Reactions Summary Bar ────────────────────────── */}
      {(totalReactions > 0 || commentsCount > 0) && (
        <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
          {totalReactions > 0 ? (
            <div className="flex items-center gap-1">
              <div className="flex -space-x-1">
                {reactionSummary.slice(0, 3).map(r => (
                  <span key={r.type} className="text-sm">{getReactionEmoji(r.type)}</span>
                ))}
              </div>
              <span>{totalReactions}</span>
            </div>
          ) : <div />}
          {commentsCount > 0 && (
            <button 
              onClick={() => setIsCommentsOpen(!isCommentsOpen)}
              className="hover:underline"
            >
              {commentsCount} تعليق
            </button>
          )}
        </div>
      )}

      {/* ─── Action Buttons ──────────────────────────────── */}
      <div className="border-t border-b border-border py-1 flex items-center">
        {/* Like/React Button */}
        <Popover open={showReactionPicker} onOpenChange={setShowReactionPicker}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "flex-1 gap-2 rounded-none h-9",
                userReaction && getReactionColor(userReaction.reaction_type)
              )}
              onClick={handleQuickLike}
              onMouseEnter={() => setShowReactionPicker(true)}
            >
              {userReaction ? (
                <>
                  <span className="text-lg leading-none">{getReactionEmoji(userReaction.reaction_type)}</span>
                  <span className="text-xs">{REACTIONS.find(r => r.type === userReaction.reaction_type)?.label}</span>
                </>
              ) : (
                <>
                  <ThumbsUp className="w-4 h-4" />
                  <span className="text-xs">أعجبني</span>
                </>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-auto p-1.5 rounded-full shadow-xl border" 
            side="top" 
            align="start"
            onMouseLeave={() => setShowReactionPicker(false)}
          >
            <div className="flex items-center gap-0.5">
              {REACTIONS.map((reaction) => (
                <button
                  key={reaction.type}
                  onClick={() => reactMutation.mutate(reaction.type)}
                  className={cn(
                    "w-10 h-10 flex flex-col items-center justify-center rounded-full transition-all hover:scale-125 hover:bg-muted",
                    userReaction?.reaction_type === reaction.type && "bg-muted scale-110"
                  )}
                  title={reaction.label}
                >
                  <span className="text-2xl leading-none">{reaction.emoji}</span>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Comment Button */}
        {showComments && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCommentsOpen(!isCommentsOpen)}
            className="flex-1 gap-2 rounded-none h-9"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-xs">تعليق</span>
          </Button>
        )}

        {/* Share Button */}
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 gap-2 rounded-none h-9"
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            toast.success('تم نسخ الرابط');
          }}
        >
          <Share2 className="w-4 h-4" />
          <span className="text-xs">مشاركة</span>
        </Button>
      </div>

      {/* ─── Comments Section ────────────────────────────── */}
      <AnimatePresence>
        {showComments && isCommentsOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            {/* Comment Input */}
            <div className="flex gap-2 items-start">
              <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                <AvatarFallback className="bg-primary/10">
                  <User className="w-4 h-4 text-primary" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 relative">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="اكتب تعليقاً..."
                  className="pr-3 pl-10 bg-muted/50 border-none rounded-full h-9 text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && newComment.trim() && commentMutation.mutate({ content: newComment.trim() })}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => newComment.trim() && commentMutation.mutate({ content: newComment.trim() })}
                  disabled={!newComment.trim() || commentMutation.isPending}
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-1">
              {visibleComments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  userId={user?.id}
                  onReply={(id, name) => setReplyingTo({ id, name })}
                  onDelete={(id) => deleteCommentMutation.mutate(id)}
                  onLike={(id, liked) => likeCommentMutation.mutate({ commentId: id, liked })}
                  replyingTo={replyingTo}
                  replyText={replyText}
                  onReplyTextChange={setReplyText}
                  onSubmitReply={() => {
                    if (replyText.trim() && replyingTo) {
                      commentMutation.mutate({ content: replyText.trim(), parentId: replyingTo.id });
                    }
                  }}
                  onCancelReply={() => { setReplyingTo(null); setReplyText(''); }}
                />
              ))}

              {comments.length > 3 && !showAllComments && (
                <button
                  onClick={() => setShowAllComments(true)}
                  className="flex items-center gap-1 text-xs text-primary hover:underline px-10 py-1"
                >
                  <ChevronDown className="w-3 h-3" />
                  عرض {comments.length - 3} تعليقات أخرى
                </button>
              )}

              {comments.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-3">
                  كن أول من يعلق
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Comment Item Component ─────────────────────────────
const CommentItem = ({
  comment, userId, onReply, onDelete, onLike,
  replyingTo, replyText, onReplyTextChange, onSubmitReply, onCancelReply,
  isReply = false,
}: {
  comment: Comment;
  userId?: string;
  onReply: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onLike: (id: string, liked: boolean) => void;
  replyingTo: { id: string; name: string } | null;
  replyText: string;
  onReplyTextChange: (v: string) => void;
  onSubmitReply: () => void;
  onCancelReply: () => void;
  isReply?: boolean;
}) => {
  const [showReplies, setShowReplies] = useState(true);

  return (
    <div className={cn("flex gap-2", isReply && "mr-10")}>
      <Avatar className={cn("shrink-0", isReply ? "h-6 w-6" : "h-8 w-8")}>
        <AvatarImage src={comment.profile?.avatar_url || ''} />
        <AvatarFallback className="bg-primary/10">
          <User className={cn("text-primary", isReply ? "w-3 h-3" : "w-4 h-4")} />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        {/* Comment Bubble */}
        <div className="bg-muted/60 rounded-2xl px-3 py-2 inline-block max-w-full">
          <span className="font-semibold text-xs block">
            {comment.profile?.full_name || 'مستخدم'}
          </span>
          <p className="text-sm">{comment.content}</p>
        </div>

        {/* Comment Actions */}
        <div className="flex items-center gap-3 px-3 mt-0.5 text-[11px]">
          <span className="text-muted-foreground">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ar })}
          </span>
          <button
            onClick={() => onLike(comment.id, comment.userLiked || false)}
            className={cn(
              "font-semibold hover:underline",
              comment.userLiked ? "text-blue-500" : "text-muted-foreground"
            )}
          >
            أعجبني {comment.likesCount ? `(${comment.likesCount})` : ''}
          </button>
          {!isReply && (
            <button
              onClick={() => onReply(comment.id, comment.profile?.full_name || 'مستخدم')}
              className="font-semibold text-muted-foreground hover:underline"
            >
              رد
            </button>
          )}
          {userId === comment.user_id && (
            <button
              onClick={() => onDelete(comment.id)}
              className="text-destructive hover:underline"
            >
              حذف
            </button>
          )}
        </div>

        {/* Replies */}
        {!isReply && comment.replies && comment.replies.length > 0 && (
          <div className="mt-1">
            {comment.replies.length > 2 && !showReplies && (
              <button
                onClick={() => setShowReplies(true)}
                className="flex items-center gap-1 text-xs text-primary hover:underline px-3 py-0.5"
              >
                <Reply className="w-3 h-3" /> عرض {comment.replies.length} رد
              </button>
            )}
            {showReplies && comment.replies.map(reply => (
              <CommentItem
                key={reply.id}
                comment={reply}
                userId={userId}
                onReply={onReply}
                onDelete={onDelete}
                onLike={onLike}
                replyingTo={replyingTo}
                replyText={replyText}
                onReplyTextChange={onReplyTextChange}
                onSubmitReply={onSubmitReply}
                onCancelReply={onCancelReply}
                isReply
              />
            ))}
          </div>
        )}

        {/* Reply Input */}
        {!isReply && replyingTo?.id === comment.id && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex gap-2 items-center mt-1.5 mr-10"
          >
            <Avatar className="h-6 w-6 shrink-0">
              <AvatarFallback className="bg-primary/10">
                <User className="w-3 h-3 text-primary" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 relative">
              <Input
                value={replyText}
                onChange={(e) => onReplyTextChange(e.target.value)}
                placeholder={`رد على ${replyingTo.name}...`}
                className="pr-3 pl-16 bg-muted/50 border-none rounded-full h-8 text-xs"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && replyText.trim()) onSubmitReply();
                  if (e.key === 'Escape') onCancelReply();
                }}
              />
              <div className="absolute left-1 top-1/2 -translate-y-1/2 flex gap-0.5">
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onCancelReply}>
                  <Trash2 className="w-3 h-3 text-muted-foreground" />
                </Button>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onSubmitReply} disabled={!replyText.trim()}>
                  <Send className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PostInteractions;
