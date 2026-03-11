import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { OrgType } from '@/components/b2b/B2BVisibilityEngine';
import { DEFAULT_TARGET_AUDIENCE } from '@/components/b2b/B2BVisibilityEngine';

export interface B2BListing {
  id: string;
  title: string;
  waste_type: string;
  waste_description: string | null;
  quantity: number;
  unit: string | null;
  min_price: number | null;
  max_price: number | null;
  price_per_unit: number | null;
  is_negotiable: boolean | null;
  pickup_address: string | null;
  pickup_city: string | null;
  delivery_option: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  special_requirements: string | null;
  hazardous: boolean | null;
  status: string | null;
  listing_number: string;
  images: string[] | null;
  seller_type: string | null;
  target_audience: string[] | null;
  organization_id: string;
  bids_count: number | null;
  views_count: number | null;
  created_at: string;
  expires_at: string | null;
  deadline: string | null;
  listing_type: string | null;
  // Joined
  organization_name?: string;
  organization_type?: string;
}

/**
 * Fetch visible listings for the current user's org type
 */
export const useB2BListings = (filters?: {
  category?: string;
  search?: string;
  sellerType?: string;
}) => {
  const { organization } = useAuth();
  const myOrgType = (organization?.organization_type as OrgType) || 'generator';

  return useQuery({
    queryKey: ['b2b-listings', myOrgType, filters],
    queryFn: async () => {
      let query = supabase
        .from('marketplace_listings')
        .select('*, organizations!marketplace_listings_organization_id_fkey(name, type)')
        .in('status', ['open', 'bidding'])
        .contains('target_audience', [myOrgType])
        .order('created_at', { ascending: false });

      if (filters?.category && filters.category !== 'all') {
        query = query.eq('waste_type', filters.category);
      }

      if (filters?.sellerType && filters.sellerType !== 'all') {
        query = query.eq('seller_type', filters.sellerType);
      }

      if (filters?.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,waste_description.ilike.%${filters.search}%,pickup_city.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((item: any) => ({
        ...item,
        organization_name: item.organizations?.name,
        organization_type: item.organizations?.type,
      })) as B2BListing[];
    },
    enabled: !!organization,
  });
};

/**
 * Fetch current user's own listings
 */
export const useMyB2BListings = () => {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['my-b2b-listings', organization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_listings')
        .select('*')
        .eq('organization_id', organization!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as B2BListing[];
    },
    enabled: !!organization?.id,
  });
};

/**
 * B2B marketplace stats
 */
export const useB2BStats = () => {
  const { organization } = useAuth();
  const myOrgType = (organization?.organization_type as OrgType) || 'generator';

  return useQuery({
    queryKey: ['b2b-stats', myOrgType],
    queryFn: async () => {
      const { data: allOpen } = await supabase
        .from('marketplace_listings')
        .select('id, seller_type, bids_count', { count: 'exact' })
        .in('status', ['open', 'bidding'])
        .contains('target_audience', [myOrgType]);

      const { data: myListings } = await supabase
        .from('marketplace_listings')
        .select('id, status, bids_count')
        .eq('organization_id', organization!.id);

      const openCount = allOpen?.length || 0;
      const myCount = myListings?.length || 0;
      const myActiveCount = myListings?.filter(l => l.status === 'open' || l.status === 'bidding').length || 0;
      const totalBids = myListings?.reduce((sum, l) => sum + (l.bids_count || 0), 0) || 0;

      return { openCount, myCount, myActiveCount, totalBids };
    },
    enabled: !!organization,
  });
};

/**
 * Create a new listing
 */
export const useCreateB2BListing = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const myOrgType = (organization?.organization_type as OrgType) || 'generator';

  return useMutation({
    mutationFn: async (listing: {
      title: string;
      waste_type: string;
      waste_description?: string;
      quantity: number;
      unit: string;
      min_price?: number;
      max_price?: number;
      price_per_unit?: number;
      is_negotiable?: boolean;
      pickup_address?: string;
      pickup_city?: string;
      delivery_option?: string;
      contact_name?: string;
      contact_phone?: string;
      special_requirements?: string;
      hazardous?: boolean;
      target_audience?: string[];
      deadline?: string;
    }) => {
      const { error } = await supabase.from('marketplace_listings').insert({
        ...listing,
        organization_id: organization!.id,
        seller_type: myOrgType,
        target_audience: listing.target_audience || DEFAULT_TARGET_AUDIENCE[myOrgType],
        listing_number: `B2B-${Date.now().toString(36).toUpperCase()}`,
        status: 'open',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم نشر العرض بنجاح');
      queryClient.invalidateQueries({ queryKey: ['b2b-listings'] });
      queryClient.invalidateQueries({ queryKey: ['my-b2b-listings'] });
      queryClient.invalidateQueries({ queryKey: ['b2b-stats'] });
    },
    onError: (err: any) => {
      toast.error('فشل نشر العرض: ' + err.message);
    },
  });
};

/**
 * Update listing status
 */
export const useUpdateListingStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('marketplace_listings')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم تحديث حالة العرض');
      queryClient.invalidateQueries({ queryKey: ['b2b-listings'] });
      queryClient.invalidateQueries({ queryKey: ['my-b2b-listings'] });
    },
  });
};
