/**
 * useCarbonScopes — Calculates Scope 1/2/3 carbon emissions
 * Scope 1: Direct fuel combustion (from fuel_records)
 * Scope 2: Purchased electricity (estimated from org data)
 * Scope 3: Waste transport + processing (from shipments)
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// IPCC + Egyptian Grid factors
const DIESEL_KG_CO2_PER_LITER = 2.68;
const GASOLINE_KG_CO2_PER_LITER = 2.31;
const NATURAL_GAS_KG_CO2_PER_M3 = 2.0;
const EGYPT_GRID_KG_CO2_PER_KWH = 0.489;
const TRANSPORT_KG_CO2_PER_KM_TON = 0.062;

const RECYCLING_SAVINGS_FACTORS: Record<string, number> = {
  plastic: 1400, paper: 900, metal: 4000, glass: 300,
  electronic: 3500, organic: 200, chemical: 1000, medical: 1500,
  construction: 200, aluminum: 9000, textile: 3000, wood: 500,
  rubber: 1800, other: 500,
};

const WASTE_PROCESSING_FACTORS: Record<string, number> = {
  plastic: 2500, paper: 800, metal: 1200, glass: 500,
  electronic: 3500, organic: 300, chemical: 4000, medical: 5000,
  construction: 400, other: 1000,
};

export interface ScopeBreakdown {
  scope1: { total: number; fuel: number; details: Array<{ type: string; liters: number; kgCO2: number }> };
  scope2: { total: number; estimatedKWh: number };
  scope3: { total: number; transport: number; processing: number; savings: number };
  grandTotal: number;
  netEmissions: number;
  totalSavings: number;
  scopePercentages: { scope1: number; scope2: number; scope3: number };
  insights: string[];
  monthlyScopes: Array<{ month: string; scope1: number; scope2: number; scope3: number }>;
}

export function useCarbonScopes(period: 'month' | 'quarter' | 'year' | 'all' = 'year') {
  const { organization } = useAuth();
  const orgId = organization?.id;

  return useQuery({
    queryKey: ['carbon-scopes', orgId, period],
    queryFn: async (): Promise<ScopeBreakdown> => {
      if (!orgId) throw new Error('No org');

      const now = new Date();
      let fromDate: string | null = null;
      if (period === 'month') fromDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      else if (period === 'quarter') fromDate = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString();
      else if (period === 'year') fromDate = new Date(now.getFullYear(), 0, 1).toISOString();

      // Parallel fetch: fuel records + shipments
      const [fuelResult, shipmentsResult] = await Promise.all([
        (() => {
          let q = supabase
            .from('fuel_records')
            .select('id, fuel_type, liters, cost_per_liter, total_cost, odometer_reading, created_at')
            .eq('organization_id', orgId);
          if (fromDate) q = q.gte('created_at', fromDate);
          return q;
        })(),
        (() => {
          let q = supabase
            .from('shipments')
            .select('id, waste_type, quantity, unit, status, disposal_method, pickup_latitude, pickup_longitude, delivery_latitude, delivery_longitude, created_at')
            .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId},disposal_facility_id.eq.${orgId}`)
            .in('status', ['delivered', 'confirmed'] as any[]);
          if (fromDate) q = q.gte('created_at', fromDate);
          return q;
        })(),
      ]);

      const fuelRecords = fuelResult.data || [];
      const shipments = shipmentsResult.data || [];

      // ═══ SCOPE 1: Direct fuel combustion ═══
      const fuelByType = new Map<string, { liters: number; kgCO2: number }>();
      let scope1Total = 0;

      for (const f of fuelRecords) {
        const liters = Number(f.liters) || 0;
        const type = (f.fuel_type || 'diesel').toLowerCase();
        const factor = type === 'gasoline' || type === 'بنزين' ? GASOLINE_KG_CO2_PER_LITER
          : type === 'natural_gas' || type === 'غاز' ? NATURAL_GAS_KG_CO2_PER_M3
          : DIESEL_KG_CO2_PER_LITER;
        const kgCO2 = liters * factor;
        scope1Total += kgCO2;

        const existing = fuelByType.get(type) || { liters: 0, kgCO2: 0 };
        fuelByType.set(type, { liters: existing.liters + liters, kgCO2: existing.kgCO2 + kgCO2 });
      }

      const fuelDetails = Array.from(fuelByType.entries()).map(([type, data]) => ({
        type, liters: Math.round(data.liters), kgCO2: Math.round(data.kgCO2),
      }));

      // ═══ SCOPE 2: Electricity (estimated) ═══
      // Estimate based on fleet size: avg factory ~50,000 kWh/month
      const estimatedMonthlyKWh = 15000; // conservative per org
      const monthsInPeriod = period === 'month' ? 1 : period === 'quarter' ? 3 : period === 'year' ? 12 : 24;
      const estimatedKWh = estimatedMonthlyKWh * monthsInPeriod;
      const scope2Total = estimatedKWh * EGYPT_GRID_KG_CO2_PER_KWH;

      // ═══ SCOPE 3: Transport + Processing ═══
      let transportTotal = 0;
      let processingTotal = 0;
      let savingsTotal = 0;

      for (const s of shipments) {
        const qty = Number(s.quantity) || 0;
        const unit = (s.unit || 'ton').toLowerCase();
        const tons = unit === 'kg' ? qty / 1000 : qty;
        const kgWaste = tons * 1000;
        const wt = (s.waste_type || 'other').toLowerCase();

        // Transport emissions
        let distanceKm = 50;
        if (s.pickup_latitude && s.delivery_latitude) {
          const R = 6371;
          const dLat = ((s.delivery_latitude - s.pickup_latitude) * Math.PI) / 180;
          const dLon = ((s.delivery_longitude! - s.pickup_longitude!) * Math.PI) / 180;
          const a = Math.sin(dLat / 2) ** 2 +
            Math.cos((s.pickup_latitude * Math.PI) / 180) *
            Math.cos((s.delivery_latitude * Math.PI) / 180) *
            Math.sin(dLon / 2) ** 2;
          distanceKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1.3;
        }
        const transportKg = tons * TRANSPORT_KG_CO2_PER_KM_TON * distanceKm;
        transportTotal += transportKg;

        // Processing emissions
        const processingFactor = WASTE_PROCESSING_FACTORS[wt] || 1000;
        const processingKg = tons * processingFactor;
        processingTotal += processingKg;

        // Recycling savings
        const isRecycled = s.disposal_method === 'recycling' || s.status === 'confirmed';
        if (isRecycled) {
          const savingsFactor = RECYCLING_SAVINGS_FACTORS[wt] || 500;
          savingsTotal += tons * savingsFactor;
        }
      }

      const scope3Total = transportTotal + processingTotal;
      const grandTotal = scope1Total + scope2Total + scope3Total;
      const netEmissions = grandTotal - savingsTotal;

      // Scope percentages
      const scopePercentages = grandTotal > 0 ? {
        scope1: Math.round((scope1Total / grandTotal) * 100),
        scope2: Math.round((scope2Total / grandTotal) * 100),
        scope3: Math.round((scope3Total / grandTotal) * 100),
      } : { scope1: 0, scope2: 0, scope3: 0 };

      // Monthly breakdown
      const monthlyMap = new Map<string, { scope1: number; scope2: number; scope3: number }>();

      for (const f of fuelRecords) {
        const d = new Date(f.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const liters = Number(f.liters) || 0;
        const kgCO2 = liters * DIESEL_KG_CO2_PER_LITER;
        const existing = monthlyMap.get(key) || { scope1: 0, scope2: 0, scope3: 0 };
        existing.scope1 += kgCO2;
        monthlyMap.set(key, existing);
      }

      for (const s of shipments) {
        const d = new Date(s.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const qty = Number(s.quantity) || 0;
        const unit = (s.unit || 'ton').toLowerCase();
        const tons = unit === 'kg' ? qty / 1000 : qty;
        const wt = (s.waste_type || 'other').toLowerCase();
        const processingKg = tons * (WASTE_PROCESSING_FACTORS[wt] || 1000);
        const transportKg = tons * TRANSPORT_KG_CO2_PER_KM_TON * 50;
        const existing = monthlyMap.get(key) || { scope1: 0, scope2: 0, scope3: 0 };
        existing.scope3 += processingKg + transportKg;
        monthlyMap.set(key, existing);
      }

      // Add scope 2 estimate per month
      for (const [key, data] of monthlyMap) {
        data.scope2 = estimatedMonthlyKWh * EGYPT_GRID_KG_CO2_PER_KWH;
      }

      const monthlyScopes = Array.from(monthlyMap.entries())
        .map(([month, data]) => ({ month, scope1: Math.round(data.scope1), scope2: Math.round(data.scope2), scope3: Math.round(data.scope3) }))
        .sort((a, b) => a.month.localeCompare(b.month));

      // ═══ INSIGHTS ═══
      const insights: string[] = [];

      if (scopePercentages.scope3 > 60) {
        insights.push('🚛 النقل والمعالجة (نطاق 3) يمثل أكبر مصدر للانبعاثات. تحسين المسارات أو اختيار ناقلين أقرب يوفر بشكل ملحوظ.');
      }
      if (scopePercentages.scope1 > 30) {
        insights.push('⛽ الوقود المباشر (نطاق 1) مرتفع. فكّر في صيانة دورية للأسطول أو تحويل لمركبات أكفأ.');
      }
      if (savingsTotal > grandTotal * 0.5) {
        insights.push('🌟 ممتاز! وفورات التدوير تتجاوز 50% من إجمالي الانبعاثات. أنت على الطريق الصحيح للحياد الكربوني.');
      }
      if (savingsTotal < grandTotal * 0.2) {
        insights.push('⚠️ وفورات التدوير منخفضة. زيادة نسبة المواد المُدوّرة ستحسن البصمة الكربونية بشكل كبير.');
      }
      if (fuelRecords.length === 0) {
        insights.push('📊 لا توجد سجلات وقود. أدخل بيانات الوقود لحساب نطاق 1 بدقة أعلى.');
      }
      if (netEmissions < 0) {
        insights.push('🏆 تهانينا! البصمة الكربونية الصافية سالبة — أنت تساهم في تنظيف الجو!');
      }

      return {
        scope1: { total: Math.round(scope1Total), fuel: Math.round(scope1Total), details: fuelDetails },
        scope2: { total: Math.round(scope2Total), estimatedKWh },
        scope3: { total: Math.round(scope3Total), transport: Math.round(transportTotal), processing: Math.round(processingTotal), savings: Math.round(savingsTotal) },
        grandTotal: Math.round(grandTotal),
        netEmissions: Math.round(netEmissions),
        totalSavings: Math.round(savingsTotal),
        scopePercentages,
        insights,
        monthlyScopes,
      };
    },
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });
}
