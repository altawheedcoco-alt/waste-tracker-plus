import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface OHSInspection {
  id: string;
  organization_id: string;
  consultant_id: string | null;
  inspector_name: string;
  inspector_title: string | null;
  inspection_date: string;
  report_number: string;
  facility_name: string;
  facility_address: string | null;
  facility_type: string;
  inspection_type: string;
  overall_risk_level: string;
  overall_score: number;
  status: string;
  summary: string | null;
  recommendations: string | null;
  next_inspection_date: string | null;
  weather_conditions: string | null;
  employees_present: number | null;
  photos_urls: string[] | null;
  signed_by_consultant: boolean;
  signature_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface OHSChecklistItem {
  id: string;
  inspection_id: string;
  category: string;
  item_name: string;
  item_name_ar: string;
  status: string;
  severity: string;
  notes: string | null;
  photo_url: string | null;
  corrective_action: string | null;
  deadline: string | null;
  responsible_person: string | null;
  sort_order: number;
  created_at: string;
}

export interface OHSCorrectiveAction {
  id: string;
  inspection_id: string;
  checklist_item_id: string | null;
  action_description: string;
  priority: string;
  status: string;
  assigned_to: string | null;
  due_date: string | null;
  completed_date: string | null;
  completion_notes: string | null;
  verification_photo_url: string | null;
  created_at: string;
  updated_at: string;
}

interface ChecklistCategory {
  category: string;
  categoryLabel: string;
  items: { name: string; name_ar: string }[];
}

// ========== SHARED categories (all facility types) ==========
const SHARED_CATEGORIES: ChecklistCategory[] = [
  {
    category: 'ppe',
    categoryLabel: 'معدات الحماية الشخصية (PPE)',
    items: [
      { name: 'Hard hats available and worn', name_ar: 'خوذات السلامة متوفرة ومستخدمة' },
      { name: 'Safety gloves provided', name_ar: 'قفازات السلامة متوفرة' },
      { name: 'Safety goggles/face shields', name_ar: 'نظارات/أقنعة واقية' },
      { name: 'High-visibility vests', name_ar: 'سترات عاكسة' },
      { name: 'Safety boots worn', name_ar: 'أحذية السلامة مستخدمة' },
      { name: 'Respiratory protection (if needed)', name_ar: 'حماية تنفسية (عند الحاجة)' },
    ],
  },
  {
    category: 'fire_safety',
    categoryLabel: 'السلامة من الحرائق',
    items: [
      { name: 'Fire extinguishers accessible and inspected', name_ar: 'طفايات الحريق متاحة ومفحوصة' },
      { name: 'Emergency exits clear and marked', name_ar: 'مخارج الطوارئ واضحة ومعلّمة' },
      { name: 'Fire alarm system functional', name_ar: 'نظام إنذار الحريق يعمل' },
      { name: 'Fire evacuation plan posted', name_ar: 'خطة الإخلاء معلقة' },
    ],
  },
  {
    category: 'emergency',
    categoryLabel: 'الاستعداد للطوارئ',
    items: [
      { name: 'First aid kits stocked', name_ar: 'صناديق الإسعافات الأولية مجهزة' },
      { name: 'Emergency contacts posted', name_ar: 'أرقام الطوارئ معلقة' },
      { name: 'Assembly points marked', name_ar: 'نقاط التجمع محددة' },
      { name: 'Emergency response plan updated', name_ar: 'خطة الاستجابة للطوارئ محدثة' },
    ],
  },
  {
    category: 'training',
    categoryLabel: 'التدريب والتأهيل',
    items: [
      { name: 'Safety induction for new workers', name_ar: 'تدريب تعريفي للعمال الجدد' },
      { name: 'Regular safety meetings held', name_ar: 'اجتماعات سلامة دورية' },
      { name: 'Safety records maintained', name_ar: 'سجلات السلامة محفوظة' },
    ],
  },
];

// ========== RECYCLER-SPECIFIC ==========
const RECYCLER_CATEGORIES: ChecklistCategory[] = [
  {
    category: 'machinery',
    categoryLabel: 'سلامة الآلات وخطوط الإنتاج',
    items: [
      { name: 'Machine guards in place', name_ar: 'حراسات الآلات في مكانها' },
      { name: 'Emergency stop buttons functional', name_ar: 'أزرار التوقف الطارئ تعمل' },
      { name: 'Conveyor belts inspected', name_ar: 'سيور النقل مفحوصة' },
      { name: 'Shredder/crusher safety interlocks', name_ar: 'أقفال أمان الفرامات/الكسارات' },
      { name: 'Lockout/Tagout procedures followed', name_ar: 'إجراءات القفل/العلامات متبعة' },
      { name: 'Preventive maintenance schedule current', name_ar: 'جدول الصيانة الوقائية محدث' },
    ],
  },
  {
    category: 'chemical_recycler',
    categoryLabel: 'التعرض الكيميائي والأبخرة',
    items: [
      { name: 'MSDS sheets available for all chemicals', name_ar: 'صحائف MSDS متوفرة لكل المواد' },
      { name: 'Ventilation systems adequate', name_ar: 'أنظمة التهوية كافية' },
      { name: 'Fume extraction working', name_ar: 'شفاطات الأبخرة تعمل' },
      { name: 'Chemical storage segregated properly', name_ar: 'تخزين المواد الكيميائية مفصول' },
      { name: 'Spill containment available', name_ar: 'أحواض احتواء الانسكابات متوفرة' },
      { name: 'Workers exposure monitoring records', name_ar: 'سجلات قياس تعرض العمال' },
    ],
  },
  {
    category: 'noise_vibration',
    categoryLabel: 'الضوضاء والاهتزازات',
    items: [
      { name: 'Noise levels measured and within limits', name_ar: 'مستويات الضوضاء مقاسة وضمن الحدود' },
      { name: 'Hearing protection provided in noisy areas', name_ar: 'حماية السمع في المناطق الصاخبة' },
      { name: 'Vibration damping on heavy machines', name_ar: 'عزل اهتزازات على الآلات الثقيلة' },
      { name: 'Noise warning signs posted', name_ar: 'علامات تحذير الضوضاء معلقة' },
    ],
  },
  {
    category: 'waste_management_recycler',
    categoryLabel: 'إدارة مخلفات التدوير',
    items: [
      { name: 'Industrial waste properly classified', name_ar: 'المخلفات الصناعية مصنفة بشكل صحيح' },
      { name: 'Waste storage areas designated', name_ar: 'مناطق تخزين المخلفات محددة' },
      { name: 'Residual waste disposal documented', name_ar: 'التخلص من المخلفات المتبقية موثق' },
      { name: 'Recycling efficiency tracked', name_ar: 'كفاءة التدوير متابعة' },
    ],
  },
  {
    category: 'electrical_recycler',
    categoryLabel: 'السلامة الكهربائية',
    items: [
      { name: 'Electrical panels accessible and labeled', name_ar: 'لوحات الكهرباء يمكن الوصول إليها ومسماة' },
      { name: 'No exposed wiring', name_ar: 'لا توجد أسلاك مكشوفة' },
      { name: 'Grounding systems intact', name_ar: 'أنظمة التأريض سليمة' },
      { name: 'Overload protection functional', name_ar: 'حماية الحمل الزائد تعمل' },
    ],
  },
  {
    category: 'env_monitoring',
    categoryLabel: 'الرصد البيئي',
    items: [
      { name: 'Air quality monitoring', name_ar: 'مراقبة جودة الهواء' },
      { name: 'Dust control measures', name_ar: 'إجراءات التحكم في الأتربة' },
      { name: 'Wastewater treatment functional', name_ar: 'معالجة المياه المستعملة تعمل' },
      { name: 'Emissions within permit limits', name_ar: 'الانبعاثات ضمن حدود التصريح' },
    ],
  },
];

// ========== TRANSPORTER-SPECIFIC ==========
const TRANSPORTER_CATEGORIES: ChecklistCategory[] = [
  {
    category: 'vehicle_safety',
    categoryLabel: 'سلامة المركبات',
    items: [
      { name: 'Vehicle inspection certificates current', name_ar: 'شهادات فحص المركبات سارية' },
      { name: 'Brakes tested and functional', name_ar: 'الفرامل مفحوصة وتعمل' },
      { name: 'Tires in good condition', name_ar: 'الإطارات في حالة جيدة' },
      { name: 'Lights and indicators working', name_ar: 'الأضواء والإشارات تعمل' },
      { name: 'Mirrors clean and adjusted', name_ar: 'المرايا نظيفة ومضبوطة' },
      { name: 'Vehicle maintenance log updated', name_ar: 'سجل صيانة المركبة محدث' },
    ],
  },
  {
    category: 'load_security',
    categoryLabel: 'تأمين الحمولة',
    items: [
      { name: 'Load secured with straps/chains', name_ar: 'الحمولة مثبتة بأحزمة/سلاسل' },
      { name: 'Container integrity verified', name_ar: 'سلامة الحاوية مُتحقق منها' },
      { name: 'No overloading beyond capacity', name_ar: 'عدم تجاوز الحمولة القصوى' },
      { name: 'Spillage prevention measures', name_ar: 'إجراءات منع الانسكاب' },
      { name: 'Hazmat placards displayed (if applicable)', name_ar: 'لوحات المواد الخطرة معروضة (إن وجد)' },
    ],
  },
  {
    category: 'driver_compliance',
    categoryLabel: 'امتثال السائقين',
    items: [
      { name: 'Valid driving license', name_ar: 'رخصة قيادة سارية' },
      { name: 'ADR certification (hazardous goods)', name_ar: 'شهادة ADR (بضائع خطرة)' },
      { name: 'Driving hours within legal limits', name_ar: 'ساعات القيادة ضمن الحدود القانونية' },
      { name: 'Rest periods documented', name_ar: 'فترات الراحة موثقة' },
      { name: 'No signs of fatigue/impairment', name_ar: 'لا علامات إرهاق أو ضعف' },
      { name: 'Route planning documented', name_ar: 'تخطيط المسار موثق' },
    ],
  },
  {
    category: 'road_emergency',
    categoryLabel: 'معدات الطوارئ على الطريق',
    items: [
      { name: 'Warning triangles available', name_ar: 'مثلثات تحذير متوفرة' },
      { name: 'Fire extinguisher in cab', name_ar: 'طفاية حريق في الكابينة' },
      { name: 'First aid kit in vehicle', name_ar: 'حقيبة إسعافات أولية في المركبة' },
      { name: 'Spill kit on board (if hazmat)', name_ar: 'أدوات انسكاب (للمواد الخطرة)' },
      { name: 'Emergency contact list accessible', name_ar: 'قائمة أرقام الطوارئ متاحة' },
      { name: 'GPS tracking device functional', name_ar: 'جهاز تتبع GPS يعمل' },
    ],
  },
  {
    category: 'loading_unloading',
    categoryLabel: 'عمليات التحميل والتفريغ',
    items: [
      { name: 'Loading area safe and clear', name_ar: 'منطقة التحميل آمنة وخالية' },
      { name: 'Forklift operators certified', name_ar: 'مشغلو الرافعات معتمدون' },
      { name: 'Chocking wheels during loading', name_ar: 'تثبيت العجلات أثناء التحميل' },
      { name: 'Spotters used for reversing', name_ar: 'مرشدون عند الرجوع للخلف' },
    ],
  },
];

// ========== DISPOSAL-SPECIFIC ==========
const DISPOSAL_CATEGORIES: ChecklistCategory[] = [
  {
    category: 'toxic_gases',
    categoryLabel: 'مراقبة الغازات السامة',
    items: [
      { name: 'H₂S monitors installed and calibrated', name_ar: 'أجهزة رصد كبريتيد الهيدروجين مُركبة ومعايرة' },
      { name: 'CH₄ (methane) detection active', name_ar: 'كشف الميثان (CH₄) نشط' },
      { name: 'CO monitoring in enclosed areas', name_ar: 'مراقبة أول أكسيد الكربون في المناطق المغلقة' },
      { name: 'Gas alarm systems functional', name_ar: 'أنظمة إنذار الغاز تعمل' },
      { name: 'Confined space entry permits current', name_ar: 'تصاريح دخول الأماكن المحصورة سارية' },
    ],
  },
  {
    category: 'landfill_safety',
    categoryLabel: 'سلامة المدافن',
    items: [
      { name: 'Slope stability assessed', name_ar: 'استقرار المنحدرات مُقيّم' },
      { name: 'Daily cover applied', name_ar: 'الغطاء اليومي مطبق' },
      { name: 'Leachate collection system functional', name_ar: 'نظام تجميع الرشاحة يعمل' },
      { name: 'Access roads maintained', name_ar: 'طرق الوصول مصانة' },
      { name: 'Cell boundaries clearly marked', name_ar: 'حدود الخلايا معلّمة بوضوح' },
      { name: 'Settlement monitoring active', name_ar: 'مراقبة الهبوط نشطة' },
    ],
  },
  {
    category: 'incinerator_safety',
    categoryLabel: 'سلامة المحارق',
    items: [
      { name: 'Combustion temperature monitored', name_ar: 'درجة حرارة الاحتراق مراقبة' },
      { name: 'Emission scrubbers operational', name_ar: 'أجهزة تنقية الانبعاثات تعمل' },
      { name: 'Ash handling procedures safe', name_ar: 'إجراءات التعامل مع الرماد آمنة' },
      { name: 'Feed system interlocks functional', name_ar: 'أقفال أمان نظام التغذية تعمل' },
      { name: 'Stack emission testing current', name_ar: 'اختبار انبعاثات المدخنة محدث' },
    ],
  },
  {
    category: 'hazmat_handling',
    categoryLabel: 'التعامل مع المخلفات الخطرة',
    items: [
      { name: 'Hazmat classification verified', name_ar: 'تصنيف المخلفات الخطرة مُتحقق منه' },
      { name: 'Proper containment used', name_ar: 'الاحتواء المناسب مُستخدم' },
      { name: 'Medical waste treated before disposal', name_ar: 'النفايات الطبية مُعالجة قبل التخلص' },
      { name: 'Chemical compatibility checked', name_ar: 'توافق المواد الكيميائية مفحوص' },
      { name: 'Manifest tracking complete', name_ar: 'تتبع البيان الجمركي مكتمل' },
    ],
  },
  {
    category: 'groundwater_protection',
    categoryLabel: 'حماية المياه الجوفية والتربة',
    items: [
      { name: 'Groundwater monitoring wells sampled', name_ar: 'عينات آبار مراقبة المياه الجوفية مأخوذة' },
      { name: 'Liner integrity verified', name_ar: 'سلامة البطانة مُتحقق منها' },
      { name: 'Leachate quality within limits', name_ar: 'جودة الرشاحة ضمن الحدود' },
      { name: 'Soil contamination testing current', name_ar: 'اختبار تلوث التربة محدث' },
      { name: 'Stormwater management adequate', name_ar: 'إدارة مياه الأمطار كافية' },
    ],
  },
];

// ========== GENERATOR-SPECIFIC ==========
const GENERATOR_CATEGORIES: ChecklistCategory[] = [
  {
    category: 'temp_storage',
    categoryLabel: 'التخزين المؤقت للمخلفات',
    items: [
      { name: 'Storage area designated and labeled', name_ar: 'منطقة التخزين محددة ومُسماة' },
      { name: 'Containers in good condition', name_ar: 'الحاويات في حالة جيدة' },
      { name: 'Storage time limits observed', name_ar: 'حدود وقت التخزين مُلتزم بها' },
      { name: 'Incompatible wastes segregated', name_ar: 'المخلفات غير المتوافقة مفصولة' },
      { name: 'Secondary containment provided', name_ar: 'احتواء ثانوي متوفر' },
      { name: 'Inventory records current', name_ar: 'سجلات المخزون محدثة' },
    ],
  },
  {
    category: 'waste_segregation',
    categoryLabel: 'فصل وتصنيف النفايات',
    items: [
      { name: 'Color-coded bins provided', name_ar: 'حاويات مُلونة حسب النوع متوفرة' },
      { name: 'Waste classification signs posted', name_ar: 'لوحات تصنيف النفايات معلقة' },
      { name: 'Staff trained on segregation', name_ar: 'الموظفون مدربون على الفصل' },
      { name: 'Contamination prevention measures', name_ar: 'إجراءات منع التلوث المتبادل' },
      { name: 'Recyclable materials identified', name_ar: 'المواد القابلة للتدوير محددة' },
    ],
  },
  {
    category: 'loading_zone',
    categoryLabel: 'سلامة مناطق التحميل',
    items: [
      { name: 'Loading area traffic controlled', name_ar: 'حركة المرور في منطقة التحميل مُنظمة' },
      { name: 'Lighting adequate in loading areas', name_ar: 'الإضاءة كافية في مناطق التحميل' },
      { name: 'Pedestrian barriers in place', name_ar: 'حواجز المشاة في مكانها' },
      { name: 'Spill response equipment nearby', name_ar: 'معدات الاستجابة للانسكاب قريبة' },
    ],
  },
  {
    category: 'staff_awareness',
    categoryLabel: 'التوعية البيئية للموظفين',
    items: [
      { name: 'Environmental awareness training conducted', name_ar: 'تم إجراء تدريب التوعية البيئية' },
      { name: 'Waste minimization program active', name_ar: 'برنامج تقليل النفايات نشط' },
      { name: 'Reporting procedures known by staff', name_ar: 'إجراءات الإبلاغ معروفة للموظفين' },
      { name: 'Environmental policy posted', name_ar: 'السياسة البيئية معلقة' },
    ],
  },
  {
    category: 'housekeeping',
    categoryLabel: 'النظافة والترتيب',
    items: [
      { name: 'Work areas clean and organized', name_ar: 'مناطق العمل نظيفة ومنظمة' },
      { name: 'Aisles and walkways clear', name_ar: 'الممرات خالية من العوائق' },
      { name: 'Adequate lighting throughout', name_ar: 'إضاءة كافية في كل مكان' },
      { name: 'Pest control measures in place', name_ar: 'إجراءات مكافحة الآفات متوفرة' },
    ],
  },
];

// Get checklist for a specific facility type
export function getChecklistForFacilityType(facilityType: string): ChecklistCategory[] {
  const specific = (() => {
    switch (facilityType) {
      case 'recycling': return RECYCLER_CATEGORIES;
      case 'transport': return TRANSPORTER_CATEGORIES;
      case 'disposal': return DISPOSAL_CATEGORIES;
      case 'collection': return GENERATOR_CATEGORIES;
      default: return RECYCLER_CATEGORIES;
    }
  })();
  return [...SHARED_CATEGORIES, ...specific];
}

// For backward compat
export const DEFAULT_CHECKLIST = getChecklistForFacilityType('recycling');

export const INSPECTION_TYPE_LABELS: Record<string, string> = {
  routine: 'دوري',
  follow_up: 'متابعة',
  incident: 'بعد حادث',
  pre_operation: 'قبل التشغيل',
  annual: 'سنوي',
};

export const FACILITY_TYPE_LABELS: Record<string, string> = {
  recycling: 'تدوير',
  transport: 'نقل',
  disposal: 'تخلص نهائي',
  collection: 'جمع / توليد',
};

export const RISK_LEVEL_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  low: { label: 'منخفض', color: 'text-green-700', bg: 'bg-green-100' },
  medium: { label: 'متوسط', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  high: { label: 'مرتفع', color: 'text-orange-700', bg: 'bg-orange-100' },
  critical: { label: 'حرج', color: 'text-red-700', bg: 'bg-red-100' },
};

export const STATUS_LABELS: Record<string, string> = {
  draft: 'مسودة',
  in_review: 'قيد المراجعة',
  approved: 'معتمد',
  rejected: 'مرفوض',
  archived: 'مؤرشف',
};

export const CHECKLIST_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  compliant: { label: 'ممتثل', color: 'text-green-600' },
  non_compliant: { label: 'غير ممتثل', color: 'text-red-600' },
  partial: { label: 'جزئي', color: 'text-yellow-600' },
  not_applicable: { label: 'لا ينطبق', color: 'text-muted-foreground' },
  not_checked: { label: 'لم يُفحص', color: 'text-muted-foreground' },
};

export function useOHSInspections() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const orgId = profile?.organization_id;

  const { data: inspections = [], isLoading } = useQuery({
    queryKey: ['ohs-inspections', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('ohs_inspections')
        .select('*')
        .eq('organization_id', orgId)
        .order('inspection_date', { ascending: false });
      if (error) throw error;
      return data as unknown as OHSInspection[];
    },
    enabled: !!orgId,
  });

  const createInspection = useMutation({
    mutationFn: async (input: Partial<OHSInspection> & { checklist?: boolean }) => {
      const { checklist, ...inspectionData } = input;
      const facilityType = inspectionData.facility_type || 'recycling';
      const { data, error } = await supabase
        .from('ohs_inspections')
        .insert({
          organization_id: orgId!,
          inspector_name: inspectionData.inspector_name || profile?.full_name || '',
          facility_name: inspectionData.facility_name || '',
          inspection_type: inspectionData.inspection_type || 'routine',
          facility_type: facilityType,
          summary: inspectionData.summary,
          facility_address: inspectionData.facility_address,
          employees_present: inspectionData.employees_present,
          weather_conditions: inspectionData.weather_conditions,
          consultant_id: inspectionData.consultant_id,
          inspector_title: inspectionData.inspector_title,
          report_number: '',
          created_by: profile?.id,
        } as any)
        .select()
        .single();
      if (error) throw error;

      // Auto-populate facility-specific checklist
      if (checklist !== false) {
        const template = getChecklistForFacilityType(facilityType);
        const items = template.flatMap((cat, ci) =>
          cat.items.map((item, ii) => ({
            inspection_id: data.id,
            category: cat.category,
            item_name: item.name,
            item_name_ar: item.name_ar,
            sort_order: ci * 100 + ii,
          }))
        );
        await supabase.from('ohs_checklist_items').insert(items as any);
      }

      return data as unknown as OHSInspection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ohs-inspections'] });
      toast.success('تم إنشاء تقرير الفحص بنجاح');
    },
    onError: (e: any) => toast.error(e.message || 'حدث خطأ'),
  });

  const updateInspection = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<OHSInspection> & { id: string }) => {
      const { error } = await supabase
        .from('ohs_inspections')
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ohs-inspections'] });
      toast.success('تم تحديث التقرير');
    },
  });

  const fetchChecklist = async (inspectionId: string) => {
    const { data, error } = await supabase
      .from('ohs_checklist_items')
      .select('*')
      .eq('inspection_id', inspectionId)
      .order('sort_order');
    if (error) throw error;
    return data as unknown as OHSChecklistItem[];
  };

  const updateChecklistItem = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<OHSChecklistItem> & { id: string }) => {
      const { error } = await supabase
        .from('ohs_checklist_items')
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
    },
  });

  // Consultant: add custom checklist item
  const addChecklistItem = useMutation({
    mutationFn: async (input: { inspection_id: string; category: string; item_name: string; item_name_ar: string; severity?: string }) => {
      const { data: maxOrder } = await supabase
        .from('ohs_checklist_items')
        .select('sort_order')
        .eq('inspection_id', input.inspection_id)
        .eq('category', input.category)
        .order('sort_order', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { error } = await supabase
        .from('ohs_checklist_items')
        .insert({
          inspection_id: input.inspection_id,
          category: input.category,
          item_name: input.item_name,
          item_name_ar: input.item_name_ar,
          severity: input.severity || 'medium',
          sort_order: ((maxOrder as any)?.sort_order || 0) + 1,
        } as any);
      if (error) throw error;
    },
    onSuccess: () => toast.success('تم إضافة عنصر الفحص'),
    onError: (e: any) => toast.error(e.message || 'حدث خطأ'),
  });

  // Consultant: delete checklist item
  const deleteChecklistItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ohs_checklist_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => toast.success('تم حذف عنصر الفحص'),
  });

  const fetchCorrectiveActions = async (inspectionId: string) => {
    const { data, error } = await supabase
      .from('ohs_corrective_actions')
      .select('*')
      .eq('inspection_id', inspectionId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as unknown as OHSCorrectiveAction[];
  };

  const createCorrectiveAction = useMutation({
    mutationFn: async (input: Partial<OHSCorrectiveAction>) => {
      const { error } = await supabase
        .from('ohs_corrective_actions')
        .insert(input as any);
      if (error) throw error;
    },
    onSuccess: () => toast.success('تم إضافة الإجراء التصحيحي'),
  });

  return {
    inspections,
    isLoading,
    createInspection,
    updateInspection,
    fetchChecklist,
    updateChecklistItem,
    addChecklistItem,
    deleteChecklistItem,
    fetchCorrectiveActions,
    createCorrectiveAction,
  };
}
