import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export interface Invitation {
  id: string;
  email: string;
  token: string;
  employee_type: string;
  permissions: string[];
  access_all_partners: boolean;
  access_all_waste_types: boolean;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expires_at: string;
  created_at: string;
  accepted_at?: string;
  invited_by_profile?: {
    full_name: string;
  };
}

export interface CreateInvitationData {
  email: string;
  employeeType?: string;
  permissions?: string[];
  accessAllPartners?: boolean;
  accessAllWasteTypes?: boolean;
  partnerIds?: string[];
  externalPartnerIds?: string[];
  wasteTypes?: string[];
  expiresInDays?: number;
}

export function useEmployeeInvitations() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  // Fetch invitations for the organization
  const { data: invitations, isLoading } = useQuery({
    queryKey: ['employee-invitations', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];

      const { data, error } = await supabase
        .from('employee_invitations')
        .select(`
          id,
          email,
          token,
          employee_type,
          permissions,
          access_all_partners,
          access_all_waste_types,
          status,
          expires_at,
          created_at,
          accepted_at,
          invited_by_profile:invited_by(full_name)
        `)
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as Invitation[];
    },
    enabled: !!profile?.organization_id,
  });

  // Create invitation
  const createInvitation = useMutation({
    mutationFn: async (data: CreateInvitationData) => {
      setIsCreating(true);

      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('غير مصرح');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/employee-invitation?action=create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify(data),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'فشل في إنشاء الدعوة');
      }

      return result;
    },
    onSuccess: (data) => {
      toast.success('تم إنشاء الدعوة بنجاح');
      queryClient.invalidateQueries({ queryKey: ['employee-invitations'] });
      setIsCreating(false);
      return data;
    },
    onError: (error: Error) => {
      toast.error(error.message);
      setIsCreating(false);
    },
  });

  // Cancel invitation
  const cancelInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('غير مصرح');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/employee-invitation?action=cancel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ invitationId }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'فشل في إلغاء الدعوة');
      }

      return result;
    },
    onSuccess: () => {
      toast.success('تم إلغاء الدعوة');
      queryClient.invalidateQueries({ queryKey: ['employee-invitations'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Resend invitation
  const resendInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('غير مصرح');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/employee-invitation?action=resend`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ invitationId }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'فشل في تجديد الدعوة');
      }

      return result;
    },
    onSuccess: (data) => {
      toast.success('تم تجديد الدعوة بنجاح');
      queryClient.invalidateQueries({ queryKey: ['employee-invitations'] });
      return data;
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    invitations: invitations || [],
    isLoading,
    isCreating,
    createInvitation,
    cancelInvitation,
    resendInvitation,
  };
}
