import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export interface ContractTemplate {
  id: string;
  organization_id: string;
  created_by: string | null;
  name: string;
  description: string | null;
  partner_type: 'generator' | 'recycler' | 'both';
  template_type: 'system' | 'custom';
  contract_category: 'collection' | 'transport' | 'collection_transport' | 'recycling' | 'other';
  header_text: string | null;
  introduction_text: string | null;
  terms_template: string | null;
  obligations_party_one: string | null;
  obligations_party_two: string | null;
  payment_terms_template: string | null;
  duration_clause: string | null;
  termination_clause: string | null;
  dispute_resolution: string | null;
  closing_text: string | null;
  include_stamp: boolean;
  include_signature: boolean;
  include_header_logo: boolean;
  is_active: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateContractTemplateInput {
  name: string;
  description?: string;
  partner_type: 'generator' | 'recycler' | 'both';
  contract_category: 'collection' | 'transport' | 'collection_transport' | 'recycling' | 'other';
  header_text?: string;
  introduction_text?: string;
  terms_template?: string;
  obligations_party_one?: string;
  obligations_party_two?: string;
  payment_terms_template?: string;
  duration_clause?: string;
  termination_clause?: string;
  dispute_resolution?: string;
  closing_text?: string;
  include_stamp?: boolean;
  include_signature?: boolean;
  include_header_logo?: boolean;
}

export const partnerTypeLabels: Record<string, string> = {
  generator: 'جهات مولدة',
  recycler: 'جهات تدوير',
  both: 'جميع الجهات',
};

export const contractCategoryLabels: Record<string, string> = {
  collection: 'عقد جمع',
  transport: 'عقد نقل',
  collection_transport: 'عقد جمع ونقل',
  recycling: 'عقد تدوير',
  other: 'أخرى',
};

export const useContractTemplates = () => {
  const { organization, profile } = useAuth();
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = useCallback(async () => {
    if (!organization?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .or(`organization_id.eq.${organization.id},template_type.eq.system`)
        .eq('is_active', true)
        .order('template_type', { ascending: false })
        .order('usage_count', { ascending: false });

      if (error) throw error;
      
      const typedTemplates = (data || []).map(t => ({
        ...t,
        partner_type: t.partner_type as 'generator' | 'recycler' | 'both',
        template_type: t.template_type as 'system' | 'custom',
        contract_category: t.contract_category as 'collection' | 'transport' | 'collection_transport' | 'recycling' | 'other',
      })) as ContractTemplate[];
      
      setTemplates(typedTemplates);
    } catch (error) {
      console.error('Error fetching contract templates:', error);
      toast.error('حدث خطأ أثناء تحميل قوالب العقود');
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  const createTemplate = async (input: CreateContractTemplateInput): Promise<ContractTemplate | null> => {
    if (!organization?.id || !profile?.id) {
      toast.error('يجب تسجيل الدخول أولاً');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('contract_templates')
        .insert({
          organization_id: organization.id,
          created_by: profile.id,
          template_type: 'custom',
          ...input,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('تم إنشاء قالب العقد بنجاح');
      fetchTemplates();
      return data as ContractTemplate;
    } catch (error) {
      console.error('Error creating contract template:', error);
      toast.error('حدث خطأ أثناء إنشاء قالب العقد');
      return null;
    }
  };

  const updateTemplate = async (id: string, updates: Partial<CreateContractTemplateInput>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('contract_templates')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast.success('تم تحديث قالب العقد بنجاح');
      fetchTemplates();
      return true;
    } catch (error) {
      console.error('Error updating contract template:', error);
      toast.error('حدث خطأ أثناء تحديث قالب العقد');
      return false;
    }
  };

  const deleteTemplate = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('contract_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('تم حذف قالب العقد بنجاح');
      fetchTemplates();
      return true;
    } catch (error) {
      console.error('Error deleting contract template:', error);
      toast.error('حدث خطأ أثناء حذف قالب العقد');
      return false;
    }
  };

  const incrementUsage = async (id: string): Promise<void> => {
    try {
      const template = templates.find(t => t.id === id);
      if (!template) return;

      await supabase
        .from('contract_templates')
        .update({ usage_count: (template.usage_count || 0) + 1 })
        .eq('id', id);
    } catch (error) {
      console.error('Error incrementing usage:', error);
    }
  };

  const getTemplatesByPartnerType = (partnerType: 'generator' | 'recycler') => {
    return templates.filter(t => t.partner_type === partnerType || t.partner_type === 'both');
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
    getTemplatesByPartnerType,
  };
};

export default useContractTemplates;
