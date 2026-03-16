/**
 * useCarbonCredits — Track and manage carbon credits from recycling operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CarbonCredit {
  id: string;
  carbon_tons: number;
  credit_type: string;
  credit_value_usd: number | null;
  credit_value_sar: number | null;
  certificate_number: string | null;
  certificate_url: string | null;
  source_description: string | null;
  source_shipment_id: string | null;
  status: string | null;
  tradeable: boolean | null;
  traded_at: string | null;
  traded_price: number | null;
  traded_to: string | null;
  verification_status: string | null;
  verified_at: string | null;
  expiry_date: string | null;
  created_at: string;
}

export interface CarbonCreditSummary {
  totalCredits: number;
  totalTons: number;
  totalValueUSD: number;
  verifiedCredits: number;
  tradeableCredits: number;
  tradedCredits: number;
  pendingVerification: number;
}

// Carbon price per ton (approximation based on voluntary market)
const CARBON_PRICE_USD_PER_TON = 25;

export function useCarbonCredits() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  return useQuery({
    queryKey: ['carbon-credits', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('carbon_credits')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as CarbonCredit[];
    },
    enabled: !!orgId,
  });
}

export function useCarbonCreditSummary(): CarbonCreditSummary {
  const { data: credits = [] } = useCarbonCredits();

  return {
    totalCredits: credits.length,
    totalTons: credits.reduce((sum, c) => sum + (c.carbon_tons || 0), 0),
    totalValueUSD: credits.reduce((sum, c) => sum + (c.credit_value_usd || c.carbon_tons * CARBON_PRICE_USD_PER_TON), 0),
    verifiedCredits: credits.filter(c => c.verification_status === 'verified').length,
    tradeableCredits: credits.filter(c => c.tradeable && !c.traded_at).length,
    tradedCredits: credits.filter(c => c.traded_at).length,
    pendingVerification: credits.filter(c => c.verification_status === 'pending' || !c.verification_status).length,
  };
}

export function useGenerateCarbonCredit() {
  const { organization } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ shipmentId, carbonTons, description }: {
      shipmentId: string;
      carbonTons: number;
      description: string;
    }) => {
      if (!organization?.id) throw new Error('No org');

      const certNumber = `CC-${organization.id.slice(0, 4).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

      const { data, error } = await supabase
        .from('carbon_credits')
        .insert({
          organization_id: organization.id,
          source_shipment_id: shipmentId,
          carbon_tons: carbonTons,
          credit_type: 'voluntary',
          credit_value_usd: carbonTons * CARBON_PRICE_USD_PER_TON,
          source_description: description,
          certificate_number: certNumber,
          status: 'active',
          verification_status: 'pending',
          tradeable: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carbon-credits'] });
      toast.success('تم توليد رصيد كربون جديد');
    },
    onError: (err: any) => {
      toast.error(`خطأ: ${err.message}`);
    },
  });
}
