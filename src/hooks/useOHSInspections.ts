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

// Default checklist template
export const DEFAULT_CHECKLIST: { category: string; categoryLabel: string; items: { name: string; name_ar: string }[] }[] = [
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
      { name: 'Fire drill conducted recently', name_ar: 'تم إجراء تدريب إخلاء مؤخراً' },
    ],
  },
  {
    category: 'chemical',
    categoryLabel: 'السلامة الكيميائية',
    items: [
      { name: 'MSDS sheets available', name_ar: 'صحائف بيانات السلامة (MSDS) متوفرة' },
      { name: 'Chemical storage proper', name_ar: 'تخزين المواد الكيميائية سليم' },
      { name: 'Spill kits available', name_ar: 'أدوات التعامل مع الانسكابات متوفرة' },
      { name: 'Labeling and signage correct', name_ar: 'العلامات والتسميات صحيحة' },
    ],
  },
  {
    category: 'electrical',
    categoryLabel: 'السلامة الكهربائية',
    items: [
      { name: 'Electrical panels accessible', name_ar: 'لوحات الكهرباء يمكن الوصول إليها' },
      { name: 'No exposed wiring', name_ar: 'لا توجد أسلاك مكشوفة' },
      { name: 'Grounding systems intact', name_ar: 'أنظمة التأريض سليمة' },
      { name: 'Lockout/Tagout procedures followed', name_ar: 'إجراءات القفل/العلامات متبعة' },
    ],
  },
  {
    category: 'housekeeping',
    categoryLabel: 'النظافة والترتيب',
    items: [
      { name: 'Work areas clean and organized', name_ar: 'مناطق العمل نظيفة ومنظمة' },
      { name: 'Aisles and walkways clear', name_ar: 'الممرات خالية من العوائق' },
      { name: 'Waste properly segregated', name_ar: 'النفايات مفصولة بشكل صحيح' },
      { name: 'Adequate lighting', name_ar: 'إضاءة كافية' },
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
      { name: 'Operator certifications current', name_ar: 'شهادات المشغلين سارية' },
      { name: 'Safety records maintained', name_ar: 'سجلات السلامة محفوظة' },
    ],
  },
  {
    category: 'env_monitoring',
    categoryLabel: 'الرصد البيئي',
    items: [
      { name: 'Air quality monitoring', name_ar: 'مراقبة جودة الهواء' },
      { name: 'Noise levels within limits', name_ar: 'مستويات الضوضاء ضمن الحدود' },
      { name: 'Dust control measures', name_ar: 'إجراءات التحكم في الأتربة' },
      { name: 'Wastewater management', name_ar: 'إدارة المياه المستعملة' },
    ],
  },
];

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
  collection: 'جمع',
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
  not_applicable: { label: 'لا ينطبق', color: 'text-gray-400' },
  not_checked: { label: 'لم يُفحص', color: 'text-gray-500' },
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
      const { data, error } = await supabase
        .from('ohs_inspections')
        .insert({
          organization_id: orgId!,
          inspector_name: inspectionData.inspector_name || profile?.full_name || '',
          facility_name: inspectionData.facility_name || '',
          inspection_type: inspectionData.inspection_type || 'routine',
          facility_type: inspectionData.facility_type || 'recycling',
          summary: inspectionData.summary,
          facility_address: inspectionData.facility_address,
          employees_present: inspectionData.employees_present,
          weather_conditions: inspectionData.weather_conditions,
          consultant_id: inspectionData.consultant_id,
          inspector_title: inspectionData.inspector_title,
          report_number: '', // auto-generated
          created_by: profile?.id,
        } as any)
        .select()
        .single();
      if (error) throw error;

      // Auto-populate checklist
      if (checklist !== false) {
        const items = DEFAULT_CHECKLIST.flatMap((cat, ci) =>
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
    fetchCorrectiveActions,
    createCorrectiveAction,
  };
}
