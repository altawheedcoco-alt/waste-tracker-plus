import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const fromFollows = () => (supabase as any).from('member_follows');

interface FollowCounts {
  followersCount: number;
  followingCount: number;
}

export const useFollow = (targetProfileId?: string, targetOrgId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  // Check if current user follows this target
  const { data: isFollowing = false } = useQuery({
    queryKey: ['is-following', userId, targetProfileId, targetOrgId],
    queryFn: async () => {
      if (!userId) return false;
      let query = (supabase.from('member_follows') as any)
        .select('id', { count: 'exact', head: true })
        .eq('follower_id', userId);

      if (targetProfileId) query = query.eq('followed_profile_id', targetProfileId);
      else if (targetOrgId) query = query.eq('followed_organization_id', targetOrgId);
      else return false;

      const { count } = await query;
      return (count || 0) > 0;
    },
    enabled: !!userId && !!(targetProfileId || targetOrgId),
  });

  // Get follower/following counts for a profile
  const { data: profileCounts } = useQuery({
    queryKey: ['follow-counts-profile', targetProfileId],
    queryFn: async (): Promise<FollowCounts> => {
      if (!targetProfileId) return { followersCount: 0, followingCount: 0 };

      // Get the user_id for this profile to count their followings
      const { data: prof } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('id', targetProfileId)
        .single();

      const [followersRes, followingRes] = await Promise.all([
        (supabase.from('member_follows') as any)
          .select('id', { count: 'exact', head: true })
          .eq('followed_profile_id', targetProfileId),
        prof?.user_id
          ? (supabase.from('member_follows') as any)
              .select('id', { count: 'exact', head: true })
              .eq('follower_id', prof.user_id)
          : Promise.resolve({ count: 0 }),
      ]);

      return {
        followersCount: followersRes.count || 0,
        followingCount: followingRes.count || 0,
      };
    },
    enabled: !!targetProfileId,
  });

  // Get follower count for an org
  const { data: orgFollowersCount = 0 } = useQuery({
    queryKey: ['follow-counts-org', targetOrgId],
    queryFn: async () => {
      if (!targetOrgId) return 0;
      const { count } = await (supabase.from('member_follows') as any)
        .select('id', { count: 'exact', head: true })
        .eq('followed_organization_id', targetOrgId);
      return count || 0;
    },
    enabled: !!targetOrgId,
  });

  const toggleFollow = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('غير مسجل');

      if (isFollowing) {
        let query = (supabase.from('member_follows') as any)
          .delete()
          .eq('follower_id', userId);
        if (targetProfileId) query = query.eq('followed_profile_id', targetProfileId);
        else if (targetOrgId) query = query.eq('followed_organization_id', targetOrgId);
        const { error } = await query;
        if (error) throw error;
      } else {
        const row: any = { follower_id: userId };
        if (targetProfileId) row.followed_profile_id = targetProfileId;
        else if (targetOrgId) row.followed_organization_id = targetOrgId;
        const { error } = await (supabase.from('member_follows') as any).insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['is-following'] });
      queryClient.invalidateQueries({ queryKey: ['follow-counts-profile'] });
      queryClient.invalidateQueries({ queryKey: ['follow-counts-org'] });
      queryClient.invalidateQueries({ queryKey: ['follow-feed'] });
      toast.success(isFollowing ? 'تم إلغاء المتابعة' : 'تمت المتابعة');
    },
    onError: () => toast.error('فشلت العملية'),
  });

  return {
    isFollowing,
    toggleFollow: () => toggleFollow.mutate(),
    isToggling: toggleFollow.isPending,
    followersCount: targetOrgId ? orgFollowersCount : (profileCounts?.followersCount || 0),
    followingCount: profileCounts?.followingCount || 0,
  };
};

/**
 * Hook to fetch the follow feed (posts from followed profiles & orgs)
 */
export const useFollowFeed = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['follow-feed', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get who I follow
      const { data: follows } = await (supabase.from('member_follows') as any)
        .select('followed_profile_id, followed_organization_id')
        .eq('follower_id', user.id);

      if (!follows || follows.length === 0) return [];

      const profileIds = follows
        .filter((f: any) => f.followed_profile_id)
        .map((f: any) => f.followed_profile_id);
      const orgIds = follows
        .filter((f: any) => f.followed_organization_id)
        .map((f: any) => f.followed_organization_id);

      // Fetch member posts from followed profiles
      const memberPostsPromise = profileIds.length > 0
        ? (supabase.from('member_posts') as any)
            .select('*, author:profiles!member_posts_author_id_fkey(id, full_name, avatar_url, position, organization_id)')
            .in('author_id', profileIds)
            .order('created_at', { ascending: false })
            .limit(30)
        : Promise.resolve({ data: [] });

      // Fetch org posts from followed organizations
      const orgPostsPromise = orgIds.length > 0
        ? (supabase.from('organization_posts') as any)
            .select('*, organization:organizations!organization_posts_organization_id_fkey(id, name, logo_url, organization_type)')
            .in('organization_id', orgIds)
            .order('created_at', { ascending: false })
            .limit(30)
        : Promise.resolve({ data: [] });

      const [memberRes, orgRes] = await Promise.all([memberPostsPromise, orgPostsPromise]);

      // Merge and sort by date
      const memberPosts = (memberRes.data || []).map((p: any) => ({ ...p, _source: 'member' as const }));
      const orgPosts = (orgRes.data || []).map((p: any) => ({ ...p, _source: 'org' as const }));

      const allPosts = [...memberPosts, ...orgPosts]
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 50);

      return allPosts;
    },
    enabled: !!user?.id,
    staleTime: 30000,
  });
};
