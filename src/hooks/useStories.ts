import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { smartChunkedUpload } from '@/utils/chunkedUpload';
import { needsCompression, quickCompressVideo } from '@/utils/quickVideoCompress';

export interface Story {
  id: string;
  user_id: string;
  organization_id: string | null;
  media_url: string;
  media_type: string;
  caption: string | null;
  text_content: string | null;
  background_color: string | null;
  created_at: string;
  expires_at: string;
  is_active: boolean;
  view_count: number;
  profile?: { full_name: string; avatar_url?: string | null };
  organization?: { name: string; logo_url?: string | null };
}

export interface StoryView {
  id: string;
  story_id: string;
  viewer_user_id: string;
  viewer_organization_id: string | null;
  viewed_at: string;
  profile?: { full_name: string; avatar_url?: string | null };
  organization?: { name: string };
}

export interface StoryGroup {
  user_id: string;
  user_name: string;
  avatar_url?: string | null;
  org_name?: string | null;
  org_logo?: string | null;
  stories: Story[];
  hasUnviewed: boolean;
}

export const useStories = () => {
  const { user, organization } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all active stories from partners
  const { data: stories = [], isLoading, refetch } = useQuery({
    queryKey: ['stories', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles and orgs for stories
      const userIds = [...new Set((data || []).map((s: any) => s.user_id))];
      const orgIds = [...new Set((data || []).filter((s: any) => s.organization_id).map((s: any) => s.organization_id))];

      const [profilesRes, orgsRes] = await Promise.all([
        userIds.length > 0
          ? supabase.from('profiles').select('user_id, full_name, avatar_url').in('user_id', userIds)
          : { data: [] },
        orgIds.length > 0
          ? supabase.from('organizations').select('id, name, logo_url').in('id', orgIds)
          : { data: [] },
      ]);

      const profilesMap: Record<string, any> = {};
      (profilesRes.data || []).forEach((p: any) => { profilesMap[p.user_id] = p; });

      const orgsMap: Record<string, any> = {};
      (orgsRes.data || []).forEach((o: any) => { orgsMap[o.id] = o; });

      return (data || []).map((s: any) => ({
        ...s,
        profile: profilesMap[s.user_id] || { full_name: 'مستخدم' },
        organization: s.organization_id ? orgsMap[s.organization_id] : null,
      })) as Story[];
    },
    enabled: !!user,
  });

  // Fetch views for user's stories
  const { data: myStoryViews = [] } = useQuery({
    queryKey: ['story-views', user?.id],
    queryFn: async () => {
      const { data: myStories } = await supabase
        .from('stories')
        .select('id')
        .eq('user_id', user!.id);

      if (!myStories?.length) return [];

      const storyIds = myStories.map((s: any) => s.id);
      const { data, error } = await supabase
        .from('story_views')
        .select('*')
        .in('story_id', storyIds)
        .order('viewed_at', { ascending: false });

      if (error) throw error;

      // Fetch viewer profiles
      const viewerIds = [...new Set((data || []).map((v: any) => v.viewer_user_id))];
      if (viewerIds.length === 0) return data || [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', viewerIds);

      const profilesMap: Record<string, any> = {};
      (profiles || []).forEach((p: any) => { profilesMap[p.user_id] = p; });

      return (data || []).map((v: any) => ({
        ...v,
        profile: profilesMap[v.viewer_user_id] || { full_name: 'مستخدم' },
      })) as StoryView[];
    },
    enabled: !!user,
  });

  // Check which stories current user has viewed
  const { data: viewedStoryIds = [] } = useQuery({
    queryKey: ['viewed-stories', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('story_views')
        .select('story_id')
        .eq('viewer_user_id', user!.id);

      if (error) throw error;
      return (data || []).map((v: any) => v.story_id);
    },
    enabled: !!user,
  });

  // Group stories by user
  const storyGroups: StoryGroup[] = (() => {
    const groups: Record<string, StoryGroup> = {};
    stories.forEach((story) => {
      if (!groups[story.user_id]) {
        groups[story.user_id] = {
          user_id: story.user_id,
          user_name: story.profile?.full_name || 'مستخدم',
          avatar_url: story.profile?.avatar_url,
          org_name: story.organization?.name,
          org_logo: story.organization?.logo_url,
          stories: [],
          hasUnviewed: false,
        };
      }
      groups[story.user_id].stories.push(story);
      if (!viewedStoryIds.includes(story.id) && story.user_id !== user?.id) {
        groups[story.user_id].hasUnviewed = true;
      }
    });
    
    // Put current user first
    const sorted = Object.values(groups);
    sorted.sort((a, b) => {
      if (a.user_id === user?.id) return -1;
      if (b.user_id === user?.id) return 1;
      if (a.hasUnviewed && !b.hasUnviewed) return -1;
      if (!a.hasUnviewed && b.hasUnviewed) return 1;
      return 0;
    });
    return sorted;
  })();

  // Upload story
  const uploadStory = useMutation({
    mutationFn: async ({ file, caption, textContent, backgroundColor }: {
      file?: File;
      caption?: string;
      textContent?: string;
      backgroundColor?: string;
    }) => {
      let mediaUrl = '';
      let mediaType = 'text';

      if (file) {
        let fileToUpload = file;

        // ضغط الفيديو تلقائياً
        if (needsCompression(file)) {
          try {
            toast.info('جاري ضغط الفيديو...');
            const compressed = await quickCompressVideo(file);
            fileToUpload = compressed.file;
            if (compressed.compressionRatio > 0) {
              toast.success(`تم ضغط الفيديو ${compressed.compressionRatio}%`);
            }
          } catch {
            console.warn('⚠️ فشل ضغط الفيديو');
          }
        }

        const ext = fileToUpload.name.split('.').pop();
        const path = `${user!.id}/${Date.now()}.${ext}`;

        const result = await smartChunkedUpload(fileToUpload, {
          bucket: 'stories',
          path,
        });

        mediaUrl = result.publicUrl;
        mediaType = file.type.startsWith('video') ? 'video' : 'image';
      }

      const { error } = await supabase.from('stories').insert({
        user_id: user!.id,
        organization_id: organization?.id || null,
        media_url: mediaUrl || 'text-only',
        media_type: mediaType,
        caption: caption || null,
        text_content: textContent || null,
        background_color: backgroundColor || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم نشر الحالة بنجاح!');
      queryClient.invalidateQueries({ queryKey: ['stories'] });

      // Fire story_posted notification to followers
      try {
        import('@/services/notificationTriggers').then(({ notifySocialEvent }) => {
          notifySocialEvent({
            type: 'story_posted',
            actorName: 'قصة جديدة',
            actorUserId: user?.id || '',
            targetOrgId: organization?.id,
            organizationId: organization?.id,
          });
        });
      } catch {}
    },
    onError: () => {
      toast.error('فشل في نشر الحالة');
    },
  });

  // Record view
  const recordView = useMutation({
    mutationFn: async (storyId: string) => {
      if (viewedStoryIds.includes(storyId)) return;
      const { error } = await supabase.from('story_views').insert({
        story_id: storyId,
        viewer_user_id: user!.id,
        viewer_organization_id: organization?.id || null,
      });
      // Ignore unique constraint errors
      if (error && !error.message.includes('duplicate')) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['viewed-stories'] });
      queryClient.invalidateQueries({ queryKey: ['story-views'] });
    },
  });

  // Delete story
  const deleteStory = useMutation({
    mutationFn: async (storyId: string) => {
      const { error } = await supabase.from('stories').delete().eq('id', storyId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم حذف الحالة');
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });

  return {
    stories,
    storyGroups,
    myStoryViews,
    viewedStoryIds,
    isLoading,
    uploadStory,
    recordView,
    deleteStory,
    refetch,
  };
};
