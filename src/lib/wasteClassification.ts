/**
 * Egyptian Waste Classification System
 * نظام تصنيف المخلفات المصري المحدّث
 * 
 * المرجعيات القانونية:
 * - قانون البيئة رقم 4 لسنة 1994 وتعديلاته
 * - قانون تنظيم إدارة المخلفات رقم 202 لسنة 2020
 * - اللائحة التنفيذية لقانون إدارة المخلفات (2020)
 * - قرارات جهاز تنظيم إدارة المخلفات (WMRA)
 * - اتفاقية بازل بشأن المخلفات الخطرة (Basel Convention)
 * - التصنيف الأوروبي للمخلفات (EWC) - استرشادي
 * 
 * نظام مرن: فئات رئيسية + وصف حر
 * المستخدم يختار الفئة الرئيسية ويكتب الوصف بحرية
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
  baselCode?: string; // كود اتفاقية بازل (للخطرة)
}

export interface WasteCategoryInfo {
  id: string;
  name: string;
  description: string;
  wasteState: WasteState;
  category: WasteCategory;
  icon?: string;
  legalReference?: string;
  subcategories: WasteSubcategory[];
}

// ============================================
// الفئات الرئيسية المبسطة (للاستخدام في المحدد المرن)
// ============================================

export interface MainCategory {
  id: WasteType;
  name: string;
  nameShort: string;
  code: string;
  isHazardous: boolean;
  keywords: string[];
}

export const mainCategories: MainCategory[] = [
  // غير خطرة
  { id: 'organic', name: 'أخشاب ومواد عضوية', nameShort: 'عضوي/خشب', code: 'WD', isHazardous: false, keywords: ['خشب', 'اخشاب', 'بالت', 'بالتات', 'كونتر', 'حبيبي', 'صندوق', 'mdf', 'عضوي', 'طعام', 'زراعي'] },
  { id: 'plastic', name: 'بلاستيك ومطاط', nameShort: 'بلاستيك', code: 'PL', isHazardous: false, keywords: ['بلاستيك', 'plastic', 'pet', 'hdpe', 'pvc', 'نايلون', 'اكياس', 'عبوات', 'مطاط', 'كاوتش', 'إطار'] },
  { id: 'paper', name: 'ورق وكرتون', nameShort: 'ورق', code: 'PA', isHazardous: false, keywords: ['ورق', 'كرتون', 'paper', 'cardboard', 'كراتين', 'علب'] },
  { id: 'metal', name: 'معادن وخردة', nameShort: 'معادن', code: 'MT', isHazardous: false, keywords: ['معدن', 'حديد', 'ألومنيوم', 'نحاس', 'ستانلس', 'خردة', 'سكراب', 'زنك', 'رصاص'] },
  { id: 'glass', name: 'زجاج', nameShort: 'زجاج', code: 'GL', isHazardous: false, keywords: ['زجاج', 'glass', 'قوارير', 'زجاجات'] },
  { id: 'construction', name: 'مخلفات بناء وهدم', nameShort: 'بناء', code: 'CN', isHazardous: false, keywords: ['بناء', 'هدم', 'خرسانة', 'طوب', 'بلاط', 'سيراميك', 'ردم', 'أتربة'] },
  { id: 'other', name: 'مخلفات متنوعة', nameShort: 'متنوع', code: 'OT', isHazardous: false, keywords: ['متنوع', 'مختلط', 'اخرى', 'قماش', 'اثاث', 'نسيج', 'جلود'] },
  // خطرة
  { id: 'chemical', name: 'مخلفات كيميائية وبترولية', nameShort: 'كيميائي', code: 'CH', isHazardous: true, keywords: ['كيميائي', 'مذيب', 'حمض', 'قلوي', 'مبيد', 'زيت ملوث', 'طلاء', 'بترول', 'وقود'] },
  { id: 'electronic', name: 'مخلفات إلكترونية وكهربائية', nameShort: 'إلكتروني', code: 'EL', isHazardous: true, keywords: ['إلكتروني', 'بطارية', 'بطاريات', 'شاشة', 'كمبيوتر', 'موبايل', 'كهربائي'] },
  { id: 'medical', name: 'مخلفات طبية ورعاية صحية', nameShort: 'طبي', code: 'MD', isHazardous: true, keywords: ['طبي', 'صيدلي', 'إبر', 'أدوية', 'مستشفى', 'عيادة', 'صحي'] },
];

// الكشف التلقائي عن الفئة من الوصف
export const detectMainCategory = (description: string): MainCategory | null => {
  const desc = description.toLowerCase().trim();
  for (const cat of mainCategories) {
    for (const keyword of cat.keywords) {
      if (desc.includes(keyword.toLowerCase())) {
        return cat;
      }
    }
  }
  return null;
};

// ============================================
// المخلفات الخطرة - طبقاً لقانون 202/2020 واتفاقية بازل
// ============================================

export const hazardousWasteCategories: WasteCategoryInfo[] = [
  {
    id: 'chemical',
    name: 'المخلفات الكيميائية والبترولية',
    description: 'المواد الكيميائية الخطرة والمذيبات والزيوت الملوثة والمشتقات البترولية',
    wasteState: 'mixed',
    category: 'hazardous',
    legalReference: 'قانون 202/2020 - الباب الرابع',
    subcategories: [
      { name: 'مذيبات عضوية مستعملة', code: 'CH-01', hazardLevel: 'high', wasteState: 'liquid', baselCode: 'A3140' },
      { name: 'أحماض وقلويات صناعية', code: 'CH-02', hazardLevel: 'high', wasteState: 'liquid', baselCode: 'A4090' },
      { name: 'مبيدات ومواد كيماوية زراعية', code: 'CH-03', hazardLevel: 'critical', wasteState: 'mixed', baselCode: 'A4030' },
      { name: 'زيوت محركات وهيدروليك مستعملة', code: 'CH-04', hazardLevel: 'medium', wasteState: 'liquid', baselCode: 'A3020' },
      { name: 'دهانات وطلاءات وورنيش', code: 'CH-05', hazardLevel: 'medium', wasteState: 'liquid', baselCode: 'A4070' },
      { name: 'مواد لاصقة وراتنجات إيبوكسي', code: 'CH-06', hazardLevel: 'medium', wasteState: 'semi_solid' },
      { name: 'مخلفات مختبرات كيميائية', code: 'CH-07', hazardLevel: 'high', wasteState: 'mixed' },
      { name: 'براميل وحاويات ملوثة كيميائياً', code: 'CH-08', hazardLevel: 'high', wasteState: 'solid', baselCode: 'A1160' },
      { name: 'غازات مضغوطة وأسطوانات ملوثة', code: 'CH-09', hazardLevel: 'critical', wasteState: 'gas' },
      { name: 'مخلفات تكرير البترول', code: 'CH-10', hazardLevel: 'high', wasteState: 'liquid', baselCode: 'A3190' },
      { name: 'مخلفات أحبار وطباعة صناعية', code: 'CH-11', hazardLevel: 'medium', wasteState: 'liquid' },
      { name: 'مواد مؤكسدة ومواد كاوية', code: 'CH-12', hazardLevel: 'critical', wasteState: 'mixed', baselCode: 'A4140' },
    ],
  },
  {
    id: 'electronic',
    name: 'المخلفات الإلكترونية والكهربائية (WEEE)',
    description: 'أجهزة ومعدات إلكترونية وكهربائية مستعملة ومكوناتها',
    wasteState: 'solid',
    category: 'hazardous',
    legalReference: 'قانون 202/2020 - المادة 29 + توجيه WEEE الأوروبي',
    subcategories: [
      { name: 'بطاريات رصاص-حمض (سيارات)', code: 'EL-01', hazardLevel: 'high', wasteState: 'solid', baselCode: 'A1160' },
      { name: 'بطاريات ليثيوم-أيون', code: 'EL-02', hazardLevel: 'high', wasteState: 'solid' },
      { name: 'لوحات إلكترونية (PCB)', code: 'EL-03', hazardLevel: 'medium', wasteState: 'solid', baselCode: 'A1180' },
      { name: 'شاشات CRT ومصابيح فلورية', code: 'EL-04', hazardLevel: 'high', wasteState: 'solid', baselCode: 'A1030' },
      { name: 'حواسيب وأجهزة مكتبية', code: 'EL-05', hazardLevel: 'medium', wasteState: 'solid' },
      { name: 'هواتف وأجهزة اتصالات', code: 'EL-06', hazardLevel: 'medium', wasteState: 'solid' },
      { name: 'طابعات وخراطيش حبر/تونر', code: 'EL-07', hazardLevel: 'medium', wasteState: 'solid' },
      { name: 'أجهزة تبريد وتكييف (فريون)', code: 'EL-08', hazardLevel: 'high', wasteState: 'solid' },
      { name: 'كابلات وأسلاك نحاسية معزولة', code: 'EL-09', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'ألواح طاقة شمسية تالفة', code: 'EL-10', hazardLevel: 'medium', wasteState: 'solid' },
      { name: 'محولات كهربائية ومكثفات', code: 'EL-11', hazardLevel: 'high', wasteState: 'solid', baselCode: 'A1190' },
      { name: 'أجهزة منزلية كهربائية كبيرة', code: 'EL-12', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
    ],
  },
  {
    id: 'medical',
    name: 'مخلفات الرعاية الصحية',
    description: 'مخلفات المنشآت الصحية والطبية والصيدلانية والبيطرية',
    wasteState: 'mixed',
    category: 'hazardous',
    legalReference: 'قانون 202/2020 - المادة 27 + دليل منظمة الصحة العالمية',
    subcategories: [
      { name: 'نفايات معدية (أكياس حمراء)', code: 'MD-01', hazardLevel: 'critical', wasteState: 'solid', baselCode: 'Y1' },
      { name: 'أدوات حادة (إبر ومشارط)', code: 'MD-02', hazardLevel: 'critical', wasteState: 'solid', baselCode: 'Y1' },
      { name: 'أدوية ولقاحات منتهية الصلاحية', code: 'MD-03', hazardLevel: 'high', wasteState: 'mixed', baselCode: 'Y3' },
      { name: 'نفايات العلاج الكيميائي (السيتوتوكسيك)', code: 'MD-04', hazardLevel: 'critical', wasteState: 'liquid', baselCode: 'Y3' },
      { name: 'نفايات تشريحية وأعضاء', code: 'MD-05', hazardLevel: 'critical', wasteState: 'solid' },
      { name: 'أكياس دم ومشتقاته', code: 'MD-06', hazardLevel: 'high', wasteState: 'liquid' },
      { name: 'مستلزمات طبية ملوثة (قفازات، أقنعة)', code: 'MD-07', hazardLevel: 'high', wasteState: 'solid' },
      { name: 'نفايات مختبرات التحاليل والميكروبيولوجيا', code: 'MD-08', hazardLevel: 'high', wasteState: 'mixed' },
      { name: 'نفايات صيدلانية ومواد تخدير', code: 'MD-09', hazardLevel: 'high', wasteState: 'mixed', baselCode: 'Y3' },
      { name: 'مخلفات بيطرية', code: 'MD-10', hazardLevel: 'high', wasteState: 'mixed' },
      { name: 'نفايات مشعة طبية', code: 'MD-11', hazardLevel: 'critical', wasteState: 'mixed', baselCode: 'Y5' },
      { name: 'نفايات غسيل كلوي وأجهزة طبية', code: 'MD-12', hazardLevel: 'high', wasteState: 'mixed' },
    ],
  },
  {
    id: 'industrial',
    name: 'المخلفات الصناعية الخطرة',
    description: 'مخلفات ناتجة عن العمليات الصناعية والتعدينية',
    wasteState: 'mixed',
    category: 'hazardous',
    legalReference: 'قانون 202/2020 - المادة 26',
    subcategories: [
      { name: 'حمأة صناعية سامة', code: 'IN-01', hazardLevel: 'critical', wasteState: 'semi_solid', baselCode: 'A4100' },
      { name: 'مخلفات الدباغة والجلود', code: 'IN-02', hazardLevel: 'high', wasteState: 'liquid', baselCode: 'A4100' },
      { name: 'مخلفات صناعة البتروكيماويات', code: 'IN-03', hazardLevel: 'critical', wasteState: 'liquid' },
      { name: 'رماد وخبث أفران صناعية', code: 'IN-04', hazardLevel: 'high', wasteState: 'solid', baselCode: 'A2060' },
      { name: 'مخلفات الطلاء الكهربائي والمعالجة السطحية', code: 'IN-05', hazardLevel: 'high', wasteState: 'liquid', baselCode: 'A1120' },
      { name: 'مخلفات الأسبستوس (أميانت)', code: 'IN-06', hazardLevel: 'critical', wasteState: 'solid', baselCode: 'A2050' },
      { name: 'حمأة معالجة مياه صناعية', code: 'IN-07', hazardLevel: 'high', wasteState: 'semi_solid' },
      { name: 'فلاتر صناعية ملوثة', code: 'IN-08', hazardLevel: 'medium', wasteState: 'solid' },
      { name: 'مخلفات تعدين ومعادن ثقيلة', code: 'IN-09', hazardLevel: 'high', wasteState: 'solid', baselCode: 'A1010' },
      { name: 'مخلفات صناعة النسيج الملوثة', code: 'IN-10', hazardLevel: 'medium', wasteState: 'liquid' },
    ],
  },
];

// ============================================
// المخلفات غير الخطرة - طبقاً لقانون 202/2020
// ============================================

export const nonHazardousWasteCategories: WasteCategoryInfo[] = [
  {
    id: 'plastic',
    name: 'مخلفات البلاستيك والمطاط',
    description: 'أنواع البلاستيك والمطاط القابلة لإعادة التدوير',
    wasteState: 'solid',
    category: 'non_hazardous',
    legalReference: 'قانون 202/2020 - الباب الثالث',
    subcategories: [
      { name: 'PET - بولي إيثيلين تريفثالات (زجاجات مياه)', code: 'PL-01', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'HDPE - بولي إيثيلين عالي الكثافة (عبوات)', code: 'PL-02', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'PVC - بولي فينيل كلوريد (أنابيب)', code: 'PL-03', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'LDPE - بولي إيثيلين منخفض الكثافة (أكياس)', code: 'PL-04', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'PP - بولي بروبيلين (علب طعام)', code: 'PL-05', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'PS - بوليسترين (ستايروفوم/فوم)', code: 'PL-06', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'بلاستيك مختلط وأغشية تغليف', code: 'PL-07', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'مطاط وإطارات مستعملة', code: 'PL-08', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'بلاستيك صناعي وهندسي', code: 'PL-09', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
    ],
  },
  {
    id: 'paper',
    name: 'مخلفات الورق والكرتون',
    description: 'الورق والكرتون بأنواعهما',
    wasteState: 'solid',
    category: 'non_hazardous',
    subcategories: [
      { name: 'ورق مكتبي أبيض (A4/A3)', code: 'PA-01', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'صحف ومجلات ومطبوعات', code: 'PA-02', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'كرتون مموج (صناديق شحن)', code: 'PA-03', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'كرتون مضغوط وعلب', code: 'PA-04', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'أكياس ورقية وورق تغليف', code: 'PA-05', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'ورق مشمع أو مغلف (غير قابل للتدوير)', code: 'PA-06', hazardLevel: 'low', wasteState: 'solid', recyclable: false },
      { name: 'كتب ومستندات ووثائق قديمة', code: 'PA-07', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
    ],
  },
  {
    id: 'metal',
    name: 'مخلفات المعادن والخردة',
    description: 'المعادن الحديدية وغير الحديدية',
    wasteState: 'solid',
    category: 'non_hazardous',
    subcategories: [
      { name: 'حديد وصلب (خردة حديد)', code: 'MT-01', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'ألومنيوم (علب مشروبات وألواح)', code: 'MT-02', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'نحاس ونحاس أصفر', code: 'MT-03', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'ستانلس ستيل (فولاذ مقاوم للصدأ)', code: 'MT-04', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'خردة معدنية مختلطة', code: 'MT-05', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'براميل وحاويات معدنية نظيفة', code: 'MT-06', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'أنابيب وهياكل معدنية', code: 'MT-07', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
    ],
  },
  {
    id: 'glass',
    name: 'مخلفات الزجاج',
    description: 'الزجاج بألوانه وأنواعه المختلفة',
    wasteState: 'solid',
    category: 'non_hazardous',
    subcategories: [
      { name: 'زجاج شفاف (عبوات وقوارير)', code: 'GL-01', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'زجاج ملون (أخضر/بني/أزرق)', code: 'GL-02', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'زجاج مسطح (نوافذ ومرايا)', code: 'GL-03', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'زجاج مختلط', code: 'GL-04', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
    ],
  },
  {
    id: 'organic',
    name: 'مخلفات عضوية وغذائية وزراعية',
    description: 'المخلفات العضوية القابلة للتحلل والتسميد - غذائية وزراعية وأخشاب',
    wasteState: 'solid',
    category: 'non_hazardous',
    legalReference: 'قانون 202/2020 - المادة 22',
    subcategories: [
      { name: 'مخلفات طعام (مطاعم وفنادق)', code: 'OR-01', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'مخلفات أسواق وخضار وفاكهة', code: 'OR-02', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'مخلفات حدائق وتقليم أشجار', code: 'OR-03', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'أخشاب نظيفة (بالتات وصناديق)', code: 'OR-04', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'مخلفات محاصيل زراعية (قش/حطب)', code: 'OR-05', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'مخلفات تصنيع غذائي', code: 'OR-06', hazardLevel: 'low', wasteState: 'mixed', recyclable: true },
      { name: 'منسوجات طبيعية (قطن/كتان/صوف)', code: 'OR-07', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'سماد عضوي وروث حيواني', code: 'OR-08', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
    ],
  },
  {
    id: 'construction',
    name: 'مخلفات البناء والهدم (C&D)',
    description: 'مخلفات قطاع البناء والتشييد والبنية التحتية',
    wasteState: 'solid',
    category: 'non_hazardous',
    legalReference: 'قانون 202/2020 - المادة 24',
    subcategories: [
      { name: 'خرسانة وطوب وبلوكات', code: 'CN-01', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'أخشاب إنشائية وقوالب', code: 'CN-02', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'بلاط وسيراميك ورخام', code: 'CN-03', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'حديد تسليح ومعادن إنشائية', code: 'CN-04', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'ردم وأتربة ورمال', code: 'CN-05', hazardLevel: 'low', wasteState: 'solid', recyclable: false },
      { name: 'أنابيب ومواسير (PVC/حديد)', code: 'CN-06', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
    ],
  },
  {
    id: 'textile',
    name: 'مخلفات نسيج وملابس وجلود',
    description: 'مخلفات صناعة النسيج والملابس والجلود غير الملوثة',
    wasteState: 'solid',
    category: 'non_hazardous',
    subcategories: [
      { name: 'ملابس وأقمشة مستعملة', code: 'TX-01', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'قصاصات وبقايا تصنيع نسيج', code: 'TX-02', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'جلود طبيعية وصناعية (غير ملوثة)', code: 'TX-03', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'سجاد وموكيت وبطانيات', code: 'TX-04', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
      { name: 'خيوط وحبال ومنسوجات صناعية', code: 'TX-05', hazardLevel: 'low', wasteState: 'solid', recyclable: true },
    ],
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export const wasteTypeLabels: Record<string, string> = {
  plastic: 'بلاستيك ومطاط',
  paper: 'ورق وكرتون',
  metal: 'معادن وخردة',
  glass: 'زجاج',
  electronic: 'إلكترونيات وكهربائيات',
  organic: 'عضوي/غذائي/زراعي',
  chemical: 'كيميائي وبترولي',
  medical: 'رعاية صحية',
  construction: 'بناء وهدم',
  industrial: 'صناعي خطر',
  textile: 'نسيج وجلود',
  other: 'أخرى',
};

export const wasteCategoryLabels: Record<string, string> = {
  hazardous: 'مخلفات خطرة',
  non_hazardous: 'مخلفات غير خطرة',
  medical_hazardous: 'مخلفات رعاية صحية',
  all: 'جميع الأنواع',
};

export const hazardLevelLabels: Record<HazardLevel, string> = {
  low: 'منخفض',
  medium: 'متوسط',
  high: 'عالي',
  critical: 'حرج',
};

export const wasteStateLabels: Record<WasteState, string> = {
  solid: 'صلبة',
  liquid: 'سائلة',
  semi_solid: 'شبه صلبة',
  gas: 'غازية',
  mixed: 'مختلطة',
};

export const getHazardLevelColor = (level: HazardLevel): string => {
  const colors: Record<HazardLevel, string> = {
    low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };
  return colors[level] || colors.low;
};

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
    industrial: 'IN',
    textile: 'TX',
    other: 'OT',
  };
  return codes[wasteType] || 'OT';
};

export const isHazardousWasteType = (wasteType: WasteType | string): boolean => {
  if (!wasteType) return false;
  return ['chemical', 'electronic', 'medical', 'industrial'].includes(wasteType);
};

export const getHazardLevelFromWasteType = (wasteType: WasteType | string): 'hazardous' | 'non_hazardous' => {
  return isHazardousWasteType(wasteType) ? 'hazardous' : 'non_hazardous';
};

export const getAllWasteCategories = (): WasteCategoryInfo[] => {
  return [...hazardousWasteCategories, ...nonHazardousWasteCategories];
};

export const findCategoryById = (id: string): WasteCategoryInfo | undefined => {
  return getAllWasteCategories().find(cat => cat.id === id);
};

export const findSubcategoryByCode = (code: string): { category: WasteCategoryInfo; subcategory: WasteSubcategory } | undefined => {
  for (const category of getAllWasteCategories()) {
    const subcategory = category.subcategories.find(sub => sub.code === code);
    if (subcategory) {
      return { category, subcategory };
    }
  }
  return undefined;
};

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
  baselConvention: {
    title: 'اتفاقية بازل بشأن نقل المخلفات الخطرة عبر الحدود',
    description: 'الاتفاقية الدولية المنظمة لنقل المخلفات الخطرة والتخلص منها',
  },
  eeaaWebsite: 'https://www.eeaa.gov.eg',
  wmraWebsite: 'https://www.wmra.gov.eg',
};
