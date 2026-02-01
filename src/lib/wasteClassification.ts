/**
 * Egyptian Waste Classification System
 * Based on Egyptian Environmental Law No. 4 of 1994 and its executive regulations
 * Updated according to Law No. 202 of 2020 for Waste Management
 * 
 * Reference: Egyptian Environmental Affairs Agency (EEAA) - https://www.eeaa.gov.eg
 */

import type { Database } from '@/integrations/supabase/types';

export type WasteType = Database['public']['Enums']['waste_type'];

export type HazardLevel = 'low' | 'medium' | 'high' | 'critical';
export type WasteState = 'solid' | 'liquid' | 'semi_solid' | 'gas' | 'mixed';
export type WasteCategory = 'hazardous' | 'non_hazardous' | 'all';

export interface WasteSubcategory {
  name: string;
  code: string;
  hazardLevel: HazardLevel;
  wasteState: WasteState;
  recyclable?: boolean;
}

export interface WasteCategoryInfo {
  id: string;
  name: string;
  description: string;
  wasteState: WasteState;
  category: WasteCategory;
  subcategories: WasteSubcategory[];
}

// ============================================
// HAZARDOUS WASTE CATEGORIES
// ============================================

export const hazardousWasteCategories: WasteCategoryInfo[] = [
  {
    id: 'chemical',
    name: 'المخلفات الكيميائية',
    description: 'المواد الكيميائية الخطرة والسامة',
    wasteState: 'mixed',
    category: 'hazardous',
    subcategories: [
      { name: 'المذيبات العضوية', code: 'CH-01', hazardLevel: 'high', wasteState: 'liquid' },
      { name: 'الأحماض والقلويات', code: 'CH-02', hazardLevel: 'high', wasteState: 'liquid' },
      { name: 'المبيدات الحشرية', code: 'CH-03', hazardLevel: 'critical', wasteState: 'liquid' },
      { name: 'الأسمدة الكيميائية المنتهية', code: 'CH-04', hazardLevel: 'medium', wasteState: 'solid' },
      { name: 'المواد المؤكسدة', code: 'CH-05', hazardLevel: 'high', wasteState: 'solid' },
      { name: 'المواد الكاوية', code: 'CH-06', hazardLevel: 'high', wasteState: 'liquid' },
      { name: 'المواد السامة', code: 'CH-07', hazardLevel: 'critical', wasteState: 'mixed' },
      { name: 'مخلفات المختبرات الكيميائية', code: 'CH-08', hazardLevel: 'high', wasteState: 'mixed' },
      { name: 'الزيوت والشحوم الملوثة', code: 'CH-09', hazardLevel: 'medium', wasteState: 'liquid' },
      { name: 'الطلاءات والدهانات', code: 'CH-10', hazardLevel: 'medium', wasteState: 'liquid' },
      { name: 'براميل كيميائية ملوثة', code: 'CH-11', hazardLevel: 'high', wasteState: 'solid' },
      { name: 'حاويات مواد خطرة فارغة', code: 'CH-12', hazardLevel: 'medium', wasteState: 'solid' },
      { name: 'مخلفات التنظيف الصناعي', code: 'CH-13', hazardLevel: 'medium', wasteState: 'liquid' },
      { name: 'غازات مضغوطة ملوثة', code: 'CH-14', hazardLevel: 'critical', wasteState: 'gas' },
      { name: 'مواد لاصقة صناعية', code: 'CH-15', hazardLevel: 'medium', wasteState: 'semi_solid' },
      { name: 'راتنجات ومواد ايبوكسي', code: 'CH-16', hazardLevel: 'medium', wasteState: 'semi_solid' },
      { name: 'مخلفات التبريد والتكييف', code: 'CH-17', hazardLevel: 'high', wasteState: 'gas' },
      { name: 'زيوت هيدروليكية مستعملة', code: 'CH-18', hazardLevel: 'medium', wasteState: 'liquid' },
      { name: 'مخلفات الطباعة والأحبار', code: 'CH-19', hazardLevel: 'medium', wasteState: 'liquid' },
      { name: 'مخلفات معالجة الأسطح', code: 'CH-20', hazardLevel: 'high', wasteState: 'liquid' },
    ],
  },
  {
    id: 'electronic',
    name: 'المخلفات الإلكترونية',
    description: 'الأجهزة والمكونات الإلكترونية',
    wasteState: 'solid',
    category: 'hazardous',
    subcategories: [
      { name: 'البطاريات (رصاص-حمض)', code: 'EL-01', hazardLevel: 'high', wasteState: 'solid' },
      { name: 'البطاريات الليثيوم', code: 'EL-02', hazardLevel: 'high', wasteState: 'solid' },
      { name: 'الشاشات CRT', code: 'EL-03', hazardLevel: 'medium', wasteState: 'solid' },
      { name: 'اللوحات الإلكترونية', code: 'EL-04', hazardLevel: 'medium', wasteState: 'solid' },
      { name: 'الكابلات والأسلاك', code: 'EL-05', hazardLevel: 'low', wasteState: 'solid' },
      { name: 'أجهزة الحاسوب', code: 'EL-06', hazardLevel: 'medium', wasteState: 'solid' },
      { name: 'الهواتف المحمولة', code: 'EL-07', hazardLevel: 'medium', wasteState: 'solid' },
      { name: 'الطابعات وخراطيش الحبر', code: 'EL-08', hazardLevel: 'medium', wasteState: 'solid' },
      { name: 'المصابيح الفلورية', code: 'EL-09', hazardLevel: 'high', wasteState: 'solid' },
      { name: 'الأجهزة المنزلية الإلكترونية', code: 'EL-10', hazardLevel: 'low', wasteState: 'solid' },
      { name: 'مكيفات هواء مستعملة', code: 'EL-11', hazardLevel: 'medium', wasteState: 'solid' },
      { name: 'ثلاجات ومبردات', code: 'EL-12', hazardLevel: 'medium', wasteState: 'solid' },
      { name: 'معدات طبية إلكترونية', code: 'EL-13', hazardLevel: 'high', wasteState: 'solid' },
      { name: 'أجهزة اتصالات وشبكات', code: 'EL-14', hazardLevel: 'low', wasteState: 'solid' },
      { name: 'شاشات LCD/LED', code: 'EL-15', hazardLevel: 'medium', wasteState: 'solid' },
      { name: 'محولات كهربائية', code: 'EL-16', hazardLevel: 'medium', wasteState: 'solid' },
      { name: 'UPS وبطاريات احتياطية', code: 'EL-17', hazardLevel: 'high', wasteState: 'solid' },
      { name: 'ألواح طاقة شمسية تالفة', code: 'EL-18', hazardLevel: 'medium', wasteState: 'solid' },
      { name: 'موتورات كهربائية', code: 'EL-19', hazardLevel: 'low', wasteState: 'solid' },
      { name: 'أسلاك نحاسية معزولة', code: 'EL-20', hazardLevel: 'low', wasteState: 'solid' },
    ],
  },
  {
    id: 'medical',
    name: 'المخلفات الطبية',
    description: 'المخلفات الصحية والطبية الخطرة',
    wasteState: 'mixed',
    category: 'hazardous',
    subcategories: [
      { name: 'النفايات المعدية', code: 'MD-01', hazardLevel: 'critical', wasteState: 'solid' },
      { name: 'الأدوات الحادة (إبر، مشارط)', code: 'MD-02', hazardLevel: 'critical', wasteState: 'solid' },
      { name: 'الأدوية منتهية الصلاحية', code: 'MD-03', hazardLevel: 'high', wasteState: 'mixed' },
      { name: 'المواد الكيميائية الصيدلانية', code: 'MD-04', hazardLevel: 'high', wasteState: 'liquid' },
      { name: 'النفايات التشريحية', code: 'MD-05', hazardLevel: 'critical', wasteState: 'solid' },
      { name: 'نفايات العلاج الكيميائي', code: 'MD-06', hazardLevel: 'critical', wasteState: 'liquid' },
      { name: 'النفايات المشعة الطبية', code: 'MD-07', hazardLevel: 'critical', wasteState: 'mixed' },
      { name: 'أكياس الدم ومشتقاته', code: 'MD-08', hazardLevel: 'high', wasteState: 'liquid' },
      { name: 'المستلزمات الطبية الملوثة', code: 'MD-09', hazardLevel: 'high', wasteState: 'solid' },
      { name: 'نفايات غسيل الكلى', code: 'MD-10', hazardLevel: 'high', wasteState: 'liquid' },
      { name: 'قفازات طبية ملوثة', code: 'MD-11', hazardLevel: 'high', wasteState: 'solid' },
      { name: 'أقنعة ومعدات وقاية شخصية', code: 'MD-12', hazardLevel: 'medium', wasteState: 'solid' },
      { name: 'عبوات أدوية فارغة', code: 'MD-13', hazardLevel: 'medium', wasteState: 'solid' },
      { name: 'نفايات مختبرات التحاليل', code: 'MD-14', hazardLevel: 'high', wasteState: 'mixed' },
      { name: 'نفايات الأسنان', code: 'MD-15', hazardLevel: 'medium', wasteState: 'solid' },
      { name: 'نفايات العيادات البيطرية', code: 'MD-16', hazardLevel: 'high', wasteState: 'mixed' },
      { name: 'أنابيب ومحاقن مستعملة', code: 'MD-17', hazardLevel: 'critical', wasteState: 'solid' },
      { name: 'ضمادات وقطن ملوث', code: 'MD-18', hazardLevel: 'high', wasteState: 'solid' },
      { name: 'نفايات غرف العمليات', code: 'MD-19', hazardLevel: 'critical', wasteState: 'mixed' },
      { name: 'مخلفات التعقيم', code: 'MD-20', hazardLevel: 'medium', wasteState: 'liquid' },
    ],
  },
  {
    id: 'industrial',
    name: 'المخلفات الصناعية الخطرة',
    description: 'مخلفات العمليات الصناعية الخطرة',
    wasteState: 'mixed',
    category: 'hazardous',
    subcategories: [
      { name: 'براميل صناعية ملوثة', code: 'IN-01', hazardLevel: 'high', wasteState: 'solid' },
      { name: 'حمأة صناعية سامة', code: 'IN-02', hazardLevel: 'critical', wasteState: 'semi_solid' },
      { name: 'مخلفات الدباغة', code: 'IN-03', hazardLevel: 'high', wasteState: 'liquid' },
      { name: 'رماد أفران صناعية', code: 'IN-04', hazardLevel: 'medium', wasteState: 'solid' },
      { name: 'مخلفات صناعة البتروكيماويات', code: 'IN-05', hazardLevel: 'critical', wasteState: 'liquid' },
      { name: 'مخلفات الطلاء الكهربائي', code: 'IN-06', hazardLevel: 'high', wasteState: 'liquid' },
      { name: 'حمأة معالجة المياه الصناعية', code: 'IN-07', hazardLevel: 'high', wasteState: 'semi_solid' },
      { name: 'مخلفات صناعة النسيج الملوثة', code: 'IN-08', hazardLevel: 'medium', wasteState: 'liquid' },
      { name: 'فلاتر صناعية ملوثة', code: 'IN-09', hazardLevel: 'medium', wasteState: 'solid' },
      { name: 'مخلفات اللحام والقطع', code: 'IN-10', hazardLevel: 'medium', wasteState: 'solid' },
      { name: 'خبث المعادن الثقيلة', code: 'IN-11', hazardLevel: 'high', wasteState: 'solid' },
      { name: 'مخلفات الأسبستوس', code: 'IN-12', hazardLevel: 'critical', wasteState: 'solid' },
    ],
  },
];

// ============================================
// NON-HAZARDOUS WASTE CATEGORIES
// ============================================

export const nonHazardousWasteCategories: WasteCategoryInfo[] = [
  {
    id: 'plastic',
    name: 'مخلفات البلاستيك',
    description: 'أنواع البلاستيك القابلة لإعادة التدوير',
    wasteState: 'solid',
    category: 'non_hazardous',
    subcategories: [
      { name: 'PET (زجاجات المياه)', code: 'PL-01', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'HDPE (عبوات الحليب)', code: 'PL-02', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'PVC (أنابيب)', code: 'PL-03', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'LDPE (أكياس بلاستيكية)', code: 'PL-04', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'PP (علب الطعام)', code: 'PL-05', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'PS (الستايروفوم)', code: 'PL-06', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'البلاستيك المختلط', code: 'PL-07', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'الأغشية البلاستيكية', code: 'PL-08', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'بلاستيك صناعي', code: 'PL-09', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'خراطيم بلاستيكية', code: 'PL-10', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
    ],
  },
  {
    id: 'paper',
    name: 'مخلفات الورق والكرتون',
    description: 'الورق والكرتون بأنواعهما',
    wasteState: 'solid',
    category: 'non_hazardous',
    subcategories: [
      { name: 'الورق المكتبي الأبيض', code: 'PA-01', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'الصحف والمجلات', code: 'PA-02', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'الكرتون المموج', code: 'PA-03', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'الكرتون المضغوط', code: 'PA-04', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'أكياس الورق', code: 'PA-05', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'ورق التغليف', code: 'PA-06', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'الورق المشمع أو المغلف', code: 'PA-07', hazardLevel: 'low', wasteState: 'solid', recyclable: false },
      { name: 'ورق طباعة ملون', code: 'PA-08', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'كتب ومستندات قديمة', code: 'PA-09', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
    ],
  },
  {
    id: 'metal',
    name: 'مخلفات المعادن',
    description: 'المعادن بأنواعها المختلفة',
    wasteState: 'solid',
    category: 'non_hazardous',
    subcategories: [
      { name: 'الألومنيوم (علب المشروبات)', code: 'MT-01', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'الحديد والصلب', code: 'MT-02', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'النحاس', code: 'MT-03', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'الستانلس ستيل', code: 'MT-04', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'البرونز والنحاس الأصفر', code: 'MT-05', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'الخردة المعدنية المختلطة', code: 'MT-06', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'براميل معدنية نظيفة', code: 'MT-07', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'أنابيب معدنية', code: 'MT-08', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
    ],
  },
  {
    id: 'glass',
    name: 'مخلفات الزجاج',
    description: 'الزجاج بألوانه المختلفة',
    wasteState: 'solid',
    category: 'non_hazardous',
    subcategories: [
      { name: 'زجاج شفاف', code: 'GL-01', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'زجاج أخضر', code: 'GL-02', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'زجاج بني', code: 'GL-03', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'زجاج مختلط', code: 'GL-04', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'زجاج مسطح (نوافذ)', code: 'GL-05', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'عبوات زجاجية', code: 'GL-06', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
    ],
  },
  {
    id: 'organic',
    name: 'مخلفات عضوية',
    description: 'المخلفات العضوية القابلة للتحلل',
    wasteState: 'solid',
    category: 'non_hazardous',
    subcategories: [
      { name: 'مخلفات الطعام', code: 'OR-01', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'مخلفات الحدائق', code: 'OR-02', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'مخلفات الأخشاب النظيفة', code: 'OR-03', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'مخلفات المنسوجات الطبيعية', code: 'OR-04', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'مخلفات زراعية', code: 'OR-05', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'سماد عضوي', code: 'OR-06', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
    ],
  },
  {
    id: 'construction',
    name: 'مخلفات البناء والهدم',
    description: 'مخلفات قطاع البناء والتشييد',
    wasteState: 'solid',
    category: 'non_hazardous',
    subcategories: [
      { name: 'الخرسانة والطوب', code: 'CN-01', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'الأخشاب الإنشائية', code: 'CN-02', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'البلاط والسيراميك', code: 'CN-03', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'المعادن الإنشائية', code: 'CN-04', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'مخلفات الترميم', code: 'CN-05', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'ردم وأتربة', code: 'CN-06', hazardLevel: 'low', wasteState: 'solid', recyclable: false },
    ],
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get waste type label in Arabic
 */
export const wasteTypeLabels: Record<string, string> = {
  plastic: 'بلاستيك',
  paper: 'ورق',
  metal: 'معادن',
  glass: 'زجاج',
  electronic: 'إلكترونيات',
  organic: 'عضوية',
  chemical: 'كيميائية',
  medical: 'طبية',
  construction: 'مخلفات بناء',
  other: 'أخرى',
};

/**
 * Get waste category label in Arabic
 */
export const wasteCategoryLabels: Record<string, string> = {
  hazardous: 'مخلفات خطرة',
  non_hazardous: 'مخلفات غير خطرة',
  medical_hazardous: 'مخلفات طبية خطرة',
  all: 'جميع الأنواع',
};

/**
 * Get hazard level label in Arabic
 */
export const hazardLevelLabels: Record<HazardLevel, string> = {
  low: 'منخفض',
  medium: 'متوسط',
  high: 'عالي',
  critical: 'حرج',
};

/**
 * Get waste state label in Arabic
 */
export const wasteStateLabels: Record<WasteState, string> = {
  solid: 'صلبة',
  liquid: 'سائلة',
  semi_solid: 'شبه صلبة',
  gas: 'غازية',
  mixed: 'مختلطة',
};

/**
 * Get hazard level color class
 */
export const getHazardLevelColor = (level: HazardLevel): string => {
  const colors: Record<HazardLevel, string> = {
    low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };
  return colors[level] || colors.low;
};

/**
 * Get waste type code
 */
export const getWasteTypeCode = (wasteType: WasteType | string): string => {
  const codes: Record<string, string> = {
    plastic: 'PL',
    paper: 'PA',
    metal: 'MT',
    glass: 'GL',
    electronic: 'EL',
    organic: 'OR',
    chemical: 'CH',
    medical: 'MD',
    construction: 'CN',
    other: 'OT',
  };
  return codes[wasteType] || 'OT';
};

/**
 * Check if waste type is hazardous
 */
export const isHazardousWasteType = (wasteType: WasteType | string): boolean => {
  if (!wasteType) return false;
  return ['chemical', 'electronic', 'medical'].includes(wasteType);
};

/**
 * Get hazard level from waste type
 */
export const getHazardLevelFromWasteType = (wasteType: WasteType | string): 'hazardous' | 'non_hazardous' => {
  return isHazardousWasteType(wasteType) ? 'hazardous' : 'non_hazardous';
};

/**
 * Get all waste categories combined
 */
export const getAllWasteCategories = (): WasteCategoryInfo[] => {
  return [...hazardousWasteCategories, ...nonHazardousWasteCategories];
};

/**
 * Find category by ID
 */
export const findCategoryById = (id: string): WasteCategoryInfo | undefined => {
  return getAllWasteCategories().find(cat => cat.id === id);
};

/**
 * Find subcategory by code
 */
export const findSubcategoryByCode = (code: string): { category: WasteCategoryInfo; subcategory: WasteSubcategory } | undefined => {
  for (const category of getAllWasteCategories()) {
    const subcategory = category.subcategories.find(sub => sub.code === code);
    if (subcategory) {
      return { category, subcategory };
    }
  }
  return undefined;
};

/**
 * Get all subcategories flat list
 */
export const getAllSubcategories = (): Array<WasteSubcategory & { categoryId: string; categoryName: string }> => {
  const result: Array<WasteSubcategory & { categoryId: string; categoryName: string }> = [];
  for (const category of getAllWasteCategories()) {
    for (const sub of category.subcategories) {
      result.push({
        ...sub,
        categoryId: category.id,
        categoryName: category.name,
      });
    }
  }
  return result;
};

/**
 * Legal Reference Information
 */
export const legalReferences = {
  mainLaw: {
    title: 'قانون البيئة رقم 4 لسنة 1994',
    description: 'القانون الإطاري لحماية البيئة في جمهورية مصر العربية',
  },
  executiveRegulations: {
    title: 'اللائحة التنفيذية لقانون البيئة',
    description: 'الصادرة بقرار رئيس مجلس الوزراء رقم 338 لسنة 1995 وتعديلاتها',
  },
  wasteManagementLaw: {
    title: 'قانون تنظيم إدارة المخلفات رقم 202 لسنة 2020',
    description: 'القانون المتخصص في تنظيم منظومة إدارة المخلفات بأنواعها',
  },
  eeaaWebsite: 'https://www.eeaa.gov.eg',
};
