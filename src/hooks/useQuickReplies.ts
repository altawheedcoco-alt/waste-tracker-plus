import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface QuickReply {
  id: string;
  organization_id: string | null;
  title: string;
  content: string;
  category: string;
  shortcut: string | null;
  usage_count: number;
  is_global: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReplyCategory {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  sort_order: number;
}

export const useQuickReplies = () => {
  const { roles } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAdmin = roles.includes('admin');

  // Fetch quick replies
  const { data: quickReplies = [], isLoading } = useQuery({
    queryKey: ['quick-replies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_quick_replies')
        .select('*')
        .order('usage_count', { ascending: false });

      if (error) throw error;
      return data as QuickReply[];
    },
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['reply-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_reply_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as ReplyCategory[];
    },
  });

  // Create quick reply
  const createReply = useMutation({
    mutationFn: async (reply: Partial<QuickReply>) => {
      const { data, error } = await supabase
        .from('support_quick_replies')
        .insert(reply as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quick-replies'] });
      toast({
        title: 'تم الإنشاء',
        description: 'تم إضافة الرد الجاهز بنجاح',
      });
    },
    onError: () => {
      toast({
        title: 'خطأ',
        description: 'فشل في إنشاء الرد الجاهز',
        variant: 'destructive',
      });
    },
  });

  // Update quick reply
  const updateReply = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<QuickReply> }) => {
      const { data, error } = await supabase
        .from('support_quick_replies')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quick-replies'] });
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث الرد الجاهز بنجاح',
      });
    },
  });

  // Delete quick reply
  const deleteReply = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('support_quick_replies')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quick-replies'] });
      toast({
        title: 'تم الحذف',
        description: 'تم حذف الرد الجاهز',
      });
    },
  });

  // Increment usage count
  const incrementUsage = useMutation({
    mutationFn: async (id: string) => {
      // Manual increment since RPC is not available
      const reply = quickReplies.find(r => r.id === id);
      if (reply) {
        await supabase
          .from('support_quick_replies')
          .update({ usage_count: (reply.usage_count || 0) + 1 })
          .eq('id', id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quick-replies'] });
    },
  });

  // Find reply by shortcut
  const findByShortcut = (shortcut: string) => {
    return quickReplies.find(r => r.shortcut === shortcut);
  };

  // Group replies by category
  const repliesByCategory = quickReplies.reduce((acc, reply) => {
    const cat = reply.category || 'عام';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(reply);
    return acc;
  }, {} as Record<string, QuickReply[]>);

  return {
    quickReplies,
    categories,
    repliesByCategory,
    isLoading,
    isAdmin,
    createReply,
    updateReply,
    deleteReply,
    incrementUsage,
    findByShortcut,
  };
};
