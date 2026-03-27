import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Reel {
  id: string;
  user_id: string;
  organization_id: string | null;
  video_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  hashtags: string[];
  duration_seconds: number;
  view_count: number;
  like_count: number;
  comment_count: number;
  is_active: boolean;
  created_at: string;
  profile?: { full_name: string; avatar_url: string | null };
  org_name?: string;
  is_liked?: boolean;
  is_bookmarked?: boolean;
}

export interface ReelComment {
  id: string;
  reel_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  like_count: number;
  created_at: string;
  profile?: { full_name: string; avatar_url: string | null };
}

export function useReelsFeed() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['reels-feed'],
    queryFn: async () => {
      const { data: reels, error } = await supabase
        .from('reels')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch profiles for each reel
      const userIds = [...new Set((reels || []).map(r => r.user_id))];
      const orgIds = [...new Set((reels || []).map(r => r.organization_id).filter(Boolean))];

      const [profilesRes, orgsRes, likesRes, bookmarksRes] = await Promise.all([
        userIds.length > 0
          ? supabase.from('profiles').select('id, full_name, avatar_url').in('id', userIds)
          : { data: [] },
        orgIds.length > 0
          ? supabase.from('organizations').select('id, name').in('id', orgIds as string[])
          : { data: [] },
        user
          ? supabase.from('reel_likes').select('reel_id').eq('user_id', user.id)
          : { data: [] },
        user
          ? supabase.from('reel_bookmarks').select('reel_id').eq('user_id', user.id)
          : { data: [] },
      ]);

      const profileMap = new Map((profilesRes.data || []).map(p => [p.id, p]));
      const orgMap = new Map((orgsRes.data || []).map(o => [o.id, o.name]));
      const likedIds = new Set((likesRes.data || []).map(l => l.reel_id));
      const bookmarkedIds = new Set((bookmarksRes.data || []).map(b => b.reel_id));

      return (reels || []).map(r => ({
        ...r,
        hashtags: r.hashtags || [],
        profile: profileMap.get(r.user_id) || { full_name: 'مستخدم', avatar_url: null },
        org_name: r.organization_id ? orgMap.get(r.organization_id) : undefined,
        is_liked: likedIds.has(r.id),
        is_bookmarked: bookmarkedIds.has(r.id),
      })) as Reel[];
    },
    enabled: !!user,
  });
}

export function useReelComments(reelId: string | null) {
  return useQuery({
    queryKey: ['reel-comments', reelId],
    queryFn: async () => {
      if (!reelId) return [];
      const { data, error } = await supabase
        .from('reel_comments')
        .select('*')
        .eq('reel_id', reelId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      const userIds = [...new Set((data || []).map(c => c.user_id))];
      const { data: profiles } = userIds.length > 0
        ? await supabase.from('profiles').select('id, full_name, avatar_url').in('id', userIds)
        : { data: [] };

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      return (data || []).map(c => ({
        ...c,
        profile: profileMap.get(c.user_id) || { full_name: 'مستخدم', avatar_url: null },
      })) as ReelComment[];
    },
    enabled: !!reelId,
  });
}

export function useReelActions() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  const toggleLike = useMutation({
    mutationFn: async ({ reelId, isLiked }: { reelId: string; isLiked: boolean }) => {
      if (!user) throw new Error('Not authenticated');
      if (isLiked) {
        await supabase.from('reel_likes').delete().eq('reel_id', reelId).eq('user_id', user.id);
      } else {
        await supabase.from('reel_likes').insert({ reel_id: reelId, user_id: user.id });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reels-feed'] }),
  });

  const toggleBookmark = useMutation({
    mutationFn: async ({ reelId, isBookmarked }: { reelId: string; isBookmarked: boolean }) => {
      if (!user) throw new Error('Not authenticated');
      if (isBookmarked) {
        await supabase.from('reel_bookmarks').delete().eq('reel_id', reelId).eq('user_id', user.id);
      } else {
        await supabase.from('reel_bookmarks').insert({ reel_id: reelId, user_id: user.id });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reels-feed'] });
      toast({ title: 'تم الحفظ' });
    },
  });

  const addComment = useMutation({
    mutationFn: async ({ reelId, content }: { reelId: string; content: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('reel_comments').insert({
        reel_id: reelId,
        user_id: user.id,
        content,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['reel-comments', vars.reelId] });
      qc.invalidateQueries({ queryKey: ['reels-feed'] });
    },
  });

  const createReel = useMutation({
    mutationFn: async (data: { video_url: string; thumbnail_url?: string; caption?: string; hashtags?: string[]; duration_seconds?: number; organization_id?: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('reels').insert({
        user_id: user.id,
        ...data,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reels-feed'] });
      toast({ title: 'تم نشر الريل بنجاح! 🎬' });
    },
  });

  const deleteReel = useMutation({
    mutationFn: async (reelId: string) => {
      const { error } = await supabase.from('reels').delete().eq('id', reelId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reels-feed'] });
      toast({ title: 'تم حذف الريل' });
    },
  });

  const incrementView = useMutation({
    mutationFn: async (reelId: string) => {
      if (!user) return;
      await supabase.from('reel_views').insert({
        reel_id: reelId,
        viewer_id: user.id,
        watch_duration_seconds: 0,
        completed: false,
      });
    },
  });

  return { toggleLike, toggleBookmark, addComment, createReel, deleteReel, incrementView };
}
