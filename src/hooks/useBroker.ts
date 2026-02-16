import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface BrokerTransaction {
  id: string;
  organization_id: string;
  transaction_type: 'purchase' | 'sale';
  status: string;
  counterparty_organization_id?: string;
  counterparty_external_id?: string;
  counterparty_name?: string;
  waste_type: string;
  waste_description?: string;
  quantity_tons: number;
  actual_quantity_tons?: number;
  quality_grade?: string;
  price_per_ton: number;
  total_amount?: number;
  currency: string;
  shipment_id?: string;
  location_governorate?: string;
  pickup_address?: string;
  delivery_address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BrokerDeal {
  id: string;
  organization_id: string;
  deal_name?: string;
  status: string;
  purchase_transaction_id?: string;
  purchase_price_per_ton: number;
  purchase_quantity_tons: number;
  purchase_total?: number;
  sale_transaction_id?: string;
  sale_price_per_ton: number;
  sale_quantity_tons: number;
  sale_total?: number;
  transport_cost: number;
  other_costs: number;
  waste_type: string;
  notes?: string;
  created_at: string;
}

export interface BrokerStats {
  totalPurchases: number;
  totalSales: number;
  totalProfit: number;
  totalVolume: number;
  dealCount: number;
  avgMargin: number;
  pendingDeals: number;
}

export function useBroker() {
  const { organization, profile } = useAuth();
  const [transactions, setTransactions] = useState<BrokerTransaction[]>([]);
  const [deals, setDeals] = useState<BrokerDeal[]>([]);
  const [stats, setStats] = useState<BrokerStats>({
    totalPurchases: 0, totalSales: 0, totalProfit: 0,
    totalVolume: 0, dealCount: 0, avgMargin: 0, pendingDeals: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!organization?.id) return;
    setLoading(true);
    try {
      const [txRes, dealRes] = await Promise.all([
        supabase
          .from('broker_transactions')
          .select('*')
          .eq('organization_id', organization.id)
          .order('created_at', { ascending: false }) as any,
        supabase
          .from('broker_deals')
          .select('*')
          .eq('organization_id', organization.id)
          .order('created_at', { ascending: false }) as any,
      ]);

      const txs: BrokerTransaction[] = txRes.data || [];
      const dls: BrokerDeal[] = dealRes.data || [];
      setTransactions(txs);
      setDeals(dls);

      // Calculate stats
      const purchases = txs.filter(t => t.transaction_type === 'purchase');
      const sales = txs.filter(t => t.transaction_type === 'sale');
      const totalPurchases = purchases.reduce((s, t) => s + (t.total_amount || t.quantity_tons * t.price_per_ton), 0);
      const totalSales = sales.reduce((s, t) => s + (t.total_amount || t.quantity_tons * t.price_per_ton), 0);
      const totalVolume = txs.reduce((s, t) => s + (t.actual_quantity_tons || t.quantity_tons), 0);
      const totalCosts = dls.reduce((s, d) => s + (d.transport_cost || 0) + (d.other_costs || 0), 0);
      const totalProfit = totalSales - totalPurchases - totalCosts;
      const avgMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;

      setStats({
        totalPurchases, totalSales, totalProfit, totalVolume,
        dealCount: dls.length,
        avgMargin: Math.round(avgMargin * 10) / 10,
        pendingDeals: dls.filter(d => d.status === 'open' || d.status === 'partial').length,
      });
    } catch (err) {
      console.error('Broker fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const createTransaction = useCallback(async (data: {
    transaction_type: 'purchase' | 'sale';
    waste_type: string;
    waste_description?: string;
    quantity_tons: number;
    price_per_ton: number;
    quality_grade?: string;
    counterparty_name?: string;
    counterparty_organization_id?: string;
    location_governorate?: string;
    pickup_address?: string;
    delivery_address?: string;
    notes?: string;
  }) => {
    if (!organization?.id) return null;
    try {
      const { data: result, error } = await supabase
        .from('broker_transactions')
        .insert({
          ...data,
          organization_id: organization.id,
          created_by: profile?.id,
        } as any)
        .select()
        .single();
      if (error) throw error;
      toast.success(data.transaction_type === 'purchase' ? 'تم تسجيل عملية الشراء' : 'تم تسجيل عملية البيع');
      fetchData();
      return result;
    } catch (err: any) {
      toast.error(err.message || 'خطأ في تسجيل العملية');
      return null;
    }
  }, [organization?.id, profile?.id, fetchData]);

  const createDeal = useCallback(async (data: {
    deal_name?: string;
    waste_type: string;
    purchase_transaction_id?: string;
    purchase_price_per_ton: number;
    purchase_quantity_tons: number;
    sale_transaction_id?: string;
    sale_price_per_ton: number;
    sale_quantity_tons: number;
    transport_cost?: number;
    other_costs?: number;
    notes?: string;
  }) => {
    if (!organization?.id) return null;
    try {
      const { data: result, error } = await supabase
        .from('broker_deals')
        .insert({
          ...data,
          organization_id: organization.id,
          created_by: profile?.id,
        } as any)
        .select()
        .single();
      if (error) throw error;
      toast.success('تم إنشاء الصفقة بنجاح');
      fetchData();
      return result;
    } catch (err: any) {
      toast.error(err.message || 'خطأ في إنشاء الصفقة');
      return null;
    }
  }, [organization?.id, profile?.id, fetchData]);

  const updateTransactionStatus = useCallback(async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('broker_transactions')
        .update({ status } as any)
        .eq('id', id);
      if (error) throw error;
      toast.success('تم تحديث الحالة');
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  }, [fetchData]);

  return {
    transactions, deals, stats, loading,
    createTransaction, createDeal, updateTransactionStatus,
    refresh: fetchData
  };
}
