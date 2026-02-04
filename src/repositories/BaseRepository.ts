import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

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

// Type aliases for Supabase tables
type Tables = Database['public']['Tables'];
export type TableName = keyof Tables;

// Generic repository interface
export interface IRepository<T> {
  findById(id: string, select?: string): Promise<T | null>;
  findAll(options?: QueryOptions): Promise<T[]>;
  findPaginated(page: number, pageSize: number, options?: QueryOptions): Promise<PaginatedResult<T>>;
  create(entity: Partial<T>): Promise<T>;
  update(id: string, updates: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
  count(filters?: Record<string, any>): Promise<number>;
}

// Helper function to build queries with filters
export function applyFilters<T>(
  query: any,
  filters?: Record<string, any>
): any {
  if (!filters) return query;
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query = query.eq(key, value);
    }
  });
  
  return query;
}

// Helper function to apply ordering
export function applyOrdering(
  query: any,
  orderBy?: { column: string; ascending?: boolean }
): any {
  if (!orderBy) return query;
  return query.order(orderBy.column, { ascending: orderBy.ascending ?? false });
}

// Helper function to apply pagination
export function applyPagination(
  query: any,
  limit?: number,
  offset?: number
): any {
  if (limit) {
    query = query.limit(limit);
  }
  if (offset !== undefined && limit) {
    query = query.range(offset, offset + limit - 1);
  }
  return query;
}

// Base repository factory function
export function createRepository<T extends { id: string }>(
  tableName: string,
  defaultSelect = '*'
) {
  const getTable = () => supabase.from(tableName as any);

  return {
    async findById(id: string, select?: string): Promise<T | null> {
      const { data, error } = await getTable()
        .select(select || defaultSelect)
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error(`Error fetching ${tableName} by id:`, error);
        throw error;
      }

      return data as unknown as T | null;
    },

    async findAll(options?: QueryOptions): Promise<T[]> {
      let query = getTable().select(options?.select || defaultSelect);
      
      query = applyFilters(query, options?.filters);
      query = applyOrdering(query, options?.orderBy);
      query = applyPagination(query, options?.limit, options?.offset);

      const { data, error } = await query;

      if (error) {
        console.error(`Error fetching ${tableName}:`, error);
        throw error;
      }

      return (data || []) as unknown as T[];
    },

    async findPaginated(page: number, pageSize: number, options?: QueryOptions): Promise<PaginatedResult<T>> {
      const offset = (page - 1) * pageSize;
      
      // Get count
      let countQuery = getTable().select('*', { count: 'exact', head: true });
      countQuery = applyFilters(countQuery, options?.filters);

      const { count, error: countError } = await countQuery;
      
      if (countError) {
        console.error(`Error counting ${tableName}:`, countError);
        throw countError;
      }

      // Get data
      let dataQuery = getTable().select(options?.select || defaultSelect);
      dataQuery = applyFilters(dataQuery, options?.filters);
      dataQuery = applyOrdering(dataQuery, options?.orderBy);
      dataQuery = dataQuery.range(offset, offset + pageSize - 1);

      const { data, error } = await dataQuery;

      if (error) {
        console.error(`Error fetching paginated ${tableName}:`, error);
        throw error;
      }

      const totalCount = count || 0;
      
      return {
        data: (data || []) as unknown as T[],
        count: totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
      };
    },

    async create(entity: Partial<T>): Promise<T> {
      const { data, error } = await getTable()
        .insert(entity as any)
        .select(defaultSelect)
        .single();

      if (error) {
        console.error(`Error creating ${tableName}:`, error);
        throw error;
      }

      return data as T;
    },

    async createMany(entities: Partial<T>[]): Promise<T[]> {
      const { data, error } = await getTable()
        .insert(entities as any)
        .select(defaultSelect);

      if (error) {
        console.error(`Error creating multiple ${tableName}:`, error);
        throw error;
      }

      return (data || []) as T[];
    },

    async update(id: string, updates: Partial<T>): Promise<T> {
      const { data, error } = await getTable()
        .update(updates as any)
        .eq('id', id)
        .select(defaultSelect)
        .single();

      if (error) {
        console.error(`Error updating ${tableName}:`, error);
        throw error;
      }

      return data as T;
    },

    async delete(id: string): Promise<void> {
      const { error } = await getTable().delete().eq('id', id);

      if (error) {
        console.error(`Error deleting ${tableName}:`, error);
        throw error;
      }
    },

    async deleteMany(ids: string[]): Promise<void> {
      const { error } = await getTable().delete().in('id', ids);

      if (error) {
        console.error(`Error deleting multiple ${tableName}:`, error);
        throw error;
      }
    },

    async exists(id: string): Promise<boolean> {
      const { count, error } = await getTable()
        .select('id', { count: 'exact', head: true })
        .eq('id', id);

      if (error) {
        console.error(`Error checking existence in ${tableName}:`, error);
        throw error;
      }

      return (count || 0) > 0;
    },

    async count(filters?: Record<string, any>): Promise<number> {
      let query = getTable().select('*', { count: 'exact', head: true });
      query = applyFilters(query, filters);

      const { count, error } = await query;

      if (error) {
        console.error(`Error counting ${tableName}:`, error);
        throw error;
      }

      return count || 0;
    },

    // Access to raw table for custom queries
    table: getTable,
    tableName,
    defaultSelect,
  };
}
