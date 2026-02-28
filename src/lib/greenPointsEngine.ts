/**
 * Green Points Engine — يحول أوزان المخلفات المُدورة إلى "أصول رقمية" بيئية
 * الاستشاري يضبط المعاملات، والمحرك يحسب النقاط والمكافئات البيئية
 */

// Default environmental factors per waste type (points per ton)
export const DEFAULT_GREEN_FACTORS: Record<string, {
  points_per_ton: number;
  trees_per_ton: number;
  energy_saved_kwh_per_ton: number;
  water_saved_liters_per_ton: number;
  description_ar: string;
}> = {
  paper: {
    points_per_ton: 500,
    trees_per_ton: 17,
    energy_saved_kwh_per_ton: 4100,
    water_saved_liters_per_ton: 26500,
    description_ar: 'حماية الأشجار + توفير المياه والطاقة',
  },
  plastic: {
    points_per_ton: 350,
    trees_per_ton: 0,
    energy_saved_kwh_per_ton: 5774,
    water_saved_liters_per_ton: 0,
    description_ar: 'تقليل استهلاك البترول + منع تلوث المحيطات',
  },
  metal: {
    points_per_ton: 600,
    trees_per_ton: 0,
    energy_saved_kwh_per_ton: 14000,
    water_saved_liters_per_ton: 40000,
    description_ar: 'توفير 95% من طاقة التعدين',
  },
  glass: {
    points_per_ton: 200,
    trees_per_ton: 0,
    energy_saved_kwh_per_ton: 315,
    water_saved_liters_per_ton: 0,
    description_ar: 'قابل لإعادة التدوير 100% بلا حدود',
  },
  electronic: {
    points_per_ton: 800,
    trees_per_ton: 0,
    energy_saved_kwh_per_ton: 0,
    water_saved_liters_per_ton: 0,
    description_ar: 'منع تسرب السموم (رصاص/زئبق) — أعلى خطورة',
  },
  organic: {
    points_per_ton: 150,
    trees_per_ton: 0,
    energy_saved_kwh_per_ton: 0,
    water_saved_liters_per_ton: 1000,
    description_ar: 'تحويل لسماد عضوي أو طاقة حيوية',
  },
  chemical: {
    points_per_ton: 700,
    trees_per_ton: 0,
    energy_saved_kwh_per_ton: 0,
    water_saved_liters_per_ton: 0,
    description_ar: 'معالجة آمنة تمنع تلوث التربة والمياه',
  },
  medical: {
    points_per_ton: 900,
    trees_per_ton: 0,
    energy_saved_kwh_per_ton: 0,
    water_saved_liters_per_ton: 0,
    description_ar: 'تعقيم وتخلص آمن لحماية الصحة العامة',
  },
  construction: {
    points_per_ton: 120,
    trees_per_ton: 0,
    energy_saved_kwh_per_ton: 1350,
    water_saved_liters_per_ton: 0,
    description_ar: 'إعادة استخدام مواد البناء',
  },
  other: {
    points_per_ton: 100,
    trees_per_ton: 0,
    energy_saved_kwh_per_ton: 0,
    water_saved_liters_per_ton: 0,
    description_ar: 'مخلفات متنوعة',
  },
};

export interface GreenPointsCalculation {
  basePoints: number;
  qualityMultiplier: number;
  finalPoints: number;
  treesSaved: number;
  co2SavedTons: number;
  energySavedKwh: number;
  waterSavedLiters: number;
}

/**
 * Calculate green points for a shipment
 */
export const calculateGreenPoints = (
  wasteType: string,
  weightTons: number,
  qualityMultiplier: number = 1.0,
  customFactors?: Partial<typeof DEFAULT_GREEN_FACTORS[string]>,
): GreenPointsCalculation => {
  const factors = customFactors 
    ? { ...DEFAULT_GREEN_FACTORS[wasteType] || DEFAULT_GREEN_FACTORS.other, ...customFactors }
    : DEFAULT_GREEN_FACTORS[wasteType] || DEFAULT_GREEN_FACTORS.other;

  const basePoints = weightTons * factors.points_per_ton;
  const finalPoints = Math.round(basePoints * qualityMultiplier);
  const treesSaved = Math.round(weightTons * factors.trees_per_ton * 10) / 10;
  
  // CO2 saved from recycling (from carbonEngine factors)
  const co2Factors: Record<string, number> = {
    plastic: 1.4, paper: 0.9, metal: 4.0, glass: 0.3,
    electronic: 3.5, organic: 0.2, chemical: 1.0, medical: 1.5,
    construction: 0.2, other: 0.5,
  };
  const co2SavedTons = Math.round(weightTons * (co2Factors[wasteType] || 0.5) * 1000) / 1000;

  return {
    basePoints,
    qualityMultiplier,
    finalPoints,
    treesSaved,
    co2SavedTons,
    energySavedKwh: Math.round(weightTons * factors.energy_saved_kwh_per_ton),
    waterSavedLiters: Math.round(weightTons * factors.water_saved_liters_per_ton),
  };
};

/**
 * Determine green level based on total points
 */
export const getGreenLevel = (totalPoints: number): { level: string; label: string; color: string; nextThreshold: number } => {
  if (totalPoints >= 50000) return { level: 'platinum', label: 'بلاتيني ♻️', color: 'text-cyan-600', nextThreshold: 100000 };
  if (totalPoints >= 20000) return { level: 'gold', label: 'ذهبي 🥇', color: 'text-yellow-600', nextThreshold: 50000 };
  if (totalPoints >= 5000) return { level: 'silver', label: 'فضي 🥈', color: 'text-gray-500', nextThreshold: 20000 };
  return { level: 'bronze', label: 'برونزي 🥉', color: 'text-orange-600', nextThreshold: 5000 };
};

/**
 * Determine transporter badge based on overall score
 */
export const getTransporterBadge = (overallScore: number): { badge: string; label: string } => {
  if (overallScore >= 90) return { badge: 'green_champion', label: 'بطل النقل الأخضر 🏆' };
  if (overallScore >= 75) return { badge: 'green_certified', label: 'ناقل أخضر معتمد ✅' };
  if (overallScore >= 50) return { badge: 'green_progressing', label: 'في طريقه للاعتماد 📈' };
  return { badge: 'needs_improvement', label: 'يحتاج تحسين ⚠️' };
};
