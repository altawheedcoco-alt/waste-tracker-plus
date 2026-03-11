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
  organization_name?: string;
  organization_type?: string;
  is_favorited?: boolean;
}

export interface B2BRequest {
  id: string;
  organization_id: string;
  requester_type: string;
  title: string;
  description: string | null;
  waste_type: string;
  quantity: number;
  unit: string | null;
  budget_min: number | null;
  budget_max: number | null;
  target_audience: string[] | null;
  delivery_preference: string | null;
  location_city: string | null;
  location_address: string | null;
  urgency: string | null;
  deadline: string | null;
  status: string | null;
  responses_count: number | null;
  views_count: number | null;
  request_number: string;
  created_at: string;
  organization_name?: string;
  organization_type?: string;
}

export interface B2BDeal {
  id: string;
  listing_id: string | null;
  request_id: string | null;
  seller_organization_id: string;
  buyer_organization_id: string;
  deal_number: string;
  title: string;
  agreed_price: number | null;
  agreed_quantity: number | null;
  unit: string | null;
  status: string | null;
  seller_confirmed: boolean | null;
  buyer_confirmed: boolean | null;
  notes: string | null;
  delivery_date: string | null;
  delivery_method: string | null;
  payment_terms: string | null;
  seller_rating: number | null;
  buyer_rating: number | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  seller_name?: string;
  buyer_name?: string;
}

// ============ LISTINGS ============

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

export const useCreateB2BListing = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const myOrgType = (organization?.organization_type as OrgType) || 'generator';

  return useMutation({
    mutationFn: async (listing: Partial<B2BListing> & { title: string; waste_type: string; quantity: number }) => {
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
      toast.success('تم نشر العرض بنجاح في السوق');
      queryClient.invalidateQueries({ queryKey: ['b2b-listings'] });
      queryClient.invalidateQueries({ queryKey: ['my-b2b-listings'] });
      queryClient.invalidateQueries({ queryKey: ['b2b-stats'] });
    },
    onError: (err: any) => toast.error('فشل نشر العرض: ' + err.message),
  });
};

export const useUpdateListingStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('marketplace_listings').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم تحديث حالة العرض');
      queryClient.invalidateQueries({ queryKey: ['b2b-listings'] });
      queryClient.invalidateQueries({ queryKey: ['my-b2b-listings'] });
    },
  });
};

// ============ REQUESTS (DEMAND SIDE) ============

export const useB2BRequests = (filters?: { category?: string; search?: string }) => {
  const { organization } = useAuth();
  const myOrgType = (organization?.organization_type as OrgType) || 'generator';

  return useQuery({
    queryKey: ['b2b-requests', myOrgType, filters],
    queryFn: async () => {
      let query = (supabase.from('b2b_requests') as any)
        .select('*, organizations!b2b_requests_organization_id_fkey(name, type)')
        .eq('status', 'open')
        .contains('target_audience', [myOrgType])
        .order('created_at', { ascending: false });

      if (filters?.category && filters.category !== 'all') {
        query = query.eq('waste_type', filters.category);
      }
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((item: any) => ({
        ...item,
        organization_name: item.organizations?.name,
        organization_type: item.organizations?.type,
      })) as B2BRequest[];
    },
    enabled: !!organization,
  });
};

export const useMyB2BRequests = () => {
  const { organization } = useAuth();
  return useQuery({
    queryKey: ['my-b2b-requests', organization?.id],
    queryFn: async () => {
      const { data, error } = await (supabase.from('b2b_requests') as any)
        .select('*')
        .eq('organization_id', organization!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as B2BRequest[];
    },
    enabled: !!organization?.id,
  });
};

export const useCreateB2BRequest = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const myOrgType = (organization?.organization_type as OrgType) || 'generator';

  return useMutation({
    mutationFn: async (req: {
      title: string; waste_type: string; quantity: number; unit?: string;
      description?: string; budget_min?: number; budget_max?: number;
      target_audience?: string[]; location_city?: string; urgency?: string; deadline?: string;
    }) => {
      const { error } = await (supabase.from('b2b_requests') as any).insert({
        ...req,
        organization_id: organization!.id,
        requester_type: myOrgType,
        target_audience: req.target_audience || DEFAULT_TARGET_AUDIENCE[myOrgType],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم نشر طلبك بنجاح');
      queryClient.invalidateQueries({ queryKey: ['b2b-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-b2b-requests'] });
      queryClient.invalidateQueries({ queryKey: ['b2b-stats'] });
    },
    onError: (err: any) => toast.error('فشل نشر الطلب: ' + err.message),
  });
};

// ============ DEALS ============

export const useMyDeals = () => {
  const { organization } = useAuth();
  return useQuery({
    queryKey: ['b2b-deals', organization?.id],
    queryFn: async () => {
      const { data, error } = await (supabase.from('b2b_deals') as any)
        .select(`*, 
          seller:organizations!b2b_deals_seller_organization_id_fkey(name),
          buyer:organizations!b2b_deals_buyer_organization_id_fkey(name)
        `)
        .or(`seller_organization_id.eq.${organization!.id},buyer_organization_id.eq.${organization!.id}`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((d: any) => ({
        ...d,
        seller_name: d.seller?.name,
        buyer_name: d.buyer?.name,
      })) as B2BDeal[];
    },
    enabled: !!organization?.id,
  });
};

export const useCreateDeal = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (deal: {
      listing_id?: string; request_id?: string;
      counterpart_org_id: string; title: string;
      agreed_price?: number; agreed_quantity?: number; unit?: string;
      notes?: string; isSeller: boolean;
    }) => {
      const { error } = await (supabase.from('b2b_deals') as any).insert({
        listing_id: deal.listing_id,
        request_id: deal.request_id,
        seller_organization_id: deal.isSeller ? organization!.id : deal.counterpart_org_id,
        buyer_organization_id: deal.isSeller ? deal.counterpart_org_id : organization!.id,
        title: deal.title,
        agreed_price: deal.agreed_price,
        agreed_quantity: deal.agreed_quantity,
        unit: deal.unit || 'ton',
        notes: deal.notes,
        status: 'negotiating',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم إنشاء الصفقة بنجاح');
      queryClient.invalidateQueries({ queryKey: ['b2b-deals'] });
    },
    onError: (err: any) => toast.error('فشل إنشاء الصفقة: ' + err.message),
  });
};

export const useUpdateDeal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<B2BDeal>) => {
      const { error } = await (supabase.from('b2b_deals') as any).update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم تحديث الصفقة');
      queryClient.invalidateQueries({ queryKey: ['b2b-deals'] });
    },
  });
};

// ============ FAVORITES ============

export const useB2BFavorites = () => {
  const { user, organization } = useAuth();
  return useQuery({
    queryKey: ['b2b-favorites', user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase.from('b2b_favorites') as any)
        .select('*')
        .eq('user_id', user!.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
};

export const useToggleFavorite = () => {
  const { user, organization } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ listingId, requestId }: { listingId?: string; requestId?: string }) => {
      // Check if exists
      let query = (supabase.from('b2b_favorites') as any).select('id').eq('user_id', user!.id);
      if (listingId) query = query.eq('listing_id', listingId);
      if (requestId) query = query.eq('request_id', requestId);
      const { data: existing } = await query.maybeSingle();

      if (existing) {
        await (supabase.from('b2b_favorites') as any).delete().eq('id', existing.id);
      } else {
        await (supabase.from('b2b_favorites') as any).insert({
          user_id: user!.id,
          organization_id: organization!.id,
          listing_id: listingId || null,
          request_id: requestId || null,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['b2b-favorites'] });
    },
  });
};

// ============ STATS ============

export const useB2BStats = () => {
  const { organization } = useAuth();
  const myOrgType = (organization?.organization_type as OrgType) || 'generator';

  return useQuery({
    queryKey: ['b2b-stats', myOrgType, organization?.id],
    queryFn: async () => {
      const { data: listings } = await supabase
        .from('marketplace_listings')
        .select('id', { count: 'exact' })
        .in('status', ['open', 'bidding'])
        .contains('target_audience', [myOrgType]);

      const { data: requests } = await (supabase.from('b2b_requests') as any)
        .select('id', { count: 'exact' })
        .eq('status', 'open')
        .contains('target_audience', [myOrgType]);

      const { data: myListings } = await supabase
        .from('marketplace_listings')
        .select('id, status, bids_count')
        .eq('organization_id', organization!.id);

      const { data: deals } = await (supabase.from('b2b_deals') as any)
        .select('id, status')
        .or(`seller_organization_id.eq.${organization!.id},buyer_organization_id.eq.${organization!.id}`);

      return {
        availableListings: listings?.length || 0,
        availableRequests: requests?.length || 0,
        myListingsCount: myListings?.length || 0,
        myActiveListings: myListings?.filter((l: any) => l.status === 'open' || l.status === 'bidding').length || 0,
        totalBidsReceived: myListings?.reduce((s: number, l: any) => s + (l.bids_count || 0), 0) || 0,
        activeDeals: deals?.filter((d: any) => d.status === 'negotiating' || d.status === 'agreed').length || 0,
        completedDeals: deals?.filter((d: any) => d.status === 'completed').length || 0,
      };
    },
    enabled: !!organization,
  });
};
