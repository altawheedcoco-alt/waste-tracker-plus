import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Customer {
  id: string;
  organization_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  city: string | null;
  status: 'active' | 'inactive' | 'lead' | 'prospect';
  source: string | null;
  notes: string | null;
  total_purchases: number;
  last_contact_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type CustomerFormData = Omit<Customer, 'id' | 'organization_id' | 'created_by' | 'created_at' | 'updated_at'>;

export const useCustomers = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Customer[];
    },
    enabled: !!organization?.id,
  });

  const createCustomer = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      if (!organization?.id) throw new Error("No organization");
      const { data: result, error } = await supabase
        .from("customers")
        .insert({ ...data, organization_id: organization.id })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("تم إضافة العميل بنجاح");
    },
    onError: (error) => {
      toast.error("فشل في إضافة العميل: " + error.message);
    },
  });

  const updateCustomer = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CustomerFormData> }) => {
      const { data: result, error } = await supabase
        .from("customers")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("تم تحديث العميل بنجاح");
    },
    onError: (error) => {
      toast.error("فشل في تحديث العميل: " + error.message);
    },
  });

  const deleteCustomer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("تم حذف العميل بنجاح");
    },
    onError: (error) => {
      toast.error("فشل في حذف العميل: " + error.message);
    },
  });

  // Stats
  const stats = {
    total: customers.length,
    active: customers.filter(c => c.status === 'active').length,
    leads: customers.filter(c => c.status === 'lead').length,
    prospects: customers.filter(c => c.status === 'prospect').length,
    totalPurchases: customers.reduce((sum, c) => sum + (c.total_purchases || 0), 0),
  };

  return {
    customers,
    isLoading,
    stats,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  };
};
