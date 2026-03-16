/**
 * useEnvironmentalKPIs — Real-time environmental impact metrics
 * Pulls actual shipment data to calculate CO₂ saved, recycling rate, trees equivalent, etc.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// IPCC/GHG Protocol emission factors (tons CO₂ per ton waste recycled)
const RECYCLING_CO2_FACTORS: Record<string, number> = {
  plastic: 1.4, paper: 0.9, metal: 4.0, glass: 0.3,
  electronic: 3.5, organic: 0.2, chemical: 1.0, medical: 1.5,
  construction: 0.2, aluminum: 9.0, textile: 3.0, wood: 0.5,
  rubber: 1.8, other: 0.5,
};

// Equivalency factors
const TREE_CO2_ABSORPTION_PER_YEAR = 0.022; // tons CO₂ per tree per year
const CAR_CO2_PER_YEAR = 4.6; // tons CO₂ per car per year
const HOME_ENERGY_CO2_PER_YEAR = 5.5; // tons CO₂ per home per year
const WATER_SAVED_PER_TON_RECYCLED = 7000; // liters per ton recycled
const ENERGY_SAVED_PER_TON_KWH = 3500; // kWh per ton recycled avg

export interface EnvironmentalKPIs {
  totalWasteTons: number;
  recycledTons: number;
  landfillDivertedTons: number;
  recyclingRate: number; // percentage
  co2SavedTons: number;
  treesEquivalent: number;
  carsOffRoad: number;
  homesEnergySaved: number;
  waterSavedLiters: number;
  energySavedKWh: number;
  monthlyTrend: Array<{ month: string; tons: number; co2: number }>;
  wasteByType: Array<{ type: string; tons: number; co2: number }>;
  period: string;
}

export function useEnvironmentalKPIs(period: 'month' | 'quarter' | 'year' | 'all' = 'year') {
  const { organization } = useAuth();
  const orgId = organization?.id;

  return useQuery({
    queryKey: ['environmental-kpis', orgId, period],
    queryFn: async (): Promise<EnvironmentalKPIs> => {
      if (!orgId) throw new Error('No org');

      // Calculate date range
      const now = new Date();
      let fromDate: string | null = null;
      if (period === 'month') {
        fromDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      } else if (period === 'quarter') {
        fromDate = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString();
      } else if (period === 'year') {
        fromDate = new Date(now.getFullYear(), 0, 1).toISOString();
      }

      // Fetch completed shipments
      let query = supabase
        .from('shipments')
        .select('id, waste_type, quantity, unit, status, created_at')
        .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId},disposal_facility_id.eq.${orgId}`)
        .in('status', ['delivered', 'completed', 'recycled', 'processed', 'accepted']);

      if (fromDate) {
        query = query.gte('created_at', fromDate);
      }

      const { data: shipments, error } = await query;
      if (error) throw error;

      const records = shipments || [];

      // Aggregate by waste type
      const wasteMap = new Map<string, number>();
      let totalTons = 0;

      for (const s of records) {
        const tons = convertToTons(s.quantity || 0, s.unit || 'ton');
        totalTons += tons;
        const wt = (s.waste_type || 'other').toLowerCase();
        wasteMap.set(wt, (wasteMap.get(wt) || 0) + tons);
      }

      // Calculate CO₂ saved per type
      let totalCO2 = 0;
      const wasteByType: EnvironmentalKPIs['wasteByType'] = [];
      for (const [type, tons] of wasteMap) {
        const factor = RECYCLING_CO2_FACTORS[type] || RECYCLING_CO2_FACTORS.other;
        const co2 = tons * factor;
        totalCO2 += co2;
        wasteByType.push({ type, tons: Math.round(tons * 100) / 100, co2: Math.round(co2 * 100) / 100 });
      }
      wasteByType.sort((a, b) => b.tons - a.tons);

      // Monthly trend (last 12 months)
      const monthlyMap = new Map<string, { tons: number; co2: number }>();
      for (const s of records) {
        const d = new Date(s.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const tons = convertToTons(s.quantity || 0, s.unit || 'ton');
        const wt = (s.waste_type || 'other').toLowerCase();
        const co2 = tons * (RECYCLING_CO2_FACTORS[wt] || 0.5);
        const existing = monthlyMap.get(key) || { tons: 0, co2: 0 };
        monthlyMap.set(key, { tons: existing.tons + tons, co2: existing.co2 + co2 });
      }
      const monthlyTrend = Array.from(monthlyMap.entries())
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month));

      return {
        totalWasteTons: Math.round(totalTons * 100) / 100,
        recycledTons: Math.round(totalTons * 100) / 100, // all completed = recycled/processed
        landfillDivertedTons: Math.round(totalTons * 100) / 100,
        recyclingRate: totalTons > 0 ? 100 : 0,
        co2SavedTons: Math.round(totalCO2 * 100) / 100,
        treesEquivalent: Math.round(totalCO2 / TREE_CO2_ABSORPTION_PER_YEAR),
        carsOffRoad: Math.round((totalCO2 / CAR_CO2_PER_YEAR) * 10) / 10,
        homesEnergySaved: Math.round((totalCO2 / HOME_ENERGY_CO2_PER_YEAR) * 10) / 10,
        waterSavedLiters: Math.round(totalTons * WATER_SAVED_PER_TON_RECYCLED),
        energySavedKWh: Math.round(totalTons * ENERGY_SAVED_PER_TON_KWH),
        monthlyTrend,
        wasteByType,
        period,
      };
    },
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });
}

function convertToTons(qty: number, unit: string): number {
  switch (unit?.toLowerCase()) {
    case 'kg': return qty / 1000;
    case 'gram': case 'g': return qty / 1_000_000;
    case 'liter': case 'litre': case 'l': return qty / 1000;
    default: return qty; // ton
  }
}
