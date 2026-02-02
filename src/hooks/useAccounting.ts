import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Invoice {
  id: string;
  invoice_number: string;
  organization_id: string;
  partner_organization_id?: string;
  partner_name?: string;
  invoice_type: 'sales' | 'purchase' | 'service';
  invoice_category: 'shipment' | 'service' | 'expense' | 'other';
  status: 'draft' | 'pending' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';
  issue_date: string;
  due_date?: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  currency: string;
  notes?: string;
  terms?: string;
  created_at: string;
  partner_organization?: { name: string; };
}

export interface InvoiceItem {
  id?: string;
  invoice_id?: string;
  shipment_id?: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  waste_type?: string;
  waste_quantity?: number;
}

export interface Payment {
  id: string;
  payment_number: string;
  organization_id: string;
  invoice_id?: string;
  partner_organization_id?: string;
  partner_name?: string;
  payment_type: 'incoming' | 'outgoing';
  payment_method: 'cash' | 'bank_transfer' | 'check' | 'card' | 'other';
  amount: number;
  currency: string;
  payment_date: string;
  reference_number?: string;
  bank_name?: string;
  check_number?: string;
  status: 'pending' | 'completed' | 'cancelled' | 'bounced';
  notes?: string;
  created_at: string;
  partner_organization?: { name: string; };
  invoice?: { invoice_number: string; };
}

export interface Expense {
  id: string;
  expense_number: string;
  organization_id: string;
  category: string;
  subcategory?: string;
  description: string;
  amount: number;
  currency: string;
  expense_date: string;
  shipment_id?: string;
  driver_id?: string;
  vehicle_plate?: string;
  payment_method: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  shipment?: { shipment_number: string; };
  driver?: { profiles: { full_name: string; } };
}

export interface PartnerBalance {
  id: string;
  organization_id: string;
  partner_organization_id: string;
  total_invoiced: number;
  total_paid: number;
  balance: number;
  last_transaction_date?: string;
  partner_organization?: { name: string; };
}

export interface FinancialSummary {
  totalReceivables: number;
  totalPayables: number;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  pendingInvoices: number;
  overdueInvoices: number;
}

export const useAccounting = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const orgId = organization?.id;

  // Fetch invoices
  const { data: invoices = [], isLoading: invoicesLoading, refetch: refetchInvoices } = useQuery({
    queryKey: ['invoices', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          partner_organization:organizations!invoices_partner_organization_id_fkey(name)
        `)
        .or(`organization_id.eq.${orgId},partner_organization_id.eq.${orgId}`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as Invoice[];
    },
    enabled: !!orgId,
  });

  // Fetch payments
  const { data: payments = [], isLoading: paymentsLoading, refetch: refetchPayments } = useQuery({
    queryKey: ['payments', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          partner_organization:organizations!payments_partner_organization_id_fkey(name),
          invoice:invoices!payments_invoice_id_fkey(invoice_number)
        `)
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as Payment[];
    },
    enabled: !!orgId,
  });

  // Fetch expenses
  const { data: expenses = [], isLoading: expensesLoading, refetch: refetchExpenses } = useQuery({
    queryKey: ['expenses', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          shipment:shipment_id(shipment_number)
        `)
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Expense[];
    },
    enabled: !!orgId,
  });

  // Fetch partner balances
  const { data: partnerBalances = [], isLoading: balancesLoading } = useQuery({
    queryKey: ['partner-balances', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('partner_balances')
        .select(`
          *,
          partner_organization:organizations!partner_balances_partner_organization_id_fkey(name)
        `)
        .eq('organization_id', orgId);
      
      if (error) throw error;
      return data as unknown as PartnerBalance[];
    },
    enabled: !!orgId,
  });

  // Calculate financial summary
  const financialSummary: FinancialSummary = {
    totalReceivables: invoices
      .filter(inv => inv.organization_id === orgId && inv.status !== 'paid' && inv.status !== 'cancelled')
      .reduce((sum, inv) => sum + (inv.remaining_amount || 0), 0),
    totalPayables: invoices
      .filter(inv => inv.partner_organization_id === orgId && inv.status !== 'paid' && inv.status !== 'cancelled')
      .reduce((sum, inv) => sum + (inv.remaining_amount || 0), 0),
    totalIncome: payments
      .filter(p => p.payment_type === 'incoming' && p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0),
    totalExpenses: expenses
      .filter(e => e.status === 'approved')
      .reduce((sum, e) => sum + e.amount, 0),
    netBalance: 0,
    pendingInvoices: invoices.filter(inv => inv.status === 'pending' || inv.status === 'sent').length,
    overdueInvoices: invoices.filter(inv => inv.status === 'overdue').length,
  };
  financialSummary.netBalance = financialSummary.totalIncome - financialSummary.totalExpenses;

  // Create invoice mutation
  const createInvoice = useMutation({
    mutationFn: async (invoiceData: Partial<Invoice> & { items?: InvoiceItem[] }) => {
      const { items, ...invoice } = invoiceData;
      
      const { data: newInvoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          ...invoice,
          organization_id: orgId,
          invoice_number: '', // Will be generated by trigger
        })
        .select()
        .single();
      
      if (invoiceError) throw invoiceError;
      
      if (items && items.length > 0) {
        const itemsWithInvoiceId = items.map(item => ({
          ...item,
          invoice_id: newInvoice.id,
        }));
        
        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(itemsWithInvoiceId);
        
        if (itemsError) throw itemsError;
      }
      
      return newInvoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('تم إنشاء الفاتورة بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في إنشاء الفاتورة: ' + error.message);
    },
  });

  // Create payment mutation
  const createPayment = useMutation({
    mutationFn: async (paymentData: Partial<Payment>) => {
      const insertData = {
        payment_number: '', // Will be generated by trigger
        payment_type: paymentData.payment_type || 'incoming',
        payment_method: paymentData.payment_method || 'cash',
        amount: paymentData.amount || 0,
        currency: paymentData.currency || 'EGP',
        payment_date: paymentData.payment_date || new Date().toISOString().split('T')[0],
        organization_id: orgId!,
        partner_organization_id: paymentData.partner_organization_id || null,
        partner_name: paymentData.partner_name || null,
        invoice_id: paymentData.invoice_id || null,
        reference_number: paymentData.reference_number || null,
        bank_name: paymentData.bank_name || null,
        check_number: paymentData.check_number || null,
        status: paymentData.status || 'completed',
        notes: paymentData.notes || null,
      };
      
      const { data, error } = await supabase
        .from('payments')
        .insert([insertData])
        .select()
        .single();
      
      if (error) throw error;
      
      // Update invoice paid amount if linked to invoice
      if (paymentData.invoice_id) {
        const invoice = invoices.find(inv => inv.id === paymentData.invoice_id);
        if (invoice) {
          const newPaidAmount = (invoice.paid_amount || 0) + (paymentData.amount || 0);
          await supabase
            .from('invoices')
            .update({ 
              paid_amount: newPaidAmount,
              remaining_amount: invoice.total_amount - newPaidAmount,
              status: newPaidAmount >= invoice.total_amount ? 'paid' : 'partial'
            })
            .eq('id', paymentData.invoice_id);
        }
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['partner-balances'] });
      toast.success('تم تسجيل الدفعة بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في تسجيل الدفعة: ' + error.message);
    },
  });

  // Create expense mutation
  const createExpense = useMutation({
    mutationFn: async (expenseData: Partial<Expense>) => {
      const insertData = {
        expense_number: '', // Will be generated by trigger
        category: expenseData.category || 'other',
        description: expenseData.description || '',
        amount: expenseData.amount || 0,
        currency: expenseData.currency || 'EGP',
        expense_date: expenseData.expense_date || new Date().toISOString().split('T')[0],
        organization_id: orgId!,
        subcategory: expenseData.subcategory || null,
        shipment_id: expenseData.shipment_id || null,
        driver_id: expenseData.driver_id || null,
        vehicle_plate: expenseData.vehicle_plate || null,
        payment_method: expenseData.payment_method || 'cash',
        status: expenseData.status || 'approved',
      };
      
      const { data, error } = await supabase
        .from('expenses')
        .insert([insertData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('تم تسجيل المصروف بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في تسجيل المصروف: ' + error.message);
    },
  });

  // Update invoice status
  const updateInvoiceStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('invoices')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('تم تحديث حالة الفاتورة');
    },
  });

  return {
    invoices,
    payments,
    expenses,
    partnerBalances,
    financialSummary,
    invoicesLoading,
    paymentsLoading,
    expensesLoading,
    balancesLoading,
    createInvoice,
    createPayment,
    createExpense,
    updateInvoiceStatus,
    refetchInvoices,
    refetchPayments,
    refetchExpenses,
  };
};
