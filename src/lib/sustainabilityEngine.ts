import { supabase } from '@/integrations/supabase/client';
import { loadEmissionFactors, calculateShipmentCarbon, ShipmentCarbonResult } from './carbonEngine';

// ─── Types ───────────────────────────────────────────────────────────────────

export type EntityType = 'generator' | 'transporter' | 'recycler' | 'disposal';

export interface EnvironmentalEquivalents {
  treesPlanted: number;       // ~21.77 kg CO2 per tree/year
  carsOffRoad: number;        // ~4.6 tons CO2 per car/year
  homesEnergy: number;        // ~7.5 tons CO2 per home/year
  waterSavedLiters: number;   // ~7000 liters per ton recycled
  landfillDiverted: number;   // tons diverted from landfill
  oilBarrelsSaved: number;    // ~0.43 barrels per ton recycled
  flightsAvoided: number;     // ~0.9 tons CO2 per Cairo-Riyadh flight
}

export interface WasteTypeAnalysis {
  wasteType: string;
  wasteTypeAr: string;
  totalTons: number;
  recycledTons: number;
  landfillTons: number;
  recoveryRate: number;
  carbonPerTon: number;
  totalEmissions: number;
  totalSavings: number;
  netImpact: number;
  equivalents: EnvironmentalEquivalents;
}

export interface EntitySustainabilityReport {
  entityType: EntityType;
  organizationId: string;
  organizationName: string;
  periodStart: string;
  periodEnd: string;
  // Summary
  totalWasteTons: number;
  totalRecycledTons: number;
  totalLandfillTons: number;
  recyclingRate: number;
  // Carbon
  totalEmissions: number;       // tons CO2
  totalSavings: number;         // tons CO2
  netCarbonImpact: number;      // tons CO2
  scope1Emissions: number;      // direct (transport fuel, processing)
  scope2Emissions: number;      // indirect (electricity)
  scope3Emissions: number;      // value chain
  carbonIntensity: number;      // tons CO2 per ton waste
  // Equivalents
  equivalents: EnvironmentalEquivalents;
  // Breakdown
  wasteBreakdown: WasteTypeAnalysis[];
  monthlyTrend: MonthlyTrend[];
  // Scoring
  sustainabilityScore: number;  // 0-100
  sustainabilityLevel: 'platinum' | 'gold' | 'silver' | 'bronze';
  // Entity-specific
  entityMetrics: Record<string, number>;
  // GRI/SASB indicators
  griIndicators: GRIIndicator[];
}

export interface MonthlyTrend {
  month: string;
  monthLabel: string;
  waste: number;
  recycled: number;
  emissions: number;
  savings: number;
  score: number;
}

export interface GRIIndicator {
  code: string;
  name: string;
  nameAr: string;
  value: number | string;
  unit: string;
  standard: 'GRI' | 'SASB' | 'IPCC';
  category: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const WASTE_TYPE_MAP: Record<string, string> = {
  plastic: 'بلاستيك', paper: 'ورق', metal: 'معادن', glass: 'زجاج',
  electronic: 'إلكترونيات', organic: 'عضوية', chemical: 'كيميائية',
  medical: 'طبية', construction: 'مخلفات بناء', wood: 'أخشاب',
  textile: 'منسوجات', food: 'مخلفات غذائية', other: 'أخرى',
};

const WATER_SAVINGS_PER_TON: Record<string, number> = {
  plastic: 22000, paper: 26500, metal: 14000, glass: 1520,
  electronic: 5000, organic: 3000, wood: 7000, textile: 20000,
  food: 5000, other: 7000,
};

const OIL_SAVINGS_PER_TON: Record<string, number> = {
  plastic: 2.2, paper: 0.8, metal: 1.5, glass: 0.3,
  electronic: 1.8, organic: 0.1, wood: 0.2, other: 0.43,
};

// ─── Core Engine ─────────────────────────────────────────────────────────────

/** Calculate environmental equivalents from CO2 savings */
export const calculateEquivalents = (
  co2SavedTons: number, 
  recycledTons: number, 
  wasteType?: string
): EnvironmentalEquivalents => {
  const savedKg = co2SavedTons * 1000;
  const wt = wasteType || 'other';
  return {
    treesPlanted: Math.round(savedKg / 21.77),
    carsOffRoad: Math.round((co2SavedTons / 4.6) * 10) / 10,
    homesEnergy: Math.round((co2SavedTons / 7.5) * 10) / 10,
    waterSavedLiters: Math.round(recycledTons * (WATER_SAVINGS_PER_TON[wt] || 7000)),
    landfillDiverted: Math.round(recycledTons * 10) / 10,
    oilBarrelsSaved: Math.round(recycledTons * (OIL_SAVINGS_PER_TON[wt] || 0.43) * 10) / 10,
    flightsAvoided: Math.round((co2SavedTons / 0.9) * 10) / 10,
  };
};

/** Merge multiple equivalents */
const mergeEquivalents = (eqs: EnvironmentalEquivalents[]): EnvironmentalEquivalents => {
  return eqs.reduce((acc, e) => ({
    treesPlanted: acc.treesPlanted + e.treesPlanted,
    carsOffRoad: Math.round((acc.carsOffRoad + e.carsOffRoad) * 10) / 10,
    homesEnergy: Math.round((acc.homesEnergy + e.homesEnergy) * 10) / 10,
    waterSavedLiters: acc.waterSavedLiters + e.waterSavedLiters,
    landfillDiverted: Math.round((acc.landfillDiverted + e.landfillDiverted) * 10) / 10,
    oilBarrelsSaved: Math.round((acc.oilBarrelsSaved + e.oilBarrelsSaved) * 10) / 10,
    flightsAvoided: Math.round((acc.flightsAvoided + e.flightsAvoided) * 10) / 10,
  }), { treesPlanted: 0, carsOffRoad: 0, homesEnergy: 0, waterSavedLiters: 0, landfillDiverted: 0, oilBarrelsSaved: 0, flightsAvoided: 0 });
};

/** Calculate sustainability score (0-100) */
const calculateScore = (
  recyclingRate: number,
  carbonIntensity: number,
  netImpact: number,
  totalSavings: number,
): number => {
  let score = 0;
  // Recycling rate (40%)
  score += Math.min(40, recyclingRate * 0.4);
  // Carbon savings (30%)
  score += totalSavings > 0 ? Math.min(30, (totalSavings / (totalSavings + Math.abs(netImpact) + 0.01)) * 30) : 0;
  // Carbon intensity (20%) - lower is better
  score += carbonIntensity < 0.5 ? 20 : carbonIntensity < 1.0 ? 15 : carbonIntensity < 2.0 ? 10 : 5;
  // Net positive impact bonus (10%)
  score += netImpact < 0 ? 10 : 0;
  return Math.min(100, Math.round(score));
};

const getLevel = (score: number): EntitySustainabilityReport['sustainabilityLevel'] => {
  if (score >= 85) return 'platinum';
  if (score >= 70) return 'gold';
  if (score >= 50) return 'silver';
  return 'bronze';
};

/** Build GRI/SASB indicators */
const buildGRIIndicators = (report: Partial<EntitySustainabilityReport>, entityType: EntityType): GRIIndicator[] => {
  const indicators: GRIIndicator[] = [
    { code: 'GRI 306-1', name: 'Waste generated', nameAr: 'إجمالي النفايات المتولدة', value: report.totalWasteTons || 0, unit: 'طن', standard: 'GRI', category: 'waste' },
    { code: 'GRI 306-2', name: 'Waste diverted from disposal', nameAr: 'نفايات محوّلة عن المدافن', value: report.totalRecycledTons || 0, unit: 'طن', standard: 'GRI', category: 'waste' },
    { code: 'GRI 306-3', name: 'Waste directed to disposal', nameAr: 'نفايات موجهة للتخلص', value: report.totalLandfillTons || 0, unit: 'طن', standard: 'GRI', category: 'waste' },
    { code: 'GRI 306-4', name: 'Waste recycling rate', nameAr: 'معدل إعادة التدوير', value: `${report.recyclingRate || 0}%`, unit: '%', standard: 'GRI', category: 'waste' },
    { code: 'GRI 305-1', name: 'Direct GHG emissions (Scope 1)', nameAr: 'الانبعاثات المباشرة (النطاق 1)', value: report.scope1Emissions || 0, unit: 'طن CO₂e', standard: 'GRI', category: 'emissions' },
    { code: 'GRI 305-2', name: 'Energy indirect GHG emissions (Scope 2)', nameAr: 'انبعاثات غير مباشرة (النطاق 2)', value: report.scope2Emissions || 0, unit: 'طن CO₂e', standard: 'GRI', category: 'emissions' },
    { code: 'GRI 305-3', name: 'Other indirect GHG emissions (Scope 3)', nameAr: 'انبعاثات سلسلة القيمة (النطاق 3)', value: report.scope3Emissions || 0, unit: 'طن CO₂e', standard: 'GRI', category: 'emissions' },
    { code: 'GRI 305-4', name: 'GHG emissions intensity', nameAr: 'كثافة انبعاثات الكربون', value: report.carbonIntensity || 0, unit: 'طن CO₂e/طن مخلف', standard: 'GRI', category: 'emissions' },
    { code: 'GRI 305-5', name: 'Reduction of GHG emissions', nameAr: 'تخفيض الانبعاثات', value: report.totalSavings || 0, unit: 'طن CO₂e', standard: 'GRI', category: 'emissions' },
    { code: 'SASB IF-WM-110a.1', name: 'Total waste managed', nameAr: 'إجمالي المخلفات المُدارة', value: report.totalWasteTons || 0, unit: 'طن', standard: 'SASB', category: 'operations' },
    { code: 'SASB IF-WM-110a.2', name: 'Recycling rate', nameAr: 'معدل التدوير', value: `${report.recyclingRate || 0}%`, unit: '%', standard: 'SASB', category: 'operations' },
  ];

  // Entity-specific indicators
  if (entityType === 'transporter') {
    indicators.push(
      { code: 'GRI 305-T1', name: 'Transport emissions per km', nameAr: 'انبعاثات النقل لكل كم', value: report.entityMetrics?.emissionsPerKm || 0, unit: 'كجم CO₂/كم', standard: 'IPCC', category: 'transport' },
      { code: 'SASB IF-WM-110b.1', name: 'Fleet fuel efficiency', nameAr: 'كفاءة وقود الأسطول', value: report.entityMetrics?.fuelEfficiency || 0, unit: 'لتر/100كم', standard: 'SASB', category: 'transport' },
    );
  }
  if (entityType === 'recycler') {
    indicators.push(
      { code: 'GRI 306-R1', name: 'Material recovery rate', nameAr: 'معدل استرداد المواد', value: `${report.entityMetrics?.recoveryRate || 0}%`, unit: '%', standard: 'GRI', category: 'recycling' },
      { code: 'SASB IF-WM-420a.1', name: 'Recycled product output', nameAr: 'إنتاج المواد المُعاد تدويرها', value: report.entityMetrics?.recycledOutput || 0, unit: 'طن', standard: 'SASB', category: 'recycling' },
    );
  }
  if (entityType === 'disposal') {
    indicators.push(
      { code: 'GRI 306-D1', name: 'Safe disposal compliance', nameAr: 'نسبة التخلص الآمن', value: `${report.entityMetrics?.safeDisposalRate || 0}%`, unit: '%', standard: 'GRI', category: 'disposal' },
      { code: 'GRI 306-D2', name: 'Hazardous waste treated', nameAr: 'مخلفات خطرة مُعالجة', value: report.entityMetrics?.hazardousTreated || 0, unit: 'طن', standard: 'SASB', category: 'disposal' },
    );
  }

  return indicators;
};

// ─── Main API ────────────────────────────────────────────────────────────────

/** Generate comprehensive sustainability report for any entity type */
export const generateEntityReport = async (
  organizationId: string,
  entityType: EntityType,
  periodStart: string,
  periodEnd: string,
): Promise<EntitySustainabilityReport | null> => {
  try {
    // 1. Fetch organization info
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name, organization_type')
      .eq('id', organizationId)
      .single();
    if (!org) return null;

    // 2. Build query based on entity type
    const fieldMap: Record<EntityType, string> = {
      generator: 'generator_id',
      transporter: 'transporter_id',
      recycler: 'recycler_id',
      disposal: 'recycler_id', // disposal facilities use recycler_id
    };
    const field = fieldMap[entityType];

    const query = supabase
      .from('shipments')
      .select('id, waste_type, quantity, unit, status, disposal_method, pickup_latitude, pickup_longitude, delivery_latitude, delivery_longitude, created_at, generator_id, transporter_id, recycler_id');
    
    // Apply entity filter dynamically
    const filteredQuery = (query as any).eq(field, organizationId).gte('created_at', periodStart).lte('created_at', periodEnd);
    const { data: rawShipments } = await filteredQuery;
    
    const shipments = (rawShipments || []).filter(
      (s) => ['delivered', 'confirmed'].includes(s.status)
    );

    if (!shipments?.length) {
      // Return empty report
      return createEmptyReport(organizationId, org.name, entityType, periodStart, periodEnd);
    }

    // 3. Calculate per-waste-type analysis
    const factors = await loadEmissionFactors();
    const wasteGroups: Record<string, typeof shipments> = {};
    shipments.forEach(s => {
      const wt = (s.waste_type as string) || 'other';
      if (!wasteGroups[wt]) wasteGroups[wt] = [];
      wasteGroups[wt].push(s);
    });

    const wasteBreakdown: WasteTypeAnalysis[] = [];
    let totalEmissions = 0, totalSavings = 0;

    for (const [wasteType, group] of Object.entries(wasteGroups)) {
      const totalKg = group.reduce((s, sh) => s + (Number(sh.quantity) || 0), 0);
      const tons = (group[0]?.unit === 'طن' || group[0]?.unit === 'ton') ? totalKg : totalKg / 1000;
      
      const recycled = group.filter(s => s.disposal_method === 'recycling' || s.status === 'confirmed');
      const recycledTons = recycled.reduce((s, sh) => s + (Number(sh.quantity) || 0), 0) / 1000;
      const landfillTons = tons - recycledTons;
      
      const processingFactor = (factors.waste_processing as Record<string, number>)[wasteType] || 1.0;
      const savingsFactor = (factors.recycling_savings as Record<string, number>)[wasteType] || 0.5;
      
      const emissions = tons * processingFactor;
      const savings = recycledTons * savingsFactor;
      
      totalEmissions += emissions;
      totalSavings += savings;

      wasteBreakdown.push({
        wasteType,
        wasteTypeAr: WASTE_TYPE_MAP[wasteType] || wasteType,
        totalTons: Math.round(tons * 100) / 100,
        recycledTons: Math.round(recycledTons * 100) / 100,
        landfillTons: Math.round(landfillTons * 100) / 100,
        recoveryRate: tons > 0 ? Math.round((recycledTons / tons) * 100) : 0,
        carbonPerTon: Math.round(processingFactor * 1000) / 1000,
        totalEmissions: Math.round(emissions * 1000) / 1000,
        totalSavings: Math.round(savings * 1000) / 1000,
        netImpact: Math.round((emissions - savings) * 1000) / 1000,
        equivalents: calculateEquivalents(savings, recycledTons, wasteType),
      });
    }

    // 4. Transport emissions (scope 1)
    let transportEmissions = 0;
    if (entityType === 'transporter') {
      for (const s of shipments) {
        if (s.pickup_latitude && s.delivery_latitude) {
          const dist = haversineKm(s.pickup_latitude, s.pickup_longitude!, s.delivery_latitude, s.delivery_longitude!);
          const weight = (Number(s.quantity) || 0) / 1000;
          transportEmissions += weight * factors.transport_per_km_ton * dist;
        }
      }
    }

    // 5. Totals
    const totalWasteTons = wasteBreakdown.reduce((s, w) => s + w.totalTons, 0);
    const totalRecycledTons = wasteBreakdown.reduce((s, w) => s + w.recycledTons, 0);
    const totalLandfillTons = wasteBreakdown.reduce((s, w) => s + w.landfillTons, 0);
    const recyclingRate = totalWasteTons > 0 ? Math.round((totalRecycledTons / totalWasteTons) * 100) : 0;
    const carbonIntensity = totalWasteTons > 0 ? Math.round((totalEmissions / totalWasteTons) * 1000) / 1000 : 0;
    const netCarbonImpact = totalEmissions + transportEmissions - totalSavings;

    // 6. Monthly trend
    const monthlyTrend = buildMonthlyTrend(shipments, factors, periodStart, periodEnd);

    // 7. Entity-specific metrics
    const entityMetrics = buildEntityMetrics(entityType, shipments, transportEmissions, totalRecycledTons, totalWasteTons);

    // 8. Score
    const sustainabilityScore = calculateScore(recyclingRate, carbonIntensity, netCarbonImpact, totalSavings);
    const sustainabilityLevel = getLevel(sustainabilityScore);

    // 9. Equivalents
    const equivalents = mergeEquivalents(wasteBreakdown.map(w => w.equivalents));

    // 10. Build report
    const report: EntitySustainabilityReport = {
      entityType,
      organizationId,
      organizationName: org.name,
      periodStart,
      periodEnd,
      totalWasteTons: Math.round(totalWasteTons * 100) / 100,
      totalRecycledTons: Math.round(totalRecycledTons * 100) / 100,
      totalLandfillTons: Math.round(totalLandfillTons * 100) / 100,
      recyclingRate,
      totalEmissions: Math.round((totalEmissions + transportEmissions) * 1000) / 1000,
      totalSavings: Math.round(totalSavings * 1000) / 1000,
      netCarbonImpact: Math.round(netCarbonImpact * 1000) / 1000,
      scope1Emissions: Math.round(transportEmissions * 1000) / 1000,
      scope2Emissions: 0, // TODO: electricity data
      scope3Emissions: Math.round(totalEmissions * 1000) / 1000,
      carbonIntensity,
      equivalents,
      wasteBreakdown: wasteBreakdown.sort((a, b) => b.totalTons - a.totalTons),
      monthlyTrend,
      sustainabilityScore,
      sustainabilityLevel,
      entityMetrics,
      griIndicators: [],
    };
    
    report.griIndicators = buildGRIIndicators(report, entityType);
    return report;
  } catch (error) {
    console.error('Error generating sustainability report:', error);
    return null;
  }
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1.3;
};

const buildMonthlyTrend = (shipments: any[], factors: any, periodStart: string, periodEnd: string): MonthlyTrend[] => {
  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  const months: MonthlyTrend[] = [];
  
  const current = new Date(start.getFullYear(), start.getMonth(), 1);
  while (current <= end) {
    const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
    const monthShipments = shipments.filter(s => {
      const d = new Date(s.created_at);
      return d >= current && d <= monthEnd;
    });
    
    const waste = monthShipments.reduce((s, sh) => s + (Number(sh.quantity) || 0), 0) / 1000;
    const recycled = monthShipments
      .filter(s => s.disposal_method === 'recycling' || s.status === 'confirmed')
      .reduce((s, sh) => s + (Number(sh.quantity) || 0), 0) / 1000;
    
    const emissions = waste * 1.0; // average factor
    const savings = recycled * 0.8;
    const rate = waste > 0 ? (recycled / waste) * 100 : 0;
    
    months.push({
      month: `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`,
      monthLabel: current.toLocaleDateString('ar-EG', { month: 'short', year: 'numeric' }),
      waste: Math.round(waste * 100) / 100,
      recycled: Math.round(recycled * 100) / 100,
      emissions: Math.round(emissions * 100) / 100,
      savings: Math.round(savings * 100) / 100,
      score: Math.round(calculateScore(rate, emissions / (waste || 1), emissions - savings, savings)),
    });
    
    current.setMonth(current.getMonth() + 1);
  }
  return months;
};

const buildEntityMetrics = (entityType: EntityType, shipments: any[], transportEmissions: number, recycledTons: number, totalTons: number): Record<string, number> => {
  const metrics: Record<string, number> = {
    shipmentsCount: shipments.length,
  };
  
  switch (entityType) {
    case 'generator':
      metrics.wasteGeneratedTons = Math.round(totalTons * 100) / 100;
      metrics.diversionRate = totalTons > 0 ? Math.round((recycledTons / totalTons) * 100) : 0;
      metrics.wastePerShipment = shipments.length > 0 ? Math.round((totalTons / shipments.length) * 100) / 100 : 0;
      break;
    case 'transporter':
      metrics.totalDistanceKm = 0;
      metrics.emissionsPerKm = 0;
      metrics.fuelEfficiency = 0;
      let totalDist = 0;
      shipments.forEach(s => {
        if (s.pickup_latitude && s.delivery_latitude) {
          totalDist += haversineKm(s.pickup_latitude, s.pickup_longitude!, s.delivery_latitude, s.delivery_longitude!);
        }
      });
      metrics.totalDistanceKm = Math.round(totalDist);
      metrics.emissionsPerKm = totalDist > 0 ? Math.round((transportEmissions * 1000 / totalDist) * 100) / 100 : 0;
      metrics.fuelEfficiency = totalDist > 0 ? Math.round((totalDist / (shipments.length || 1)) * 10) / 10 : 0;
      break;
    case 'recycler':
      metrics.recoveryRate = totalTons > 0 ? Math.round((recycledTons / totalTons) * 100) : 0;
      metrics.recycledOutput = Math.round(recycledTons * 100) / 100;
      metrics.processingEfficiency = Math.round(Math.min(100, (recycledTons / (totalTons || 1)) * 100));
      break;
    case 'disposal':
      metrics.safeDisposalRate = 100; // assumed safe if through system
      metrics.hazardousTreated = shipments.filter(s => ['chemical', 'medical', 'electronic'].includes(s.waste_type)).reduce((s, sh) => s + (Number(sh.quantity) || 0), 0) / 1000;
      metrics.complianceRate = 100;
      break;
  }
  return metrics;
};

const createEmptyReport = (orgId: string, orgName: string, entityType: EntityType, start: string, end: string): EntitySustainabilityReport => ({
  entityType,
  organizationId: orgId,
  organizationName: orgName,
  periodStart: start,
  periodEnd: end,
  totalWasteTons: 0,
  totalRecycledTons: 0,
  totalLandfillTons: 0,
  recyclingRate: 0,
  totalEmissions: 0,
  totalSavings: 0,
  netCarbonImpact: 0,
  scope1Emissions: 0,
  scope2Emissions: 0,
  scope3Emissions: 0,
  carbonIntensity: 0,
  equivalents: { treesPlanted: 0, carsOffRoad: 0, homesEnergy: 0, waterSavedLiters: 0, landfillDiverted: 0, oilBarrelsSaved: 0, flightsAvoided: 0 },
  wasteBreakdown: [],
  monthlyTrend: [],
  sustainabilityScore: 0,
  sustainabilityLevel: 'bronze',
  entityMetrics: {},
  griIndicators: [],
});

// ─── Level labels ────────────────────────────────────────────────────────────

export const LEVEL_CONFIG = {
  platinum: { label: 'بلاتيني', labelEn: 'Platinum', color: 'text-violet-700', bg: 'bg-violet-100', border: 'border-violet-300', icon: '💎' },
  gold: { label: 'ذهبي', labelEn: 'Gold', color: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-300', icon: '🥇' },
  silver: { label: 'فضي', labelEn: 'Silver', color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-300', icon: '🥈' },
  bronze: { label: 'برونزي', labelEn: 'Bronze', color: 'text-orange-700', bg: 'bg-orange-100', border: 'border-orange-300', icon: '🥉' },
};

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  generator: 'الجهة المولّدة',
  transporter: 'الجهة الناقلة',
  recycler: 'جهة التدوير',
  disposal: 'جهة التخلص النهائي',
};
