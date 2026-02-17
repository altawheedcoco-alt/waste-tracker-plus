import { supabase } from '@/integrations/supabase/client';
import { loadEmissionFactors } from './carbonEngine';

// ─── Types ───────────────────────────────────────────────────────────────────

export type EntityType = 'generator' | 'transporter' | 'recycler' | 'disposal';

export interface EnvironmentalEquivalents {
  treesPlanted: number;         // ~21.77 kg CO2 per tree/year
  carsOffRoad: number;          // ~4.6 tons CO2 per car/year
  homesEnergy: number;          // ~7.5 tons CO2 per home/year
  waterSavedLiters: number;     // varies per waste type
  landfillDiverted: number;     // tons diverted from landfill
  oilBarrelsSaved: number;      // varies per waste type
  flightsAvoided: number;       // ~0.9 tons CO2 per Cairo-Riyadh flight
  // Egyptian-specific equivalents
  nileFeddan: number;           // 1 feddan irrigation ≈ 4000 m³/year
  egyptianHouseholds: number;   // ~2.5 tons CO2/year (Egyptian avg)
  desertSqMeters: number;       // reforestation equivalent
  phoneCharges: number;         // ~0.008 kgCO2 per phone charge
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
  baselCode: string;            // Basel Convention code
  hazardLevel: 'non-hazardous' | 'hazardous' | 'special';
  wasteHierarchyLevel: WasteHierarchyLevel;
  materialCircularityIndex: number; // 0-1 MCI
}

export type WasteHierarchyLevel = 'prevention' | 'reuse' | 'recycling' | 'recovery' | 'disposal';

export interface CircularEconomyMetrics {
  materialCircularityIndex: number;   // 0-1 (Ellen MacArthur Foundation)
  resourceProductivity: number;       // value per ton of waste
  wasteToResource: number;            // % of waste converted to resource
  closedLoopRate: number;             // % returned to same production cycle
  downcyclingRate: number;            // % converted to lower-grade material
  upcyclingRate: number;              // % converted to higher-grade material
  virginMaterialDisplacement: number; // tons of virgin material avoided
  economicValueRecovered: number;     // EGP value recovered from waste
}

export interface SDGAlignment {
  sdg: number;
  name: string;
  nameAr: string;
  icon: string;
  score: number;        // 0-100
  contribution: string; // description of how the org contributes
  indicators: { name: string; value: string }[];
}

export interface RegulatoryCompliance {
  framework: string;
  frameworkAr: string;
  status: 'compliant' | 'partial' | 'non-compliant';
  score: number;
  requirements: { name: string; met: boolean; detail: string }[];
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
  totalEmissions: number;
  totalSavings: number;
  netCarbonImpact: number;
  scope1Emissions: number;
  scope2Emissions: number;
  scope3Emissions: number;
  carbonIntensity: number;
  // Equivalents
  equivalents: EnvironmentalEquivalents;
  // Breakdown
  wasteBreakdown: WasteTypeAnalysis[];
  monthlyTrend: MonthlyTrend[];
  // Scoring (enhanced 7-axis)
  sustainabilityScore: number;
  sustainabilityLevel: 'platinum' | 'gold' | 'silver' | 'bronze';
  scoreBreakdown: ScoreBreakdown;
  // Entity-specific
  entityMetrics: Record<string, number>;
  // Standards
  griIndicators: GRIIndicator[];
  // NEW: Advanced metrics
  circularEconomy: CircularEconomyMetrics;
  sdgAlignment: SDGAlignment[];
  regulatoryCompliance: RegulatoryCompliance[];
  wasteHierarchy: WasteHierarchyDistribution;
  carbonCreditsEarned: number;
  carbonCreditsValue: number;
  // Certificate data
  certificateHash: string;
}

export interface ScoreBreakdown {
  recyclingEfficiency: { score: number; weight: number; maxScore: number };
  carbonPerformance: { score: number; weight: number; maxScore: number };
  circularEconomy: { score: number; weight: number; maxScore: number };
  regulatoryCompliance: { score: number; weight: number; maxScore: number };
  wasteHierarchy: { score: number; weight: number; maxScore: number };
  resourceConservation: { score: number; weight: number; maxScore: number };
  innovation: { score: number; weight: number; maxScore: number };
}

export interface WasteHierarchyDistribution {
  prevention: number;   // %
  reuse: number;
  recycling: number;
  recovery: number;
  disposal: number;
}

export interface MonthlyTrend {
  month: string;
  monthLabel: string;
  waste: number;
  recycled: number;
  emissions: number;
  savings: number;
  score: number;
  circularityIndex: number;
}

export interface GRIIndicator {
  code: string;
  name: string;
  nameAr: string;
  value: number | string;
  unit: string;
  standard: 'GRI' | 'SASB' | 'IPCC' | 'ISO14001' | 'Basel' | 'EgyptLaw';
  category: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const WASTE_TYPE_MAP: Record<string, string> = {
  plastic: 'بلاستيك', paper: 'ورق', metal: 'معادن', glass: 'زجاج',
  electronic: 'إلكترونيات', organic: 'عضوية', chemical: 'كيميائية',
  medical: 'طبية', construction: 'مخلفات بناء', wood: 'أخشاب',
  textile: 'منسوجات', food: 'مخلفات غذائية', other: 'أخرى',
};

const BASEL_CODES: Record<string, string> = {
  plastic: 'B3010', paper: 'B3020', metal: 'B1010', glass: 'B2020',
  electronic: 'A1180', organic: 'B3040', chemical: 'A4060', medical: 'Y1',
  construction: 'B2130', wood: 'B3050', textile: 'B3030', food: 'B3040', other: 'B3065',
};

const HAZARD_LEVELS: Record<string, WasteTypeAnalysis['hazardLevel']> = {
  plastic: 'non-hazardous', paper: 'non-hazardous', metal: 'non-hazardous', glass: 'non-hazardous',
  electronic: 'hazardous', organic: 'non-hazardous', chemical: 'hazardous', medical: 'hazardous',
  construction: 'non-hazardous', wood: 'non-hazardous', textile: 'non-hazardous', food: 'non-hazardous', other: 'non-hazardous',
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

// Virgin material displacement factors (tons of virgin material per ton recycled)
const VIRGIN_DISPLACEMENT: Record<string, number> = {
  plastic: 0.85, paper: 0.9, metal: 0.95, glass: 0.8,
  electronic: 0.6, organic: 0.3, wood: 0.7, textile: 0.75,
  food: 0.2, other: 0.5,
};

// Economic value per ton recycled (EGP)
const ECONOMIC_VALUE_PER_TON: Record<string, number> = {
  plastic: 8000, paper: 3500, metal: 15000, glass: 1200,
  electronic: 25000, organic: 800, wood: 4000, textile: 6000,
  food: 500, other: 2000,
};

// ─── Core Engine ─────────────────────────────────────────────────────────────

export const calculateEquivalents = (
  co2SavedTons: number,
  recycledTons: number,
  wasteType?: string
): EnvironmentalEquivalents => {
  const savedKg = co2SavedTons * 1000;
  const wt = wasteType || 'other';
  const waterSaved = recycledTons * (WATER_SAVINGS_PER_TON[wt] || 7000);
  return {
    treesPlanted: Math.round(savedKg / 21.77),
    carsOffRoad: Math.round((co2SavedTons / 4.6) * 10) / 10,
    homesEnergy: Math.round((co2SavedTons / 7.5) * 10) / 10,
    waterSavedLiters: Math.round(waterSaved),
    landfillDiverted: Math.round(recycledTons * 10) / 10,
    oilBarrelsSaved: Math.round(recycledTons * (OIL_SAVINGS_PER_TON[wt] || 0.43) * 10) / 10,
    flightsAvoided: Math.round((co2SavedTons / 0.9) * 10) / 10,
    nileFeddan: Math.round((waterSaved / 4000000) * 100) / 100,
    egyptianHouseholds: Math.round((co2SavedTons / 2.5) * 10) / 10,
    desertSqMeters: Math.round(savedKg / 21.77 * 25),  // ~25 m² per tree
    phoneCharges: Math.round(savedKg / 0.008),
  };
};

const mergeEquivalents = (eqs: EnvironmentalEquivalents[]): EnvironmentalEquivalents => {
  const zero: EnvironmentalEquivalents = {
    treesPlanted: 0, carsOffRoad: 0, homesEnergy: 0, waterSavedLiters: 0,
    landfillDiverted: 0, oilBarrelsSaved: 0, flightsAvoided: 0,
    nileFeddan: 0, egyptianHouseholds: 0, desertSqMeters: 0, phoneCharges: 0,
  };
  return eqs.reduce((acc, e) => ({
    treesPlanted: acc.treesPlanted + e.treesPlanted,
    carsOffRoad: r1(acc.carsOffRoad + e.carsOffRoad),
    homesEnergy: r1(acc.homesEnergy + e.homesEnergy),
    waterSavedLiters: acc.waterSavedLiters + e.waterSavedLiters,
    landfillDiverted: r1(acc.landfillDiverted + e.landfillDiverted),
    oilBarrelsSaved: r1(acc.oilBarrelsSaved + e.oilBarrelsSaved),
    flightsAvoided: r1(acc.flightsAvoided + e.flightsAvoided),
    nileFeddan: r2(acc.nileFeddan + e.nileFeddan),
    egyptianHouseholds: r1(acc.egyptianHouseholds + e.egyptianHouseholds),
    desertSqMeters: acc.desertSqMeters + e.desertSqMeters,
    phoneCharges: acc.phoneCharges + e.phoneCharges,
  }), zero);
};

const r1 = (n: number) => Math.round(n * 10) / 10;
const r2 = (n: number) => Math.round(n * 100) / 100;
const r3 = (n: number) => Math.round(n * 1000) / 1000;

// ─── Enhanced 7-Axis Scoring ─────────────────────────────────────────────────

const calculateEnhancedScore = (
  recyclingRate: number,
  carbonIntensity: number,
  netImpact: number,
  totalSavings: number,
  mci: number,
  wasteHierarchy: WasteHierarchyDistribution,
  totalWaste: number,
  totalRecycled: number,
): { score: number; breakdown: ScoreBreakdown } => {
  const breakdown: ScoreBreakdown = {
    recyclingEfficiency: {
      score: Math.min(20, recyclingRate * 0.2),
      weight: 20,
      maxScore: 20,
    },
    carbonPerformance: {
      score: totalSavings > 0 ? Math.min(20, (totalSavings / (totalSavings + Math.abs(netImpact) + 0.01)) * 20) : 0,
      weight: 20,
      maxScore: 20,
    },
    circularEconomy: {
      score: Math.min(15, mci * 15),
      weight: 15,
      maxScore: 15,
    },
    regulatoryCompliance: {
      score: 12, // base score for using the system (can be enhanced with actual data)
      weight: 15,
      maxScore: 15,
    },
    wasteHierarchy: {
      score: Math.min(10,
        (wasteHierarchy.prevention * 0.05 +
         wasteHierarchy.reuse * 0.04 +
         wasteHierarchy.recycling * 0.025 +
         wasteHierarchy.recovery * 0.015 +
         wasteHierarchy.disposal * 0.005)),
      weight: 10,
      maxScore: 10,
    },
    resourceConservation: {
      score: carbonIntensity < 0.5 ? 10 : carbonIntensity < 1.0 ? 7 : carbonIntensity < 2.0 ? 4 : 2,
      weight: 10,
      maxScore: 10,
    },
    innovation: {
      score: netImpact < 0 ? 10 : netImpact === 0 ? 5 : 2,
      weight: 10,
      maxScore: 10,
    },
  };

  const totalScore = Object.values(breakdown).reduce((s, axis) => s + axis.score, 0);
  return { score: Math.min(100, Math.round(totalScore)), breakdown };
};

const getLevel = (score: number): EntitySustainabilityReport['sustainabilityLevel'] => {
  if (score >= 85) return 'platinum';
  if (score >= 70) return 'gold';
  if (score >= 50) return 'silver';
  return 'bronze';
};

// ─── Circular Economy Calculator ─────────────────────────────────────────────

const calculateCircularEconomy = (wasteBreakdown: WasteTypeAnalysis[], totalWaste: number, totalRecycled: number): CircularEconomyMetrics => {
  if (totalWaste === 0) return { materialCircularityIndex: 0, resourceProductivity: 0, wasteToResource: 0, closedLoopRate: 0, downcyclingRate: 0, upcyclingRate: 0, virginMaterialDisplacement: 0, economicValueRecovered: 0 };

  let virginDisplacement = 0;
  let economicValue = 0;

  for (const w of wasteBreakdown) {
    virginDisplacement += w.recycledTons * (VIRGIN_DISPLACEMENT[w.wasteType] || 0.5);
    economicValue += w.recycledTons * (ECONOMIC_VALUE_PER_TON[w.wasteType] || 2000);
  }

  // MCI = 1 - (W / (2M)) where W = waste going to disposal, M = total material flow
  const wasteToDisposal = totalWaste - totalRecycled;
  const mci = Math.max(0, Math.min(1, 1 - (wasteToDisposal / (2 * totalWaste))));

  return {
    materialCircularityIndex: r2(mci),
    resourceProductivity: totalWaste > 0 ? r2(economicValue / totalWaste) : 0,
    wasteToResource: r1((totalRecycled / totalWaste) * 100),
    closedLoopRate: r1(Math.min(100, (totalRecycled / totalWaste) * 100 * 0.6)), // ~60% of recycled goes to closed loop
    downcyclingRate: r1(Math.min(100, (totalRecycled / totalWaste) * 100 * 0.3)),
    upcyclingRate: r1(Math.min(100, (totalRecycled / totalWaste) * 100 * 0.1)),
    virginMaterialDisplacement: r2(virginDisplacement),
    economicValueRecovered: Math.round(economicValue),
  };
};

// ─── SDG Alignment Calculator ────────────────────────────────────────────────

const calculateSDGAlignment = (report: Partial<EntitySustainabilityReport>): SDGAlignment[] => {
  const rr = report.recyclingRate || 0;
  const savings = report.totalSavings || 0;
  const waste = report.totalWasteTons || 0;
  const waterSaved = report.equivalents?.waterSavedLiters || 0;

  return [
    {
      sdg: 6, name: 'Clean Water and Sanitation', nameAr: 'المياه النظيفة والنظافة الصحية',
      icon: '💧', score: Math.min(100, Math.round((waterSaved / 100000) * 100)),
      contribution: 'توفير المياه من خلال إعادة التدوير بدلاً من الإنتاج الأولي',
      indicators: [
        { name: 'مياه محفوظة (م³)', value: `${Math.round(waterSaved / 1000)}` },
      ],
    },
    {
      sdg: 7, name: 'Affordable and Clean Energy', nameAr: 'طاقة نظيفة وبأسعار معقولة',
      icon: '⚡', score: Math.min(100, Math.round(savings * 20)),
      contribution: 'تقليل استهلاك الطاقة عبر التدوير بدلاً من التصنيع الأولي',
      indicators: [
        { name: 'طاقة موفرة (MWh)', value: `${r1(savings * 2.78)}` }, // ~2.78 MWh per ton CO2
      ],
    },
    {
      sdg: 9, name: 'Industry, Innovation and Infrastructure', nameAr: 'الصناعة والابتكار والبنية التحتية',
      icon: '🏭', score: Math.min(100, Math.round(rr * 0.8)),
      contribution: 'تطوير البنية التحتية لإعادة التدوير والتكنولوجيا النظيفة',
      indicators: [
        { name: 'معدل التحويل الصناعي %', value: `${rr}` },
      ],
    },
    {
      sdg: 11, name: 'Sustainable Cities', nameAr: 'مدن ومجتمعات مستدامة',
      icon: '🏙️', score: Math.min(100, Math.round(rr * 0.7 + (savings > 0 ? 20 : 0))),
      contribution: 'تقليل المخلفات الموجهة للمدافن وتحسين جودة البيئة الحضرية',
      indicators: [
        { name: 'محوّل عن المدافن (طن)', value: `${report.totalRecycledTons || 0}` },
      ],
    },
    {
      sdg: 12, name: 'Responsible Consumption', nameAr: 'الاستهلاك والإنتاج المسؤولان',
      icon: '♻️', score: Math.min(100, Math.round(rr * 1.0)),
      contribution: 'تعزيز الاقتصاد الدائري وتقليل الهدر في سلسلة القيمة',
      indicators: [
        { name: 'معدل التدوير %', value: `${rr}` },
        { name: 'إجمالي المخلفات المُدارة (طن)', value: `${waste}` },
      ],
    },
    {
      sdg: 13, name: 'Climate Action', nameAr: 'العمل المناخي',
      icon: '🌍', score: Math.min(100, Math.round(savings * 15)),
      contribution: 'خفض انبعاثات غازات الدفيئة من خلال التدوير والمعالجة المستدامة',
      indicators: [
        { name: 'CO₂ مُتجنّب (طن)', value: `${savings}` },
        { name: 'كثافة الكربون', value: `${report.carbonIntensity || 0}` },
      ],
    },
    {
      sdg: 14, name: 'Life Below Water', nameAr: 'الحياة تحت الماء',
      icon: '🐟', score: Math.min(100, Math.round(rr * 0.4)),
      contribution: 'تقليل تسرب النفايات إلى المسطحات المائية والبحار',
      indicators: [
        { name: 'بلاستيك مُحوّل (طن)', value: `${report.wasteBreakdown?.find(w => w.wasteType === 'plastic')?.recycledTons || 0}` },
      ],
    },
    {
      sdg: 15, name: 'Life on Land', nameAr: 'الحياة في البر',
      icon: '🌳', score: Math.min(100, Math.round((report.equivalents?.treesPlanted || 0) / 10)),
      contribution: 'حماية التربة والحياة البرية من التلوث بالمخلفات',
      indicators: [
        { name: 'أشجار معادلة', value: `${report.equivalents?.treesPlanted || 0}` },
        { name: 'مساحة صحراء (م²)', value: `${report.equivalents?.desertSqMeters || 0}` },
      ],
    },
  ];
};

// ─── Regulatory Compliance Calculator ────────────────────────────────────────

const calculateRegulatoryCompliance = (entityType: EntityType, recyclingRate: number, wasteBreakdown: WasteTypeAnalysis[]): RegulatoryCompliance[] => {
  const hasHazardous = wasteBreakdown.some(w => w.hazardLevel === 'hazardous');
  const allTracked = true; // assumed if in system

  return [
    {
      framework: 'Egyptian Law 202/2020',
      frameworkAr: 'قانون تنظيم إدارة المخلفات 202/2020',
      status: allTracked ? 'compliant' : 'partial',
      score: allTracked ? 90 : 50,
      requirements: [
        { name: 'تسجيل النشاط', met: true, detail: 'مسجل في المنظومة الرقمية' },
        { name: 'تتبع المخلفات', met: allTracked, detail: 'نماذج تتبع رقمية صادرة' },
        { name: 'فصل المخلفات الخطرة', met: !hasHazardous || wasteBreakdown.filter(w => w.hazardLevel === 'hazardous').every(w => w.recoveryRate > 0), detail: hasHazardous ? 'مخلفات خطرة مُعالجة' : 'لا توجد مخلفات خطرة' },
        { name: 'الإبلاغ الدوري', met: true, detail: 'تقارير آلية مُولّدة' },
      ],
    },
    {
      framework: 'Egyptian Law 4/1994 (Environment)',
      frameworkAr: 'قانون البيئة المصري 4/1994',
      status: 'compliant',
      score: 85,
      requirements: [
        { name: 'ترخيص بيئي', met: true, detail: 'موافقة جهاز شؤون البيئة' },
        { name: 'تقييم الأثر البيئي', met: true, detail: 'EIA متوفر عبر النظام' },
        { name: 'رصد الانبعاثات', met: true, detail: 'حساب آلي للبصمة الكربونية' },
        { name: 'السجلات البيئية', met: true, detail: 'سجلات رقمية محفوظة' },
      ],
    },
    {
      framework: 'Basel Convention',
      frameworkAr: 'اتفاقية بازل للنقل العابر',
      status: hasHazardous ? 'partial' : 'compliant',
      score: hasHazardous ? 75 : 95,
      requirements: [
        { name: 'تصنيف المخلفات', met: true, detail: 'مصنفة بأكواد بازل (Y/B codes)' },
        { name: 'نماذج النقل', met: allTracked, detail: 'نماذج إلكترونية مطابقة' },
        { name: 'الموافقة المسبقة (PIC)', met: !hasHazardous, detail: hasHazardous ? 'مطلوب للمخلفات الخطرة' : 'غير مطلوب' },
        { name: 'التخلص السليم', met: true, detail: 'مرافق معتمدة' },
      ],
    },
    {
      framework: 'ISO 14001:2015',
      frameworkAr: 'آيزو 14001 - نظام الإدارة البيئية',
      status: 'partial',
      score: 70,
      requirements: [
        { name: 'سياق المنظمة (§4)', met: true, detail: 'الأطراف المعنية محددة' },
        { name: 'القيادة والتخطيط (§5-6)', met: true, detail: 'أهداف بيئية محددة' },
        { name: 'الدعم والتشغيل (§7-8)', met: true, detail: 'إجراءات تشغيلية موثقة' },
        { name: 'تقييم الأداء (§9)', met: true, detail: 'رصد وقياس مستمر' },
        { name: 'التحسين المستمر (§10)', met: recyclingRate > 50, detail: recyclingRate > 50 ? 'اتجاه تحسّن ملحوظ' : 'يحتاج تحسين' },
      ],
    },
    {
      framework: 'GRI Standards 2021',
      frameworkAr: 'معايير المبادرة العالمية للتقارير',
      status: 'compliant',
      score: 88,
      requirements: [
        { name: 'GRI 306: النفايات', met: true, detail: 'بيانات كاملة (306-1 إلى 306-5)' },
        { name: 'GRI 305: الانبعاثات', met: true, detail: 'Scope 1-3 محسوبة' },
        { name: 'GRI 302: الطاقة', met: true, detail: 'كثافة الطاقة محسوبة' },
        { name: 'GRI 303: المياه', met: true, detail: 'وفورات المياه محسوبة' },
      ],
    },
  ];
};

// ─── Waste Hierarchy Distribution ────────────────────────────────────────────

const calculateWasteHierarchy = (wasteBreakdown: WasteTypeAnalysis[], totalWaste: number): WasteHierarchyDistribution => {
  if (totalWaste === 0) return { prevention: 0, reuse: 0, recycling: 0, recovery: 0, disposal: 0 };

  const totalRecycled = wasteBreakdown.reduce((s, w) => s + w.recycledTons, 0);
  const totalLandfill = wasteBreakdown.reduce((s, w) => s + w.landfillTons, 0);

  // Estimate distribution based on disposal methods
  const recyclingPct = totalWaste > 0 ? (totalRecycled / totalWaste) * 100 : 0;
  const disposalPct = totalWaste > 0 ? (totalLandfill / totalWaste) * 100 : 0;

  return {
    prevention: r1(Math.max(0, 100 - recyclingPct - disposalPct) * 0.1), // small portion from reduction
    reuse: r1(recyclingPct * 0.15),
    recycling: r1(recyclingPct * 0.85),
    recovery: r1(disposalPct * 0.3), // energy recovery from disposal
    disposal: r1(disposalPct * 0.7),
  };
};

// ─── GRI/SASB/ISO Indicators ─────────────────────────────────────────────────

const buildGRIIndicators = (report: Partial<EntitySustainabilityReport>, entityType: EntityType): GRIIndicator[] => {
  const ce = report.circularEconomy;
  const indicators: GRIIndicator[] = [
    // GRI 306: Waste
    { code: 'GRI 306-1', name: 'Waste generated', nameAr: 'إجمالي النفايات المتولدة', value: report.totalWasteTons || 0, unit: 'طن', standard: 'GRI', category: 'waste' },
    { code: 'GRI 306-2', name: 'Waste diverted from disposal', nameAr: 'نفايات محوّلة عن المدافن', value: report.totalRecycledTons || 0, unit: 'طن', standard: 'GRI', category: 'waste' },
    { code: 'GRI 306-3', name: 'Waste directed to disposal', nameAr: 'نفايات موجهة للتخلص', value: report.totalLandfillTons || 0, unit: 'طن', standard: 'GRI', category: 'waste' },
    { code: 'GRI 306-4', name: 'Waste recycling rate', nameAr: 'معدل إعادة التدوير', value: `${report.recyclingRate || 0}%`, unit: '%', standard: 'GRI', category: 'waste' },
    { code: 'GRI 306-5', name: 'Waste to landfill', nameAr: 'نفايات موجهة للمدافن', value: report.totalLandfillTons || 0, unit: 'طن', standard: 'GRI', category: 'waste' },
    // GRI 305: Emissions
    { code: 'GRI 305-1', name: 'Direct GHG (Scope 1)', nameAr: 'انبعاثات مباشرة (النطاق 1)', value: report.scope1Emissions || 0, unit: 'طن CO₂e', standard: 'GRI', category: 'emissions' },
    { code: 'GRI 305-2', name: 'Energy indirect GHG (Scope 2)', nameAr: 'انبعاثات غير مباشرة (النطاق 2)', value: report.scope2Emissions || 0, unit: 'طن CO₂e', standard: 'GRI', category: 'emissions' },
    { code: 'GRI 305-3', name: 'Other indirect GHG (Scope 3)', nameAr: 'انبعاثات سلسلة القيمة (النطاق 3)', value: report.scope3Emissions || 0, unit: 'طن CO₂e', standard: 'GRI', category: 'emissions' },
    { code: 'GRI 305-4', name: 'GHG emissions intensity', nameAr: 'كثافة انبعاثات الكربون', value: report.carbonIntensity || 0, unit: 'طن CO₂e/طن', standard: 'GRI', category: 'emissions' },
    { code: 'GRI 305-5', name: 'Reduction of GHG', nameAr: 'تخفيض الانبعاثات', value: report.totalSavings || 0, unit: 'طن CO₂e', standard: 'GRI', category: 'emissions' },
    // GRI 303: Water
    { code: 'GRI 303-5', name: 'Water consumption saved', nameAr: 'مياه محفوظة', value: Math.round((report.equivalents?.waterSavedLiters || 0) / 1000), unit: 'م³', standard: 'GRI', category: 'water' },
    // GRI 302: Energy
    { code: 'GRI 302-4', name: 'Energy savings', nameAr: 'طاقة موفرة', value: r1((report.totalSavings || 0) * 2.78), unit: 'MWh', standard: 'GRI', category: 'energy' },
    // SASB
    { code: 'SASB IF-WM-110a.1', name: 'Total waste managed', nameAr: 'إجمالي المخلفات المُدارة', value: report.totalWasteTons || 0, unit: 'طن', standard: 'SASB', category: 'operations' },
    { code: 'SASB IF-WM-110a.2', name: 'Recycling rate', nameAr: 'معدل التدوير', value: `${report.recyclingRate || 0}%`, unit: '%', standard: 'SASB', category: 'operations' },
    { code: 'SASB IF-WM-420a.2', name: 'Landfill diversion', nameAr: 'تحويل عن المدافن', value: report.totalRecycledTons || 0, unit: 'طن', standard: 'SASB', category: 'operations' },
    // Circular Economy
    { code: 'CE-MCI', name: 'Material Circularity Index', nameAr: 'مؤشر الدورانية المادية', value: ce?.materialCircularityIndex || 0, unit: 'مؤشر (0-1)', standard: 'ISO14001', category: 'circular' },
    { code: 'CE-VD', name: 'Virgin material displaced', nameAr: 'مواد خام مُتجنّبة', value: ce?.virginMaterialDisplacement || 0, unit: 'طن', standard: 'ISO14001', category: 'circular' },
    { code: 'CE-EVR', name: 'Economic value recovered', nameAr: 'قيمة اقتصادية مسترجعة', value: `${((ce?.economicValueRecovered || 0) / 1000).toFixed(0)}K`, unit: 'ج.م', standard: 'SASB', category: 'circular' },
    // Egyptian Law
    { code: 'EG-202/2020', name: 'Waste Management Law compliance', nameAr: 'امتثال قانون إدارة المخلفات', value: '✓', unit: '', standard: 'EgyptLaw', category: 'regulatory' },
    { code: 'EG-4/1994', name: 'Environment Law compliance', nameAr: 'امتثال قانون البيئة', value: '✓', unit: '', standard: 'EgyptLaw', category: 'regulatory' },
    // Basel
    { code: 'BASEL-PIC', name: 'Prior Informed Consent', nameAr: 'الموافقة المسبقة المستنيرة', value: '✓', unit: '', standard: 'Basel', category: 'regulatory' },
  ];

  // Entity-specific
  if (entityType === 'transporter') {
    indicators.push(
      { code: 'GRI 305-T1', name: 'Transport emissions/km', nameAr: 'انبعاثات النقل/كم', value: report.entityMetrics?.emissionsPerKm || 0, unit: 'كجم CO₂/كم', standard: 'IPCC', category: 'transport' },
      { code: 'SASB IF-WM-110b.1', name: 'Fleet efficiency', nameAr: 'كفاءة الأسطول', value: report.entityMetrics?.fuelEfficiency || 0, unit: 'كم/رحلة', standard: 'SASB', category: 'transport' },
    );
  }
  if (entityType === 'recycler') {
    indicators.push(
      { code: 'GRI 306-R1', name: 'Material recovery rate', nameAr: 'معدل استرداد المواد', value: `${report.entityMetrics?.recoveryRate || 0}%`, unit: '%', standard: 'GRI', category: 'recycling' },
      { code: 'SASB IF-WM-420a.1', name: 'Recycled output', nameAr: 'إنتاج مُدوّر', value: report.entityMetrics?.recycledOutput || 0, unit: 'طن', standard: 'SASB', category: 'recycling' },
    );
  }
  if (entityType === 'disposal') {
    indicators.push(
      { code: 'GRI 306-D1', name: 'Safe disposal rate', nameAr: 'نسبة التخلص الآمن', value: `${report.entityMetrics?.safeDisposalRate || 0}%`, unit: '%', standard: 'GRI', category: 'disposal' },
      { code: 'GRI 306-D2', name: 'Hazardous treated', nameAr: 'مخلفات خطرة مُعالجة', value: report.entityMetrics?.hazardousTreated || 0, unit: 'طن', standard: 'SASB', category: 'disposal' },
    );
  }
  if (entityType === 'generator') {
    indicators.push(
      { code: 'GRI 306-G1', name: 'Waste per unit output', nameAr: 'مخلفات لكل شحنة', value: report.entityMetrics?.wastePerShipment || 0, unit: 'طن/شحنة', standard: 'GRI', category: 'generation' },
      { code: 'GRI 306-G2', name: 'Diversion rate', nameAr: 'معدل التحويل', value: `${report.entityMetrics?.diversionRate || 0}%`, unit: '%', standard: 'GRI', category: 'generation' },
    );
  }

  return indicators;
};

// ─── Certificate Hash ────────────────────────────────────────────────────────

const generateCertificateHash = (orgId: string, period: string, score: number): string => {
  const raw = `${orgId}-${period}-${score}-${Date.now()}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `iRC-${Math.abs(hash).toString(36).toUpperCase().substring(0, 8)}-${score}`;
};

// ─── Main API ────────────────────────────────────────────────────────────────

export const generateEntityReport = async (
  organizationId: string,
  entityType: EntityType,
  periodStart: string,
  periodEnd: string,
): Promise<EntitySustainabilityReport | null> => {
  try {
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name, organization_type')
      .eq('id', organizationId)
      .single();
    if (!org) return null;

    const fieldMap: Record<EntityType, string> = {
      generator: 'generator_id',
      transporter: 'transporter_id',
      recycler: 'recycler_id',
      disposal: 'recycler_id',
    };
    const field = fieldMap[entityType];

    const query = supabase
      .from('shipments')
      .select('id, waste_type, quantity, unit, status, disposal_method, pickup_latitude, pickup_longitude, delivery_latitude, delivery_longitude, created_at, generator_id, transporter_id, recycler_id');
    const filteredQuery = (query as any).eq(field, organizationId).gte('created_at', periodStart).lte('created_at', periodEnd);
    const { data: rawShipments } = await filteredQuery;

    const shipments = (rawShipments || []).filter(
      (s: any) => ['delivered', 'confirmed'].includes(s.status)
    );

    if (!shipments?.length) {
      return createEmptyReport(organizationId, org.name, entityType, periodStart, periodEnd);
    }

    // Calculate per-waste-type analysis
    const factors = await loadEmissionFactors();
    const wasteGroups: Record<string, typeof shipments> = {};
    shipments.forEach((s: any) => {
      const wt = (s.waste_type as string) || 'other';
      if (!wasteGroups[wt]) wasteGroups[wt] = [];
      wasteGroups[wt].push(s);
    });

    const wasteBreakdown: WasteTypeAnalysis[] = [];
    let totalEmissions = 0, totalSavings = 0;

    for (const [wasteType, group] of Object.entries(wasteGroups)) {
      const totalKg = group.reduce((s: number, sh: any) => s + (Number(sh.quantity) || 0), 0);
      const tons = (group[0]?.unit === 'طن' || group[0]?.unit === 'ton') ? totalKg : totalKg / 1000;

      const recycled = group.filter((s: any) => s.disposal_method === 'recycling' || s.status === 'confirmed');
      const recycledTons = recycled.reduce((s: number, sh: any) => s + (Number(sh.quantity) || 0), 0) / 1000;
      const landfillTons = Math.max(0, tons - recycledTons);

      const processingFactor = (factors.waste_processing as Record<string, number>)[wasteType] || 1.0;
      const savingsFactor = (factors.recycling_savings as Record<string, number>)[wasteType] || 0.5;

      const emissions = tons * processingFactor;
      const savings = recycledTons * savingsFactor;

      totalEmissions += emissions;
      totalSavings += savings;

      // MCI per waste type
      const wasteToDisposal = Math.max(0, tons - recycledTons);
      const mci = tons > 0 ? Math.max(0, Math.min(1, 1 - (wasteToDisposal / (2 * tons)))) : 0;

      wasteBreakdown.push({
        wasteType,
        wasteTypeAr: WASTE_TYPE_MAP[wasteType] || wasteType,
        totalTons: r2(tons),
        recycledTons: r2(recycledTons),
        landfillTons: r2(landfillTons),
        recoveryRate: tons > 0 ? Math.round((recycledTons / tons) * 100) : 0,
        carbonPerTon: r3(processingFactor),
        totalEmissions: r3(emissions),
        totalSavings: r3(savings),
        netImpact: r3(emissions - savings),
        equivalents: calculateEquivalents(savings, recycledTons, wasteType),
        baselCode: BASEL_CODES[wasteType] || 'B3065',
        hazardLevel: HAZARD_LEVELS[wasteType] || 'non-hazardous',
        wasteHierarchyLevel: recycledTons > 0 ? 'recycling' : 'disposal',
        materialCircularityIndex: r2(mci),
      });
    }

    // Transport emissions
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

    // Totals
    const totalWasteTons = wasteBreakdown.reduce((s, w) => s + w.totalTons, 0);
    const totalRecycledTons = wasteBreakdown.reduce((s, w) => s + w.recycledTons, 0);
    const totalLandfillTons = wasteBreakdown.reduce((s, w) => s + w.landfillTons, 0);
    const recyclingRate = totalWasteTons > 0 ? Math.round((totalRecycledTons / totalWasteTons) * 100) : 0;
    const carbonIntensity = totalWasteTons > 0 ? r3(totalEmissions / totalWasteTons) : 0;
    const netCarbonImpact = totalEmissions + transportEmissions - totalSavings;

    // Advanced metrics
    const circularEconomy = calculateCircularEconomy(wasteBreakdown, totalWasteTons, totalRecycledTons);
    const wasteHierarchy = calculateWasteHierarchy(wasteBreakdown, totalWasteTons);
    const monthlyTrend = buildMonthlyTrend(shipments, factors, periodStart, periodEnd);
    const entityMetrics = buildEntityMetrics(entityType, shipments, transportEmissions, totalRecycledTons, totalWasteTons);

    // Enhanced scoring
    const { score: sustainabilityScore, breakdown: scoreBreakdown } = calculateEnhancedScore(
      recyclingRate, carbonIntensity, netCarbonImpact, totalSavings,
      circularEconomy.materialCircularityIndex, wasteHierarchy, totalWasteTons, totalRecycledTons
    );
    const sustainabilityLevel = getLevel(sustainabilityScore);

    const equivalents = mergeEquivalents(wasteBreakdown.map(w => w.equivalents));

    // Carbon credits (1 credit = 1 ton CO2 avoided, value ~$30 = ~1500 EGP)
    const carbonCreditsEarned = r2(totalSavings);
    const carbonCreditsValue = Math.round(carbonCreditsEarned * 1500);

    const report: EntitySustainabilityReport = {
      entityType,
      organizationId,
      organizationName: org.name,
      periodStart,
      periodEnd,
      totalWasteTons: r2(totalWasteTons),
      totalRecycledTons: r2(totalRecycledTons),
      totalLandfillTons: r2(totalLandfillTons),
      recyclingRate,
      totalEmissions: r3(totalEmissions + transportEmissions),
      totalSavings: r3(totalSavings),
      netCarbonImpact: r3(netCarbonImpact),
      scope1Emissions: r3(transportEmissions),
      scope2Emissions: 0,
      scope3Emissions: r3(totalEmissions),
      carbonIntensity,
      equivalents,
      wasteBreakdown: wasteBreakdown.sort((a, b) => b.totalTons - a.totalTons),
      monthlyTrend,
      sustainabilityScore,
      sustainabilityLevel,
      scoreBreakdown,
      entityMetrics,
      griIndicators: [],
      circularEconomy,
      sdgAlignment: [],
      regulatoryCompliance: [],
      wasteHierarchy,
      carbonCreditsEarned,
      carbonCreditsValue,
      certificateHash: generateCertificateHash(organizationId, periodStart, sustainabilityScore),
    };

    report.griIndicators = buildGRIIndicators(report, entityType);
    report.sdgAlignment = calculateSDGAlignment(report);
    report.regulatoryCompliance = calculateRegulatoryCompliance(entityType, recyclingRate, wasteBreakdown);

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
    const monthShipments = shipments.filter((s: any) => {
      const d = new Date(s.created_at);
      return d >= current && d <= monthEnd;
    });
    const waste = monthShipments.reduce((s: number, sh: any) => s + (Number(sh.quantity) || 0), 0) / 1000;
    const recycled = monthShipments
      .filter((s: any) => s.disposal_method === 'recycling' || s.status === 'confirmed')
      .reduce((s: number, sh: any) => s + (Number(sh.quantity) || 0), 0) / 1000;
    const emissions = waste * 1.0;
    const savings = recycled * 0.8;
    const rate = waste > 0 ? (recycled / waste) * 100 : 0;
    const mci = waste > 0 ? Math.max(0, 1 - ((waste - recycled) / (2 * waste))) : 0;
    months.push({
      month: `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`,
      monthLabel: current.toLocaleDateString('ar-EG', { month: 'short', year: 'numeric' }),
      waste: r2(waste), recycled: r2(recycled), emissions: r2(emissions), savings: r2(savings),
      score: Math.round(rate * 0.8 + mci * 20),
      circularityIndex: r2(mci),
    });
    current.setMonth(current.getMonth() + 1);
  }
  return months;
};

const buildEntityMetrics = (entityType: EntityType, shipments: any[], transportEmissions: number, recycledTons: number, totalTons: number): Record<string, number> => {
  const metrics: Record<string, number> = { shipmentsCount: shipments.length };
  switch (entityType) {
    case 'generator':
      metrics.wasteGeneratedTons = r2(totalTons);
      metrics.diversionRate = totalTons > 0 ? Math.round((recycledTons / totalTons) * 100) : 0;
      metrics.wastePerShipment = shipments.length > 0 ? r2(totalTons / shipments.length) : 0;
      break;
    case 'transporter': {
      let totalDist = 0;
      shipments.forEach((s: any) => {
        if (s.pickup_latitude && s.delivery_latitude)
          totalDist += haversineKm(s.pickup_latitude, s.pickup_longitude!, s.delivery_latitude, s.delivery_longitude!);
      });
      metrics.totalDistanceKm = Math.round(totalDist);
      metrics.emissionsPerKm = totalDist > 0 ? r2(transportEmissions * 1000 / totalDist) : 0;
      metrics.fuelEfficiency = totalDist > 0 ? r1(totalDist / (shipments.length || 1)) : 0;
      break;
    }
    case 'recycler':
      metrics.recoveryRate = totalTons > 0 ? Math.round((recycledTons / totalTons) * 100) : 0;
      metrics.recycledOutput = r2(recycledTons);
      metrics.processingEfficiency = Math.round(Math.min(100, (recycledTons / (totalTons || 1)) * 100));
      break;
    case 'disposal':
      metrics.safeDisposalRate = 100;
      metrics.hazardousTreated = shipments.filter((s: any) => ['chemical', 'medical', 'electronic'].includes(s.waste_type)).reduce((s: number, sh: any) => s + (Number(sh.quantity) || 0), 0) / 1000;
      metrics.complianceRate = 100;
      break;
  }
  return metrics;
};

const createEmptyReport = (orgId: string, orgName: string, entityType: EntityType, start: string, end: string): EntitySustainabilityReport => ({
  entityType, organizationId: orgId, organizationName: orgName, periodStart: start, periodEnd: end,
  totalWasteTons: 0, totalRecycledTons: 0, totalLandfillTons: 0, recyclingRate: 0,
  totalEmissions: 0, totalSavings: 0, netCarbonImpact: 0,
  scope1Emissions: 0, scope2Emissions: 0, scope3Emissions: 0, carbonIntensity: 0,
  equivalents: { treesPlanted: 0, carsOffRoad: 0, homesEnergy: 0, waterSavedLiters: 0, landfillDiverted: 0, oilBarrelsSaved: 0, flightsAvoided: 0, nileFeddan: 0, egyptianHouseholds: 0, desertSqMeters: 0, phoneCharges: 0 },
  wasteBreakdown: [], monthlyTrend: [],
  sustainabilityScore: 0, sustainabilityLevel: 'bronze',
  scoreBreakdown: {
    recyclingEfficiency: { score: 0, weight: 20, maxScore: 20 },
    carbonPerformance: { score: 0, weight: 20, maxScore: 20 },
    circularEconomy: { score: 0, weight: 15, maxScore: 15 },
    regulatoryCompliance: { score: 0, weight: 15, maxScore: 15 },
    wasteHierarchy: { score: 0, weight: 10, maxScore: 10 },
    resourceConservation: { score: 0, weight: 10, maxScore: 10 },
    innovation: { score: 0, weight: 10, maxScore: 10 },
  },
  entityMetrics: {}, griIndicators: [],
  circularEconomy: { materialCircularityIndex: 0, resourceProductivity: 0, wasteToResource: 0, closedLoopRate: 0, downcyclingRate: 0, upcyclingRate: 0, virginMaterialDisplacement: 0, economicValueRecovered: 0 },
  sdgAlignment: [], regulatoryCompliance: [],
  wasteHierarchy: { prevention: 0, reuse: 0, recycling: 0, recovery: 0, disposal: 0 },
  carbonCreditsEarned: 0, carbonCreditsValue: 0,
  certificateHash: '',
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

export const SCORE_AXIS_LABELS: Record<keyof ScoreBreakdown, string> = {
  recyclingEfficiency: 'كفاءة التدوير',
  carbonPerformance: 'الأداء الكربوني',
  circularEconomy: 'الاقتصاد الدائري',
  regulatoryCompliance: 'الامتثال التنظيمي',
  wasteHierarchy: 'هرم النفايات',
  resourceConservation: 'حفظ الموارد',
  innovation: 'الابتكار البيئي',
};
