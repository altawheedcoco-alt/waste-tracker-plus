import { createRepository, QueryOptions } from './BaseRepository';
import { supabase } from '@/integrations/supabase/client';

export interface Shipment {
  id: string;
  shipment_number: string;
  status: string;
  waste_type: string;
  waste_category?: string;
  quantity: number;
  unit: string;
  notes?: string;
  pickup_location?: string;
  pickup_lat?: number;
  pickup_lng?: number;
  delivery_location?: string;
  delivery_lat?: number;
  delivery_lng?: number;
  generator_id?: string;
  transporter_id?: string;
  recycler_id?: string;
  disposal_facility_id?: string;
  driver_id?: string;
  price_per_unit?: number;
  total_price?: number;
  currency?: string;
  scheduled_date?: string;
  actual_pickup_date?: string;
  actual_delivery_date?: string;
  created_at: string;
  updated_at: string;
  organization_id: string;
  manual_disposal_name?: string;
}

export interface ShipmentFilters {
  organization_id?: string;
  status?: string;
  waste_type?: string;
  generator_id?: string;
  transporter_id?: string;
  recycler_id?: string;
  driver_id?: string;
  dateFrom?: string;
  dateTo?: string;
}

const baseRepo = createRepository<Shipment>('shipments', '*');

export const ShipmentsRepository = {
  ...baseRepo,

  async findByOrganization(organizationId: string, options?: QueryOptions): Promise<Shipment[]> {
    return baseRepo.findAll({
      ...options,
      filters: { ...options?.filters, organization_id: organizationId },
    });
  },

  async findByStatus(status: string, organizationId?: string): Promise<Shipment[]> {
    const filters: Record<string, any> = { status };
    if (organizationId) filters.organization_id = organizationId;
    
    return baseRepo.findAll({ filters, orderBy: { column: 'created_at', ascending: false } });
  },

  async findByDriver(driverId: string): Promise<Shipment[]> {
    return baseRepo.findAll({
      filters: { driver_id: driverId },
      orderBy: { column: 'created_at', ascending: false },
    });
  },

  async findWithFilters(filters: ShipmentFilters, options?: QueryOptions): Promise<Shipment[]> {
    let query = supabase.from('shipments').select(options?.select || '*');

    if (filters.organization_id) {
      query = query.or(`organization_id.eq.${filters.organization_id},generator_id.eq.${filters.organization_id},transporter_id.eq.${filters.organization_id},recycler_id.eq.${filters.organization_id}`);
    }

    if (filters.status) query = query.eq('status', filters.status as any);
    if (filters.waste_type) query = query.eq('waste_type', filters.waste_type as any);
    if (filters.generator_id) query = query.eq('generator_id', filters.generator_id);
    if (filters.transporter_id) query = query.eq('transporter_id', filters.transporter_id);
    if (filters.recycler_id) query = query.eq('recycler_id', filters.recycler_id);
    if (filters.driver_id) query = query.eq('driver_id', filters.driver_id);
    if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom);
    if (filters.dateTo) query = query.lte('created_at', filters.dateTo);

    query = query.order('created_at', { ascending: options?.orderBy?.ascending ?? false });

    if (options?.limit) query = query.limit(options.limit);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching shipments with filters:', error);
      throw error;
    }

    return (data || []) as unknown as Shipment[];
  },

  async updateStatus(id: string, status: string, userId?: string): Promise<Shipment> {
    const timestampFields: Record<string, string> = {
      'approved': 'approved_at',
      'in_transit': 'in_transit_at',
      'delivered': 'delivered_at',
      'confirmed': 'confirmed_at',
    };

    const updates: Record<string, any> = { status };
    
    if (timestampFields[status]) {
      updates[timestampFields[status]] = new Date().toISOString();
    }

    const shipment = await baseRepo.update(id, updates as Partial<Shipment>);

    // Log the status change
    if (userId) {
      await supabase.from('shipment_logs').insert({
        shipment_id: id,
        status: status as any,
        changed_by: userId,
        notes: `تم تغيير الحالة إلى ${status}`,
      });

      // Auto-create declarations based on status (all parties)
      try {
        const { autoCreateGeneratorDeclaration, autoCreateRecyclerDeclaration, autoCreateTransporterDeclaration, autoCreateDisposalReceptionDeclaration, autoCreateDisposalCertificate, autoCreateRecyclingCertificate, autoCreateDriverConfirmation, autoCreateTransporterDeliveryDeclaration, autoCreateDriverDeliveryDeclaration } = await import('@/utils/autoDeclarationCreator');
        const { autoCreateReceipt } = await import('@/utils/autoReceiptCreator');
        
        if (['approved', 'registered'].includes(status) && shipment.generator_id) {
          await autoCreateGeneratorDeclaration(id, shipment.generator_id, userId);
        }
        if (['picked_up', 'loading'].includes(status) && shipment.transporter_id) {
          await autoCreateDriverConfirmation(id, shipment.transporter_id, userId);
        }
        if (status === 'in_transit' && shipment.transporter_id) {
          await autoCreateTransporterDeclaration(id, shipment.transporter_id, userId);
          await autoCreateReceipt(id, shipment.transporter_id, userId);
        }
        if (['delivered', 'confirmed'].includes(status) && shipment.transporter_id) {
          await autoCreateTransporterDeliveryDeclaration(id, shipment.transporter_id, userId);
          await autoCreateDriverDeliveryDeclaration(id, shipment.transporter_id, userId);
        }
        if (['delivered', 'confirmed'].includes(status) && shipment.recycler_id) {
          await autoCreateRecyclerDeclaration(id, shipment.recycler_id, userId);
          await autoCreateDisposalReceptionDeclaration(id, shipment.recycler_id, userId);
        }
        if (['delivered'].includes(status) && shipment.transporter_id) {
          await autoCreateReceipt(id, shipment.transporter_id, userId);
        }
        if (['disposal_treatment', 'disposal_final', 'disposal_completed'].includes(status) && shipment.recycler_id) {
          await autoCreateDisposalCertificate(id, shipment.recycler_id, userId);
        }
        if (['recycling_complete', 'processing_complete', 'completed'].includes(status) && shipment.recycler_id) {
          await autoCreateRecyclingCertificate(id, shipment.recycler_id, userId);
        }
      } catch (e) {
        console.error('Auto declaration error (non-blocking):', e);
      }
    }

    return shipment;
  },

  async getStats(organizationId: string): Promise<{
    total: number;
    pending: number;
    inTransit: number;
    completed: number;
    cancelled: number;
  }> {
    // Single query to get all statuses, then count client-side (1 query instead of 5)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - deep type instantiation workaround
    const result = await supabase.from('shipments').select('status').eq('organization_id', organizationId);
    const data = (result.data || []) as { status: string }[];
    const error = result.error;

    if (error) {
      console.error('Error fetching shipment stats:', error);
      throw error;
    }

    const rows = (data || []) as { status: string }[];
    return {
      total: rows.length,
      pending: rows.filter(r => r.status === 'pending').length,
      inTransit: rows.filter(r => r.status === 'in_transit').length,
      completed: rows.filter(r => r.status === 'completed').length,
      cancelled: rows.filter(r => r.status === 'cancelled').length,
    };
  },

  async getRecentShipments(organizationId: string, limit = 10): Promise<Shipment[]> {
    return this.findByOrganization(organizationId, {
      limit,
      orderBy: { column: 'created_at', ascending: false },
    });
  },
};
