import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CollabFile {
  id: string;
  conversation_key: string;
  uploaded_by: string;
  uploaded_by_org_id: string | null;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  status: string;
  category: string;
  notes: string | null;
  metadata: any;
  created_at: string;
  uploader_name?: string;
}

export function useCollaborationBoard(conversationKey: string | null) {
  const { user, organization } = useAuth();
  const qc = useQueryClient();

  const { data: files = [], isLoading } = useQuery({
    queryKey: ['collab-files', conversationKey],
    queryFn: async () => {
      if (!conversationKey) return [];
      const { data } = await supabase
        .from('shared_collaboration_files')
        .select('*')
        .eq('conversation_key', conversationKey)
        .order('created_at', { ascending: false });
      return (data || []) as CollabFile[];
    },
    enabled: !!conversationKey,
  });

  const upload = useMutation({
    mutationFn: async ({ fileName, fileUrl, fileType, fileSize, category, notes }: {
      fileName: string; fileUrl: string; fileType?: string; fileSize?: number;
      category?: string; notes?: string;
    }) => {
      if (!user || !organization || !conversationKey) throw new Error('Missing context');
      const { error } = await supabase.from('shared_collaboration_files').insert({
        conversation_key: conversationKey,
        uploaded_by: user.id,
        uploaded_by_org_id: organization.id,
        file_name: fileName,
        file_url: fileUrl,
        file_type: fileType,
        file_size: fileSize,
        category: category || 'general',
        notes,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['collab-files'] });
      toast.success('تم رفع الملف للوحة المشتركة');
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ fileId, status }: { fileId: string; status: string }) => {
      const { error } = await supabase
        .from('shared_collaboration_files')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', fileId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['collab-files'] });
      toast.success('تم تحديث حالة الملف');
    },
  });

  return {
    files,
    isLoading,
    upload: upload.mutate,
    updateStatus: updateStatus.mutate,
  };
}
