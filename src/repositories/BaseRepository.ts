import { supabase } from '@/integrations/supabase/client';
import { PostgrestFilterBuilder } from '@supabase/postgrest-js';

export interface QueryOptions {
  select?: string;
  limit?: number;
  offset?: number;
  orderBy?: { column: string; ascending?: boolean };
  filters?: Record<string, any>;
}

export interface PaginatedResult<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export abstract class BaseRepository<T extends { id: string }> {
  protected abstract tableName: string;
  protected abstract defaultSelect: string;

  protected get table() {
    return supabase.from(this.tableName);
  }

  async findById(id: string, select?: string): Promise<T | null> {
    const { data, error } = await this.table
      .select(select || this.defaultSelect)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching ${this.tableName} by id:`, error);
      throw error;
    }

    return data as T | null;
  }

  async findAll(options?: QueryOptions): Promise<T[]> {
    let query = this.table.select(options?.select || this.defaultSelect);

    if (options?.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
    }

    if (options?.orderBy) {
      query = query.order(options.orderBy.column, { 
        ascending: options.orderBy.ascending ?? false 
      });
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`Error fetching ${this.tableName}:`, error);
      throw error;
    }

    return (data || []) as T[];
  }

  async findPaginated(page: number, pageSize: number, options?: QueryOptions): Promise<PaginatedResult<T>> {
    const offset = (page - 1) * pageSize;
    
    // Get count
    let countQuery = this.table.select('*', { count: 'exact', head: true });
    
    if (options?.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          countQuery = countQuery.eq(key, value);
        }
      });
    }

    const { count, error: countError } = await countQuery;
    
    if (countError) {
      console.error(`Error counting ${this.tableName}:`, countError);
      throw countError;
    }

    // Get data
    const data = await this.findAll({
      ...options,
      limit: pageSize,
      offset,
    });

    const totalCount = count || 0;
    
    return {
      data,
      count: totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    };
  }

  async create(entity: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> {
    const { data, error } = await this.table
      .insert(entity as any)
      .select(this.defaultSelect)
      .single();

    if (error) {
      console.error(`Error creating ${this.tableName}:`, error);
      throw error;
    }

    return data as T;
  }

  async createMany(entities: Omit<T, 'id' | 'created_at' | 'updated_at'>[]): Promise<T[]> {
    const { data, error } = await this.table
      .insert(entities as any)
      .select(this.defaultSelect);

    if (error) {
      console.error(`Error creating multiple ${this.tableName}:`, error);
      throw error;
    }

    return (data || []) as T[];
  }

  async update(id: string, updates: Partial<T>): Promise<T> {
    const { data, error } = await this.table
      .update(updates as any)
      .eq('id', id)
      .select(this.defaultSelect)
      .single();

    if (error) {
      console.error(`Error updating ${this.tableName}:`, error);
      throw error;
    }

    return data as T;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.table.delete().eq('id', id);

    if (error) {
      console.error(`Error deleting ${this.tableName}:`, error);
      throw error;
    }
  }

  async deleteMany(ids: string[]): Promise<void> {
    const { error } = await this.table.delete().in('id', ids);

    if (error) {
      console.error(`Error deleting multiple ${this.tableName}:`, error);
      throw error;
    }
  }

  async exists(id: string): Promise<boolean> {
    const { count, error } = await this.table
      .select('id', { count: 'exact', head: true })
      .eq('id', id);

    if (error) {
      console.error(`Error checking existence in ${this.tableName}:`, error);
      throw error;
    }

    return (count || 0) > 0;
  }

  async count(filters?: Record<string, any>): Promise<number> {
    let query = this.table.select('*', { count: 'exact', head: true });

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
    }

    const { count, error } = await query;

    if (error) {
      console.error(`Error counting ${this.tableName}:`, error);
      throw error;
    }

    return count || 0;
  }
}
