import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CURRENT_TERMS_VERSION, OrganizationType } from '@/data/organizationTermsContent';

interface TermsAcceptance {
  id: string;
  user_id: string;
  organization_id: string | null;
  organization_type: string;
  organization_name: string;
  full_name: string;
  terms_version: string;
  accepted_at: string;
}

export const useTermsAcceptance = () => {
  const { user, organization } = useAuth();
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [acceptance, setAcceptance] = useState<TermsAcceptance | null>(null);

  useEffect(() => {
    const checkTerms = async () => {
      if (!user || !organization) {
        setHasAcceptedTerms(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('terms_acceptances')
          .select('*')
          .eq('user_id', user.id)
          .eq('organization_id', organization.id)
          .eq('terms_version', CURRENT_TERMS_VERSION)
          .maybeSingle();

        if (error) {
          console.error('[TermsAcceptance] Check failed:', error.message);
          // On error, allow access to prevent blocking users
          setHasAcceptedTerms(true);
        } else if (data) {
          setAcceptance(data as TermsAcceptance);
          setHasAcceptedTerms(true);
        } else {
          setHasAcceptedTerms(false);
        }
      } catch (err) {
        console.error('[TermsAcceptance] Unexpected error:', err);
        setHasAcceptedTerms(true);
      } finally {
        setLoading(false);
      }
    };

    checkTerms();
  }, [user, organization]);

  const markAsAccepted = () => {
    setHasAcceptedTerms(true);
  };

  const organizationType = organization?.organization_type as OrganizationType | undefined;

  return {
    hasAcceptedTerms,
    loading,
    acceptance,
    markAsAccepted,
    organizationType,
    requiresAcceptance: organizationType && hasAcceptedTerms === false,
  };
};
