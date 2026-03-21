import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface BroadcastComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_comment_id: string | null;
  likes_count: number;
  created_at: string;
  // joined
  user_name?: string;
  user_avatar?: string;
}

export function useBroadcastComments(postId: string | undefined) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['broadcast-comments', postId],
    queryFn: async () => {
      if (!postId) return [];
      const { data } = await (supabase as any)
        .from('broadcast_post_comments')
        .select('*, profiles:user_id(full_name, avatar_url)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      return (data || []).map((c: any) => ({
        ...c,
        user_name: c.profiles?.full_name || 'مستخدم',
        user_avatar: c.profiles?.avatar_url,
      })) as BroadcastComment[];
    },
    enabled: !!postId,
  });

  const addComment = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId?: string }) => {
      if (!user || !postId) throw new Error('Not authenticated');
      const { error } = await (supabase as any).from('broadcast_post_comments').insert({
        post_id: postId, user_id: user.id, content,
        parent_comment_id: parentId || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['broadcast-comments', postId] });
      qc.invalidateQueries({ queryKey: ['broadcast-posts'] });
    },
    onError: () => toast.error('فشل إضافة التعليق'),
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await (supabase as any).from('broadcast_post_comments').delete().eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['broadcast-comments', postId] });
      qc.invalidateQueries({ queryKey: ['broadcast-posts'] });
    },
  });

  const toggleLike = useMutation({
    mutationFn: async (commentId: string) => {
      if (!user) return;
      const { data: existing } = await (supabase as any)
        .from('broadcast_comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        await (supabase as any).from('broadcast_comment_likes').delete().eq('id', existing.id);
      } else {
        await (supabase as any).from('broadcast_comment_likes').insert({
          comment_id: commentId, user_id: user.id,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['broadcast-comments', postId] });
    },
  });

  return {
    comments, isLoading,
    addComment: addComment.mutate,
    deleteComment: deleteComment.mutate,
    toggleLike: toggleLike.mutate,
    isAdding: addComment.isPending,
  };
}
