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
import { extendedWasteTypes, TOTAL_WASTE_TYPES } from './extendedWasteTypes';

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
  // غير خطرة صلبة
  { id: 'organic', name: 'أخشاب ومواد عضوية', nameShort: 'عضوي/خشب', code: 'WD', isHazardous: false, keywords: ['خشب', 'اخشاب', 'بالت', 'بالتات', 'كونتر', 'حبيبي', 'صندوق', 'mdf', 'hdf', 'عضوي', 'طعام', 'زراعي', 'موسكي', 'ابلكاش', 'خشب زان', 'خشب سويد', 'لتزانيلو', 'تيك', 'نشارة', 'باركيه', 'فورميكا', 'لاتيه', 'كسر خشب', 'أثاث خشب', 'طبالي', 'خشب كسر', 'رايش'] },
  { id: 'plastic', name: 'بلاستيك ومطاط', nameShort: 'بلاستيك', code: 'PL', isHazardous: false, keywords: ['بلاستيك', 'plastic', 'pet', 'hdpe', 'pvc', 'نايلون', 'اكياس', 'عبوات', 'مطاط', 'كاوتش', 'إطار', 'شنطة', 'جردل', 'خرطوم', 'فيبر جلاس'] },
  { id: 'paper', name: 'ورق وكرتون', nameShort: 'ورق', code: 'PA', isHazardous: false, keywords: ['ورق', 'كرتون', 'paper', 'cardboard', 'كراتين', 'علب', 'دشت', 'رول', 'ورق فلوسكاب'] },
  { id: 'metal', name: 'معادن وخردة', nameShort: 'معادن', code: 'MT', isHazardous: false, keywords: ['معدن', 'حديد', 'ألومنيوم', 'نحاس', 'ستانلس', 'خردة', 'سكراب', 'زنك', 'رصاص', 'تنك', 'صاج', 'سلك', 'مسمار'] },
  { id: 'glass', name: 'زجاج', nameShort: 'زجاج', code: 'GL', isHazardous: false, keywords: ['زجاج', 'glass', 'قوارير', 'زجاجات', 'كسر زجاج', 'ازاز'] },
  { id: 'construction', name: 'مخلفات بناء وهدم', nameShort: 'بناء', code: 'CN', isHazardous: false, keywords: ['بناء', 'هدم', 'خرسانة', 'طوب', 'بلاط', 'سيراميك', 'ردم', 'أتربة', 'رمل', 'زلط', 'أسمنت'] },
  { id: 'other', name: 'مخلفات متنوعة', nameShort: 'متنوع', code: 'OT', isHazardous: false, keywords: ['متنوع', 'مختلط', 'اخرى', 'قماش', 'اثاث', 'نسيج', 'جلود'] },
  // غير خطرة سائلة
  { id: 'liquid_non_hazardous', name: 'مخلفات سائلة غير خطرة', nameShort: 'سوائل غ.خ', code: 'LQ', isHazardous: false, keywords: ['مياه صرف', 'مياه غسيل', 'بنتونيت', 'زيوت طعام', 'مياه عكرة', 'عصائر', 'مرتجعات سائلة', 'سوائل غذائية', 'مياه تطهير'] },
  // غير خطرة - بلدية وفندقية
  { id: 'municipal', name: 'مخلفات بلدية ومختلطة', nameShort: 'بلدية', code: 'MU', isHazardous: false, keywords: ['بلدي', 'بلدية', 'قمامة', 'مخلفات منازل', 'فنادق', 'يخوت', 'مراكب', 'سفن', 'RDF', 'وقود بديل'] },
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
      { name: 'رماد المحارق الطبية', code: 'MD-13', hazardLevel: 'high', wasteState: 'solid', commonNames: ['رماد محارق طبية', 'رماد حرق نفايات طبية', 'مخلفات محارق مستشفيات', 'رماد أفران طبية'] },
      { name: 'نواتج فرم وتعقيم النفايات الطبية', code: 'MD-14', hazardLevel: 'high', wasteState: 'solid', commonNames: ['نواتج فرم طبي', 'نفايات طبية مفرومة ومعقمة', 'مخرجات أوتوكلاف', 'نواتج تعقيم نفايات طبية'] },
      { name: 'جيف الحيوانات وأنسجة التجارب والمسحات الملوثة', code: 'MD-15', hazardLevel: 'critical', wasteState: 'solid', commonNames: ['جيف حيوانات تجارب', 'أنسجة حيوانات ملوثة', 'مسحات ملوثة بيولوجياً', 'حيوانات تجارب ميتة'] },
      { name: 'حاويات وأسطوانات مضغوطة طبية', code: 'MD-16', hazardLevel: 'high', wasteState: 'solid', commonNames: ['حاويات مضغوطة طبية', 'أسطوانات غاز طبية تالفة', 'إيروسولات طبية', 'بخاخات طبية فارغة'] },
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
      { name: 'مخلفات البنتونيت الخطر المخلوط بزيوت وشحوم', code: 'IN-11', hazardLevel: 'high', wasteState: 'semi_solid', commonNames: ['بنتونيت ملوث', 'طين حفر ملوث بزيوت', 'بنتونيت مخلوط بشحوم'] },
      { name: 'الطفلة الزيتية من مواقع البترول', code: 'IN-12', hazardLevel: 'high', wasteState: 'semi_solid', commonNames: ['طفلة زيتية', 'طفلة بترولية', 'حمأة ناتجة عن معالجة المياه المصاحبة'] },
      { name: 'الحمأة الجلفانية', code: 'IN-13', hazardLevel: 'critical', wasteState: 'semi_solid', commonNames: ['حمأة جلفانية', 'رواسب جلفنة', 'حمأة معالجة سطحية'] },
      { name: 'النفايات الفلزية والمعدنية الخطرة', code: 'IN-14', hazardLevel: 'high', wasteState: 'solid', commonNames: ['نفايات فلزية خطرة', 'أنتيمون', 'زرنيخ', 'بريليوم', 'كادميوم', 'رصاص', 'زئبق', 'تاليوم', 'سلينيوم', 'كروم سداسي'] },
      { name: 'نفايات الجبس الناجمة عن العمليات الصناعية الملوثة', code: 'IN-15', hazardLevel: 'medium', wasteState: 'solid', commonNames: ['جبس صناعي ملوث', 'فوسفوجبس', 'جبس ملوث بعناصر خطرة'] },
      { name: 'المخلفات البترولية الصلبة', code: 'IN-16', hazardLevel: 'high', wasteState: 'solid', commonNames: ['مخلفات بترولية صلبة', 'كوك بترولي ملوث', 'بقايا تكرير صلبة'] },
      { name: 'حرق أسلاك النحاس المعزولة', code: 'IN-17', hazardLevel: 'high', wasteState: 'solid', commonNames: ['رماد حرق أسلاك', 'نواتج حرق كابلات', 'أسلاك نحاس محروقة'] },
      { name: 'كسر أقطاب الجرافيت', code: 'IN-18', hazardLevel: 'medium', wasteState: 'solid', commonNames: ['أقطاب جرافيت', 'كسر جرافيت', 'إلكترودات جرافيت مستهلكة', 'جرافيت أفران كهربائية'] },
      { name: 'أخشاب ملوثة بالكيماويات أو الزيوت', code: 'IN-19', hazardLevel: 'high', wasteState: 'solid', commonNames: ['أخشاب ملوثة', 'خشب ملوث بزيوت', 'خشب ملوث بكيماويات', 'أخشاب معالجة كيميائياً', 'خشب CCA'] },
      { name: 'تراب التبيض وطين ترشيح الزيوت', code: 'IN-20', hazardLevel: 'high', wasteState: 'semi_solid', commonNames: ['تراب تبيض', 'تراب تبيض زيوت طعام', 'طين ترشيح زيوت معدنية', 'أتربة فلاتر زيوت', 'تراب بليتشنج'] },
      { name: 'رمال المسابك والأتربة والرمال الملوثة', code: 'IN-21', hazardLevel: 'high', wasteState: 'solid', commonNames: ['رمال مسابك', 'رمال سباكة', 'أتربة ملوثة', 'رمال ملوثة بمعادن ثقيلة', 'رمال قوالب صب'] },
      { name: 'مخلفات المزارع والمجازر والسلخنات الخطرة', code: 'IN-22', hazardLevel: 'high', wasteState: 'mixed', commonNames: ['مخلفات مجازر ملوثة', 'مخلفات سلخنات خطرة', 'دماء مجازر', 'محتويات كرش ملوثة', 'جيف حيوانات نافقة'] },
      { name: 'الكربون المنشط المستهلك', code: 'IN-23', hazardLevel: 'medium', wasteState: 'solid', commonNames: ['كربون نشط مستهلك', 'كربون منشط تالف', 'فحم نشط مستعمل', 'كربون فلاتر مستهلك'] },
      { name: 'شكائر بولي إيثيلين مستهلكة ملوثة', code: 'IN-24', hazardLevel: 'medium', wasteState: 'solid', commonNames: ['شكائر ملوثة', 'أكياس بولي إيثيلين ملوثة', 'شكائر كيماويات فارغة', 'عبوات بلاستيك ملوثة كيميائياً'] },
      { name: 'مواسير بلاستيكية تالفة ملوثة', code: 'IN-25', hazardLevel: 'medium', wasteState: 'solid', commonNames: ['مواسير بلاستيك ملوثة', 'أنابيب PVC ملوثة كيميائياً', 'مواسير صرف صناعي تالفة'] },
      { name: 'مستلزمات المطابع المستهلكة الملوثة', code: 'IN-26', hazardLevel: 'medium', wasteState: 'solid', commonNames: ['بلنكتات أوفست ملوثة', 'رولات طباعة ملوثة', 'فلاتر طباعة', 'لوازم مطابع ملوثة بأحبار'] },
    ],
  },
  // ============================================
  // المخلفات السائلة الخطرة — مستخرجة من وثائق التصنيف الرسمية
  // ============================================
  {
    id: 'hazardous_liquid',
    name: 'المخلفات السائلة الخطرة',
    description: 'السوائل الخطرة والملوثة بمواد كيميائية أو بترولية أو معادن ثقيلة',
    wasteState: 'liquid',
    category: 'hazardous',
    legalReference: 'قانون 202/2020 - الباب الرابع + اتفاقية بازل',
    subcategories: [
      { name: 'الزيوت المعدنية المُستهلكة', code: 'HL-01', hazardLevel: 'high', wasteState: 'liquid', baselCode: 'A3020', commonNames: ['زيوت معدنية مستهلكة', 'زيوت محركات مستعملة', 'زيوت هيدروليك مستعملة', 'زيوت ترس مستعملة'] },
      { name: 'المياه المُصاحبة الناتجة عن إنتاج النفط والغاز', code: 'HL-02', hazardLevel: 'high', wasteState: 'liquid', commonNames: ['مياه مصاحبة بترول', 'مياه إنتاج نفط', 'مياه آبار بترول'] },
      { name: 'مياه الصرف الصحي والصناعي الملوثة', code: 'HL-03', hazardLevel: 'high', wasteState: 'liquid', commonNames: ['مياه صرف صناعي ملوث', 'مياه صرف مصانع', 'مياه ملوثة بمعادن ثقيلة'] },
      { name: 'المخلفات السائلة لتنظيف تنكات وصهاريج البترول', code: 'HL-04', hazardLevel: 'high', wasteState: 'liquid', commonNames: ['مخلفات تنظيف تنكات', 'مياه غسيل صهاريج', 'مخلفات غسيل ناقلات بترول'] },
      { name: 'مخلفات الزيوت والشحوم ونواتج التنظيف وإزالة الشحوم وصيانة الماكينات', code: 'HL-05', hazardLevel: 'medium', wasteState: 'liquid', commonNames: ['زيوت صيانة ملوثة', 'مخلفات إزالة شحوم', 'سوائل تنظيف صناعي ملوثة'] },
      { name: 'مخلفات السوائل الحمضية والقاعدية', code: 'HL-06', hazardLevel: 'high', wasteState: 'liquid', baselCode: 'A4090', commonNames: ['أحماض مستعملة', 'قلويات مستعملة', 'محاليل حمضية صناعية', 'سوائل قاعدية مستعملة'] },
      { name: 'مخلفات العصائر والمركزات المنتهية الملوثة', code: 'HL-07', hazardLevel: 'medium', wasteState: 'liquid', commonNames: ['عصائر ملوثة بمواد خطرة', 'سوائل غذائية ملوثة', 'مركزات منتهية ملوثة'] },
      { name: 'مخلفات المذيبات العضوية والدهانات السائلة', code: 'HL-08', hazardLevel: 'high', wasteState: 'liquid', baselCode: 'A3140', commonNames: ['مذيبات مستعملة', 'ثنر مستعمل', 'دهانات سائلة تالفة', 'بويات سائلة ملوثة'] },
      { name: 'مخلفات صناعة الأسمدة والمبيدات السائلة', code: 'HL-09', hazardLevel: 'critical', wasteState: 'liquid', commonNames: ['مبيدات سائلة منتهية', 'أسمدة سائلة تالفة', 'مخلفات مصانع أسمدة', 'مبيدات محظورة'] },
      { name: 'المياه الملوثة المستخدمة في صناعة البطاريات', code: 'HL-10', hazardLevel: 'high', wasteState: 'liquid', commonNames: ['مياه بطاريات ملوثة', 'حمض بطاريات مستعمل', 'مياه غسيل بطاريات'] },
      { name: 'مخلفات المذيبات العضوية والمخلفات غير العضوية السائلة', code: 'HL-11', hazardLevel: 'high', wasteState: 'liquid', commonNames: ['مذيبات عضوية مختلطة', 'سوائل كيميائية مختلطة', 'مياه غسيل سيراميك وبورسلين ملوثة'] },
      { name: 'مخلفات الأصباغ السائلة والمخلوطة بمياه الصرف الصناعي', code: 'HL-12', hazardLevel: 'high', wasteState: 'liquid', commonNames: ['أصباغ سائلة ملوثة', 'مياه صباغة صناعية', 'مخلفات ورنيش سائلة', 'مواد لاصقة سائلة ملوثة'] },
      { name: 'نفايات المحاليل السائلة الناتجة عن تنقية النحاس بالتحليل الكهربائي', code: 'HL-13', hazardLevel: 'high', wasteState: 'liquid', commonNames: ['محاليل تحليل كهربائي', 'نفايات تنقية نحاس', 'محاليل إلكتروليت مستعملة'] },
      { name: 'المحاليل الأكالة المستعملة', code: 'HL-14', hazardLevel: 'critical', wasteState: 'liquid', commonNames: ['محاليل أكالة', 'محاليل إتش', 'محاليل حمضية أكالة', 'محاليل نحاس مذاب'] },
      { name: 'المذيبات الهالوجينية المستعملة', code: 'HL-15', hazardLevel: 'critical', wasteState: 'liquid', baselCode: 'A3150', commonNames: ['مذيبات هالوجينية', 'ثلاثي كلورو الإيثلين', 'رباعي كلورو الإيثلين', 'كلوروفورم مستعمل', 'ثنائي كلورو ميثان'] },
      { name: 'الجاروسايت والهيماتيت ونواتج معالجة الزنك', code: 'HL-16', hazardLevel: 'high', wasteState: 'semi_solid', commonNames: ['جاروسايت', 'هيماتيت', 'jarosite', 'hematite', 'مخلفات معالجة زنك', 'غبار زنك', 'حمأة زنك'] },
      { name: 'مخلفات غسيل وتشريح معالجة الزنك والمعادن', code: 'HL-17', hazardLevel: 'high', wasteState: 'liquid', commonNames: ['مخلفات تشريح زنك', 'مياه غسيل معالجة معادن', 'محاليل إذابة معادن', 'سوائل حمضية لتنقية معادن'] },
      { name: 'الزيوت المحتوية على ثنائي الفينيل متعدد الكلور (PCBs)', code: 'HL-18', hazardLevel: 'critical', wasteState: 'liquid', baselCode: 'A3180', commonNames: ['زيوت PCBs', 'زيوت محولات ملوثة', 'ثنائي فينيل متعدد الكلور', 'زيوت عازلة ملوثة PCB'] },
      { name: 'مخلفات الأصباغ والدهانات والورنيش واللاصقات واللحام السائلة', code: 'HL-19', hazardLevel: 'high', wasteState: 'liquid', commonNames: ['أصباغ سائلة خطرة', 'دهانات سائلة ملوثة', 'ورنيش سائل تالف', 'مواد لاصقة سائلة خطرة', 'مواد لحام سائلة'] },
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
      // ===== PET =====
      { name: 'PET - بولي إيثيلين تريفثالات', code: 'PL-01', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['زجاجات مياه', 'زجاجات مشروبات غازية', 'عبوات زيت طعام بلاستيك', 'زجاجات عصير', 'قوارير بلاستيك شفافة', 'PET فلينات'] },
      { name: 'PET كسر ومطحون', code: 'PL-01A', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['كسر PET', 'رقائق PET (فليكس)', 'PET مطحون', 'حبيبات PET معاد تدوير', 'بالات PET مضغوطة'] },
      // ===== HDPE =====
      { name: 'HDPE - بولي إيثيلين عالي الكثافة', code: 'PL-02', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['جرادل بلاستيك', 'خزانات مياه', 'عبوات شامبو', 'عبوات منظفات', 'ماسورة HDPE', 'صفائح بلاستيك سميكة', 'عبوات لبن', 'طبالي بلاستيك'] },
      { name: 'HDPE مطحون ومعاد تدوير', code: 'PL-02A', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['HDPE مطحون', 'حبيبات HDPE', 'HDPE كسر', 'خرطوم HDPE كسر', 'جرادل HDPE كسر'] },
      // ===== PVC =====
      { name: 'PVC - بولي فينيل كلوريد', code: 'PL-03', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['مواسير PVC', 'بروفيل شبابيك PVC', 'كابلات PVC', 'أرضيات فينيل', 'خراطيم حدائق', 'أنابيب صرف PVC'] },
      { name: 'PVC كسر ومواسير', code: 'PL-03A', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['كسر مواسير PVC', 'PVC مطحون', 'بروفيل PVC كسر', 'قطع PVC', 'PVC رجيع'] },
      // ===== LDPE =====
      { name: 'LDPE - أكياس وأغشية', code: 'PL-04', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['أكياس بلاستيك (شنط)', 'أكياس سوبر ماركت', 'بلاستيك تغليف (ستريتش)', 'أكياس زبالة', 'بلاستيك فقاعات (ببل راب)'] },
      { name: 'نايلون زراعي وصوب', code: 'PL-04A', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['نايلون زراعي', 'غطاء صوب', 'ملش زراعي', 'نايلون ري', 'نايلون تغطية أرض', 'أغشية بيوت محمية'] },
      { name: 'ستريتش وأغلفة صناعية', code: 'PL-04B', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['ستريتش فيلم', 'شرنك', 'أغلفة بالتات', 'نايلون تغليف صناعي', 'أكياس شحن كبيرة', 'بيج باج (أكياس طن)'] },
      // ===== PP =====
      { name: 'PP - بولي بروبيلين', code: 'PL-05', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['علب طعام بلاستيك', 'أغطية زجاجات', 'عبوات زبادي', 'أنابيب PP', 'كراسي بلاستيك'] },
      { name: 'شنط وخيش بلاستيك (PP منسوج)', code: 'PL-05A', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['شنط منسوجة (خيش بلاستيك)', 'شوالات', 'أكياس سكر', 'أكياس أسمنت بلاستيك', 'أكياس أعلاف', 'أكياس أرز PP', 'حبال بلاستيك PP'] },
      // ===== PS / فوم =====
      { name: 'PS - بوليسترين (فوم)', code: 'PL-06', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['فوم تغليف (ستايروفوم)', 'أطباق فوم أكل', 'كوبايات فوم', 'عبوات حماية أجهزة', 'صواني لحوم فوم'] },
      { name: 'فوم عزل (XPS/EPS)', code: 'PL-06A', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['فوم عزل حراري', 'ألواح فوم أسقف', 'فوم أرضيات', 'EPS عزل', 'XPS ألواح', 'فوم بلوكات بناء'] },
      // ===== بلاستيك مختلط =====
      { name: 'بلاستيك مختلط وأغشية تغليف', code: 'PL-07', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['بلاستيك مخلوط', 'أغلفة شيبسي', 'أكياس متعددة الطبقات', 'بلاستيك ألومنيوم (تتراباك)', 'أغشية تغليف ملونة'] },
      { name: 'عبوات بلاستيك كبيرة (IBC/براميل)', code: 'PL-07A', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['تنك بلاستيك IBC', 'برميل بلاستيك 200 لتر', 'جركن بلاستيك 20 لتر', 'عبوات كيماوية فارغة نظيفة', 'خزان IBC مستعمل'] },
      // ===== مطاط =====
      { name: 'إطارات سيارات ونقل', code: 'PL-08', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['كاوتش عربيات', 'كاوتش نقل', 'كاوتش موتوسيكل', 'كاوتش فوركليفت', 'كاوتش لودر', 'إطارات مستعملة'] },
      { name: 'مطاط صناعي وسيور وجوانات', code: 'PL-08A', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['جوانات مطاط', 'سيور مطاط', 'خراطيم مطاط', 'مطاط إسفنجي', 'سيور ناقلة مطاط', 'حشوات مطاط', 'مطاط كسر', 'نعال أحذية مطاط'] },
      { name: 'مطاط مطحون وحبيبات', code: 'PL-08B', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['حبيبات كاوتش', 'مطاط مطحون (كرمب رابر)', 'بودرة كاوتش', 'ملاعب مطاط', 'أرضيات مطاطية كسر'] },
      // ===== بلاستيك هندسي =====
      { name: 'بلاستيك صناعي وهندسي', code: 'PL-09', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['نايلون هندسي (PA)', 'بولي كربونيت (PC)', 'أكريليك (PMMA)', 'تفلون (PTFE)', 'POM', 'ABS', 'فيبر جلاس (غير خطر)'] },
      { name: 'أكريليك وبولي كربونيت ألواح', code: 'PL-09A', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['ألواح أكريليك كسر', 'بولي كربونيت كسر', 'لوحات إعلانية أكريليك', 'حروف مضيئة أكريليك', 'ألواح شفافة PC'] },
    ],
  },
  {
    id: 'paper',
    name: 'مخلفات الورق والكرتون',
    description: 'الورق والكرتون بأنواعهما',
    wasteState: 'solid',
    category: 'non_hazardous',
    subcategories: [
      // ===== ورق أبيض =====
      { name: 'ورق مكتبي أبيض', code: 'PA-01', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['ورق A4', 'ورق A3', 'ورق طابعة', 'ورق فوتوكوبي', 'ورق فلوسكاب', 'ورق أبيض نظيف'] },
      { name: 'ورق مكتبي ملون ومختلط', code: 'PA-01A', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['ورق ملون', 'ورق مكتبي مخلوط', 'ورق ملاحظات', 'ورق مسودات', 'ورق فاكسات'] },
      // ===== صحف ومطبوعات =====
      { name: 'صحف ومجلات', code: 'PA-02', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['جرايد', 'مجلات', 'ورق جرايد', 'جرائد قديمة'] },
      { name: 'مطبوعات تجارية ودعائية', code: 'PA-02A', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['كتالوجات', 'فلايرز', 'بروشورات', 'ملصقات دعائية', 'منيوهات مطاعم', 'كروت بزنس'] },
      // ===== كرتون =====
      { name: 'كرتون مموج (صناديق شحن)', code: 'PA-03', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['كراتين شحن', 'كراتين نقل', 'صناديق كرتون', 'كرتون دوبلكس', 'كرتون تريبلكس', 'كراتين أجهزة'] },
      { name: 'كرتون مضغوط وعلب', code: 'PA-04', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['علب كرتون (سريال/أحذية)', 'كرتون مضغوط', 'كرتون رمادي', 'أنابيب كرتون (رول)', 'كور كرتون'] },
      { name: 'كرتون بالات مضغوطة', code: 'PA-04A', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['بالات كرتون', 'كرتون مضغوط بالات', 'كرتون مكبوس', 'رجيع كرتون'] },
      // ===== أكياس ورقية =====
      { name: 'أكياس ورقية وورق كرافت', code: 'PA-05', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['أكياس ورق بني (كرافت)', 'شنط ورقية', 'ورق تغليف هدايا', 'ورق لف سندوتشات', 'ورق كرافت', 'أكياس أسمنت ورقية', 'أكياس دقيق ورقية'] },
      // ===== ورق غير قابل للتدوير =====
      { name: 'ورق مشمع أو مغلف (غير قابل للتدوير)', code: 'PA-06', hazardLevel: 'low', wasteState: 'solid', recyclable: false, commonNames: ['ورق مشمع', 'ورق حراري (فواتير)', 'ورق لامع مغلف', 'ورق كربون', 'ورق فاكس', 'ورق استيكرز'] },
      { name: 'تتراباك وعبوات مركبة', code: 'PA-06A', hazardLevel: 'low', wasteState: 'solid', recyclable: false, commonNames: ['علب لبن تتراباك', 'علب عصير تتراباك', 'عبوات كرتون مبطنة ألومنيوم', 'عبوات UHT'] },
      // ===== كتب ومستندات =====
      { name: 'كتب ومستندات ووثائق قديمة', code: 'PA-07', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['كتب مدرسية', 'كراسات', 'ملفات مكتبية', 'أرشيف ورقي', 'سجلات قديمة', 'دفاتر'] },
      { name: 'مستندات سرية للإتلاف', code: 'PA-07A', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['أوراق سرية', 'مستندات بنكية', 'شيكات ملغاة', 'عقود قديمة', 'سجلات محاسبية', 'فواتير قديمة'] },
      // ===== ورق مقوى =====
      { name: 'ورق مقوى وأطباق ورقية', code: 'PA-08', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['أطباق ورقية', 'كوبايات ورقية', 'أطباق كيك ورق', 'ورق مقوى', 'ورق بريستول'] },
      { name: 'ورق تيشوز ومناديل (غير قابل للتدوير)', code: 'PA-08A', hazardLevel: 'low', wasteState: 'solid', recyclable: false, commonNames: ['مناديل ورقية مستعملة', 'ورق تواليت', 'فوط مطبخ ورقية', 'تيشوز'] },
    ],
  },
  {
    id: 'metal',
    name: 'مخلفات المعادن والخردة',
    description: 'المعادن الحديدية وغير الحديدية',
    wasteState: 'solid',
    category: 'non_hazardous',
    subcategories: [
      // ===== حديد وصلب =====
      { name: 'حديد تسليح (سيخ حديد)', code: 'MT-01', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['سيخ حديد', 'حديد تسليح', 'حديد 10 مم', 'حديد 12 مم', 'حديد 16 مم', 'كانات حديد', 'حديد تسليح مستعمل', 'سيخ 8'] },
      { name: 'صاج حديد (ألواح)', code: 'MT-01A', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['صاج حديد', 'صاج أسود', 'صاج مجلفن', 'صاج ملفوف', 'صاج 2 مم', 'صاج رقيق', 'صاج سميك', 'قصاقيص صاج'] },
      { name: 'حديد سكراب مختلط', code: 'MT-01B', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['حديد سكراب', 'خردة حديد', 'قطع حديد', 'حديد هالك', 'حديد رجيع', 'مسامير', 'سلك رباط', 'رايش حديد'] },
      { name: 'مواسير وزوايا وكمرات حديد', code: 'MT-01C', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['مواسير حديد', 'زوايا حديد', 'كمر حديد', 'مجرى حديد (C)', 'حديد مربع', 'مواسير ملحومة', 'مواسير سيملس'] },
      { name: 'حديد زهر (فونت/كاست)', code: 'MT-01D', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['حديد زهر', 'فونت', 'كاست أيرون', 'محركات حديد زهر', 'أغطية بيارات حديد', 'مواسير فونت'] },
      // ===== ألومنيوم =====
      { name: 'ألومنيوم بروفيل (شبابيك)', code: 'MT-02', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['ألومنيوم بروفيل', 'شبابيك ألومنيوم', 'أبواب ألومنيوم', 'واجهات ألومنيوم', 'قطاعات ألومنيوم'] },
      { name: 'ألومنيوم كانز وعبوات', code: 'MT-02A', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['علب كانز (مشروبات)', 'علب بيبسي', 'علب بيرة ألومنيوم', 'كانز مضغوطة', 'بالات كانز'] },
      { name: 'ألومنيوم أواني ومشغولات', code: 'MT-02B', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['أواني ألومنيوم', 'حلل ألومنيوم', 'صواني ألومنيوم', 'ورق ألومنيوم (فويل)', 'ألومنيوم مشغول', 'ألمنيوم سلك'] },
      // ===== نحاس =====
      { name: 'نحاس أحمر (نقي)', code: 'MT-03', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['نحاس أحمر', 'سلك نحاس أحمر', 'مواسير نحاس تكييف', 'موتور نحاس', 'نحاس نمرة 1'] },
      { name: 'نحاس أصفر (brass)', code: 'MT-03A', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['نحاس أصفر', 'brass', 'حنفيات نحاس', 'محابس نحاس', 'نحاس ديكور', 'نحاس قديم', 'شمعدانات نحاس'] },
      { name: 'نحاس خردة ومخلوط', code: 'MT-03B', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['نحاس خردة', 'نحاس مخلوط', 'كابلات نحاس معزولة', 'رادياتير نحاس', 'نحاس محروق'] },
      // ===== ستانلس =====
      { name: 'ستانلس ستيل 304', code: 'MT-04', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['ستانلس 304', 'أواني ستانلس', 'حوض ستانلس', 'درابزين ستانلس 304', 'ستانلس مطابخ'] },
      { name: 'ستانلس ستيل 316 (مقاوم)', code: 'MT-04A', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['ستانلس 316', 'ستانلس بحري', 'ستانلس طبي', 'ستانلس مصانع أغذية', 'ستانلس مقاوم كيماويات'] },
      // ===== خردة مختلطة =====
      { name: 'خردة معدنية مختلطة', code: 'MT-05', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['سكراب مخلوط', 'خردة مختلطة', 'معادن متنوعة', 'قطع غيار معدنية تالفة', 'خردة ورش'] },
      { name: 'أجهزة منزلية معدنية (بدون إلكترونيات)', code: 'MT-05A', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['بوتاجاز خردة', 'فرن معدني', 'دفاية خردة', 'سخان شمسي خردة', 'موقد غاز تالف'] },
      // ===== براميل =====
      { name: 'براميل وحاويات معدنية نظيفة', code: 'MT-06', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['برميل حديد نظيف', 'جراكن معدنية نظيفة', 'علب صفيح (تنك)', 'عبوات معدنية فارغة نظيفة'] },
      { name: 'علب صفيح ومعلبات', code: 'MT-06A', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['علب تونة فارغة', 'علب فول فارغة', 'معلبات صفيح', 'علب سمن صفيح', 'علب زيت صفيح فارغة نظيفة'] },
      // ===== هياكل =====
      { name: 'هياكل سيارات ومعدات كبيرة', code: 'MT-07', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['هيكل عربية', 'شاسيه', 'تريلا خردة', 'هيكل أتوبيس', 'معدات ثقيلة خردة', 'لودر خردة'] },
      { name: 'مواسير صلب وجلفنة', code: 'MT-07A', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['مواسير صلب', 'مواسير جلفنة', 'مواسير بترولية', 'مواسير ضغط عالي', 'أنابيب غاز'] },
      // ===== زنك وقصدير =====
      { name: 'زنك وصاج مجلفن', code: 'MT-08', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['صاج مجلفن (زنك)', 'ألواح زنك', 'صاج أبيض', 'ماسورة مجلفنة كسر'] },
      { name: 'قصدير لحام وصفيح', code: 'MT-08A', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['قصدير لحام', 'صفيح معلبات', 'قصدير خردة', 'سلك لحام قصدير'] },
      { name: 'رصاص (غير ملوث)', code: 'MT-08B', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['رصاص خردة', 'رصاص كابلات', 'رصاص أنابيب', 'رصاص طلقات', 'ألواح رصاص'] },
    ],
  },
  {
    id: 'glass',
    name: 'مخلفات الزجاج',
    description: 'الزجاج بألوانه وأنواعه المختلفة',
    wasteState: 'solid',
    category: 'non_hazardous',
    subcategories: [
      // ===== زجاج عبوات =====
      { name: 'زجاج شفاف (عبوات وقوارير)', code: 'GL-01', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['قوارير مياه زجاج', 'برطمانات', 'زجاجات عصير', 'عبوات عطور', 'زجاج شفاف نظيف'] },
      { name: 'زجاج أخضر', code: 'GL-02', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['زجاجات بيرة خضراء', 'زجاجات مشروبات خضراء', 'زجاج أخضر كسر'] },
      { name: 'زجاج بني/عنبري', code: 'GL-02A', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['زجاجات دواء بني', 'زجاجات بيرة بني', 'عبوات كيميائية زجاج بني'] },
      { name: 'زجاج أزرق/كوبالت', code: 'GL-02B', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['زجاج كوبالت أزرق', 'عبوات عطور أزرق', 'زجاج ديكور أزرق'] },
      // ===== زجاج مسطح =====
      { name: 'زجاج نوافذ عادي', code: 'GL-03', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['زجاج شبابيك', 'زجاج أبواب', 'زجاج واجهات', 'زجاج 4 مم', 'زجاج 6 مم'] },
      { name: 'زجاج سيكوريت ولاميناتد', code: 'GL-03A', hazardLevel: 'low', wasteState: 'solid', recyclable: false, commonNames: ['زجاج سيكوريت', 'زجاج مقسى', 'زجاج سيارات', 'زجاج لاميناتد', 'باراوان زجاج', 'دبل جلاس'] },
      { name: 'مرايا', code: 'GL-03B', hazardLevel: 'low', wasteState: 'solid', recyclable: false, commonNames: ['مرايا مكسورة', 'مرايا حمامات', 'مرايا دواليب', 'مرايا كبيرة', 'مرايا ديكور'] },
      // ===== كسر زجاج =====
      { name: 'كسر زجاج مختلط', code: 'GL-04', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['كسر زجاج (ازاز)', 'زجاج مخلوط', 'كسر كريستال', 'أواني زجاجية مكسورة', 'ثريات زجاج'] },
      { name: 'كسر زجاج مصانع (كوليت)', code: 'GL-04A', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['كوليت زجاج', 'كسر مصنع زجاج', 'رجيع زجاج', 'زجاج معاد طحنه', 'بودرة زجاج'] },
      // ===== زجاج تقني =====
      { name: 'زجاج تقني ومقاوم للحرارة', code: 'GL-05', hazardLevel: 'low', wasteState: 'solid', recyclable: false, commonNames: ['بايركس', 'زجاج مختبرات', 'زجاج فرن', 'زجاج بوروسيليكات', 'أنابيب اختبار زجاج'] },
      { name: 'فايبر جلاس وزجاج ليفي', code: 'GL-05A', hazardLevel: 'low', wasteState: 'solid', recyclable: false, commonNames: ['فايبر جلاس كسر', 'ألياف زجاجية', 'خزانات فايبر جلاس', 'قوارب فايبر', 'صاج فايبر'] },
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
      // ===== بند الأخشاب - تفصيلي =====
      { name: 'خشب كسر ومخلوط', code: 'OR-04', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: [
        'خشب كسر', 'كسر خشب', 'خشب مخلوط', 'بقايا خشب', 'خشب تالف', 'خشب هالك',
        'قطع خشب متبقية (تريم)', 'رايش خشب', 'فضلات خشب', 'خشب رجيع'
      ]},
      { name: 'بالتات خشب (طبالي)', code: 'OR-04A', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: [
        'بالتات خشب', 'طبالي خشب', 'بالتات يوروبالت', 'بالتة خشب', 'بالته', 'بالت',
        'طبلية خشب', 'بالتات شحن', 'بالتات مستعملة', 'بالتات نظيفة'
      ]},
      { name: 'صناديق وأقفاص خشب', code: 'OR-04B', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: [
        'صناديق خشب', 'أقفاص خشب', 'صندوق فاكهة خشب', 'أقفاص عنب', 'صناديق شحن خشب'
      ]},
      { name: 'خشب موسكي وسويدي', code: 'OR-04C', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: [
        'خشب موسكي', 'خشب سويدي', 'خشب موسكي فنلندي', 'خشب صنوبر', 'لوح موسكي',
        'تقطيع موسكي', 'عروق موسكي', 'مراين موسكي'
      ]},
      { name: 'خشب زان', code: 'OR-04D', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: [
        'خشب زان', 'زان أحمر', 'زان روماني', 'زان تركي', 'زان ألماني',
        'ألواح زان', 'خشب زان مستعمل'
      ]},
      { name: 'أخشاب صلبة (أرو/تيك/جوز/عزيزي)', code: 'OR-04E', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: [
        'خشب أرو (بلوط)', 'خشب تيك', 'خشب جوز', 'خشب عزيزي', 'خشب ماهوجني',
        'خشب ساج', 'خشب ابنوس', 'خشب ورد', 'أخشاب صلبة', 'أخشاب طبيعية فاخرة'
      ]},
      { name: 'خشب كونتر وحبيبي', code: 'OR-04F', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: [
        'خشب كونتر', 'كونتر حبيبي', 'ألواح حبيبية', 'شيب بورد', 'كونتر ملبس',
        'كونتر عاري', 'كونتر مقاوم للرطوبة', 'أجلومري'
      ]},
      { name: 'أبلكاش ولاتيه (رقائقي)', code: 'OR-04G', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: [
        'أبلكاش', 'خشب رقائقي', 'بلاي وود', 'خشب لاتيه', 'أبلكاش بحري',
        'أبلكاش فنلندي', 'أبلكاش صيني', 'ألواح أبلكاش'
      ]},
      { name: 'MDF و HDF (ألياف مضغوطة)', code: 'OR-04H', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: [
        'MDF', 'ألواح MDF', 'خشب MDF', 'HDF', 'ألواح HDF', 'أرضيات HDF',
        'MDF ملبس', 'MDF مدهون', 'ألياف متوسطة الكثافة', 'ألياف عالية الكثافة'
      ]},
      { name: 'فورميكا وقشرة خشب', code: 'OR-04I', hazardLevel: 'low', wasteState: 'solid', recyclable: false, commonNames: [
        'فورميكا', 'قشرة خشب طبيعية', 'قشرة خشب صناعية', 'HPL', 'ألواح فورميكا',
        'ورق ديكور', 'لامينيت', 'ميلامين'
      ]},
      { name: 'خشب لتزانيلو وعروق', code: 'OR-04J', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: [
        'خشب لتزانيلو', 'عروق خشب', 'مراين خشب', 'براويز خشب', 'ألواح لتزانيلو',
        'خشب تجاليد', 'ربع دائرة خشب'
      ]},
      { name: 'نشارة وبرادة خشب', code: 'OR-04K', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: [
        'نشارة خشب', 'برادة خشب', 'نشارة ناعمة', 'نشارة خشنة', 'غبار خشب',
        'نشارة مكابس', 'نشارة دائري'
      ]},
      { name: 'أثاث خشب تالف ومستعمل', code: 'OR-04L', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: [
        'أثاث خشب تالف', 'دواليب خشب', 'سرير خشب', 'طاولات خشب', 'كراسي خشب',
        'مكاتب خشب', 'سفرة خشب', 'كنبة خشب', 'كومودينو', 'تسريحة', 'أثاث مطبخ خشب'
      ]},
      { name: 'أبواب وشبابيك خشب', code: 'OR-04M', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: [
        'أبواب خشب قديمة', 'شبابيك خشب', 'ضلف خشب', 'حلوق أبواب', 'أبواب حمامات خشب',
        'شيش خشب', 'درابزين خشب'
      ]},
      { name: 'أرضيات باركيه وتجاليد خشب', code: 'OR-04N', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: [
        'أرضيات باركيه', 'باركيه مستعمل', 'أرضيات خشب', 'تجاليد حوائط خشب',
        'ديكورات خشب قديمة', 'سقف خشب', 'عوارض خشبية', 'كمرات خشب'
      ]},
      { name: 'مخلفات محاصيل زراعية', code: 'OR-05', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['قش أرز', 'حطب ذرة', 'حطب قطن', 'قش قمح', 'عروش بطاطس', 'بقايا قصب سكر (باجاس)', 'تبن', 'سيلاج تالف'] },
      { name: 'مصاصة قصب السكر (باجاس)', code: 'OR-05A', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['مصاصة قصب', 'باجاس', 'بقايا عصر قصب', 'مخلفات مصانع سكر', 'bagasse'] },
      { name: 'مخلفات تصنيع غذائي', code: 'OR-06', hazardLevel: 'low', wasteState: 'mixed', recyclable: true, commonNames: ['تفل بنجر', 'كسب بذور', 'مولاس', 'بقايا مذابح (ريش/أحشاء)', 'قشور بيض', 'بقايا مصانع أغذية', 'عظام حيوانات'] },
      { name: 'الردة (نخالة القمح)', code: 'OR-06A', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['ردة', 'نخالة', 'نخالة قمح', 'ردة ناعمة', 'ردة خشنة', 'مخلفات مطاحن'] },
      { name: 'كسب الزيوت (كسب بذور)', code: 'OR-06B', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['كسب زيوت', 'كسب فول صويا', 'كسب عباد شمس', 'كسب كتان', 'كسب بذرة قطن', 'كسب سمسم'] },
      { name: 'تفل الطماطم ومخلفات عصير الفاكهة', code: 'OR-06C', hazardLevel: 'low', wasteState: 'semi_solid', recyclable: true, commonNames: ['تفل طماطم', 'تفل فاكهة', 'بقايا عصر فاكهة', 'قشور برتقال صناعي', 'لب فاكهة'] },
      { name: 'شرش اللبن (مصل اللبن)', code: 'OR-06D', hazardLevel: 'low', wasteState: 'liquid', recyclable: true, commonNames: ['شرش لبن', 'مصل لبن', 'whey', 'شرش جبن', 'مياه جبن', 'شرش ألبان'] },
      { name: 'إعدامات مواد غذائية ومخلفات الحجر الصحي', code: 'OR-06E', hazardLevel: 'low', wasteState: 'mixed', recyclable: false, commonNames: ['إعدامات غذائية', 'مخلفات لجان إعدامات', 'أغذية محجوزة', 'مخلفات حجر صحي', 'مواد غذائية معدمة'] },
      { name: 'مخلفات المجازر غير الملوثة (جلود وقرون وحوافر)', code: 'OR-06F', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['جلود مجازر', 'قرون', 'حوافر', 'عظام مجازر نظيفة', 'مخلفات سلخنات غير ملوثة'] },
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
      // ===== خرسانة =====
      { name: 'كسر خرسانة عادية', code: 'CN-01', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['كسر خرسانة', 'خرسانة عادية مكسورة', 'دبش خرسانة', 'قطع خرسانة'] },
      { name: 'خرسانة مسلحة', code: 'CN-01A', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['خرسانة مسلحة', 'خرسانة بحديد', 'أعمدة خرسانة مهدمة', 'كمرات خرسانة', 'سقف خرسانة مهدم'] },
      { name: 'طوب أحمر وطفلي', code: 'CN-01B', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['طوب أحمر مكسور', 'طوب طفلي', 'طوب أحمر نظيف', 'كسر طوب', 'طوب حراري مستعمل'] },
      { name: 'بلوكات أسمنتية', code: 'CN-01C', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['بلوكات أسمنت', 'طوب أسمنتي', 'بلوكات مفرغة', 'بلوكات بيانو'] },
      // ===== أخشاب إنشائية =====
      { name: 'أخشاب إنشائية وشدات', code: 'CN-02', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['خشب عمل (فورم ورك)', 'قوالب خشب خرسانة', 'عروق خشب', 'ألواح لتزانيلو إنشائية', 'شدات خشبية', 'سقالات خشب'] },
      // ===== بلاط وسيراميك =====
      { name: 'كسر سيراميك وبورسلين', code: 'CN-03', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['كسر سيراميك', 'كسر بورسلين', 'سيراميك أرضيات', 'سيراميك حوائط', 'بورسلين مكسور'] },
      { name: 'كسر رخام وجرانيت', code: 'CN-03A', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['كسر رخام', 'كسر جرانيت', 'رخام سلالم', 'رخام مطابخ كسر', 'جرانيت أرضيات كسر', 'بودرة رخام'] },
      { name: 'موزاييك وتيرازو وبلاط أسمنتي', code: 'CN-03B', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['موزاييك مكسور', 'تيرازو', 'بلاط أسمنتي قديم', 'بلاط بلدي', 'أرضيات قديمة'] },
      // ===== حديد إنشائي =====
      { name: 'حديد تسليح ومعادن إنشائية', code: 'CN-04', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['سيخ حديد تسليح', 'حديد تسليح مستعمل', 'كانات حديد', 'شبك حديد', 'حديد زهر'] },
      // ===== ردم =====
      { name: 'ردم وأتربة', code: 'CN-05', hazardLevel: 'low', wasteState: 'solid', recyclable: false, commonNames: ['ردم حفر', 'أتربة ناعمة', 'تربة حفريات', 'طمي'] },
      { name: 'رمل وزلط مستعمل', code: 'CN-05A', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['رمل مستعمل', 'زلط مستعمل', 'حصى', 'سن مستعمل', 'رمل بناء رجيع'] },
      // ===== مواسير =====
      { name: 'مواسير وأنابيب إنشائية', code: 'CN-06', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['مواسير PVC صرف', 'مواسير حديد', 'مواسير PPR', 'مواسير فخار', 'مجاري صرف', 'بالوعات'] },
      // ===== عزل =====
      { name: 'عزل مائي وبيتومين', code: 'CN-07', hazardLevel: 'low', wasteState: 'solid', recyclable: false, commonNames: ['رولات بيتومين', 'عزل مائي', 'ممبرين', 'عزل أسطح', 'بيتومين مستعمل'] },
      { name: 'عزل حراري وصوتي', code: 'CN-07A', hazardLevel: 'low', wasteState: 'solid', recyclable: false, commonNames: ['عزل فوم', 'صوف صخري', 'فوم بولي يوريثان عزل', 'عزل صوتي', 'ألواح عزل XPS'] },
      { name: 'جبس بورد وأسقف معلقة', code: 'CN-07B', hazardLevel: 'low', wasteState: 'solid', recyclable: false, commonNames: ['ألواح جبس بورد', 'أسقف معلقة تالفة', 'جبس بورد كسر', 'تيل سقف', 'ألواح ساندوتش بانل', 'كلادينج كسر'] },
      // ===== أسمنت وجبس =====
      { name: 'أسمنت وجبس رجيع', code: 'CN-08', hazardLevel: 'low', wasteState: 'solid', recyclable: false, commonNames: ['أسمنت متصلب', 'أكياس أسمنت فارغة', 'جبس رجيع', 'محارة مكشوطة', 'بقايا مونة', 'لياسة قديمة'] },
      { name: 'دهانات جافة وبقايا تشطيب', code: 'CN-08A', hazardLevel: 'low', wasteState: 'solid', recyclable: false, commonNames: ['بوية جافة', 'بقايا معجون', 'ورق حائط قديم', 'بلاستيك حوائط جاف', 'بقايا سيراميك لاصق'] },
    ],
  },
  {
    id: 'textile',
    name: 'مخلفات نسيج وملابس وجلود',
    description: 'مخلفات صناعة النسيج والملابس والجلود غير الملوثة',
    wasteState: 'solid',
    category: 'non_hazardous',
    subcategories: [
      // ===== ملابس =====
      { name: 'ملابس مستعملة (بالة)', code: 'TX-01', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['هدوم مستعملة', 'ملابس بالة', 'ملابس ماركات مستعملة', 'ملابس أطفال مستعملة', 'ملابس رجالي مستعمل', 'ملابس حريمي مستعمل'] },
      { name: 'ستائر ومفارش ومنسوجات منزلية', code: 'TX-01A', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['ستائر قديمة', 'مفارش', 'ملايات', 'مناشف', 'فوط', 'أغطية سرير', 'وسائد', 'بطانيات خفيفة'] },
      // ===== قماش صناعي =====
      { name: 'أقمشة قطنية وطبيعية', code: 'TX-02', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['قماش قطن', 'قماش كتان', 'قماش صوف', 'قماش حرير', 'قصاصات قطن', 'بقايا تفصيل قطن'] },
      { name: 'أقمشة صناعية (بوليستر/نايلون)', code: 'TX-02A', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['قماش بوليستر', 'قماش نايلون', 'قماش ليكرا', 'شيفون', 'ساتان صناعي', 'قصاقيص صناعية'] },
      { name: 'دوبارة وتريكو وخرق', code: 'TX-02B', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['دوبارة', 'تريكو', 'خرق قماش', 'قصاقيص', 'رقع قماش', 'بقايا مصانع ملابس', 'خرق تنظيف'] },
      // ===== جلود =====
      { name: 'جلود طبيعية', code: 'TX-03', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['جلد طبيعي مستعمل', 'جلد بقري', 'جلد جاموسي', 'جلد ماعز', 'قصاصات جلد طبيعي', 'بقايا ورش جزم جلد'] },
      { name: 'جلود صناعية (سكاي/PU)', code: 'TX-03A', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['جلد صناعي (سكاي)', 'جلد PU', 'جلد PVC', 'كنب جلد صناعي تالف', 'أحزمة جلد صناعي', 'شنط جلد صناعي تالفة'] },
      // ===== سجاد =====
      { name: 'سجاد يدوي وشرقي', code: 'TX-04', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['سجاد يدوي', 'كليم يدوي', 'سجاد صوف', 'سجاد حرير', 'سجاد شرقي قديم'] },
      { name: 'موكيت وسجاد صناعي', code: 'TX-04A', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['موكيت مستعمل', 'سجاد ماكينة', 'بطاطين قديمة', 'حصير', 'سجاد حائط', 'موكيت مكاتب'] },
      // ===== خيوط وحبال =====
      { name: 'خيوط نسيج وغزل', code: 'TX-05', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['خيوط نسيج', 'خيوط قطن', 'خيوط بوليستر', 'بكر خيط', 'غزل قطني', 'غزل صناعي'] },
      { name: 'حبال وشباك', code: 'TX-05A', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['حبال نايلون', 'شباك صيد', 'حبال قطنية', 'أشرطة نسيج', 'أحزمة ناقلة نسيج', 'شنط منسوجة (شوالات)'] },
      // ===== أحذية وحقائب =====
      { name: 'أحذية رياضية وكاجوال', code: 'TX-06', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['جزم رياضية تالفة', 'كوتشي تالف', 'شباشب', 'صنادل', 'أحذية أطفال تالفة'] },
      { name: 'أحذية جلدية وحقائب', code: 'TX-06A', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['جزم جلد تالفة', 'بوت جلد', 'شنط مدرسة', 'شنط سفر تالفة', 'محافظ تالفة', 'شنط يد تالفة'] },
    ],
  },
  // ============================================
  // المخلفات السائلة غير الخطرة — مستخرجة من وثائق التصنيف الرسمية
  // ============================================
  {
    id: 'liquid_non_hazardous',
    name: 'المخلفات السائلة غير الخطرة',
    description: 'مياه الصرف والسوائل الغذائية والزيوت غير الملوثة',
    wasteState: 'liquid',
    category: 'non_hazardous',
    legalReference: 'قانون 202/2020 - الباب الثالث',
    subcategories: [
      { name: 'مياه الصرف الصحي', code: 'LQ-01', hazardLevel: 'low', wasteState: 'liquid', recyclable: false, commonNames: ['مياه صرف صحي', 'مياه مجاري', 'صرف منازل', 'مياه صرف آدمي'] },
      { name: 'مياه عمليات الغسيل (بدون كيماويات)', code: 'LQ-02', hazardLevel: 'low', wasteState: 'liquid', recyclable: true, commonNames: ['مياه غسيل عادي', 'مياه غسيل ملابس', 'مياه شطف', 'مياه غسيل سيارات'] },
      { name: 'البنتونيت غير الخطر (غير مخلوط بزيوت)', code: 'LQ-03', hazardLevel: 'low', wasteState: 'liquid', recyclable: false, commonNames: ['بنتونيت', 'طين حفر غير ملوث', 'بنتونيت مخلوط بماء', 'سائل حفر غير خطر'] },
      { name: 'زيوت الطعام المستهلكة', code: 'LQ-04', hazardLevel: 'low', wasteState: 'liquid', recyclable: true, commonNames: ['زيت طعام مستعمل', 'زيت قلي', 'زيت نباتي مستهلك', 'مسلى مستعمل', 'شحوم طعام مستعملة', 'زيت طبخ تالف'] },
      { name: 'المياه العكرة', code: 'LQ-05', hazardLevel: 'low', wasteState: 'liquid', recyclable: false, commonNames: ['مياه عكرة', 'مياه موحلة', 'مياه رشح', 'مياه مطر ملوثة'] },
      { name: 'مياه غسيل وتطهير الثمار والمواد الغذائية', code: 'LQ-06', hazardLevel: 'low', wasteState: 'liquid', recyclable: false, commonNames: ['مياه غسيل خضار', 'مياه غسيل فاكهة', 'مياه تطهير أغذية', 'مياه غسيل مواد غذائية'] },
      { name: 'ناتج تطهير خزانات المياه', code: 'LQ-07', hazardLevel: 'low', wasteState: 'liquid', recyclable: false, commonNames: ['مياه تطهير خزانات', 'مياه تنظيف خزانات', 'رواسب خزانات مياه'] },
      { name: 'مخلفات العصائر والمشروبات والمرتجعات السائلة', code: 'LQ-08', hazardLevel: 'low', wasteState: 'liquid', recyclable: true, commonNames: ['عصائر تالفة', 'مشروبات غازية تالفة', 'مياه معدنية منتهية', 'مرتجعات مشروبات', 'هالك إنتاج سوائل غذائية', 'مركزات تالفة', 'بيبسي تالف', 'كوكا تالفة'] },
      { name: 'حمأة جافة (محطات معالجة صرف صحي)', code: 'LQ-09', hazardLevel: 'low', wasteState: 'semi_solid', recyclable: true, commonNames: ['حمأة جافة', 'سبلة محطات معالجة', 'حمأة صرف صحي معالجة', 'بيوسوليدز'] },
      { name: 'السبلة الناتجة من مزارع الدواجن والماشية', code: 'LQ-10', hazardLevel: 'low', wasteState: 'semi_solid', recyclable: true, commonNames: ['سبلة دواجن', 'سبلة ماشية', 'روث حيواني سائل', 'مخلفات مزارع سائلة'] },
      { name: 'مياه الصرف الصحي والصناعي المعالجة', code: 'LQ-11', hazardLevel: 'low', wasteState: 'liquid', recyclable: true, commonNames: ['مياه صرف معالجة', 'مياه صرف صناعي معالج', 'مياه معالجة ثلاثياً', 'مياه ثانوية معالجة'] },
      { name: 'مياه التبريد', code: 'LQ-12', hazardLevel: 'low', wasteState: 'liquid', recyclable: true, commonNames: ['مياه تبريد', 'مياه أبراج تبريد', 'مياه تبريد مصانع', 'مياه كوندنسر'] },
    ],
  },
  // ============================================
  // المخلفات البلدية والمختلطة — مستخرجة من وثائق التصنيف
  // ============================================
  {
    id: 'municipal',
    name: 'مخلفات بلدية ومختلطة',
    description: 'مخلفات المدن والقرى والأنشطة التجارية والسياحية',
    wasteState: 'mixed',
    category: 'non_hazardous',
    legalReference: 'قانون 202/2020 - الباب الثالث - المادة 22',
    subcategories: [
      { name: 'المخلفات البلدية غير القابلة للتدوير', code: 'MU-01', hazardLevel: 'low', wasteState: 'solid', recyclable: false, commonNames: ['قمامة عادية', 'مخلفات منازل', 'مخلفات بلدية مختلطة', 'نفايات صلبة بلدية'] },
      { name: 'مخلفات قابلة للحرق لاسترجاع الطاقة (RDF)', code: 'MU-02', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['وقود بديل RDF', 'مخلفات وقود', 'RDF', 'وقود من مخلفات', 'SRF'] },
      { name: 'المخلفات العضوية (كمبوست)', code: 'MU-03', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['مخلفات عضوية بلدية', 'بقايا طعام بلدي', 'مخلفات حدائق عامة', 'مخلفات أسواق'] },
      { name: 'مخلفات الفنادق واليخوت والمراكب', code: 'MU-04', hazardLevel: 'low', wasteState: 'mixed', recyclable: true, commonNames: ['مخلفات فنادق', 'مخلفات يخوت', 'مخلفات مراكب', 'مخلفات سفن', 'مخلفات مراكب الجيت', 'خردة مراكب'] },
      { name: 'هالك الصناعات الغذائية', code: 'MU-05', hazardLevel: 'low', wasteState: 'mixed', recyclable: true, commonNames: ['هالك صناعات غذائية', 'مخلفات تصنيع غذائي', 'مرتجعات أغذية', 'أغذية منتهية الصلاحية', 'هالك إنتاج', 'معيب غذائي'] },
      { name: 'مخلفات العبوات الفارغة غير الملوثة', code: 'MU-06', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['عبوات فارغة نظيفة', 'مخلفات عبوات غذائية', 'هوالك مواد غذائية', 'عبوات بلاستيك فارغة غير ملوثة'] },
      { name: 'أتربة الخردة المستوردة', code: 'MU-07', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['أتربة خردة مستوردة', 'ناتج فرز خردة', 'أتربة فرز الخردة لصناعة الصلب'] },
      { name: 'مخلفات أتربة ناتج كنس مخازن الفحم', code: 'MU-08', hazardLevel: 'low', wasteState: 'solid', recyclable: false, commonNames: ['أتربة فحم', 'كنس مخازن فحم', 'غبار فحم', 'مخلفات أتربة فحم حجري'] },
      { name: 'الرماد المتطاير من محطات توليد الكهرباء', code: 'MU-09', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['رماد متطاير', 'fly ash', 'رماد محطات كهرباء', 'رماد مازوت', 'رماد غاز طبيعي'] },
      { name: 'خبث الأفران العالية والحديد والصلب', code: 'MU-10', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['خبث أفران عالية', 'خبث حديد صلب', 'خبث أفران كهربائية', 'slag', 'خبث سبائكي'] },
      { name: 'حمأة مرشحات مياه الشرب', code: 'MU-11', hazardLevel: 'low', wasteState: 'semi_solid', recyclable: false, commonNames: ['حمأة مرشحات رملية', 'حمأة مرشحات زلطية', 'رواسب محطات تنقية مياه', 'حمأة مياه شرب'] },
      { name: 'حمأة إزالة عسر المياه', code: 'MU-12', hazardLevel: 'low', wasteState: 'semi_solid', recyclable: false, commonNames: ['حمأة إزالة عسر', 'رواسب تيسير مياه', 'حمأة معالجة مياه كيميائية'] },
      { name: 'نواتج تطهير الترع والمصارف وقنوات الري', code: 'MU-13', hazardLevel: 'low', wasteState: 'solid', recyclable: false, commonNames: ['نواتج تطهير ترع', 'طمي مصارف', 'نواتج تطهير قنوات ري', 'رواسب ترع مجففة'] },
      { name: 'هالك البلاستيك والكرتون بمصانع الأدوية (غير ملوث)', code: 'MU-14', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['هالك بلاستيك أدوية نظيف', 'كرتون مصانع أدوية', 'ورق تغليف أدوية غير ملوث', 'عبوات أدوية فارغة نظيفة'] },
      { name: 'خردة المراكب والسفن', code: 'MU-15', hazardLevel: 'low', wasteState: 'solid', recyclable: true, commonNames: ['خردة مراكب', 'خردة سفن', 'خردة يخوت', 'هياكل سفن', 'خردة جيت بحري', 'تفكيك سفن'] },
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
  liquid_non_hazardous: 'سوائل غير خطرة',
  municipal: 'بلدية ومختلطة',
  hazardous_liquid: 'سوائل خطرة',
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
    liquid_non_hazardous: 'LQ',
    municipal: 'MU',
    hazardous_liquid: 'HL',
    other: 'OT',
  };
  return codes[wasteType] || 'OT';
};

export const isHazardousWasteType = (wasteType: WasteType | string): boolean => {
  if (!wasteType) return false;
  return ['chemical', 'electronic', 'medical', 'industrial', 'hazardous_liquid'].includes(wasteType);
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
