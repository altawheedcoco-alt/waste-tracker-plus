import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useEffect } from 'react';

export interface BroadcastPost {
  id: string;
  channel_id: string;
  sender_id: string;
  content: string;
  post_type: string;
  file_url: string | null;
  file_name: string | null;
  media_urls: string[];
  media_types: string[];
  media_names: string[];
  link_url: string | null;
  link_title: string | null;
  link_preview_image: string | null;
  views_count: number;
  reactions_count: number;
  reactions_summary: Record<string, number>;
  comments_count: number;
  forward_count: number;
  is_pinned: boolean;
  created_at: string;
  edited_at: string | null;
  metadata: any;
}

export function useBroadcastPosts(channelId: string | undefined) {
  const { user } = useAuth();
  const qc = useQueryClient();

  // ─── Fetch posts ───
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['broadcast-posts', channelId],
    queryFn: async () => {
      if (!channelId) return [];
      const { data } = await (supabase as any)
        .from('broadcast_posts')
        .select('*')
        .eq('channel_id', channelId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);
      return (data || []).map((p: any) => ({
        ...p,
        media_urls: p.media_urls || [],
        media_types: p.media_types || [],
        media_names: p.media_names || [],
      })) as BroadcastPost[];
    },
    enabled: !!channelId,
  });

  // ─── Realtime subscription ───
  useEffect(() => {
    if (!channelId) return;
    const channel = supabase
      .channel(`broadcast-posts-${channelId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'broadcast_posts',
        filter: `channel_id=eq.${channelId}`,
      }, () => {
        qc.invalidateQueries({ queryKey: ['broadcast-posts', channelId] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [channelId, qc]);

  // ─── My reactions ───
  const { data: myReactionsData = [] } = useQuery({
    queryKey: ['my-broadcast-reactions', channelId, user?.id],
    queryFn: async () => {
      if (!channelId || !user) return [];
      const postIds = posts.map(p => p.id);
      if (!postIds.length) return [];
      const { data } = await (supabase as any)
        .from('broadcast_post_reactions')
        .select('post_id, reaction_type')
        .eq('user_id', user.id)
        .in('post_id', postIds);
      return data || [];
    },
    enabled: !!channelId && !!user && posts.length > 0,
  });

  const myReactions = new Set<string>(
    myReactionsData.map((r: any) => `${r.post_id}-${r.reaction_type}`)
  );

  // ─── Create post (supports multiple media) ───
  const createPost = useMutation({
    mutationFn: async ({ content, postType, fileUrl, fileName, mediaUrls, mediaTypes, mediaNames }: {
      content: string; postType?: string; fileUrl?: string; fileName?: string;
      mediaUrls?: string[]; mediaTypes?: string[]; mediaNames?: string[];
    }) => {
      if (!user || !channelId) throw new Error('Not authenticated');
      const insertData: Record<string, any> = {
        channel_id: channelId, sender_id: user.id, content,
        post_type: postType || 'text',
      };
      // Support multi-media
      if (mediaUrls && mediaUrls.length > 0) {
        insertData.media_urls = mediaUrls;
        insertData.media_types = mediaTypes || [];
        insertData.media_names = mediaNames || [];
        insertData.post_type = 'multi_media';
        // Keep first file in legacy columns for backward compat
        insertData.file_url = mediaUrls[0];
        insertData.file_name = mediaNames?.[0] || null;
      } else if (fileUrl) {
        insertData.file_url = fileUrl;
        insertData.file_name = fileName;
      }
      const { error } = await (supabase as any).from('broadcast_posts').insert(insertData);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['broadcast-posts', channelId] });
      toast.success('تم نشر المنشور');
    },
    onError: () => toast.error('فشل نشر المنشور'),
  });

  // ─── Toggle reaction ───
  const toggleReaction = useMutation({
    mutationFn: async ({ postId, type }: { postId: string; type: string }) => {
      if (!user) return;
      const key = `${postId}-${type}`;
      if (myReactions.has(key)) {
        await (supabase as any).from('broadcast_post_reactions')
          .delete().eq('post_id', postId).eq('user_id', user.id).eq('reaction_type', type);
      } else {
        await (supabase as any).from('broadcast_post_reactions')
          .insert({ post_id: postId, user_id: user.id, reaction_type: type });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['broadcast-posts', channelId] });
      qc.invalidateQueries({ queryKey: ['my-broadcast-reactions', channelId] });
    },
  });

  // ─── Toggle pin ───
  const togglePin = useMutation({
    mutationFn: async (postId: string) => {
      const post = posts.find(p => p.id === postId);
      if (!post) return;
      await (supabase as any).from('broadcast_posts')
        .update({ is_pinned: !post.is_pinned })
        .eq('id', postId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['broadcast-posts', channelId] });
      toast.success('تم تحديث المنشور المثبت');
    },
  });

  // ─── Delete post ───
  const deletePost = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await (supabase as any).from('broadcast_posts').delete().eq('id', postId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['broadcast-posts', channelId] });
      toast.success('تم حذف المنشور');
    },
  });

  // ─── Record view ───
  const recordView = useMutation({
    mutationFn: async (postId: string) => {
      if (!user) return;
      await (supabase as any).from('broadcast_post_views')
        .upsert({ post_id: postId, user_id: user.id }, { onConflict: 'post_id,user_id' });
    },
  });

  // ─── Upload file ───
  const uploadFile = async (file: File): Promise<{ url: string; name: string; type: string } | null> => {
    if (!channelId) return null;
    const ext = file.name.split('.').pop();
    const path = `broadcast/${channelId}/${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`;
    const { error } = await supabase.storage.from('public-assets').upload(path, file);
    if (error) { toast.error('فشل رفع الملف'); return null; }
    const { data: urlData } = supabase.storage.from('public-assets').getPublicUrl(path);
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    return { url: urlData.publicUrl, name: file.name, type: isImage ? 'image' : isVideo ? 'video' : 'document' };
  };

  // ─── Upload multiple files ───
  const uploadMultipleFiles = async (files: File[]): Promise<{ url: string; name: string; type: string }[]> => {
    const results: { url: string; name: string; type: string }[] = [];
    // Upload in batches of 5 for performance
    for (let i = 0; i < files.length; i += 5) {
      const batch = files.slice(i, i + 5);
      const batchResults = await Promise.all(batch.map(f => uploadFile(f)));
      results.push(...batchResults.filter(Boolean) as { url: string; name: string; type: string }[]);
    }
    return results;
  };

  return {
    posts, isLoading, myReactions,
    createPost: createPost.mutate,
    toggleReaction: toggleReaction.mutate,
    togglePin: togglePin.mutate,
    deletePost: deletePost.mutate,
    recordView: recordView.mutate,
    uploadFile,
    uploadMultipleFiles,
    isPosting: createPost.isPending,
  };
}
