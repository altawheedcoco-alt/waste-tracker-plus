import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const getVisitorId = () => {
  let id = localStorage.getItem('visitor_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('visitor_id', id);
  }
  return id;
};

export function usePostLike(postId: string) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const visitorId = getVisitorId();

  useEffect(() => {
    if (!postId) return;
    // Check if already liked
    (supabase as any)
      .from('platform_post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('visitor_id', visitorId)
      .maybeSingle()
      .then(({ data }: any) => {
        setLiked(!!data);
      });
  }, [postId, visitorId]);

  const toggleLike = useCallback(async () => {
    if (loading || !postId) return;
    setLoading(true);
    try {
      const { data } = await (supabase as any).rpc('toggle_post_like', {
        p_post_id: postId,
        p_visitor_id: visitorId,
      });
      setLiked(data);
      setLikesCount(prev => data ? prev + 1 : Math.max(prev - 1, 0));
    } finally {
      setLoading(false);
    }
  }, [postId, visitorId, loading]);

  return { liked, likesCount, setLikesCount, toggleLike, loading };
}
