import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/AuthContext';
import { toast } from 'sonner';

export interface SigningChain {
  id: string;
  document_id: string;
  document_type: string;
  document_title: string;
  document_url: string | null;
  initiated_by: string | null;
  initiated_org_id: string | null;
  status: string;
  total_signers: number;
  completed_signers: number;
  metadata: any;
  created_at: string;
  updated_at: string;
  steps?: SigningChainStep[];
  initiated_org?: { name: string } | null;
}

export interface SigningChainStep {
  id: string;
  chain_id: string;
  signer_org_id: string | null;
  signer_user_id: string | null;
  signer_name: string | null;
  step_order: number;
  status: string;
  signed_at: string | null;
  signature_id: string | null;
  signature_url: string | null;
  rejection_reason: string | null;
  notes: string | null;
  created_at: string;
  signer_org?: { name: string } | null;
}

export function useSigningChains() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const orgId = profile?.organization_id;

  const chainsQuery = useQuery({
    queryKey: ['signing-chains', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('signing_chains')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Enrich with steps and org names
      const chains = data || [];
      if (!chains.length) return [];

      const chainIds = chains.map(c => c.id);
      const orgIds = [...new Set(chains.map(c => c.initiated_org_id).filter(Boolean))] as string[];

      const [stepsRes, orgsRes] = await Promise.all([
        supabase.from('signing_chain_steps').select('*').in('chain_id', chainIds).order('step_order'),
        orgIds.length > 0
          ? supabase.from('organizations').select('id, name').in('id', orgIds)
          : { data: [] },
      ]);

      const stepsMap = new Map<string, SigningChainStep[]>();
      const stepOrgIds = new Set<string>();
      for (const s of (stepsRes.data || [])) {
        if (!stepsMap.has(s.chain_id)) stepsMap.set(s.chain_id, []);
        stepsMap.get(s.chain_id)!.push(s as SigningChainStep);
        if (s.signer_org_id) stepOrgIds.add(s.signer_org_id);
      }

      // Fetch step org names
      const allOrgIds = [...new Set([...orgIds, ...stepOrgIds])];
      const orgsMap = new Map((orgsRes.data || []).map(o => [o.id, o]));
      if (stepOrgIds.size > 0) {
        const missing = [...stepOrgIds].filter(id => !orgsMap.has(id));
        if (missing.length) {
          const { data: moreOrgs } = await supabase.from('organizations').select('id, name').in('id', missing);
          (moreOrgs || []).forEach(o => orgsMap.set(o.id, o));
        }
      }

      return chains.map(c => ({
        ...c,
        steps: (stepsMap.get(c.id) || []).map(s => ({
          ...s,
          signer_org: s.signer_org_id ? orgsMap.get(s.signer_org_id) || null : null,
        })),
        initiated_org: c.initiated_org_id ? orgsMap.get(c.initiated_org_id) || null : null,
      })) as SigningChain[];
    },
    enabled: !!orgId,
  });

  const createChain = useMutation({
    mutationFn: async (params: {
      document_id: string;
      document_type: string;
      document_title: string;
      document_url?: string;
      signers: { org_id: string; user_id?: string; name?: string }[];
    }) => {
      if (!orgId || !profile) throw new Error('غير مسجل الدخول');

      const { data: chain, error } = await supabase
        .from('signing_chains')
        .insert({
          document_id: params.document_id,
          document_type: params.document_type,
          document_title: params.document_title,
          document_url: params.document_url || null,
          initiated_by: profile.user_id,
          initiated_org_id: orgId,
          status: 'active',
          total_signers: params.signers.length,
          completed_signers: 0,
        })
        .select('id')
        .single();
      if (error) throw error;

      // Insert steps - no enforced order
      const steps = params.signers.map((s, i) => ({
        chain_id: chain.id,
        signer_org_id: s.org_id,
        signer_user_id: s.user_id || null,
        signer_name: s.name || null,
        step_order: i,
        status: 'pending',
      }));

      const { error: stepsErr } = await supabase.from('signing_chain_steps').insert(steps);
      if (stepsErr) throw stepsErr;

      // Log journey event
      await supabase.from('document_journey_events').insert({
        document_id: params.document_id,
        document_type: params.document_type,
        event_type: 'chain_created',
        event_title: 'إنشاء سلسلة توقيع متعدد',
        event_description: `تم إنشاء سلسلة توقيع بـ ${params.signers.length} أطراف`,
        actor_user_id: profile.user_id,
        actor_org_id: orgId,
        actor_name: profile.full_name,
      });

      return chain.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signing-chains'] });
      toast.success('تم إنشاء سلسلة التوقيع المتعدد بنجاح');
    },
    onError: (err: any) => toast.error(err.message || 'فشل في إنشاء السلسلة'),
  });

  const signStep = useMutation({
    mutationFn: async (params: {
      stepId: string;
      chainId: string;
      signatureId?: string;
      signatureUrl?: string;
    }) => {
      if (!profile) throw new Error('غير مسجل الدخول');

      const { error } = await supabase
        .from('signing_chain_steps')
        .update({
          status: 'signed',
          signed_at: new Date().toISOString(),
          signature_id: params.signatureId || null,
          signature_url: params.signatureUrl || null,
        })
        .eq('id', params.stepId);
      if (error) throw error;

      // Update chain completed count
      const { data: steps } = await supabase
        .from('signing_chain_steps')
        .select('status')
        .eq('chain_id', params.chainId);

      const completed = (steps || []).filter(s => s.status === 'signed').length;
      const total = (steps || []).length;

      const chainUpdate: any = { completed_signers: completed };
      if (completed >= total) chainUpdate.status = 'completed';

      await supabase.from('signing_chains').update(chainUpdate).eq('id', params.chainId);

      // Journey event
      await supabase.from('document_journey_events').insert({
        document_id: params.chainId,
        document_type: 'signing_chain',
        event_type: 'step_signed',
        event_title: 'توقيع خطوة في السلسلة',
        event_description: `${profile.full_name} وقّع على المستند (${completed}/${total})`,
        actor_user_id: profile.user_id,
        actor_org_id: profile.organization_id,
        actor_name: profile.full_name,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signing-chains'] });
      toast.success('تم التوقيع بنجاح ✅');
    },
    onError: (err: any) => toast.error(err.message || 'فشل في التوقيع'),
  });

  return {
    chains: chainsQuery.data || [],
    isLoading: chainsQuery.isLoading,
    createChain,
    signStep,
  };
}
