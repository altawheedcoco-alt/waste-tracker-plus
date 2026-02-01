import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CURRENT_TERMS_VERSION } from '@/data/transporterTermsContent';

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

      // Only require terms for transporters
      if (organization.organization_type !== 'transporter') {
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
          console.error('Error checking terms acceptance:', error);
          setHasAcceptedTerms(true); // Don't block on error
        } else {
          setHasAcceptedTerms(!!data);
          setAcceptance(data);
        }
      } catch (error) {
        console.error('Error in checkTermsAcceptance:', error);
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

  return {
    hasAcceptedTerms,
    loading,
    acceptance,
    markAsAccepted,
    requiresAcceptance: organization?.organization_type === 'transporter' && hasAcceptedTerms === false,
  };
};
