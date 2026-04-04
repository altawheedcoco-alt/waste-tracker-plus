/**
 * useOrganizationImpact — Calculates real-time environmental impact metrics for an organization
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const RECYCLING_CO2_FACTORS: Record<string, number> = {
  plastic: 1.4, paper: 0.9, metal: 4.0, glass: 0.3,
  electronic: 3.5, organic: 0.2, chemical: 1.0, medical: 1.5,
  construction: 0.2, aluminum: 9.0, textile: 3.0, wood: 0.5,
  rubber: 1.8, other: 0.5,
};

const TREE_CO2_PER_YEAR = 0.022; // tons
const WATER_PER_TON = 7000; // liters

export interface OrgImpact {
  totalTons: number;
  co2SavedTons: number;
  treesEquivalent: number;
  waterSavedLiters: number;
  completedShipments: number;
  recyclingRate: number;
  wasteByType: Array<{ type: string; tons: number }>;
}

export function useOrganizationImpact(orgId: string | undefined) {
  return useQuery({
    queryKey: ['org-impact', orgId],
    queryFn: async (): Promise<OrgImpact> => {
      if (!orgId) throw new Error('No org');

      const { data: shipments, error } = await supabase
        .from('shipments')
        .select('id, waste_type, quantity, unit, status')
        .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId},disposal_facility_id.eq.${orgId}`)
        .in('status', ['delivered', 'confirmed'] as any[]);

      if (error) throw error;
      const records = shipments || [];

      const wasteMap = new Map<string, number>();
      let totalTons = 0;

      for (const s of records) {
        const qty = Number(s.quantity) || 0;
        const unit = (s.unit || 'ton').toLowerCase();
        const tons = unit === 'kg' ? qty / 1000 : unit === 'g' || unit === 'gram' ? qty / 1e6 : qty;
        totalTons += tons;
        const wt = (s.waste_type || 'other').toLowerCase();
        wasteMap.set(wt, (wasteMap.get(wt) || 0) + tons);
      }

      let totalCO2 = 0;
      const wasteByType: OrgImpact['wasteByType'] = [];
      for (const [type, tons] of wasteMap) {
        const co2 = tons * (RECYCLING_CO2_FACTORS[type] || 0.5);
        totalCO2 += co2;
        wasteByType.push({ type, tons: Math.round(tons * 100) / 100 });
      }
      wasteByType.sort((a, b) => b.tons - a.tons);

      return {
        totalTons: Math.round(totalTons * 100) / 100,
        co2SavedTons: Math.round(totalCO2 * 100) / 100,
        treesEquivalent: Math.round(totalCO2 / TREE_CO2_PER_YEAR),
        waterSavedLiters: Math.round(totalTons * WATER_PER_TON),
        completedShipments: records.length,
        recyclingRate: totalTons > 0 ? 100 : 0,
        wasteByType,
      };
    },
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });
}
