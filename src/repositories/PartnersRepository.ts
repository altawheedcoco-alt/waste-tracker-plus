import { BaseRepository, QueryOptions } from './BaseRepository';
import { supabase } from '@/integrations/supabase/client';

export interface Partner {
  id: string;
  name: string;
  organization_type: 'generator' | 'transporter' | 'recycler';
  email: string;
  phone: string;
  address?: string;
  city?: string;
  is_verified: boolean;
  is_active: boolean;
  logo_url?: string;
  commercial_register?: string;
  environmental_license?: string;
  created_at: string;
  updated_at: string;
}

export interface PartnerRelation {
  id: string;
  organization_id: string;
  partner_organization_id: string;
  relationship_type: string;
  status: string;
  notes?: string;
  created_at: string;
  partner?: Partner;
}

class PartnersRepositoryClass extends BaseRepository<Partner> {
  protected tableName = 'organizations';
  protected defaultSelect = '*';

  async findPartners(organizationId: string, options?: QueryOptions): Promise<Partner[]> {
    const { data: relations, error } = await supabase
      .from('partner_relationships')
      .select(`
        id,
        partner_organization_id,
        relationship_type,
        status,
        notes,
        partner:partner_organization_id(*)
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching partners:', error);
      throw error;
    }

    return (relations || []).map(r => r.partner).filter(Boolean) as Partner[];
  }

  async findByType(type: 'generator' | 'transporter' | 'recycler', options?: QueryOptions): Promise<Partner[]> {
    return this.findAll({
      ...options,
      filters: { ...options?.filters, organization_type: type, is_active: true },
    });
  }

  async findVerifiedPartners(type?: string): Promise<Partner[]> {
    const filters: Record<string, any> = { is_verified: true, is_active: true };
    if (type) filters.organization_type = type;
    
    return this.findAll({ filters, orderBy: { column: 'name', ascending: true } });
  }

  async addPartner(organizationId: string, partnerOrganizationId: string, relationshipType: string): Promise<PartnerRelation> {
    const { data, error } = await supabase
      .from('partner_relationships')
      .insert({
        organization_id: organizationId,
        partner_organization_id: partnerOrganizationId,
        relationship_type: relationshipType,
        status: 'active',
      })
      .select(`
        *,
        partner:partner_organization_id(*)
      `)
      .single();

    if (error) {
      console.error('Error adding partner:', error);
      throw error;
    }

    return data as PartnerRelation;
  }

  async removePartner(organizationId: string, partnerOrganizationId: string): Promise<void> {
    const { error } = await supabase
      .from('partner_relationships')
      .delete()
      .eq('organization_id', organizationId)
      .eq('partner_organization_id', partnerOrganizationId);

    if (error) {
      console.error('Error removing partner:', error);
      throw error;
    }
  }

  async getPartnerRelations(organizationId: string): Promise<PartnerRelation[]> {
    const { data, error } = await supabase
      .from('partner_relationships')
      .select(`
        *,
        partner:partner_organization_id(*)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching partner relations:', error);
      throw error;
    }

    return (data || []) as PartnerRelation[];
  }

  async search(query: string, type?: string): Promise<Partner[]> {
    let dbQuery = this.table
      .select(this.defaultSelect)
      .eq('is_active', true)
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`);

    if (type) {
      dbQuery = dbQuery.eq('organization_type', type);
    }

    const { data, error } = await dbQuery.order('name', { ascending: true });

    if (error) {
      console.error('Error searching partners:', error);
      throw error;
    }

    return (data || []) as Partner[];
  }

  async getStats(organizationId: string): Promise<{
    totalPartners: number;
    generators: number;
    transporters: number;
    recyclers: number;
  }> {
    const partners = await this.findPartners(organizationId);
    
    return {
      totalPartners: partners.length,
      generators: partners.filter(p => p.organization_type === 'generator').length,
      transporters: partners.filter(p => p.organization_type === 'transporter').length,
      recyclers: partners.filter(p => p.organization_type === 'recycler').length,
    };
  }
}

export const PartnersRepository = new PartnersRepositoryClass();
