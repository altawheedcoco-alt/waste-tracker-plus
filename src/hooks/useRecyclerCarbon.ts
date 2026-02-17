import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { loadEmissionFactors } from '@/lib/carbonEngine';

const WASTE_PROCESSING_FACTORS: Record<string, number> = {
  plastic: 2.5, paper: 0.8, metal: 1.2, glass: 0.5,
  electronic: 3.5, organic: 0.3, chemical: 4.0, medical: 5.0,
  construction: 0.4, other: 1.0,
};

const RECYCLING_SAVINGS_FACTORS: Record<string, number> = {
  plastic: 1.4, paper: 0.9, metal: 4.0, glass: 0.3,
  electronic: 3.5, organic: 0.2, chemical: 1.0, medical: 1.5,
  construction: 0.2, other: 0.5,
};

const TRANSPORT_FACTOR = 0.000062; // tons CO2 per km per ton

const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1.3;
};

export const useRecyclerCarbon = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const orgId = organization?.id;

  // Product-level carbon records
  const productCarbon = useQuery({
    queryKey: ['recycler-product-carbon', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('recycler_product_carbon')
        .select('*')
        .eq('organization_id', orgId)
        .order('calculation_date', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  // Facility-level carbon records
  const facilityCarbon = useQuery({
    queryKey: ['recycler-facility-carbon', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('recycler_facility_carbon')
        .select('*')
        .eq('organization_id', orgId)
        .order('period_end', { ascending: false })
        .limit(24);
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  // Calculate carbon for all delivered/confirmed shipments
  const calculateAll = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error('No organization');

      // Get shipments
      const { data: shipments, error: sErr } = await supabase
        .from('shipments')
        .select('id, waste_type, quantity, unit, status, disposal_method, pickup_latitude, pickup_longitude, delivery_latitude, delivery_longitude, created_at')
        .eq('recycler_id', orgId)
        .in('status', ['delivered', 'confirmed'])
        .limit(500);

      if (sErr) throw sErr;
      if (!shipments?.length) {
        toast.info('لا توجد شحنات مكتملة لحساب البصمة الكربونية');
        return { created: 0 };
      }

      // Get existing records
      const { data: existing } = await supabase
        .from('recycler_product_carbon')
        .select('shipment_id')
        .eq('organization_id', orgId);

      const existingIds = new Set((existing || []).map((e: any) => e.shipment_id));
      const newShipments = shipments.filter(s => !existingIds.has(s.id));

      if (!newShipments.length) {
        toast.info('جميع الشحنات محسوبة بالفعل');
        return { created: 0 };
      }

      const factors = await loadEmissionFactors();
      let created = 0;

      for (const s of newShipments) {
        const weight = Number(s.quantity) || 0;
        const weightTons = (s.unit === 'كجم' || s.unit === 'kg' || !s.unit) ? weight / 1000 : weight;
        const wasteType = (s.waste_type as string) || 'other';

        let distanceKm = 50;
        if (s.pickup_latitude && s.delivery_latitude) {
          distanceKm = haversineKm(s.pickup_latitude, s.pickup_longitude!, s.delivery_latitude, s.delivery_longitude!);
        }

        const transportEmissions = weightTons * TRANSPORT_FACTOR * distanceKm;
        const processingFactor = WASTE_PROCESSING_FACTORS[wasteType] || 1.0;
        const processingEmissions = weightTons * processingFactor;
        const totalEmissions = transportEmissions + processingEmissions;

        const isRecycled = s.disposal_method === 'recycling' || s.status === 'confirmed';
        const savingsFactor = RECYCLING_SAVINGS_FACTORS[wasteType] || 0.5;
        const recycSavings = isRecycled ? weightTons * savingsFactor : 0;
        const netImpact = totalEmissions - recycSavings;
        const savedKg = recycSavings * 1000;
        const trees = Math.round(savedKg / 21.77);
        const cars = Math.round((recycSavings / 4.6) * 10) / 10;

        const certNum = `PCF-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(created + 1).padStart(4, '0')}`;

        const wasteLabels: Record<string, string> = {
          plastic: 'بلاستيك', paper: 'ورق', metal: 'معادن', glass: 'زجاج',
          electronic: 'إلكترونيات', organic: 'عضوية', chemical: 'كيميائية',
          medical: 'طبية', construction: 'بناء', other: 'أخرى',
        };

        await supabase.from('recycler_product_carbon').insert({
          organization_id: orgId,
          shipment_id: s.id,
          product_name: `منتج مُدوَّر - ${wasteLabels[wasteType] || wasteType}`,
          waste_type: wasteType,
          input_weight_tons: parseFloat(weightTons.toFixed(3)),
          output_weight_tons: parseFloat((weightTons * 0.85).toFixed(3)),
          transport_emissions: parseFloat(transportEmissions.toFixed(4)),
          processing_emissions: parseFloat(processingEmissions.toFixed(4)),
          recycling_savings: parseFloat(recycSavings.toFixed(4)),
          total_emissions: parseFloat(totalEmissions.toFixed(4)),
          net_impact: parseFloat(netImpact.toFixed(4)),
          distance_km: Math.round(distanceKm),
          trees_equivalent: trees,
          cars_equivalent: cars,
          recycling_rate: isRecycled ? 100 : 0,
          certificate_number: certNum,
        } as any);
        created++;
      }

      // Update facility summary
      await updateFacilitySummary();

      return { created };
    },
    onSuccess: (result) => {
      if (result && result.created > 0) {
        toast.success(`تم حساب البصمة الكربونية لـ ${result.created} منتج`);
      }
      queryClient.invalidateQueries({ queryKey: ['recycler-product-carbon'] });
      queryClient.invalidateQueries({ queryKey: ['recycler-facility-carbon'] });
    },
    onError: () => {
      toast.error('خطأ في حساب البصمة الكربونية');
    },
  });

  const updateFacilitySummary = async () => {
    if (!orgId) return;

    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const { data: products } = await supabase
      .from('recycler_product_carbon')
      .select('*')
      .eq('organization_id', orgId)
      .gte('calculation_date', periodStart.toISOString())
      .lte('calculation_date', periodEnd.toISOString());

    const records = products || [];
    const totalInput = records.reduce((s: number, r: any) => s + (r.input_weight_tons || 0), 0);
    const totalOutput = records.reduce((s: number, r: any) => s + (r.output_weight_tons || 0), 0);
    const totalTransport = records.reduce((s: number, r: any) => s + (r.transport_emissions || 0), 0);
    const totalProcessing = records.reduce((s: number, r: any) => s + (r.processing_emissions || 0), 0);
    const totalSavings = records.reduce((s: number, r: any) => s + (r.recycling_savings || 0), 0);
    const totalEmissions = records.reduce((s: number, r: any) => s + (r.total_emissions || 0), 0);
    const totalNetImpact = records.reduce((s: number, r: any) => s + (r.net_impact || 0), 0);
    const totalTrees = records.reduce((s: number, r: any) => s + (r.trees_equivalent || 0), 0);
    const totalCars = records.reduce((s: number, r: any) => s + (r.cars_equivalent || 0), 0);
    const recyclingRate = totalInput > 0 ? (totalOutput / totalInput) * 100 : 0;
    const sustainabilityScore = Math.min(100, Math.round(
      (Math.min(recyclingRate, 100) * 0.4) + (totalSavings > 0 ? 30 : 0) + (totalEmissions < 100 ? 30 : 15)
    ));

    const certNum = `FCF-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${orgId.slice(0, 4).toUpperCase()}`;

    // Upsert
    const { data: existing } = await supabase
      .from('recycler_facility_carbon')
      .select('id')
      .eq('organization_id', orgId)
      .eq('period_start', periodStart.toISOString().split('T')[0])
      .limit(1);

    const record = {
      organization_id: orgId,
      period_start: periodStart.toISOString().split('T')[0],
      period_end: periodEnd.toISOString().split('T')[0],
      period_type: 'monthly',
      total_input_tons: parseFloat(totalInput.toFixed(3)),
      total_output_tons: parseFloat(totalOutput.toFixed(3)),
      total_transport_emissions: parseFloat(totalTransport.toFixed(4)),
      total_processing_emissions: parseFloat(totalProcessing.toFixed(4)),
      total_recycling_savings: parseFloat(totalSavings.toFixed(4)),
      total_emissions: parseFloat(totalEmissions.toFixed(4)),
      total_net_impact: parseFloat(totalNetImpact.toFixed(4)),
      total_trees_equivalent: totalTrees,
      total_cars_equivalent: parseFloat(totalCars.toFixed(1)),
      recycling_rate: parseFloat(recyclingRate.toFixed(1)),
      sustainability_score: sustainabilityScore,
      shipments_count: records.length,
      certificate_number: certNum,
    };

    if (existing?.length) {
      await supabase.from('recycler_facility_carbon').update(record as any).eq('id', existing[0].id);
    } else {
      await supabase.from('recycler_facility_carbon').insert(record as any);
    }
  };

  // Issue certificate
  const issueCertificate = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: 'product' | 'facility' }) => {
      const table = type === 'product' ? 'recycler_product_carbon' : 'recycler_facility_carbon';
      await supabase.from(table).update({
        certificate_issued: true,
        ...(type === 'product' ? { certificate_issued_at: new Date().toISOString() } : {}),
      } as any).eq('id', id);
    },
    onSuccess: () => {
      toast.success('تم إصدار الشهادة بنجاح');
      queryClient.invalidateQueries({ queryKey: ['recycler-product-carbon'] });
      queryClient.invalidateQueries({ queryKey: ['recycler-facility-carbon'] });
    },
  });

  // Summary stats
  const summary = {
    totalProducts: productCarbon.data?.length || 0,
    totalEmissions: productCarbon.data?.reduce((s, r: any) => s + (r.total_emissions || 0), 0) || 0,
    totalSavings: productCarbon.data?.reduce((s, r: any) => s + (r.recycling_savings || 0), 0) || 0,
    totalTrees: productCarbon.data?.reduce((s, r: any) => s + (r.trees_equivalent || 0), 0) || 0,
    netImpact: productCarbon.data?.reduce((s, r: any) => s + (r.net_impact || 0), 0) || 0,
  };

  return {
    productCarbon,
    facilityCarbon,
    calculateAll,
    issueCertificate,
    summary,
  };
};
