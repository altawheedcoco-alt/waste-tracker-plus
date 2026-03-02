import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useCallback } from 'react';

export type RestrictionType =
  | 'block_shipments'
  | 'block_invoices'
  | 'block_messaging'
  | 'block_documents'
  | 'block_visibility'
  | 'suspend_partnership'
  | 'blacklist'
  | 'block_all';

export interface PartnerRestriction {
  id: string;
  organization_id: string;
  restricted_org_id: string;
  restriction_type: RestrictionType;
  reason: string | null;
  notes: string | null;
  created_by: string;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export const RESTRICTION_TYPES: { type: RestrictionType; label: string; description: string; icon: string }[] = [
  { type: 'block_shipments', label: 'حظر الشحنات', description: 'منع إنشاء شحنات جديدة مع هذه الجهة', icon: '🚫' },
  { type: 'block_invoices', label: 'حظر الفواتير', description: 'منع إصدار فواتير لهذه الجهة', icon: '📄' },
  { type: 'block_messaging', label: 'حظر المراسلات', description: 'منع إرسال واستقبال الرسائل', icon: '💬' },
  { type: 'block_documents', label: 'حظر المستندات', description: 'منع مشاركة المستندات والتوقيعات', icon: '📁' },
  { type: 'block_visibility', label: 'إخفاء الرؤية', description: 'إخفاء بياناتك من هذه الجهة', icon: '👁️' },
  { type: 'suspend_partnership', label: 'تعليق الشراكة', description: 'تجميد الشراكة مؤقتاً دون إلغائها', icon: '⏸️' },
  { type: 'blacklist', label: 'القائمة السوداء', description: 'إضافة الجهة للقائمة السوداء نهائياً', icon: '⛔' },
  { type: 'block_all', label: 'حظر شامل', description: 'تطبيق جميع أنواع الحظر دفعة واحدة', icon: '🔒' },
];

export function usePartnerRestrictions(restrictedOrgId?: string) {
  const { user, organization } = useAuth();
  const queryClient = useQueryClient();

  const { data: restrictions = [], isLoading } = useQuery({
    queryKey: ['partner-restrictions', organization?.id, restrictedOrgId],
    queryFn: async () => {
      if (!organization) return [];
      let query = supabase
        .from('partner_restrictions')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('is_active', true);

      if (restrictedOrgId) {
        query = query.eq('restricted_org_id', restrictedOrgId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as PartnerRestriction[];
    },
    enabled: !!organization,
  });

  // Restrictions imposed on us
  const { data: restrictionsAgainstUs = [] } = useQuery({
    queryKey: ['restrictions-against-us', organization?.id],
    queryFn: async () => {
      if (!organization) return [];
      const { data, error } = await supabase
        .from('partner_restrictions')
        .select('*')
        .eq('restricted_org_id', organization.id)
        .eq('is_active', true);
      if (error) throw error;
      return (data || []) as PartnerRestriction[];
    },
    enabled: !!organization,
  });

  const addRestriction = useMutation({
    mutationFn: async (params: {
      restrictedOrgId: string;
      types: RestrictionType[];
      reason?: string;
      notes?: string;
      expiresAt?: string;
    }) => {
      if (!user || !organization) throw new Error('Not authenticated');

      const inserts = params.types.map(type => ({
        organization_id: organization.id,
        restricted_org_id: params.restrictedOrgId,
        restriction_type: type,
        reason: params.reason || null,
        notes: params.notes || null,
        created_by: user.id,
        expires_at: params.expiresAt || null,
      }));

      const { error } = await supabase
        .from('partner_restrictions')
        .upsert(inserts, { onConflict: 'organization_id,restricted_org_id,restriction_type' });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم تطبيق التقييد بنجاح');
      queryClient.invalidateQueries({ queryKey: ['partner-restrictions'] });
    },
    onError: (e: any) => toast.error(e.message || 'فشل في تطبيق التقييد'),
  });

  const removeRestriction = useMutation({
    mutationFn: async (params: { restrictedOrgId: string; types?: RestrictionType[] }) => {
      if (!organization) throw new Error('Not authenticated');
      let query = supabase
        .from('partner_restrictions')
        .delete()
        .eq('organization_id', organization.id)
        .eq('restricted_org_id', params.restrictedOrgId);

      if (params.types?.length) {
        query = query.in('restriction_type', params.types);
      }

      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم إزالة التقييد');
      queryClient.invalidateQueries({ queryKey: ['partner-restrictions'] });
    },
    onError: (e: any) => toast.error(e.message || 'فشل في إزالة التقييد'),
  });

  const isRestricted = useCallback(
    (orgId: string, type?: RestrictionType) => {
      return restrictions.some(r =>
        r.restricted_org_id === orgId &&
        r.is_active &&
        (type ? (r.restriction_type === type || r.restriction_type === 'block_all') : true)
      );
    },
    [restrictions]
  );

  const getActiveRestrictions = useCallback(
    (orgId: string): RestrictionType[] => {
      return restrictions
        .filter(r => r.restricted_org_id === orgId && r.is_active)
        .map(r => r.restriction_type as RestrictionType);
    },
    [restrictions]
  );

  return {
    restrictions,
    restrictionsAgainstUs,
    isLoading,
    addRestriction: addRestriction.mutate,
    removeRestriction: removeRestriction.mutate,
    isAdding: addRestriction.isPending,
    isRemoving: removeRestriction.isPending,
    isRestricted,
    getActiveRestrictions,
  };
}
