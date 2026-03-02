import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface HomepageSection {
  id: string;
  title: string;
  title_en: string | null;
  description: string | null;
  is_visible: boolean;
  sort_order: number;
  custom_content: Record<string, any>;
  custom_styles: Record<string, any>;
  updated_at: string;
  updated_by: string | null;
}

export interface HomepageCustomBlock {
  id: string;
  block_type: string;
  title: string;
  title_en: string | null;
  content: string | null;
  content_en: string | null;
  media_url: string | null;
  link_url: string | null;
  link_text: string | null;
  background_color: string | null;
  text_color: string | null;
  position: string;
  custom_position_after: string | null;
  sort_order: number;
  is_visible: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export function useHomepageSections() {
  const queryClient = useQueryClient();

  const { data: sections = [], isLoading } = useQuery({
    queryKey: ['homepage-sections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('homepage_sections')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return (data || []) as HomepageSection[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const updateSection = useMutation({
    mutationFn: async (params: { id: string; updates: Partial<HomepageSection> }) => {
      const { error } = await supabase
        .from('homepage_sections')
        .update({ ...params.updates, updated_at: new Date().toISOString() })
        .eq('id', params.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homepage-sections'] });
      toast.success('تم تحديث القسم');
    },
    onError: (e: any) => toast.error(e.message || 'فشل التحديث'),
  });

  const reorderSections = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) =>
        supabase.from('homepage_sections').update({ sort_order: index }).eq('id', id)
      );
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homepage-sections'] });
      toast.success('تم إعادة الترتيب');
    },
  });

  return { sections, isLoading, updateSection: updateSection.mutate, reorderSections: reorderSections.mutate };
}

export function useHomepageCustomBlocks() {
  const queryClient = useQueryClient();

  const { data: blocks = [], isLoading } = useQuery({
    queryKey: ['homepage-custom-blocks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('homepage_custom_blocks')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return (data || []) as HomepageCustomBlock[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const addBlock = useMutation({
    mutationFn: async (block: Omit<HomepageCustomBlock, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('homepage_custom_blocks').insert(block);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homepage-custom-blocks'] });
      toast.success('تم إضافة البلوك');
    },
    onError: (e: any) => toast.error(e.message || 'فشل الإضافة'),
  });

  const updateBlock = useMutation({
    mutationFn: async (params: { id: string; updates: Partial<HomepageCustomBlock> }) => {
      const { error } = await supabase
        .from('homepage_custom_blocks')
        .update({ ...params.updates, updated_at: new Date().toISOString() })
        .eq('id', params.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homepage-custom-blocks'] });
      toast.success('تم تحديث البلوك');
    },
    onError: (e: any) => toast.error(e.message || 'فشل التحديث'),
  });

  const deleteBlock = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('homepage_custom_blocks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homepage-custom-blocks'] });
      toast.success('تم حذف البلوك');
    },
    onError: (e: any) => toast.error(e.message || 'فشل الحذف'),
  });

  return {
    blocks, isLoading,
    addBlock: addBlock.mutate,
    updateBlock: updateBlock.mutate,
    deleteBlock: deleteBlock.mutate,
    isAdding: addBlock.isPending,
  };
}
