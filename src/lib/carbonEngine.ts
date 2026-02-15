import { supabase } from '@/integrations/supabase/client';

// IPCC 2006 + GHG Protocol fallback factors (tons CO2e per ton of waste)
const DEFAULT_FACTORS = {
  transport_per_km_ton: 0.000062, // tons CO2 per km per ton
  waste_processing: {
    plastic: 2.5, paper: 0.8, metal: 1.2, glass: 0.5,
    electronic: 3.5, organic: 0.3, chemical: 4.0, medical: 5.0,
    construction: 0.4, other: 1.0,
  } as Record<string, number>,
  recycling_savings: {
    plastic: 1.4, paper: 0.9, metal: 4.0, glass: 0.3,
    electronic: 3.5, organic: 0.2, chemical: 1.0, medical: 1.5,
    construction: 0.2, other: 0.5,
  } as Record<string, number>,
};

export interface ShipmentCarbonResult {
  transportEmissions: number;   // tons CO2
  processingEmissions: number;  // tons CO2
  totalEmissions: number;       // tons CO2
  co2Saved: number;             // tons CO2 saved (if recycled)
  netImpact: number;            // total - saved
  distanceKm: number;
  treesEquivalent: number;      // ~21.77 kg CO2 per tree/year
  carsEquivalent: number;       // ~4.6 tons CO2 per car/year
  homesEquivalent: number;      // ~7.5 tons CO2 per home/year
  recyclingRate: number;        // 0-100%
}

let cachedFactors: typeof DEFAULT_FACTORS | null = null;

/** Load emission factors from DB, cache result */
export const loadEmissionFactors = async (): Promise<typeof DEFAULT_FACTORS> => {
  if (cachedFactors) return cachedFactors;
  try {
    const { data, error } = await supabase
      .from('carbon_emission_factors')
      .select('*')
      .eq('is_active', true);
    if (error || !data?.length) return DEFAULT_FACTORS;

    const factors = { ...DEFAULT_FACTORS };
    for (const f of data) {
      if (f.category === 'waste_recycling') {
        const keyMap: Record<string, string> = {
          plastic_recycling: 'plastic', paper_recycling: 'paper',
          metal_recycling: 'metal', glass_recycling: 'glass',
          organic_composting: 'organic', e_waste_recycling: 'electronic',
        };
        const k = keyMap[f.sub_category];
        if (k) factors.recycling_savings[k] = f.emission_factor / 1000;
      }
    }
    cachedFactors = factors;
    return factors;
  } catch {
    return DEFAULT_FACTORS;
  }
};

/** Calculate Haversine distance in km */
const haversineKm = (
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1.3; // 1.3 road factor
};

/** Calculate carbon footprint for a single shipment */
export const calculateShipmentCarbon = async (shipmentId: string): Promise<ShipmentCarbonResult | null> => {
  const { data: shipment, error } = await supabase
    .from('shipments')
    .select(`
      id, waste_type, quantity, unit, status, disposal_method,
      pickup_latitude, pickup_longitude,
      delivery_latitude, delivery_longitude
    `)
    .eq('id', shipmentId)
    .single();

  if (error || !shipment) return null;

  const factors = await loadEmissionFactors();
  const weight = Number(shipment.quantity) || 0;
  // Convert kg to tons if unit is kg
  const weightTons = (shipment.unit === 'كجم' || shipment.unit === 'kg' || !shipment.unit)
    ? weight / 1000
    : weight; // assume tons

  const wasteType = (shipment.waste_type as string) || 'other';

  // Transport emissions
  let distanceKm = 50; // default
  if (shipment.pickup_latitude && shipment.delivery_latitude) {
    distanceKm = haversineKm(
      shipment.pickup_latitude, shipment.pickup_longitude!,
      shipment.delivery_latitude, shipment.delivery_longitude!
    );
  }
  const transportEmissions = weightTons * factors.transport_per_km_ton * distanceKm;

  // Processing emissions
  const processingFactor = factors.waste_processing[wasteType] || 1.0;
  const processingEmissions = weightTons * processingFactor;

  const totalEmissions = transportEmissions + processingEmissions;

  // Savings (only if recycled/confirmed)
  const isRecycled = shipment.disposal_method === 'recycling' || shipment.status === 'confirmed';
  const savingsFactor = factors.recycling_savings[wasteType] || 0.5;
  const co2Saved = isRecycled ? weightTons * savingsFactor : 0;

  const netImpact = totalEmissions - co2Saved;

  // Equivalents
  const savedKg = co2Saved * 1000;
  const treesEquivalent = Math.round(savedKg / 21.77);
  const carsEquivalent = Math.round((co2Saved / 4.6) * 10) / 10;
  const homesEquivalent = Math.round((co2Saved / 7.5) * 10) / 10;

  return {
    transportEmissions: Math.round(transportEmissions * 1000) / 1000,
    processingEmissions: Math.round(processingEmissions * 1000) / 1000,
    totalEmissions: Math.round(totalEmissions * 1000) / 1000,
    co2Saved: Math.round(co2Saved * 1000) / 1000,
    netImpact: Math.round(netImpact * 1000) / 1000,
    distanceKm: Math.round(distanceKm),
    treesEquivalent,
    carsEquivalent,
    homesEquivalent,
    recyclingRate: isRecycled ? 100 : 0,
  };
};
