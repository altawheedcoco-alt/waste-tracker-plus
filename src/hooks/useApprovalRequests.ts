import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

interface CreateRequestParams {
  request_type: string;
  request_title: string;
  request_description?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  target_resource_type?: string;
  target_resource_id?: string;
  request_data?: Json;
}

export const useApprovalRequests = () => {
  const { user, organization } = useAuth();
  const { toast } = useToast();

  const createRequest = async (params: CreateRequestParams) => {
    try {
      const { error } = await supabase.from('approval_requests').insert([{
        request_type: params.request_type,
        request_title: params.request_title,
        request_description: params.request_description || null,
        priority: params.priority || 'normal',
        requester_user_id: user?.id,
        requester_organization_id: organization?.id || null,
        target_resource_type: params.target_resource_type || null,
        target_resource_id: params.target_resource_id || null,
        request_data: params.request_data || {},
      }]);

      if (error) throw error;

      toast({
        title: 'تم إرسال الطلب',
        description: 'سيتم مراجعة طلبك من قبل إدارة النظام',
      });

      return { success: true };
    } catch (error) {
      console.error('Error creating approval request:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في إرسال الطلب',
        variant: 'destructive',
      });
      return { success: false, error };
    }
  };

  const getUserRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('approval_requests')
        .select('*')
        .eq('requester_user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching user requests:', error);
      return { data: null, error };
    }
  };

  const getOrganizationRequests = async () => {
    if (!organization?.id) return { data: null, error: 'No organization' };

    try {
      const { data, error } = await supabase
        .from('approval_requests')
        .select('*')
        .eq('requester_organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching organization requests:', error);
      return { data: null, error };
    }
  };

  return {
    createRequest,
    getUserRequests,
    getOrganizationRequests,
  };
};
