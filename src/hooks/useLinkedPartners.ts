import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface LinkedPartner {
  id: string;
  name: string;
  organization_type: string;
  email: string;
  phone: string;
  city?: string;
  logo_url?: string;
  partner_code: string;
}

export const useLinkedPartners = (filterType?: 'generator' | 'transporter' | 'recycler' | 'disposal') => {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['linked-partners', organization?.id, filterType],
    queryFn: async (): Promise<LinkedPartner[]> => {
      if (!organization?.id) return [];

      // جلب الشراكات النشطة
      const { data: partnerships, error: partnershipError } = await supabase
        .from('verified_partnerships')
        .select(`
          id,
          requester_org_id,
          partner_org_id
        `)
        .or(`requester_org_id.eq.${organization.id},partner_org_id.eq.${organization.id}`)
        .eq('status', 'active');

      if (partnershipError) {
        console.error('Error fetching partnerships:', partnershipError);
        throw partnershipError;
      }

      if (!partnerships || partnerships.length === 0) {
        return [];
      }

      // استخراج معرفات الجهات المرتبطة
      const partnerIds = partnerships.map(p => 
        p.requester_org_id === organization.id ? p.partner_org_id : p.requester_org_id
      );

      // جلب بيانات الجهات المرتبطة
      let query = supabase
        .from('organizations')
        .select('id, name, organization_type, email, phone, city, logo_url, partner_code')
        .in('id', partnerIds)
        .eq('is_active', true);

      if (filterType) {
        query = query.eq('organization_type', filterType);
      }

      const { data: partners, error: partnersError } = await query.order('name');

      if (partnersError) {
        console.error('Error fetching partner organizations:', partnersError);
        throw partnersError;
      }

      return (partners || []) as LinkedPartner[];
    },
    enabled: !!organization?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
};

// Hook لجلب المولدين المرتبطين فقط
export const useLinkedGenerators = () => useLinkedPartners('generator');

// Hook لجلب الناقلين المرتبطين فقط
export const useLinkedTransporters = () => useLinkedPartners('transporter');

// Hook لجلب المدورين المرتبطين فقط
export const useLinkedRecyclers = () => useLinkedPartners('recycler');

// Hook لجلب جهات التخلص المرتبطة فقط
export const useLinkedDisposals = () => useLinkedPartners('disposal');

// Hook للتحقق من وجود شراكة مع جهة معينة
export const useIsPartnerLinked = (partnerOrgId?: string) => {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['is-partner-linked', organization?.id, partnerOrgId],
    queryFn: async (): Promise<boolean> => {
      if (!organization?.id || !partnerOrgId) return false;

      const { data, error } = await supabase
        .from('verified_partnerships')
        .select('id')
        .or(`and(requester_org_id.eq.${organization.id},partner_org_id.eq.${partnerOrgId}),and(requester_org_id.eq.${partnerOrgId},partner_org_id.eq.${organization.id})`)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.error('Error checking partnership:', error);
        return false;
      }

      return !!data;
    },
    enabled: !!organization?.id && !!partnerOrgId,
  });
};
