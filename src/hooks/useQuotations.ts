import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/AuthContext';
import { toast } from 'sonner';

export interface QuotationItem {
  id?: string;
  quotation_id?: string;
  item_order: number;
  description: string;
  unit: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
}

export interface Quotation {
  id?: string;
  quotation_number: string;
  organization_id: string;
  created_by?: string;
  client_type: 'registered' | 'unregistered';
  client_organization_id?: string;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  client_address?: string;
  client_tax_number?: string;
  title: string;
  description?: string;
  entity_type: string;
  template_id?: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  status: string;
  valid_until?: string;
  sent_at?: string;
  terms_and_conditions?: string;
  notes?: string;
  payment_terms?: string;
  delivery_terms?: string;
  created_at?: string;
  updated_at?: string;
  items?: QuotationItem[];
  // Joined
  client_organization?: { name_ar: string; name_en: string } | null;
  organization?: { name_ar: string; name_en: string; logo_url: string } | null;
}

export const useQuotations = (organizationId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const quotationsQuery = useQuery({
    queryKey: ['quotations', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('quotations')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Quotation[];
    },
    enabled: !!organizationId,
  });

  // Received quotations (where this org is the client)
  const receivedQuery = useQuery({
    queryKey: ['quotations-received', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('quotations')
        .select('*')
        .eq('client_organization_id', organizationId)
        .in('status', ['sent', 'viewed'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Quotation[];
    },
    enabled: !!organizationId,
  });

  const createQuotation = useMutation({
    mutationFn: async (data: { quotation: Partial<Quotation>; items: QuotationItem[] }) => {
      const qNum = `QT-${Date.now().toString(36).toUpperCase()}`;
      const { data: q, error } = await supabase
        .from('quotations')
        .insert({ ...data.quotation, quotation_number: qNum, created_by: user?.id } as any)
        .select()
        .single();
      if (error) throw error;

      if (data.items.length > 0) {
        const itemsWithId = data.items.map((item, idx) => ({
          ...item,
          quotation_id: q.id,
          item_order: idx + 1,
        }));
        const { error: itemsError } = await supabase.from('quotation_items').insert(itemsWithId as any);
        if (itemsError) throw itemsError;
      }
      return q;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('تم إنشاء عرض السعر بنجاح');
    },
    onError: (e: any) => toast.error(e.message || 'فشل في إنشاء عرض السعر'),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, rejection_reason }: { id: string; status: string; rejection_reason?: string }) => {
      const updates: any = { status, updated_at: new Date().toISOString() };
      if (status === 'sent') updates.sent_at = new Date().toISOString();
      if (status === 'viewed') updates.viewed_at = new Date().toISOString();
      if (status === 'accepted' || status === 'rejected') updates.responded_at = new Date().toISOString();
      if (rejection_reason) updates.rejection_reason = rejection_reason;
      
      const { error } = await supabase.from('quotations').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['quotations-received'] });
      toast.success('تم تحديث حالة العرض');
    },
  });

  const deleteQuotation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('quotations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('تم حذف عرض السعر');
    },
  });

  const getQuotationItems = async (quotationId: string) => {
    const { data, error } = await supabase
      .from('quotation_items')
      .select('*')
      .eq('quotation_id', quotationId)
      .order('item_order');
    if (error) throw error;
    return data;
  };

  return {
    quotations: quotationsQuery.data || [],
    receivedQuotations: receivedQuery.data || [],
    isLoading: quotationsQuery.isLoading,
    createQuotation,
    updateStatus,
    deleteQuotation,
    getQuotationItems,
  };
};
