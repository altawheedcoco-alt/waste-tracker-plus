import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { getTabChannelName } from '@/lib/tabSession';

export interface Note {
  id: string;
  organization_id: string;
  author_id: string;
  resource_type: string;
  resource_id: string;
  parent_note_id: string | null;
  content: string;
  note_type: string;
  priority: string;
  visibility: string;
  target_organization_id: string | null;
  mentioned_user_ids: string[];
  attachment_url: string | null;
  attachment_name: string | null;
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  is_pinned: boolean;
  is_edited: boolean;
  edited_at: string | null;
  created_at: string;
  updated_at: string;
  author?: {
    full_name: string;
    avatar_url: string | null;
  } | null;
  replies_count?: number;
}

interface CreateNoteInput {
  content: string;
  note_type?: string;
  priority?: string;
  visibility?: string;
  target_organization_id?: string | null;
  parent_note_id?: string | null;
  mentioned_user_ids?: string[];
  attachment_url?: string | null;
  attachment_name?: string | null;
  linked_shipment_id?: string | null;
  send_to_chat?: boolean;
}

export const useNotes = (resourceType: string, resourceId: string) => {
  const { profile, organization } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ['notes', resourceType, resourceId];

  const { data: notes = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select(`
          *,
          author:profiles!notes_author_id_fkey(full_name, avatar_url)
        `)
        .eq('resource_type', resourceType)
        .eq('resource_id', resourceId)
        .is('parent_note_id', null)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as unknown as Note[]) || [];
    },
    enabled: !!resourceId && !!resourceType,
  });

  const { data: notesCount = 0 } = useQuery({
    queryKey: ['notes-count', resourceType, resourceId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('notes')
        .select('*', { count: 'exact', head: true })
        .eq('resource_type', resourceType)
        .eq('resource_id', resourceId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!resourceId && !!resourceType,
  });

  // Realtime subscription
  useEffect(() => {
    if (!resourceId) return;

    const channel = supabase
      .channel(getTabChannelName(`notes-${resourceType}-${resourceId}`))
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes',
          filter: `resource_id=eq.${resourceId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey });
          queryClient.invalidateQueries({ queryKey: ['notes-count', resourceType, resourceId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [resourceId, resourceType]);

  const createNote = useMutation({
    mutationFn: async (input: CreateNoteInput) => {
      if (!profile || !organization) throw new Error('غير مصرح');

      const { data, error } = await supabase
        .from('notes')
        .insert({
          organization_id: organization.id,
          author_id: profile.id,
          resource_type: resourceType,
          resource_id: resourceId,
          content: input.content,
          note_type: input.note_type || 'comment',
          priority: input.priority || 'normal',
          visibility: input.visibility || 'internal',
          target_organization_id: input.target_organization_id || null,
          parent_note_id: input.parent_note_id || null,
          mentioned_user_ids: input.mentioned_user_ids || [],
          attachment_url: input.attachment_url || null,
          attachment_name: input.attachment_name || null,
          linked_shipment_id: input.linked_shipment_id || null,
        } as any)
        .select()
        .single();

      if (error) throw error;

      // Send note as a chat message if send_to_chat is true
      if (input.send_to_chat && input.target_organization_id) {
        try {
          await supabase.from('direct_messages').insert({
            sender_id: profile.id,
            sender_organization_id: organization.id,
            receiver_organization_id: input.target_organization_id,
            content: `📝 ملاحظة: ${input.content}`,
            message_type: 'system',
          } as any);
        } catch (chatErr) {
          console.error('Failed to send note to chat:', chatErr);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('تم إضافة الملاحظة بنجاح');
    },
    onError: () => {
      toast.error('حدث خطأ أثناء إضافة الملاحظة');
    },
  });

  const updateNote = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const { error } = await supabase
        .from('notes')
        .update({ content, is_edited: true, edited_at: new Date().toISOString() } as any)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('تم تحديث الملاحظة');
    },
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('تم حذف الملاحظة');
    },
  });

  const togglePin = useMutation({
    mutationFn: async ({ id, pinned }: { id: string; pinned: boolean }) => {
      const { error } = await supabase
        .from('notes')
        .update({ is_pinned: !pinned } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const toggleResolve = useMutation({
    mutationFn: async ({ id, resolved }: { id: string; resolved: boolean }) => {
      const update = resolved
        ? { is_resolved: false, resolved_by: null, resolved_at: null }
        : { is_resolved: true, resolved_by: profile?.id, resolved_at: new Date().toISOString() };

      const { error } = await supabase
        .from('notes')
        .update(update as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    notes,
    notesCount,
    isLoading,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
    toggleResolve,
  };
};

// Hook to get replies for a specific note
export const useNoteReplies = (parentNoteId: string) => {
  const { data: replies = [], isLoading } = useQuery({
    queryKey: ['note-replies', parentNoteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select(`
          *,
          author:profiles!notes_author_id_fkey(full_name, avatar_url)
        `)
        .eq('parent_note_id', parentNoteId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data as unknown as Note[]) || [];
    },
    enabled: !!parentNoteId,
  });

  return { replies, isLoading };
};
