import { createRepository, QueryOptions } from './BaseRepository';
import { supabase } from '@/integrations/supabase/client';

export interface Invoice {
  id: string;
  invoice_number: string;
  organization_id: string;
  partner_organization_id?: string;
  external_partner_id?: string;
  shipment_id?: string;
  invoice_type: string;
  status: string;
  amount: number;
  currency: string;
  tax_amount?: number;
  total_amount: number;
  due_date?: string;
  paid_date?: string;
  notes?: string;
  pdf_url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceFilters {
  organization_id?: string;
  status?: string;
  invoice_type?: string;
  partner_organization_id?: string;
  dateFrom?: string;
  dateTo?: string;
}

const baseRepo = createRepository<Invoice>('invoices', '*');

export const InvoicesRepository = {
  ...baseRepo,

  async findByOrganization(organizationId: string, options?: QueryOptions): Promise<Invoice[]> {
    return baseRepo.findAll({
      ...options,
      filters: { ...options?.filters, organization_id: organizationId },
    });
  },

  async findByStatus(status: string, organizationId?: string): Promise<Invoice[]> {
    const filters: Record<string, any> = { status };
    if (organizationId) filters.organization_id = organizationId;
    
    return baseRepo.findAll({ filters, orderBy: { column: 'created_at', ascending: false } });
  },

  async findUnpaid(organizationId: string): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('organization_id', organizationId)
      .in('status', ['pending', 'overdue'])
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Error fetching unpaid invoices:', error);
      throw error;
    }

    return (data || []) as unknown as Invoice[];
  },

  async findOverdue(organizationId: string): Promise<Invoice[]> {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', 'pending')
      .lt('due_date', now)
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Error fetching overdue invoices:', error);
      throw error;
    }

    return (data || []) as unknown as Invoice[];
  },

  async findByPartner(partnerId: string, organizationId?: string): Promise<Invoice[]> {
    const filters: Record<string, any> = { partner_organization_id: partnerId };
    if (organizationId) filters.organization_id = organizationId;
    
    return baseRepo.findAll({ filters, orderBy: { column: 'created_at', ascending: false } });
  },

  async findByShipment(shipmentId: string): Promise<Invoice[]> {
    return baseRepo.findAll({
      filters: { shipment_id: shipmentId },
      orderBy: { column: 'created_at', ascending: false },
    });
  },

  async markAsPaid(id: string): Promise<Invoice> {
    return baseRepo.update(id, {
      status: 'paid',
      paid_date: new Date().toISOString(),
    } as Partial<Invoice>);
  },

  async getStats(organizationId: string): Promise<{
    total: number;
    pending: number;
    paid: number;
    overdue: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
  }> {
    const invoices = await this.findByOrganization(organizationId);
    const now = new Date();
    
    const pending = invoices.filter(i => i.status === 'pending');
    const paid = invoices.filter(i => i.status === 'paid');
    const overdue = pending.filter(i => i.due_date && new Date(i.due_date) < now);
    
    return {
      total: invoices.length,
      pending: pending.length,
      paid: paid.length,
      overdue: overdue.length,
      totalAmount: invoices.reduce((sum, i) => sum + (i.total_amount || 0), 0),
      paidAmount: paid.reduce((sum, i) => sum + (i.total_amount || 0), 0),
      pendingAmount: pending.reduce((sum, i) => sum + (i.total_amount || 0), 0),
    };
  },

  async search(query: string, organizationId: string): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('organization_id', organizationId)
      .ilike('invoice_number', `%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching invoices:', error);
      throw error;
    }

    return (data || []) as unknown as Invoice[];
  },
};
