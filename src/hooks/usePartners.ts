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
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch partners based on shared shipments
 * Each organization type sees only partners they've worked with via shipments
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
      const orgType = organization.organization_type;

      // Build query based on organization type to get partner IDs from shipments
      let partnerIds: Set<string> = new Set();

      if (orgType === 'generator') {
        // Generator sees transporters and recyclers from their shipments
        const { data: shipments, error: shipmentError } = await supabase
          .from('shipments')
          .select('transporter_id, recycler_id')
          .eq('generator_id', orgId);

        if (shipmentError) throw shipmentError;

        shipments?.forEach(s => {
          if (s.transporter_id) partnerIds.add(s.transporter_id);
          if (s.recycler_id) partnerIds.add(s.recycler_id);
        });
      } else if (orgType === 'transporter') {
        // Transporter sees generators and recyclers from their shipments
        const { data: shipments, error: shipmentError } = await supabase
          .from('shipments')
          .select('generator_id, recycler_id')
          .eq('transporter_id', orgId);

        if (shipmentError) throw shipmentError;

        shipments?.forEach(s => {
          if (s.generator_id) partnerIds.add(s.generator_id);
          if (s.recycler_id) partnerIds.add(s.recycler_id);
        });
      } else if (orgType === 'recycler') {
        // Recycler sees generators and transporters from their shipments
        const { data: shipments, error: shipmentError } = await supabase
          .from('shipments')
          .select('generator_id, transporter_id')
          .eq('recycler_id', orgId);

        if (shipmentError) throw shipmentError;

        shipments?.forEach(s => {
          if (s.generator_id) partnerIds.add(s.generator_id);
          if (s.transporter_id) partnerIds.add(s.transporter_id);
        });
      }

      // Fetch partner organizations
      if (partnerIds.size > 0) {
        const { data: orgs, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .in('id', Array.from(partnerIds))
          .eq('is_verified', true)
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
      setError(err?.message || 'فشل في تحميل بيانات الشركاء');
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
    loading,
    error,
    refetch: fetchPartners,
  };
};

export default usePartners;
