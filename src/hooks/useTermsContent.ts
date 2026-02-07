import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TermsSection {
  title: string;
  content: string[];
}

export interface TermsContent {
  id: string;
  organization_type: 'generator' | 'transporter' | 'recycler';
  version: string;
  sections: TermsSection[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Hook to fetch terms content from database
 * Falls back to static content if database fetch fails
 */
export function useTermsContent(organizationType: 'generator' | 'transporter' | 'recycler') {
  return useQuery({
    queryKey: ['terms-content', organizationType],
    queryFn: async (): Promise<TermsContent | null> => {
      const { data, error } = await supabase
        .from('terms_content')
        .select('*')
        .eq('organization_type', organizationType)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching terms content:', error);
        return null;
      }

      if (data) {
        return {
          id: data.id,
          organization_type: data.organization_type as TermsContent['organization_type'],
          version: data.version,
          sections: (data.sections as unknown as TermsSection[]) || [],
          is_active: data.is_active,
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
      }

      return null;
    },
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
  });
}

/**
 * Hook to fetch all terms content (for admin)
 */
export function useAllTermsContent() {
  return useQuery({
    queryKey: ['terms-content-all'],
    queryFn: async (): Promise<TermsContent[]> => {
      const { data, error } = await supabase
        .from('terms_content')
        .select('*')
        .order('organization_type', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all terms content:', error);
        return [];
      }

      return (data || []).map(item => ({
        id: item.id,
        organization_type: item.organization_type as TermsContent['organization_type'],
        version: item.version,
        sections: (item.sections as unknown as TermsSection[]) || [],
        is_active: item.is_active,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

/**
 * Get current terms version from database
 */
export function useCurrentTermsVersion(organizationType: 'generator' | 'transporter' | 'recycler') {
  const { data } = useTermsContent(organizationType);
  return data?.version || '1.0';
}
