import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ChannelAdmin {
  id: string;
  channel_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'moderator';
  permissions: Record<string, boolean>;
  created_at: string;
  user_name?: string;
  user_avatar?: string;
}

export function useBroadcastAdmin(channelId: string | undefined) {
  const { user } = useAuth();
  const qc = useQueryClient();

  // ─── Channel admins ───
  const { data: admins = [] } = useQuery({
    queryKey: ['broadcast-admins', channelId],
    queryFn: async () => {
      if (!channelId) return [];
      const { data } = await (supabase as any)
        .from('broadcast_channel_admins')
        .select('*, profiles:user_id(full_name, avatar_url)')
        .eq('channel_id', channelId)
        .order('created_at');
      return (data || []).map((a: any) => ({
        ...a,
        user_name: a.profiles?.full_name || 'مشرف',
        user_avatar: a.profiles?.avatar_url,
      })) as ChannelAdmin[];
    },
    enabled: !!channelId,
  });

  // ─── Subscribers list (for owner) ───
  const { data: subscribers = [], isLoading: subsLoading } = useQuery({
    queryKey: ['broadcast-subscribers-list', channelId],
    queryFn: async () => {
      if (!channelId) return [];
      const { data } = await (supabase as any)
        .from('broadcast_channel_subscribers')
        .select('*, profiles:user_id(full_name, avatar_url)')
        .eq('channel_id', channelId)
        .order('subscribed_at', { ascending: false });
      return (data || []).map((s: any) => ({
        ...s,
        user_name: s.profiles?.full_name || 'متابع',
        user_avatar: s.profiles?.avatar_url,
      }));
    },
    enabled: !!channelId,
  });

  // ─── Analytics ───
  const { data: analytics } = useQuery({
    queryKey: ['broadcast-analytics', channelId],
    queryFn: async () => {
      if (!channelId) return null;
      // Post performance
      const { data: posts } = await (supabase as any)
        .from('broadcast_posts')
        .select('id, views_count, reactions_count, comments_count, forward_count, created_at')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: false })
        .limit(30);

      const totalViews = (posts || []).reduce((s: number, p: any) => s + (p.views_count || 0), 0);
      const totalReactions = (posts || []).reduce((s: number, p: any) => s + (p.reactions_count || 0), 0);
      const totalComments = (posts || []).reduce((s: number, p: any) => s + (p.comments_count || 0), 0);
      const avgViews = posts?.length ? Math.round(totalViews / posts.length) : 0;

      // Growth - subscribers in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { count: newSubs } = await (supabase as any)
        .from('broadcast_channel_subscribers')
        .select('*', { count: 'exact', head: true })
        .eq('channel_id', channelId)
        .gte('subscribed_at', thirtyDaysAgo.toISOString());

      return {
        totalPosts: posts?.length || 0,
        totalViews,
        totalReactions,
        totalComments,
        avgViewsPerPost: avgViews,
        newSubscribers30d: newSubs || 0,
        topPosts: (posts || []).slice(0, 5),
        engagementRate: totalViews > 0 ? Math.round(((totalReactions + totalComments) / totalViews) * 100) : 0,
      };
    },
    enabled: !!channelId,
    refetchInterval: 60000,
  });

  // ─── Add admin ───
  const addAdmin = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      if (!channelId || !user) throw new Error('Not authenticated');
      const { error } = await (supabase as any).from('broadcast_channel_admins').insert({
        channel_id: channelId, user_id: userId, role, added_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['broadcast-admins', channelId] });
      toast.success('تم إضافة المشرف');
    },
    onError: () => toast.error('فشل إضافة المشرف'),
  });

  // ─── Remove admin ───
  const removeAdmin = useMutation({
    mutationFn: async (adminId: string) => {
      const { error } = await (supabase as any).from('broadcast_channel_admins').delete().eq('id', adminId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['broadcast-admins', channelId] });
      toast.success('تم إزالة المشرف');
    },
  });

  // ─── Block user ───
  const blockUser = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason?: string }) => {
      if (!channelId || !user) throw new Error('Not authenticated');
      // Block
      await (supabase as any).from('broadcast_blocked_users').insert({
        channel_id: channelId, user_id: userId, blocked_by: user.id, reason,
      });
      // Remove subscription
      await (supabase as any).from('broadcast_channel_subscribers')
        .delete().eq('channel_id', channelId).eq('user_id', userId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['broadcast-subscribers-list', channelId] });
      toast.success('تم حظر المستخدم');
    },
  });

  // ─── Update channel settings ───
  const updateSettings = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      if (!channelId) throw new Error('No channel');
      const { error } = await (supabase as any).from('broadcast_channels')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', channelId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['broadcast-channels'] });
      toast.success('تم تحديث الإعدادات');
    },
  });

  // ─── Update avatar/cover ───
  const uploadChannelImage = async (file: File, type: 'avatar' | 'cover') => {
    if (!channelId) return;
    const ext = file.name.split('.').pop();
    const path = `broadcast/${channelId}/${type}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('public-assets').upload(path, file);
    if (error) { toast.error('فشل رفع الصورة'); return; }
    const { data: urlData } = supabase.storage.from('public-assets').getPublicUrl(path);
    const field = type === 'avatar' ? 'avatar_url' : 'cover_url';
    await updateSettings.mutateAsync({ [field]: urlData.publicUrl });
  };

  // ─── Generate invite link ───
  const generateInviteLink = async () => {
    if (!channelId) return '';
    const code = `ch_${channelId.slice(0, 8)}_${Date.now().toString(36)}`;
    const link = `${window.location.origin}/join-channel/${code}`;
    await updateSettings.mutateAsync({ invite_link: link });
    return link;
  };

  return {
    admins, subscribers, subsLoading, analytics,
    addAdmin: addAdmin.mutate,
    removeAdmin: removeAdmin.mutate,
    blockUser: blockUser.mutate,
    updateSettings: updateSettings.mutate,
    uploadChannelImage,
    generateInviteLink,
    isUpdating: updateSettings.isPending,
  };
}

// ─── Subscriber notification settings hook ───
export function useBroadcastNotificationSettings(channelId: string | undefined) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ['broadcast-notif-settings', channelId, user?.id],
    queryFn: async () => {
      if (!channelId || !user) return null;
      const { data } = await (supabase as any)
        .from('broadcast_notification_settings')
        .select('*')
        .eq('channel_id', channelId)
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!channelId && !!user,
  });

  const toggleMute = useMutation({
    mutationFn: async (muted: boolean) => {
      if (!channelId || !user) return;
      await (supabase as any).from('broadcast_notification_settings').upsert({
        channel_id: channelId,
        user_id: user.id,
        is_muted: muted,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'channel_id,user_id' });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['broadcast-notif-settings', channelId] });
      toast.success('تم تحديث إعدادات الإشعارات');
    },
  });

  const report = useMutation({
    mutationFn: async ({ postId, reason, details }: { postId?: string; reason: string; details?: string }) => {
      if (!user) return;
      await (supabase as any).from('broadcast_reports').insert({
        channel_id: channelId,
        post_id: postId || null,
        reporter_id: user.id,
        reason, details,
      });
    },
    onSuccess: () => toast.success('تم إرسال البلاغ بنجاح'),
    onError: () => toast.error('فشل إرسال البلاغ'),
  });

  return {
    isMuted: settings?.is_muted || false,
    toggleMute: toggleMute.mutate,
    report: report.mutate,
  };
}
