import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export interface ReportTemplate {
  id: string;
  organization_id: string;
  created_by: string | null;
  name: string;
  description: string | null;
  template_type: 'system' | 'custom';
  waste_category: 'hazardous' | 'non_hazardous' | 'medical_hazardous' | 'all';
  waste_types: string[];
  opening_declaration: string | null;
  processing_details_template: string | null;
  closing_declaration: string | null;
  custom_fields: any[];
  include_qr_code: boolean;
  include_barcode: boolean;
  include_stamp: boolean;
  include_signature: boolean;
  is_active: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateInput {
  name: string;
  description?: string;
  waste_category: 'hazardous' | 'non_hazardous' | 'medical_hazardous' | 'all';
  waste_types?: string[];
  opening_declaration?: string;
  processing_details_template?: string;
  closing_declaration?: string;
  custom_fields?: any[];
  include_qr_code?: boolean;
  include_barcode?: boolean;
  include_stamp?: boolean;
  include_signature?: boolean;
}

// System templates for different waste categories
export const systemTemplates: Omit<ReportTemplate, 'id' | 'organization_id' | 'created_by' | 'created_at' | 'updated_at' | 'usage_count'>[] = [
  {
    name: 'تقرير المخلفات الخطرة القياسي',
    description: 'تقرير رسمي لإعادة تدوير المخلفات الخطرة وفق المتطلبات البيئية',
    template_type: 'system',
    waste_category: 'hazardous',
    waste_types: ['chemical', 'electronic'],
    opening_declaration: 'نقر نحن جهة إعادة التدوير المعتمدة أن الشحنة الموضحة أدناه قد تم استلامها وفق الإجراءات المعمول بها لنقل المخلفات الخطرة، وسيتم التعامل معها وفقاً للأنظمة واللوائح البيئية المعمول بها في المملكة العربية السعودية.',
    processing_details_template: 'تم معالجة المخلفات الخطرة باستخدام التقنيات المعتمدة بيئياً وتم التخلص منها بطريقة آمنة تتوافق مع اشتراطات هيئة البيئة.',
    closing_declaration: 'نؤكد أن عملية إعادة التدوير قد تمت بالكامل وفقاً للمعايير والمتطلبات البيئية والقانونية والصناعية المنظمة، وأن جميع المخلفات الخطرة قد تم التعامل معها والتخلص منها بطريقة آمنة تحافظ على البيئة والصحة العامة.',
    custom_fields: [],
    include_qr_code: true,
    include_barcode: true,
    include_stamp: true,
    include_signature: true,
    is_active: true,
  },
  {
    name: 'تقرير المخلفات غير الخطرة',
    description: 'تقرير قياسي لإعادة تدوير المخلفات غير الخطرة',
    template_type: 'system',
    waste_category: 'non_hazardous',
    waste_types: ['plastic', 'paper', 'metal', 'glass', 'organic', 'construction', 'other'],
    opening_declaration: 'نقر نحن جهة إعادة التدوير المعتمدة باستلام الشحنة الموضحة أدناه من المخلفات غير الخطرة، وسيتم إعادة تدويرها وفق أفضل الممارسات البيئية.',
    processing_details_template: 'تم فرز ومعالجة المخلفات وإعادة تدويرها لإنتاج مواد خام ثانوية قابلة للاستخدام.',
    closing_declaration: 'نؤكد إتمام عملية إعادة التدوير بنجاح وفق المعايير البيئية المعتمدة، وتم تحقيق نسبة استرداد عالية من المواد.',
    custom_fields: [],
    include_qr_code: true,
    include_barcode: true,
    include_stamp: true,
    include_signature: true,
    is_active: true,
  },
  {
    name: 'تقرير المخلفات الطبية الخطرة',
    description: 'تقرير متخصص للتعامل مع المخلفات الطبية الخطرة',
    template_type: 'system',
    waste_category: 'medical_hazardous',
    waste_types: ['medical'],
    opening_declaration: 'نقر نحن جهة المعالجة والتخلص من المخلفات الطبية المرخصة باستلام الشحنة الموضحة أدناه من المخلفات الطبية الخطرة، وسيتم التعامل معها وفق بروتوكولات السلامة الحيوية والمعايير الصحية المعتمدة.',
    processing_details_template: 'تم معالجة المخلفات الطبية باستخدام تقنية [الأوتوكلاف/الحرق/التعقيم] المعتمدة، وتم التأكد من القضاء على جميع الميكروبات والملوثات الحيوية وفق المعايير الدولية.',
    closing_declaration: 'نؤكد أن المخلفات الطبية الخطرة قد تم التعامل معها والتخلص منها بشكل نهائي وآمن، بما يتوافق مع اللوائح الصحية والبيئية الصادرة من وزارة الصحة ووزارة البيئة والمياه والزراعة، وأن جميع العمليات تمت تحت إشراف فني متخصص.',
    custom_fields: [
      { name: 'تقنية المعالجة', type: 'select', options: ['الأوتوكلاف', 'الحرق الآمن', 'التعقيم الكيميائي', 'أخرى'] },
      { name: 'درجة حرارة المعالجة', type: 'text' },
      { name: 'مدة المعالجة', type: 'text' },
    ],
    include_qr_code: true,
    include_barcode: true,
    include_stamp: true,
    include_signature: true,
    is_active: true,
  },
  {
    name: 'تقرير شامل متعدد الأنواع',
    description: 'تقرير عام يناسب جميع أنواع المخلفات',
    template_type: 'system',
    waste_category: 'all',
    waste_types: [],
    opening_declaration: 'نقر نحن جهة إعادة التدوير المعتمدة باستلام الشحنة الموضحة أدناه وسيتم التعامل معها وفق المعايير والإجراءات المعتمدة.',
    processing_details_template: 'تم معالجة المخلفات وإعادة تدويرها باستخدام التقنيات المناسبة لنوع المخلفات.',
    closing_declaration: 'نؤكد أن عملية إعادة التدوير قد تمت بالكامل وفقاً للمعايير والمتطلبات البيئية والقانونية والصناعية المنظمة.',
    custom_fields: [],
    include_qr_code: true,
    include_barcode: true,
    include_stamp: true,
    include_signature: true,
    is_active: true,
  },
];

// Determine waste category from waste type
export const getWasteCategoryFromType = (wasteType: string): 'hazardous' | 'non_hazardous' | 'medical_hazardous' => {
  const hazardousTypes = ['chemical', 'electronic'];
  const medicalTypes = ['medical'];
  
  if (medicalTypes.includes(wasteType)) return 'medical_hazardous';
  if (hazardousTypes.includes(wasteType)) return 'hazardous';
  return 'non_hazardous';
};

// Get applicable templates for a waste type
export const getApplicableTemplates = (templates: ReportTemplate[], wasteType: string): ReportTemplate[] => {
  const category = getWasteCategoryFromType(wasteType);
  
  return templates.filter(t => {
    // Template applies to all categories
    if (t.waste_category === 'all') return true;
    // Template category matches waste category
    if (t.waste_category === category) return true;
    // Template specifically lists this waste type
    if (t.waste_types && t.waste_types.includes(wasteType)) return true;
    return false;
  });
};

export const useReportTemplates = () => {
  const { organization, profile } = useAuth();
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = useCallback(async () => {
    if (!organization?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('report_templates')
        .select('*')
        .or(`organization_id.eq.${organization.id},template_type.eq.system`)
        .eq('is_active', true)
        .order('template_type', { ascending: false })
        .order('usage_count', { ascending: false });

      if (error) throw error;
      
      // Cast the data to our type
      const typedTemplates = (data || []).map(t => ({
        ...t,
        template_type: t.template_type as 'system' | 'custom',
        waste_category: t.waste_category as 'hazardous' | 'non_hazardous' | 'medical_hazardous' | 'all',
        waste_types: (t.waste_types as string[]) || [],
        custom_fields: (t.custom_fields as any[]) || [],
      })) as ReportTemplate[];
      
      setTemplates(typedTemplates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('حدث خطأ أثناء تحميل القوالب');
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  const createTemplate = async (input: CreateTemplateInput): Promise<ReportTemplate | null> => {
    if (!organization?.id || !profile?.id) {
      toast.error('يجب تسجيل الدخول أولاً');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('report_templates')
        .insert({
          organization_id: organization.id,
          created_by: profile.id,
          template_type: 'custom',
          ...input,
          waste_types: input.waste_types || [],
          custom_fields: input.custom_fields || [],
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('تم إنشاء القالب بنجاح');
      fetchTemplates();
      return data as ReportTemplate;
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('حدث خطأ أثناء إنشاء القالب');
      return null;
    }
  };

  const updateTemplate = async (id: string, updates: Partial<CreateTemplateInput>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('report_templates')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast.success('تم تحديث القالب بنجاح');
      fetchTemplates();
      return true;
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('حدث خطأ أثناء تحديث القالب');
      return false;
    }
  };

  const deleteTemplate = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('report_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('تم حذف القالب بنجاح');
      fetchTemplates();
      return true;
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('حدث خطأ أثناء حذف القالب');
      return false;
    }
  };

  const incrementUsage = async (id: string): Promise<void> => {
    try {
      const template = templates.find(t => t.id === id);
      if (!template) return;

      await supabase
        .from('report_templates')
        .update({ usage_count: (template.usage_count || 0) + 1 })
        .eq('id', id);
    } catch (error) {
      console.error('Error incrementing usage:', error);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return {
    templates,
    loading,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    incrementUsage,
    getApplicableTemplates: (wasteType: string) => getApplicableTemplates(templates, wasteType),
    systemTemplates,
  };
};

export default useReportTemplates;