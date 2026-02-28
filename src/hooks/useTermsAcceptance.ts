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
    const checkTermsAcceptance = async () => {
      if (!user || !organization) {
        setLoading(false);
        setHasAcceptedTerms(true); // No org = no terms needed
        return;
      }

      // All organization types require terms acceptance
      const validOrgTypes: OrganizationType[] = ['generator', 'transporter', 'recycler', 'disposal', 'consultant', 'consulting_office'];
      if (!validOrgTypes.includes(organization.organization_type as OrganizationType)) {
        setLoading(false);
        setHasAcceptedTerms(true);
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
          if (!error.message?.includes('AbortError') && (error as any).name !== 'AbortError') {
            console.error('Error checking terms acceptance:', error);
          }
          setHasAcceptedTerms(true); // Don't block on error
        } else {
          setHasAcceptedTerms(!!data);
          setAcceptance(data);
        }
      } catch (error: any) {
        if (!error?.message?.includes('AbortError') && error?.name !== 'AbortError') {
          console.error('Error in checkTermsAcceptance:', error);
        }
        setHasAcceptedTerms(true);
      } finally {
        setLoading(false);
      }
    };

    checkTermsAcceptance();
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
