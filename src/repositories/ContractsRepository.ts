import { createRepository, QueryOptions } from './BaseRepository';
import { supabase } from '@/integrations/supabase/client';

export interface Contract {
  id: string;
  contract_number: string;
  title: string;
  description?: string;
  contract_type: string;
  status: string;
  partner_name?: string;
  partner_organization_id?: string;
  start_date?: string;
  end_date?: string;
  value?: number;
  currency?: string;
  terms?: string;
  notes?: string;
  attachment_url?: string;
  waste_type?: string;
  waste_category?: string;
  is_verified?: boolean;
  verification_code?: string;
  organization_id: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ContractFilters {
  organization_id?: string;
  status?: string;
  contract_type?: string;
  partner_organization_id?: string;
  is_verified?: boolean;
}

const baseRepo = createRepository<Contract>('contracts', '*');

export const ContractsRepository = {
  ...baseRepo,

  async findByOrganization(organizationId: string, options?: QueryOptions): Promise<Contract[]> {
    return baseRepo.findAll({
      ...options,
      filters: { ...options?.filters, organization_id: organizationId },
    });
  },

  async findActiveContracts(organizationId: string): Promise<Contract[]> {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .gte('end_date', now)
      .order('end_date', { ascending: true });

    if (error) {
      console.error('Error fetching active contracts:', error);
      throw error;
    }

    return (data || []) as Contract[];
  },

  async findExpiredContracts(organizationId: string): Promise<Contract[]> {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('organization_id', organizationId)
      .lt('end_date', now)
      .order('end_date', { ascending: false });

    if (error) {
      console.error('Error fetching expired contracts:', error);
      throw error;
    }

    return (data || []) as Contract[];
  },

  async findExpiringSoon(organizationId: string, daysAhead = 30): Promise<Contract[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .gte('end_date', now.toISOString())
      .lte('end_date', futureDate.toISOString())
      .order('end_date', { ascending: true });

    if (error) {
      console.error('Error fetching expiring contracts:', error);
      throw error;
    }

    return (data || []) as Contract[];
  },

  async findByPartner(partnerId: string, organizationId?: string): Promise<Contract[]> {
    const filters: Record<string, any> = { partner_organization_id: partnerId };
    if (organizationId) filters.organization_id = organizationId;
    
    return baseRepo.findAll({ filters, orderBy: { column: 'created_at', ascending: false } });
  },

  async verifyContract(id: string, verifiedBy: string): Promise<Contract> {
    return baseRepo.update(id, {
      is_verified: true,
      verified_at: new Date().toISOString(),
      verified_by: verifiedBy,
    } as Partial<Contract>);
  },

  async getStats(organizationId: string): Promise<{
    total: number;
    active: number;
    expired: number;
    pending: number;
    expiringSoon: number;
  }> {
    const [total, active, pending, expired, expiringSoon] = await Promise.all([
      baseRepo.count({ organization_id: organizationId }),
      baseRepo.count({ organization_id: organizationId, status: 'active' }),
      baseRepo.count({ organization_id: organizationId, status: 'pending' }),
      this.findExpiredContracts(organizationId).then(c => c.length),
      this.findExpiringSoon(organizationId).then(c => c.length),
    ]);

    return { total, active, expired, pending, expiringSoon };
  },

  async search(query: string, organizationId: string): Promise<Contract[]> {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('organization_id', organizationId)
      .or(`title.ilike.%${query}%,partner_name.ilike.%${query}%,contract_number.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching contracts:', error);
      throw error;
    }

    return (data || []) as Contract[];
  },
};
