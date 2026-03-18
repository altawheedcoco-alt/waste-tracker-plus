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
    // ⚠️ TEMPORARILY BYPASSED FOR TESTING — re-enable after testing
    setHasAcceptedTerms(true);
    setLoading(false);
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
