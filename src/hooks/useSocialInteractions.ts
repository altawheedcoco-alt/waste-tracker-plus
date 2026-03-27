import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type ReactionType = 'like' | 'excellent' | 'warning' | 'support' | 'celebrate';
type EntityType = 'shipment' | 'auction' | 'marketplace_listing' | 'organization_profile';

// ===== Reactions =====
export function useReactions(entityType: EntityType, entityId: string) {
  const { user, organization } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['reactions', entityType, entityId];

  const { data: reactions = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entity_reactions')
        .select('id, user_id, reaction_type, created_at')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId);
      if (error) throw error;
      return data;
    },
    enabled: !!entityId,
  });

  const userReaction = reactions.find(r => r.user_id === user?.id);

  const toggleReaction = useMutation({
    mutationFn: async (reactionType: ReactionType) => {
      if (!user || !organization) throw new Error('Not authenticated');
      
      if (userReaction) {
        if (userReaction.reaction_type === reactionType) {
          // Remove reaction
          const { error } = await supabase
            .from('entity_reactions')
            .delete()
            .eq('id', userReaction.id);
          if (error) throw error;
          return null;
        } else {
          // Change reaction - delete then insert (unique constraint)
          await supabase.from('entity_reactions').delete().eq('id', userReaction.id);
          const { error } = await supabase
            .from('entity_reactions')
            .insert({
              user_id: user.id,
              organization_id: organization.id,
              entity_type: entityType,
              entity_id: entityId,
              reaction_type: reactionType,
            });
          if (error) throw error;
        }
      } else {
        const { error } = await supabase
          .from('entity_reactions')
          .insert({
            user_id: user.id,
            organization_id: organization.id,
            entity_type: entityType,
            entity_id: entityId,
            reaction_type: reactionType,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const reactionCounts = reactions.reduce((acc, r) => {
    acc[r.reaction_type] = (acc[r.reaction_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    reactions,
    userReaction,
    reactionCounts,
    totalReactions: reactions.length,
    isLoading,
    toggleReaction: toggleReaction.mutate,
    isToggling: toggleReaction.isPending,
  };
}

// ===== Comments =====
export function useComments(entityType: EntityType, entityId: string) {
  const { user, organization } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['comments', entityType, entityId];

  const { data: comments = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entity_comments')
        .select(`
          id, user_id, content, parent_comment_id, is_edited, is_hidden,
          created_at, updated_at, organization_id
        `)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!entityId,
  });

  const addComment = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId?: string }) => {
      if (!user || !organization) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('entity_comments')
        .insert({
          user_id: user.id,
          organization_id: organization.id,
          entity_type: entityType,
          entity_id: entityId,
          content: content.trim(),
          parent_comment_id: parentId || null,
        });
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('تم إضافة التعليق');

      // Notify entity owner about comment
      try {
        import('@/services/notificationTriggers').then(({ notifySocialEvent }) => {
          notifySocialEvent({
            type: 'post_commented',
            actorName: user?.email || 'مستخدم',
            actorUserId: user?.id || '',
            entityId: entityId,
            organizationId: organization?.id,
          });
        });
      } catch {}
    },
    onError: () => toast.error('فشل في إضافة التعليق'),
  });

  const editComment = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      const { error } = await supabase
        .from('entity_comments')
        .update({ content: content.trim(), is_edited: true })
        .eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('تم تعديل التعليق');
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from('entity_comments')
        .delete()
        .eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('تم حذف التعليق');
    },
  });

  const rootComments = comments.filter(c => !c.parent_comment_id);
  const getReplies = (parentId: string) => comments.filter(c => c.parent_comment_id === parentId);

  return {
    comments,
    rootComments,
    getReplies,
    isLoading,
    addComment: addComment.mutate,
    editComment: editComment.mutate,
    deleteComment: deleteComment.mutate,
    isAdding: addComment.isPending,
  };
}

// ===== Reports =====
export function useEntityReport() {
  const { user, organization } = useAuth();
  const queryClient = useQueryClient();

  const submitReport = useMutation({
    mutationFn: async ({
      entityType,
      entityId,
      category,
      description,
      evidenceUrls,
    }: {
      entityType: string;
      entityId: string;
      category: string;
      description?: string;
      evidenceUrls?: string[];
    }) => {
      if (!user || !organization) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('entity_reports')
        .insert({
          reporter_user_id: user.id,
          reporter_organization_id: organization.id,
          entity_type: entityType,
          entity_id: entityId,
          report_category: category,
          description,
          evidence_urls: evidenceUrls || [],
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم إرسال البلاغ بنجاح، سيتم مراجعته من الإدارة');
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
    onError: () => toast.error('فشل في إرسال البلاغ'),
  });

  return { submitReport: submitReport.mutate, isSubmitting: submitReport.isPending };
}

// ===== Organization Blocks =====
export function useOrganizationBlocks() {
  const { user, organization } = useAuth();
  const queryClient = useQueryClient();

  const { data: blocks = [] } = useQuery({
    queryKey: ['org-blocks', organization?.id],
    queryFn: async () => {
      if (!organization) return [];
      const { data, error } = await supabase
        .from('organization_blocks')
        .select('*')
        .eq('blocker_organization_id', organization.id);
      if (error) throw error;
      return data;
    },
    enabled: !!organization,
  });

  const blockOrg = useMutation({
    mutationFn: async ({ targetOrgId, reason }: { targetOrgId: string; reason?: string }) => {
      if (!user || !organization) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('organization_blocks')
        .insert({
          blocker_organization_id: organization.id,
          blocked_organization_id: targetOrgId,
          blocked_by: user.id,
          reason,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم حظر الجهة');
      queryClient.invalidateQueries({ queryKey: ['org-blocks'] });
    },
  });

  const unblockOrg = useMutation({
    mutationFn: async (targetOrgId: string) => {
      if (!organization) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('organization_blocks')
        .delete()
        .eq('blocker_organization_id', organization.id)
        .eq('blocked_organization_id', targetOrgId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم إلغاء الحظر');
      queryClient.invalidateQueries({ queryKey: ['org-blocks'] });
    },
  });

  const isBlocked = useCallback(
    (orgId: string) => blocks.some(b => b.blocked_organization_id === orgId),
    [blocks]
  );

  return { blocks, blockOrg: blockOrg.mutate, unblockOrg: unblockOrg.mutate, isBlocked };
}
