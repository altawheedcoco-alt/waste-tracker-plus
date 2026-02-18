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
 * نظام مرن: فئات رئيسية + أصناف فرعية + مسميات شائعة في السوق المصري
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
  baselCode?: string;
  /** المسميات الشائعة في السوق المصري */
  commonNames?: string[];
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
  { id: 'organic', name: 'أخشاب ومواد عضوية', nameShort: 'عضوي/خشب', code: 'WD', isHazardous: false, keywords: ['خشب', 'اخشاب', 'بالت', 'بالتات', 'كونتر', 'حبيبي', 'صندوق', 'mdf', 'عضوي', 'طعام', 'زراعي', 'موسكي', 'ابلكاش', 'خشب زان', 'خشب سويد', 'لتزانيلو', 'تيك', 'نشارة'] },
  { id: 'plastic', name: 'بلاستيك ومطاط', nameShort: 'بلاستيك', code: 'PL', isHazardous: false, keywords: ['بلاستيك', 'plastic', 'pet', 'hdpe', 'pvc', 'نايلون', 'اكياس', 'عبوات', 'مطاط', 'كاوتش', 'إطار', 'شنطة', 'جردل', 'خرطوم', 'فيبر جلاس'] },
  { id: 'paper', name: 'ورق وكرتون', nameShort: 'ورق', code: 'PA', isHazardous: false, keywords: ['ورق', 'كرتون', 'paper', 'cardboard', 'كراتين', 'علب', 'دشت', 'رول', 'ورق فلوسكاب'] },
  { id: 'metal', name: 'معادن وخردة', nameShort: 'معادن', code: 'MT', isHazardous: false, keywords: ['معدن', 'حديد', 'ألومنيوم', 'نحاس', 'ستانلس', 'خردة', 'سكراب', 'زنك', 'رصاص', 'تنك', 'صاج', 'سلك', 'مسمار'] },
  { id: 'glass', name: 'زجاج', nameShort: 'زجاج', code: 'GL', isHazardous: false, keywords: ['زجاج', 'glass', 'قوارير', 'زجاجات', 'كسر زجاج', 'ازاز'] },
  { id: 'construction', name: 'مخلفات بناء وهدم', nameShort: 'بناء', code: 'CN', isHazardous: false, keywords: ['بناء', 'هدم', 'خرسانة', 'طوب', 'بلاط', 'سيراميك', 'ردم', 'أتربة', 'رمل', 'زلط', 'أسمنت'] },
  { id: 'other', name: 'مخلفات متنوعة', nameShort: 'متنوع', code: 'OT', isHazardous: false, keywords: ['متنوع', 'مختلط', 'اخرى', 'قماش', 'اثاث', 'نسيج', 'جلود'] },
  // خطرة
  { id: 'chemical', name: 'مخلفات كيميائية وبترولية', nameShort: 'كيميائي', code: 'CH', isHazardous: true, keywords: ['كيميائي', 'مذيب', 'حمض', 'قلوي', 'مبيد', 'زيت ملوث', 'طلاء', 'بترول', 'وقود', 'سولار', 'بنزين', 'ثنر'] },
  { id: 'electronic', name: 'مخلفات إلكترونية وكهربائية', nameShort: 'إلكتروني', code: 'EL', isHazardous: true, keywords: ['إلكتروني', 'بطارية', 'بطاريات', 'شاشة', 'كمبيوتر', 'موبايل', 'كهربائي', 'لمبة', 'فلورسنت'] },
  { id: 'medical', name: 'مخلفات طبية ورعاية صحية', nameShort: 'طبي', code: 'MD', isHazardous: true, keywords: ['طبي', 'صيدلي', 'إبر', 'أدوية', 'مستشفى', 'عيادة', 'صحي', 'سرنجة', 'شاش'] },
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
      { name: 'مذيبات عضوية مستعملة', code: 'CH-01', hazardLevel: 'high', wasteState: 'liquid', baselCode: 'A3140', commonNames: ['ثنر', 'أسيتون', 'تولوين', 'زيلين', 'كحول صناعي', 'مذيب بويات', 'نفط أبيض', 'تربنتين'] },
      { name: 'أحماض وقلويات صناعية', code: 'CH-02', hazardLevel: 'high', wasteState: 'liquid', baselCode: 'A4090', commonNames: ['حمض كبريتيك', 'حمض هيدروكلوريك (روح الملح)', 'حمض نيتريك', 'صودا كاوية', 'بوتاس كاوية', 'ماء نار', 'حمض فوسفوريك'] },
      { name: 'مبيدات ومواد كيماوية زراعية', code: 'CH-03', hazardLevel: 'critical', wasteState: 'mixed', baselCode: 'A4030', commonNames: ['مبيد حشري', 'مبيد فطري', 'مبيد أعشاب', 'سموم فئران', 'أسمدة كيماوية منتهية', 'مبيدات منتهية الصلاحية'] },
      { name: 'زيوت محركات وهيدروليك مستعملة', code: 'CH-04', hazardLevel: 'medium', wasteState: 'liquid', baselCode: 'A3020', commonNames: ['زيت موتور مستعمل', 'زيت فتيس', 'زيت هيدروليك', 'زيت كمبروسر', 'زيت ترس', 'شحم أسود', 'زيت تبريد'] },
      { name: 'دهانات وطلاءات وورنيش', code: 'CH-05', hazardLevel: 'medium', wasteState: 'liquid', baselCode: 'A4070', commonNames: ['بوية زيت', 'بوية لاكيه', 'ورنيش', 'دوكو', 'إيبوكسي', 'بولي يوريثان', 'برايمر', 'أساس معدني', 'إسبراي بوية'] },
      { name: 'مواد لاصقة وراتنجات', code: 'CH-06', hazardLevel: 'medium', wasteState: 'semi_solid', commonNames: ['غراء صناعي', 'إيبوكسي لاصق', 'ريزن', 'سيليكون صناعي', 'لاصق PVC', 'صمغ قوي'] },
      { name: 'مخلفات مختبرات كيميائية', code: 'CH-07', hazardLevel: 'high', wasteState: 'mixed', commonNames: ['محاليل مختبرات', 'كواشف كيميائية', 'عينات تحليل', 'مواد كيمياء منتهية'] },
      { name: 'براميل وحاويات ملوثة كيميائياً', code: 'CH-08', hazardLevel: 'high', wasteState: 'solid', baselCode: 'A1160', commonNames: ['برميل كيماوي فاضي', 'جركن بوية', 'عبوة مبيد فارغة', 'تنك زيت ملوث', 'عبوات ثنر فارغة'] },
      { name: 'غازات مضغوطة وأسطوانات ملوثة', code: 'CH-09', hazardLevel: 'critical', wasteState: 'gas', commonNames: ['أنبوبة غاز تالفة', 'أسطوانة أكسجين', 'أسطوانة أستيلين', 'رشاشات إيروسول', 'طفاية حريق منتهية'] },
      { name: 'مخلفات تكرير البترول', code: 'CH-10', hazardLevel: 'high', wasteState: 'liquid', baselCode: 'A3190', commonNames: ['قطران', 'بتيومين ملوث', 'حمأة بترولية', 'مازوت ملوث', 'سولار ملوث'] },
      { name: 'مخلفات أحبار وطباعة صناعية', code: 'CH-11', hazardLevel: 'medium', wasteState: 'liquid', commonNames: ['حبر طباعة', 'حبر أوفست', 'حبر سلك سكرين', 'تونر مستعمل', 'مذيب طباعة'] },
      { name: 'مواد مؤكسدة ومواد كاوية', code: 'CH-12', hazardLevel: 'critical', wasteState: 'mixed', baselCode: 'A4140', commonNames: ['كلور مركز', 'ماء أكسجين صناعي', 'برمنجنات', 'بيروكسيد', 'مواد مبيضة صناعية'] },
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
      { name: 'بطاريات رصاص-حمض (سيارات)', code: 'EL-01', hazardLevel: 'high', wasteState: 'solid', baselCode: 'A1160', commonNames: ['بطارية عربية', 'بطارية جافة كبيرة', 'أكيوملاتور', 'بطارية UPS', 'بطارية جل'] },
      { name: 'بطاريات ليثيوم-أيون', code: 'EL-02', hazardLevel: 'high', wasteState: 'solid', commonNames: ['بطارية موبايل', 'بطارية لاب توب', 'بطارية باور بانك', 'بطارية سكوتر كهربائي', 'بطارية ساعة'] },
      { name: 'لوحات إلكترونية (PCB)', code: 'EL-03', hazardLevel: 'medium', wasteState: 'solid', baselCode: 'A1180', commonNames: ['بورد كمبيوتر', 'مذربورد', 'كارت شاشة', 'بورد موبايل', 'دوائر مطبوعة'] },
      { name: 'شاشات CRT ومصابيح فلورية', code: 'EL-04', hazardLevel: 'high', wasteState: 'solid', baselCode: 'A1030', commonNames: ['تلفزيون قديم', 'شاشة كمبيوتر CRT', 'لمبة نيون', 'لمبة فلورسنت', 'لمبة موفرة', 'لمبة LED تالفة'] },
      { name: 'حواسيب وأجهزة مكتبية', code: 'EL-05', hazardLevel: 'medium', wasteState: 'solid', commonNames: ['كمبيوتر ديسك توب', 'لاب توب تالف', 'سيرفر قديم', 'طابعة ليزر', 'سكانر', 'ماكينة تصوير'] },
      { name: 'هواتف وأجهزة اتصالات', code: 'EL-06', hazardLevel: 'medium', wasteState: 'solid', commonNames: ['موبايل تالف', 'تابلت', 'راوتر', 'سويتش شبكات', 'لاسلكي', 'سنترال تليفون'] },
      { name: 'طابعات وخراطيش حبر/تونر', code: 'EL-07', hazardLevel: 'medium', wasteState: 'solid', commonNames: ['كارتريدج حبر', 'كارتريدج تونر', 'درم طابعة', 'رأس طباعة', 'حبارة'] },
      { name: 'أجهزة تبريد وتكييف (فريون)', code: 'EL-08', hazardLevel: 'high', wasteState: 'solid', commonNames: ['تكييف تالف', 'ثلاجة قديمة', 'ديب فريزر', 'مبرد مياه', 'تشيلر', 'كمبروسر تكييف'] },
      { name: 'كابلات وأسلاك نحاسية معزولة', code: 'EL-09', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['سلك نحاس', 'كابل كهرباء', 'سلك شعر', 'كابل أرضي', 'سلك مجدول'] },
      { name: 'ألواح طاقة شمسية تالفة', code: 'EL-10', hazardLevel: 'medium', wasteState: 'solid', commonNames: ['لوح شمسي مكسور', 'خلية فوتوفولتية', 'بانل سولار تالف', 'إنفرتر تالف'] },
      { name: 'محولات كهربائية ومكثفات', code: 'EL-11', hazardLevel: 'high', wasteState: 'solid', baselCode: 'A1190', commonNames: ['محول كهرباء', 'ترانس', 'مكثف (كوندنسر)', 'موبينة', 'كونتاكتور تالف', 'قاطع كهرباء'] },
      { name: 'أجهزة منزلية كهربائية كبيرة', code: 'EL-12', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['غسالة تالفة', 'بوتاجاز', 'سخان كهرباء', 'ميكروويف', 'شفاط مطبخ', 'غسالة أطباق'] },
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
      { name: 'نفايات معدية (أكياس حمراء)', code: 'MD-01', hazardLevel: 'critical', wasteState: 'solid', baselCode: 'Y1', commonNames: ['أكياس حمراء', 'نفايات عزل', 'ضمادات ملوثة', 'قطن ملوث', 'شاش مستعمل'] },
      { name: 'أدوات حادة (إبر ومشارط)', code: 'MD-02', hazardLevel: 'critical', wasteState: 'solid', baselCode: 'Y1', commonNames: ['سرنجات مستعملة', 'إبر سرنجة', 'مشرط', 'أمبولات مكسورة', 'كانيولا', 'حاوية sharps'] },
      { name: 'أدوية ولقاحات منتهية الصلاحية', code: 'MD-03', hazardLevel: 'high', wasteState: 'mixed', baselCode: 'Y3', commonNames: ['أدوية منتهية', 'لقاحات فاسدة', 'أنسولين منتهي', 'مضاد حيوي منتهي', 'قطرات عيون منتهية'] },
      { name: 'نفايات العلاج الكيميائي (السيتوتوكسيك)', code: 'MD-04', hazardLevel: 'critical', wasteState: 'liquid', baselCode: 'Y3', commonNames: ['نفايات كيماوي', 'أدوية سرطان', 'محاليل علاج كيماوي', 'قفازات كيماوي ملوثة'] },
      { name: 'نفايات تشريحية وأعضاء', code: 'MD-05', hazardLevel: 'critical', wasteState: 'solid', commonNames: ['أعضاء بشرية', 'أنسجة جراحية', 'مشيمة', 'عينات تشريح'] },
      { name: 'أكياس دم ومشتقاته', code: 'MD-06', hazardLevel: 'high', wasteState: 'liquid', commonNames: ['أكياس دم منتهية', 'بلازما', 'صفائح دموية منتهية', 'أنابيب نقل دم'] },
      { name: 'مستلزمات طبية ملوثة', code: 'MD-07', hazardLevel: 'high', wasteState: 'solid', commonNames: ['قفازات طبية ملوثة', 'ماسكات N95 ملوثة', 'جاون عمليات', 'قسطرة مستعملة', 'درين جراحي'] },
      { name: 'نفايات مختبرات التحاليل', code: 'MD-08', hazardLevel: 'high', wasteState: 'mixed', commonNames: ['عينات دم', 'عينات بول', 'أطباق بتري', 'محاليل مختبر', 'شرائح ميكروسكوب'] },
      { name: 'نفايات صيدلانية ومواد تخدير', code: 'MD-09', hazardLevel: 'high', wasteState: 'mixed', baselCode: 'Y3', commonNames: ['مخدرات منتهية', 'مورفين منتهي', 'كيتامين', 'أدوية مراقبة منتهية'] },
      { name: 'مخلفات بيطرية', code: 'MD-10', hazardLevel: 'high', wasteState: 'mixed', commonNames: ['نفايات عيادة بيطرية', 'لقاحات حيوانية', 'أدوية بيطرية منتهية', 'أدوات جراحة حيوانات'] },
      { name: 'نفايات مشعة طبية', code: 'MD-11', hazardLevel: 'critical', wasteState: 'mixed', baselCode: 'Y5', commonNames: ['نفايات أشعة', 'يود مشع', 'مصادر مشعة طبية', 'محاليل نووية'] },
      { name: 'نفايات غسيل كلوي وأجهزة طبية', code: 'MD-12', hazardLevel: 'high', wasteState: 'mixed', commonNames: ['فلاتر غسيل كلوي', 'خطوط غسيل كلوي', 'أكياس محاليل ديلزة', 'أجهزة طبية تالفة'] },
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
      { name: 'حمأة صناعية سامة', code: 'IN-01', hazardLevel: 'critical', wasteState: 'semi_solid', baselCode: 'A4100', commonNames: ['طين صرف صناعي', 'حمأة معالجة', 'رواسب أحواض ترسيب', 'طمي ملوث'] },
      { name: 'مخلفات الدباغة والجلود', code: 'IN-02', hazardLevel: 'high', wasteState: 'liquid', baselCode: 'A4100', commonNames: ['مياه دباغة كروم', 'قصاصات جلد مدبوغ', 'سوائل دباغة', 'شعر وصوف ملوث'] },
      { name: 'مخلفات صناعة البتروكيماويات', code: 'IN-03', hazardLevel: 'critical', wasteState: 'liquid', commonNames: ['بقايا تقطير', 'بوليمرات تالفة', 'محفزات مستهلكة', 'مياه غسيل بتروكيماوية'] },
      { name: 'رماد وخبث أفران صناعية', code: 'IN-04', hazardLevel: 'high', wasteState: 'solid', baselCode: 'A2060', commonNames: ['خبث حديد', 'رماد أفران', 'حراريات مستعملة', 'طوب حراري تالف', 'بطانة فرن'] },
      { name: 'مخلفات الطلاء الكهربائي والمعالجة السطحية', code: 'IN-05', hazardLevel: 'high', wasteState: 'liquid', baselCode: 'A1120', commonNames: ['محاليل جلفنة', 'حمامات كروم', 'حمامات نيكل', 'حمامات زنك', 'مياه شطف معالجة'] },
      { name: 'مخلفات الأسبستوس (أميانت)', code: 'IN-06', hazardLevel: 'critical', wasteState: 'solid', baselCode: 'A2050', commonNames: ['ألواح أسبستوس', 'عوازل أميانت', 'مواسير أسبستوس', 'فرامل أسبستوس', 'حشوات أميانت'] },
      { name: 'حمأة معالجة مياه صناعية', code: 'IN-07', hazardLevel: 'high', wasteState: 'semi_solid', commonNames: ['طين محطة معالجة', 'رواسب مياه صرف', 'كيك فلتر بريس', 'حمأة بيولوجية'] },
      { name: 'فلاتر صناعية ملوثة', code: 'IN-08', hazardLevel: 'medium', wasteState: 'solid', commonNames: ['فلتر هواء صناعي', 'فلتر زيت', 'فلتر مياه صناعي', 'كربون نشط مستعمل', 'أكياس فلترة'] },
      { name: 'مخلفات تعدين ومعادن ثقيلة', code: 'IN-09', hazardLevel: 'high', wasteState: 'solid', baselCode: 'A1010', commonNames: ['غبار أفران', 'مخلفات تعدين', 'خامات مستنفدة', 'أتربة معادن ثقيلة'] },
      { name: 'مخلفات صناعة النسيج الملوثة', code: 'IN-10', hazardLevel: 'medium', wasteState: 'liquid', commonNames: ['مياه صباغة', 'أصباغ كيميائية', 'محاليل تبييض نسيج', 'مواد تثبيت ألوان', 'مياه غسيل نسيج ملوثة'] },
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
      { name: 'PET - بولي إيثيلين تريفثالات', code: 'PL-01', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['زجاجات مياه', 'زجاجات مشروبات غازية', 'عبوات زيت طعام بلاستيك', 'زجاجات عصير', 'قوارير بلاستيك شفافة', 'PET فلينات'] },
      { name: 'HDPE - بولي إيثيلين عالي الكثافة', code: 'PL-02', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['جرادل بلاستيك', 'خزانات مياه', 'عبوات شامبو', 'عبوات منظفات', 'ماسورة HDPE', 'صفائح بلاستيك سميكة', 'عبوات لبن', 'طبالي بلاستيك'] },
      { name: 'PVC - بولي فينيل كلوريد', code: 'PL-03', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['مواسير PVC', 'بروفيل شبابيك', 'كابلات PVC', 'أرضيات فينيل', 'خراطيم حدائق', 'أنابيب صرف'] },
      { name: 'LDPE - بولي إيثيلين منخفض الكثافة', code: 'PL-04', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['أكياس بلاستيك (شنط)', 'أكياس سوبر ماركت', 'بلاستيك تغليف (ستريتش)', 'نايلون زراعي', 'أكياس زبالة', 'بلاستيك فقاعات (ببل راب)', 'غطاء صوب'] },
      { name: 'PP - بولي بروبيلين', code: 'PL-05', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['علب طعام بلاستيك', 'أغطية زجاجات', 'عبوات زبادي', 'شنط منسوجة (خيش بلاستيك)', 'أنابيب PP', 'حبال بلاستيك', 'كراسي بلاستيك'] },
      { name: 'PS - بوليسترين (فوم)', code: 'PL-06', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['فوم تغليف (ستايروفوم)', 'أطباق فوم أكل', 'كوبايات فوم', 'عبوات حماية أجهزة', 'فوم عزل حراري', 'صواني لحوم فوم'] },
      { name: 'بلاستيك مختلط وأغشية تغليف', code: 'PL-07', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['بلاستيك مخلوط', 'أغلفة شيبسي', 'أكياس متعددة الطبقات', 'بلاستيك ألومنيوم (تتراباك)', 'أغشية تغليف ملونة'] },
      { name: 'مطاط وإطارات مستعملة', code: 'PL-08', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['كاوتش عربيات', 'كاوتش نقل', 'كاوتش موتوسيكل', 'جوانات مطاط', 'سيور مطاط', 'خراطيم مطاط', 'كاوتش فوركليفت', 'نعال أحذية'] },
      { name: 'بلاستيك صناعي وهندسي', code: 'PL-09', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['نايلون هندسي (PA)', 'بولي كربونيت (PC)', 'أكريليك (PMMA)', 'تفلون (PTFE)', 'POM', 'ABS', 'فيبر جلاس (غير خطر)'] },
    ],
  },
  {
    id: 'paper',
    name: 'مخلفات الورق والكرتون',
    description: 'الورق والكرتون بأنواعهما',
    wasteState: 'solid',
    category: 'non_hazardous',
    subcategories: [
      { name: 'ورق مكتبي أبيض', code: 'PA-01', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['ورق A4', 'ورق A3', 'ورق طابعة', 'ورق فوتوكوبي', 'ورق فلوسكاب', 'ورق أبيض نظيف'] },
      { name: 'صحف ومجلات ومطبوعات', code: 'PA-02', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['جرايد', 'مجلات', 'كتالوجات', 'فلايرز', 'بروشورات', 'ورق جرايد'] },
      { name: 'كرتون مموج (صناديق شحن)', code: 'PA-03', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['كراتين شحن', 'كراتين نقل', 'صناديق كرتون', 'كرتون دوبلكس', 'كرتون تريبلكس', 'كراتين أجهزة'] },
      { name: 'كرتون مضغوط وعلب', code: 'PA-04', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['علب كرتون (سريال/أحذية)', 'كرتون مضغوط', 'كرتون رمادي', 'أنابيب كرتون (رول)', 'كور كرتون'] },
      { name: 'أكياس ورقية وورق تغليف', code: 'PA-05', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['أكياس ورق بني (كرافت)', 'شنط ورقية', 'ورق تغليف هدايا', 'ورق لف سندوتشات', 'ورق كرافت'] },
      { name: 'ورق مشمع أو مغلف (غير قابل للتدوير)', code: 'PA-06', hazardLevel: 'low', wasteState: 'solid', recyclable: false, commonNames: ['ورق مشمع', 'ورق حراري (فواتير)', 'ورق لامع مغلف', 'ورق كربون', 'ورق فاكس', 'ورق استيكرز'] },
      { name: 'كتب ومستندات ووثائق قديمة', code: 'PA-07', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['كتب مدرسية', 'كراسات', 'ملفات مكتبية', 'أرشيف ورقي', 'سجلات قديمة', 'دفاتر'] },
      { name: 'ورق مقوى وأطباق ورقية', code: 'PA-08', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['أطباق ورقية', 'كوبايات ورقية', 'أطباق كيك ورق', 'ورق مقوى', 'ورق بريستول'] },
    ],
  },
  {
    id: 'metal',
    name: 'مخلفات المعادن والخردة',
    description: 'المعادن الحديدية وغير الحديدية',
    wasteState: 'solid',
    category: 'non_hazardous',
    subcategories: [
      { name: 'حديد وصلب (خردة حديد)', code: 'MT-01', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['حديد سكراب', 'قطع حديد', 'صاج حديد', 'حديد تسليح (سيخ)', 'مواسير حديد', 'زوايا حديد', 'كمر حديد', 'براميل حديد نظيفة', 'سلك رباط', 'مسامير'] },
      { name: 'ألومنيوم', code: 'MT-02', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['علب كانز (مشروبات)', 'ألومنيوم بروفيل (شبابيك)', 'ورق ألومنيوم (فويل)', 'أواني ألومنيوم', 'ألومنيوم مشغول', 'ألمنيوم سلك'] },
      { name: 'نحاس ونحاس أصفر', code: 'MT-03', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['نحاس أحمر', 'نحاس أصفر (brass)', 'سلك نحاس', 'مواسير نحاس تكييف', 'حنفيات نحاس', 'موتور نحاس', 'نحاس خردة'] },
      { name: 'ستانلس ستيل (فولاذ مقاوم للصدأ)', code: 'MT-04', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['ستانلس 304', 'ستانلس 316', 'أواني ستانلس', 'درابزين ستانلس', 'حوض ستانلس', 'ستانلس طبي'] },
      { name: 'خردة معدنية مختلطة', code: 'MT-05', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['سكراب مخلوط', 'خردة مختلطة', 'معادن متنوعة', 'قطع غيار معدنية تالفة'] },
      { name: 'براميل وحاويات معدنية نظيفة', code: 'MT-06', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['برميل حديد نظيف', 'جراكن معدنية نظيفة', 'علب صفيح (تنك)', 'عبوات معدنية فارغة نظيفة'] },
      { name: 'أنابيب وهياكل معدنية', code: 'MT-07', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['مواسير صلب', 'مواسير جلفنة', 'هياكل معدنية', 'تريلا خردة', 'هيكل عربية', 'شاسيه'] },
      { name: 'زنك وقصدير ورصاص (غير ملوث)', code: 'MT-08', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['صاج مجلفن (زنك)', 'قصدير لحام', 'رصاص خردة', 'ألواح زنك', 'صفيح معلبات'] },
    ],
  },
  {
    id: 'glass',
    name: 'مخلفات الزجاج',
    description: 'الزجاج بألوانه وأنواعه المختلفة',
    wasteState: 'solid',
    category: 'non_hazardous',
    subcategories: [
      { name: 'زجاج شفاف (عبوات وقوارير)', code: 'GL-01', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['قوارير مياه زجاج', 'برطمانات', 'زجاجات عصير', 'عبوات عطور', 'زجاج شفاف نظيف'] },
      { name: 'زجاج ملون (أخضر/بني/أزرق)', code: 'GL-02', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['زجاجات بيرة', 'زجاجات دواء بني', 'زجاج أخضر', 'زجاج كوبالت أزرق'] },
      { name: 'زجاج مسطح (نوافذ ومرايا)', code: 'GL-03', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['زجاج شبابيك', 'مرايا مكسورة', 'زجاج سيكوريت', 'زجاج واجهات', 'زجاج سيارات', 'دبل جلاس'] },
      { name: 'زجاج مختلط', code: 'GL-04', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['كسر زجاج (ازاز)', 'زجاج مخلوط', 'كسر كريستال', 'أواني زجاجية مكسورة', 'ثريات زجاج'] },
      { name: 'زجاج تقني ومقاوم للحرارة', code: 'GL-05', hazardLevel: 'low', wasteState: 'solid', recyclable: false, commonNames: ['بايركس', 'زجاج مختبرات', 'زجاج فرن', 'زجاج بوروسيليكات', 'أنابيب اختبار زجاج'] },
    ],
  },
  {
    id: 'organic',
    name: 'مخلفات عضوية وغذائية وزراعية وأخشاب',
    description: 'المخلفات العضوية القابلة للتحلل والتسميد - غذائية وزراعية وأخشاب',
    wasteState: 'solid',
    category: 'non_hazardous',
    legalReference: 'قانون 202/2020 - المادة 22',
    subcategories: [
      { name: 'مخلفات طعام (مطاعم وفنادق)', code: 'OR-01', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['بقايا أكل', 'فضلات مطبخ', 'بواقي طعام فنادق', 'زيت طعام مستعمل', 'بواقي خبز', 'تفل قهوة/شاي'] },
      { name: 'مخلفات أسواق وخضار وفاكهة', code: 'OR-02', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['خضار تالف', 'فاكهة تالفة', 'قشر بطاطس', 'ورق خس', 'بقايا سوق', 'فاكهة مهروسة'] },
      { name: 'مخلفات حدائق وتقليم أشجار', code: 'OR-03', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['فروع أشجار', 'ورق شجر', 'نجيلة مقصوصة', 'تقليم نخيل', 'جريد نخل', 'سعف نخيل', 'أعشاب محشوشة'] },
      { name: 'أخشاب نظيفة وبالتات', code: 'OR-04', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: [
        'بالتات خشب (طبالي)', 'بالتات يوروبالت', 'صناديق خشب', 'خشب موسكي', 'خشب سويدي',
        'خشب زان', 'خشب عزيزي', 'خشب أرو (بلوط)', 'خشب تيك', 'خشب جوز',
        'خشب كونتر (ألواح حبيبية)', 'أبلكاش (خشب رقائقي)', 'MDF (ألياف متوسطة الكثافة)', 'HDF',
        'خشب لاتيه', 'خشب لتزانيلو', 'فورميكا',
        'نشارة خشب', 'رايش خشب', 'برادة خشب', 'قطع خشب متبقية (تريم)',
        'أبواب خشب قديمة', 'شبابيك خشب', 'أثاث خشب تالف', 'دواليب خشب',
        'سرير خشب', 'طاولات خشب', 'كراسي خشب', 'أرضيات باركيه',
        'خشب أسقف', 'عوارض خشبية', 'ألواح خشب مستعملة'
      ]},
      { name: 'مخلفات محاصيل زراعية', code: 'OR-05', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['قش أرز', 'حطب ذرة', 'حطب قطن', 'قش قمح', 'عروش بطاطس', 'بقايا قصب سكر (باجاس)', 'تبن', 'سيلاج تالف'] },
      { name: 'مخلفات تصنيع غذائي', code: 'OR-06', hazardLevel: 'low', wasteState: 'mixed', recyclable: true, commonNames: ['تفل بنجر', 'كسب بذور', 'مولاس', 'بقايا مذابح (ريش/أحشاء)', 'قشور بيض', 'بقايا مصانع أغذية', 'عظام حيوانات'] },
      { name: 'منسوجات طبيعية', code: 'OR-07', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['قطن خام', 'كتان', 'صوف', 'حرير طبيعي', 'جوت (خيش)', 'ليف نخيل', 'حبال طبيعية'] },
      { name: 'سماد عضوي وروث حيواني', code: 'OR-08', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['سماد بلدي', 'روث أبقار', 'زرق دواجن', 'سبلة خيل', 'كمبوست', 'فيرمي كمبوست'] },
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
      { name: 'خرسانة وطوب وبلوكات', code: 'CN-01', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['كسر خرسانة', 'طوب أحمر مكسور', 'بلوكات أسمنت', 'طوب طفلي', 'طوب أسمنتي', 'خرسانة مسلحة'] },
      { name: 'أخشاب إنشائية وقوالب', code: 'CN-02', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['خشب عمل (فورم ورك)', 'قوالب خشب خرسانة', 'عروق خشب', 'ألواح لتزانيلو إنشائية', 'شدات خشبية', 'سقالات خشب'] },
      { name: 'بلاط وسيراميك ورخام', code: 'CN-03', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['كسر سيراميك', 'كسر بورسلين', 'كسر رخام', 'كسر جرانيت', 'موزاييك مكسور', 'تيرازو', 'بلاط أسمنتي قديم'] },
      { name: 'حديد تسليح ومعادن إنشائية', code: 'CN-04', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['سيخ حديد تسليح', 'حديد تسليح مستعمل', 'كانات حديد', 'شبك حديد', 'حديد زهر'] },
      { name: 'ردم وأتربة ورمال', code: 'CN-05', hazardLevel: 'low', wasteState: 'solid', recyclable: false, commonNames: ['ردم حفر', 'أتربة ناعمة', 'رمل مستعمل', 'زلط مستعمل', 'تربة حفريات', 'طمي'] },
      { name: 'أنابيب ومواسير', code: 'CN-06', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['مواسير PVC صرف', 'مواسير حديد', 'مواسير PPR', 'مواسير فخار', 'مجاري صرف', 'بالوعات'] },
      { name: 'مواد عزل وأسقف', code: 'CN-07', hazardLevel: 'low', wasteState: 'solid', recyclable: false, commonNames: ['عزل فوم', 'رولات بيتومين', 'عزل مائي', 'صوف صخري', 'ألواح جبس بورد', 'أسقف معلقة تالفة', 'ألواح ساندوتش بانل'] },
    ],
  },
  {
    id: 'textile',
    name: 'مخلفات نسيج وملابس وجلود',
    description: 'مخلفات صناعة النسيج والملابس والجلود غير الملوثة',
    wasteState: 'solid',
    category: 'non_hazardous',
    subcategories: [
      { name: 'ملابس وأقمشة مستعملة', code: 'TX-01', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['هدوم مستعملة', 'ملابس بالة', 'أقمشة مستعملة', 'ستائر قديمة', 'مفارش', 'بطانيات', 'مناشف', 'فوط'] },
      { name: 'قصاصات وبقايا تصنيع نسيج', code: 'TX-02', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['دوبارة', 'تريكو', 'قصاصات قماش', 'بقايا تفصيل', 'خرق قماش', 'قصاقيص', 'رقع قماش'] },
      { name: 'جلود طبيعية وصناعية (غير ملوثة)', code: 'TX-03', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['جلد طبيعي مستعمل', 'جلد صناعي (سكاي)', 'بقايا ورش جزم', 'قصاصات جلد', 'أحزمة جلد تالفة', 'شنط جلد تالفة'] },
      { name: 'سجاد وموكيت وبطانيات', code: 'TX-04', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['سجاد قديم', 'موكيت مستعمل', 'بطاطين قديمة', 'كليم', 'حصير', 'سجاد حائط'] },
      { name: 'خيوط وحبال ومنسوجات صناعية', code: 'TX-05', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['خيوط نسيج', 'حبال نايلون', 'شباك صيد', 'أشرطة نسيج', 'أحزمة ناقلة نسيج', 'شنط منسوجة (شوالات)'] },
      { name: 'أحذية وحقائب تالفة', code: 'TX-06', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['جزم تالفة', 'شباشب', 'صنادل', 'شنط مدرسة', 'شنط سفر تالفة', 'محافظ تالفة'] },
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
  organic: 'عضوي/غذائي/زراعي/أخشاب',
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

/**
 * البحث في المسميات الشائعة - يبحث في أسماء الأصناف والمسميات الشائعة
 */
export const searchWasteByCommonName = (query: string): Array<WasteSubcategory & { categoryId: string; categoryName: string }> => {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  
  const results: Array<WasteSubcategory & { categoryId: string; categoryName: string }> = [];
  
  for (const category of getAllWasteCategories()) {
    for (const sub of category.subcategories) {
      const nameMatch = sub.name.toLowerCase().includes(q);
      const commonMatch = sub.commonNames?.some(cn => cn.toLowerCase().includes(q));
      
      if (nameMatch || commonMatch) {
        results.push({
          ...sub,
          categoryId: category.id,
          categoryName: category.name,
        });
      }
    }
  }
  
  return results;
};

/**
 * الكشف التلقائي عن الصنف الفرعي من الوصف الحر
 */
export const detectSubcategoryFromDescription = (description: string): { category: WasteCategoryInfo; subcategory: WasteSubcategory } | null => {
  const desc = description.toLowerCase().trim();
  if (!desc) return null;
  
  for (const category of getAllWasteCategories()) {
    for (const sub of category.subcategories) {
      // Check common names first (more specific)
      if (sub.commonNames?.some(cn => desc.includes(cn.toLowerCase()))) {
        return { category, subcategory: sub };
      }
    }
  }
  
  // Fallback to main category detection
  return null;
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
