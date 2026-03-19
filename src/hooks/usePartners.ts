import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Partner {
  id: string;
  name: string;
  name_en: string | null;
  organization_type: string;
  email: string;
  phone: string;
  secondary_phone: string | null;
  city: string;
  region: string | null;
  address: string;
  commercial_register: string | null;
  environmental_license: string | null;
  activity_type: string | null;
  production_capacity: string | null;
  representative_name: string | null;
  representative_phone: string | null;
  representative_email: string | null;
  representative_position: string | null;
  representative_national_id: string | null;
  delegate_name: string | null;
  delegate_phone: string | null;
  delegate_email: string | null;
  delegate_national_id: string | null;
  agent_name: string | null;
  agent_phone: string | null;
  agent_email: string | null;
  agent_national_id: string | null;
  logo_url: string | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  client_code: string | null;
}

interface UsePartnersResult {
  generators: Partner[];
  transporters: Partner[];
  recyclers: Partner[];
  allPartners: Partner[];
  partners: Partner[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch partners based on verified_partnerships (not shipments).
 * This ensures all linked partners appear regardless of shipment history.
 */
export const usePartners = (): UsePartnersResult => {
  const { organization } = useAuth();
  const [generators, setGenerators] = useState<Partner[]>([]);
  const [transporters, setTransporters] = useState<Partner[]>([]);
  const [recyclers, setRecyclers] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPartners = async () => {
    if (!organization?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const orgId = organization.id;

      // 1. Get all active verified partnerships
      const { data: partnerships, error: pError } = await supabase
        .from('verified_partnerships')
        .select('requester_org_id, partner_org_id')
        .or(`requester_org_id.eq.${orgId},partner_org_id.eq.${orgId}`)
        .eq('status', 'active');

      if (pError) throw pError;

      const partnerIds = new Set<string>();
      partnerships?.forEach(p => {
        const otherId = p.requester_org_id === orgId ? p.partner_org_id : p.requester_org_id;
        if (otherId) partnerIds.add(otherId);
      });

      if (partnerIds.size > 0) {
        const { data: orgs, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .in('id', Array.from(partnerIds))
          .eq('is_active', true)
          .order('name');

        if (orgError) throw orgError;

        if (orgs) {
          setGenerators(orgs.filter(o => o.organization_type === 'generator'));
          setTransporters(orgs.filter(o => o.organization_type === 'transporter'));
          setRecyclers(orgs.filter(o => o.organization_type === 'recycler'));
        }
      } else {
        setGenerators([]);
        setTransporters([]);
        setRecyclers([]);
      }
    } catch (err: any) {
      console.error('Error fetching partners:', err);
      setError(err?.message || 'فشل في تحميل بيانات الجهات المرتبطة');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, [organization?.id]);

  const allPartners = [...generators, ...transporters, ...recyclers];

  return {
    generators,
    transporters,
    recyclers,
    allPartners,
    partners: allPartners,
    loading,
    error,
    refetch: fetchPartners,
  };
};

export default usePartners;
