import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface DataClaimRequest {
  id: string;
  requesting_org_id: string;
  owner_org_id: string;
  external_partner_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requested_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  tables_migrated: string[] | null;
  records_count: number | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  // Joined
  requesting_org?: { name: string; organization_type: string; logo_url: string | null };
  owner_org?: { name: string; organization_type: string; logo_url: string | null };
  external_partner?: { name: string; partner_type: string };
}

/**
 * Detect claimable external partners for the current org.
 * Matches by name/phone/email between external_partners and the current org.
 */
export function useClaimablePartners() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['claimable-partners', organization?.id],
    queryFn: async () => {
      if (!organization) return [];

      // Find external_partners that match current org by name (case-insensitive)
      const { data, error } = await supabase
        .from('external_partners')
        .select('id, name, partner_type, phone, email, organization_id, created_at')
        .eq('is_active', true)
        .neq('organization_id', organization.id); // Not our own external partners

      if (error) throw error;
      if (!data?.length) return [];

      // Match by name similarity (exact match, case-insensitive)
      const orgName = organization.name?.trim().toLowerCase();
      const orgPhone = (organization as any).phone?.trim();
      const orgEmail = (organization as any).email?.trim().toLowerCase();

      const matches = data.filter(ep => {
        const epName = ep.name?.trim().toLowerCase();
        const epPhone = ep.phone?.trim();
        const epEmail = ep.email?.trim().toLowerCase();
        
        // Match by exact name OR phone OR email
        return (
          (orgName && epName && epName === orgName) ||
          (orgPhone && epPhone && epPhone === orgPhone) ||
          (orgEmail && epEmail && epEmail === orgEmail)
        );
      });

      // Check which ones already have claim requests
      if (matches.length === 0) return [];

      const matchIds = matches.map(m => m.id);
      const { data: existingClaims } = await (supabase
        .from('data_claim_requests') as any)
        .select('external_partner_id, status')
        .eq('requesting_org_id', organization.id)
        .in('external_partner_id', matchIds);

      const claimedMap = new Map(
        (existingClaims || []).map((c: any) => [c.external_partner_id, c.status])
      );

      return matches.map(ep => ({
        ...ep,
        claimStatus: claimedMap.get(ep.id) || null,
        ownerOrgId: ep.organization_id,
      }));
    },
    enabled: !!organization?.id,
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Submit a claim request
 */
export function useSubmitClaim() {
  const { user, organization } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ externalPartnerId, ownerOrgId }: { externalPartnerId: string; ownerOrgId: string }) => {
      if (!organization?.id || !user?.id) throw new Error('Not authenticated');

      const { data, error } = await (supabase
        .from('data_claim_requests') as any)
        .insert({
          requesting_org_id: organization.id,
          owner_org_id: ownerOrgId,
          external_partner_id: externalPartnerId,
          requested_by: user.id,
          status: 'pending',
        })
        .select('id')
        .single();

      if (error) throw error;

      // Notify the owner org
      const { data: ownerMembers } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('organization_id', ownerOrgId)
        .limit(5);

      if (ownerMembers?.length) {
        const notifications = ownerMembers.map(m => ({
          user_id: m.user_id,
          title: '📋 طلب استيعاب بيانات',
          message: `جهة "${organization.name}" تطلب استيعاب بيانات شريك خارجي مسجّل عندكم. يرجى المراجعة والموافقة.`,
          type: 'system',
          is_read: false,
        }));
        await (supabase.from('notifications') as any).insert(notifications);
      }

      return data;
    },
    onSuccess: () => {
      toast.success('تم إرسال طلب الاستيعاب بنجاح');
      qc.invalidateQueries({ queryKey: ['claimable-partners'] });
      qc.invalidateQueries({ queryKey: ['data-claim-requests'] });
    },
    onError: (err: any) => {
      if (err.message?.includes('duplicate')) {
        toast.error('يوجد طلب سابق لهذا الشريك');
      } else {
        toast.error('حدث خطأ أثناء إرسال الطلب');
      }
    },
  });
}

/**
 * Fetch incoming claim requests (for owner org to approve/reject)
 */
export function useIncomingClaims() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['data-claim-requests', 'incoming', organization?.id],
    queryFn: async (): Promise<DataClaimRequest[]> => {
      if (!organization?.id) return [];

      const { data, error } = await (supabase
        .from('data_claim_requests') as any)
        .select('*')
        .eq('owner_org_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data?.length) return [];

      // Enrich with org names
      const orgIds = Array.from(new Set(data.map((d: any) => d.requesting_org_id)));
      const extIds = Array.from(new Set(data.map((d: any) => d.external_partner_id)));

      const [orgsRes, extRes] = await Promise.all([
        supabase.from('organizations').select('id, name, organization_type, logo_url').in('id', orgIds as string[]),
        supabase.from('external_partners').select('id, name, partner_type').in('id', extIds as string[]),
      ]);

      const orgsMap = new Map((orgsRes.data || []).map(o => [o.id, o]));
      const extMap = new Map((extRes.data || []).map(e => [e.id, e]));

      return data.map((d: any) => ({
        ...d,
        requesting_org: orgsMap.get(d.requesting_org_id) || null,
        external_partner: extMap.get(d.external_partner_id) || null,
      }));
    },
    enabled: !!organization?.id,
  });
}

/**
 * Approve a claim request — executes atomic migration
 */
export function useApproveClaim() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (claimId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('execute_data_claim', {
        p_claim_id: claimId,
        p_approver_id: user.id,
      });

      if (error) throw error;
      
      const result = data as any;
      if (!result?.success) {
        throw new Error(result?.error || 'Migration failed');
      }

      return result;
    },
    onSuccess: (result) => {
      toast.success(`تم ترحيل ${result.records_migrated} سجل بنجاح عبر ${result.tables?.length || 0} جداول`);
      qc.invalidateQueries({ queryKey: ['data-claim-requests'] });
      qc.invalidateQueries({ queryKey: ['partner-accounts'] });
      qc.invalidateQueries({ queryKey: ['claimable-partners'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'فشل في ترحيل البيانات');
    },
  });
}

/**
 * Reject a claim request
 */
export function useRejectClaim() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ claimId, reason }: { claimId: string; reason: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await (supabase
        .from('data_claim_requests') as any)
        .update({
          status: 'rejected',
          rejection_reason: reason,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', claimId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم رفض الطلب');
      qc.invalidateQueries({ queryKey: ['data-claim-requests'] });
    },
    onError: () => {
      toast.error('حدث خطأ');
    },
  });
}
