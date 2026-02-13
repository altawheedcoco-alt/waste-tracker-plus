import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CustomWasteType {
  id: string;
  name: string;
  code: string;
  category: 'hazardous' | 'non-hazardous';
  parent_category: string;
  hazard_level?: 'low' | 'medium' | 'high' | 'critical' | null;
  recyclable?: boolean;
  organization_id: string;
  created_at: string;
}

export const useCustomWasteTypes = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const orgId = organization?.id;

  const { data: customWasteTypes = [], isLoading } = useQuery({
    queryKey: ['custom-waste-types', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('custom_waste_types')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as CustomWasteType[];
    },
    enabled: !!orgId,
  });

  const addMutation = useMutation({
    mutationFn: async (wasteType: { name: string; code: string; category: 'hazardous' | 'non-hazardous'; parent_category: string; hazard_level?: string; recyclable?: boolean }) => {
      if (!orgId) throw new Error('No organization');
      const { data, error } = await supabase
        .from('custom_waste_types')
        .insert({ ...wasteType, organization_id: orgId } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-waste-types', orgId] });
      toast.success('تم إضافة الصنف بنجاح');
    },
    onError: (err: any) => {
      if (err?.code === '23505') {
        toast.error('هذا الكود مستخدم بالفعل');
      } else {
        toast.error('فشل في إضافة الصنف');
      }
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('custom_waste_types')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-waste-types', orgId] });
      toast.success('تم حذف الصنف');
    },
  });

  const addCustomWasteType = (wasteType: { name: string; code: string; category: 'hazardous' | 'non-hazardous'; parent_category: string; hazard_level?: string; recyclable?: boolean }) => {
    addMutation.mutate(wasteType);
  };

  const removeCustomWasteType = (id: string) => {
    removeMutation.mutate(id);
  };

  const getCustomHazardousTypes = () =>
    customWasteTypes.filter(type => type.category === 'hazardous');

  const getCustomNonHazardousTypes = () =>
    customWasteTypes.filter(type => type.category === 'non-hazardous');

  return {
    customWasteTypes,
    isLoading,
    addCustomWasteType,
    removeCustomWasteType,
    getCustomHazardousTypes,
    getCustomNonHazardousTypes,
  };
};

// Static function for components that don't use the hook
export const getStoredCustomWasteTypes = async (organizationId: string): Promise<CustomWasteType[]> => {
  const { data } = await supabase
    .from('custom_waste_types')
    .select('*')
    .eq('organization_id', organizationId);
  return (data || []) as unknown as CustomWasteType[];
};
