import { BaseRepository, QueryOptions } from './BaseRepository';
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
  // Relations
  generator?: { id: string; name: string };
  transporter?: { id: string; name: string };
  recycler?: { id: string; name: string };
  driver?: { id: string; profile: { full_name: string } };
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

class ShipmentsRepositoryClass extends BaseRepository<Shipment> {
  protected tableName = 'shipments';
  protected defaultSelect = `
    *,
    generator:generator_id(id, name),
    transporter:transporter_id(id, name),
    recycler:recycler_id(id, name),
    driver:driver_id(id, profile:profile_id(full_name))
  `;

  async findByOrganization(organizationId: string, options?: QueryOptions): Promise<Shipment[]> {
    return this.findAll({
      ...options,
      filters: { ...options?.filters, organization_id: organizationId },
    });
  }

  async findByStatus(status: string, organizationId?: string): Promise<Shipment[]> {
    const filters: Record<string, any> = { status };
    if (organizationId) filters.organization_id = organizationId;
    
    return this.findAll({ filters, orderBy: { column: 'created_at', ascending: false } });
  }

  async findByDriver(driverId: string): Promise<Shipment[]> {
    return this.findAll({
      filters: { driver_id: driverId },
      orderBy: { column: 'created_at', ascending: false },
    });
  }

  async findWithFilters(filters: ShipmentFilters, options?: QueryOptions): Promise<Shipment[]> {
    let query = this.table.select(options?.select || this.defaultSelect);

    if (filters.organization_id) {
      query = query.or(`organization_id.eq.${filters.organization_id},generator_id.eq.${filters.organization_id},transporter_id.eq.${filters.organization_id},recycler_id.eq.${filters.organization_id}`);
    }

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.waste_type) query = query.eq('waste_type', filters.waste_type);
    if (filters.generator_id) query = query.eq('generator_id', filters.generator_id);
    if (filters.transporter_id) query = query.eq('transporter_id', filters.transporter_id);
    if (filters.recycler_id) query = query.eq('recycler_id', filters.recycler_id);
    if (filters.driver_id) query = query.eq('driver_id', filters.driver_id);
    if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom);
    if (filters.dateTo) query = query.lte('created_at', filters.dateTo);

    if (options?.orderBy) {
      query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending ?? false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    if (options?.limit) query = query.limit(options.limit);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching shipments with filters:', error);
      throw error;
    }

    return (data || []) as Shipment[];
  }

  async updateStatus(id: string, status: string, userId?: string): Promise<Shipment> {
    const timestampFields: Record<string, string> = {
      'approved': 'approved_at',
      'collecting': 'collection_started_at',
      'in_transit': 'in_transit_at',
      'delivered': 'delivered_at',
      'confirmed': 'confirmed_at',
    };

    const updates: Record<string, any> = { status };
    
    if (timestampFields[status]) {
      updates[timestampFields[status]] = new Date().toISOString();
    }

    const shipment = await this.update(id, updates as Partial<Shipment>);

    // Log the status change
    if (userId) {
      await supabase.from('shipment_logs').insert({
        shipment_id: id,
        status,
        changed_by: userId,
        notes: `تم تغيير الحالة إلى ${status}`,
      });
    }

    return shipment;
  }

  async getStats(organizationId: string): Promise<{
    total: number;
    pending: number;
    inTransit: number;
    completed: number;
    cancelled: number;
  }> {
    const statuses = ['pending', 'in_transit', 'completed', 'cancelled'];
    const counts = await Promise.all(
      statuses.map(status => this.count({ organization_id: organizationId, status }))
    );

    const total = await this.count({ organization_id: organizationId });

    return {
      total,
      pending: counts[0],
      inTransit: counts[1],
      completed: counts[2],
      cancelled: counts[3],
    };
  }

  async getRecentShipments(organizationId: string, limit = 10): Promise<Shipment[]> {
    return this.findByOrganization(organizationId, {
      limit,
      orderBy: { column: 'created_at', ascending: false },
    });
  }
}

export const ShipmentsRepository = new ShipmentsRepositoryClass();
