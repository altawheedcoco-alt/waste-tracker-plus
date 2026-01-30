import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Send, Trash2, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

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
  profile?: {
    full_name: string;
    avatar_url: string | null;
  };
}

const PostInteractions = ({ postId, likesCount, showComments = true }: PostInteractionsProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  // Check if user liked the post
  const { data: userLiked = false } = useQuery({
    queryKey: ['post-like', postId, user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase
        .from('organization_post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user?.id,
  });

  // Fetch comments
  const { data: comments = [] } = useQuery({
    queryKey: ['post-comments', postId],
    queryFn: async () => {
      const { data: commentsData, error } = await supabase
        .from('organization_post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch profiles for commenters
      const userIds = [...new Set(commentsData?.map(c => c.user_id) || [])];
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      const profilesMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return (commentsData || []).map(comment => ({
        ...comment,
        profile: profilesMap.get(comment.user_id),
      })) as Comment[];
    },
    enabled: isCommentsOpen,
  });

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('يجب تسجيل الدخول');

      if (userLiked) {
        const { error } = await supabase
          .from('organization_post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('organization_post_likes')
          .insert({ post_id: postId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-like', postId] });
      queryClient.invalidateQueries({ queryKey: ['organization-posts'] });
      queryClient.invalidateQueries({ queryKey: ['partners-timeline'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Comment mutation
  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user?.id) throw new Error('يجب تسجيل الدخول');

      const { error } = await supabase
        .from('organization_post_comments')
        .insert({ post_id: postId, user_id: user.id, content });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewComment('');
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
      toast.success('تم إضافة التعليق');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete comment mutation
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
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleLike = () => {
    if (!user?.id) {
      toast.error('يجب تسجيل الدخول للإعجاب');
      return;
    }
    likeMutation.mutate();
  };

  const handleComment = () => {
    if (!newComment.trim()) return;
    commentMutation.mutate(newComment.trim());
  };

  return (
    <div className="border-t border-border pt-3 mt-3">
      {/* Actions */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          disabled={likeMutation.isPending}
          className={`gap-2 ${userLiked ? 'text-red-500 hover:text-red-600' : ''}`}
        >
          <Heart className={`w-5 h-5 ${userLiked ? 'fill-current' : ''}`} />
          <span>{likesCount || 0}</span>
        </Button>

        {showComments && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCommentsOpen(!isCommentsOpen)}
            className="gap-2"
          >
            <MessageCircle className="w-5 h-5" />
            <span>{comments.length || 0}</span>
          </Button>
        )}
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && isCommentsOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 space-y-3"
          >
            {/* Comment Input */}
            <div className="flex gap-2">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="أضف تعليقاً..."
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleComment()}
              />
              <Button
                size="icon"
                onClick={handleComment}
                disabled={!newComment.trim() || commentMutation.isPending}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            {/* Comments List */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {comments.map((comment) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2 p-2 rounded-lg bg-muted/50"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.profile?.avatar_url || ''} />
                    <AvatarFallback className="bg-primary/10">
                      <User className="w-4 h-4 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm">
                        {comment.profile?.full_name || 'مستخدم'}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ar })}
                        </span>
                        {user?.id === comment.user_id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={() => deleteCommentMutation.mutate(comment.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-foreground">{comment.content}</p>
                  </div>
                </motion.div>
              ))}

              {comments.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  لا توجد تعليقات بعد
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PostInteractions;
