/**
 * Type Utilities — Central type-safe helpers to reduce `as any` usage
 * across the codebase when working with Supabase queries.
 */
import type { Database } from '@/integrations/supabase/types';

// ─── Table name type ───
export type TableName = keyof Database['public']['Tables'];

// ─── Row type for a given table ───
export type SafeRow<T extends TableName> = Database['public']['Tables'][T]['Row'];

// ─── Insert type for a given table ───
export type SafeInsert<T extends TableName> = Database['public']['Tables'][T]['Insert'];

// ─── Update type for a given table ───
export type SafeUpdate<T extends TableName> = Database['public']['Tables'][T]['Update'];

// ─── Column names for a given table ───
export type StrictColumn<T extends TableName> = keyof SafeRow<T> & string;

// ─── Partial row (useful for form state) ───
export type PartialRow<T extends TableName> = Partial<SafeRow<T>>;

// ─── Pick specific columns from a row ───
export type PickRow<T extends TableName, K extends StrictColumn<T>> = Pick<SafeRow<T>, K>;

// ─── Nullable helper ───
export type Nullable<T> = T | null;

// ─── Safe JSON parse with fallback ───
export function safeJsonParse<T = unknown>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

// ─── Type guard for non-null ───
export function isNotNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

// ─── Safe cast for Supabase query results ───
export function safeCast<T>(data: unknown): T {
  return data as T;
}

// ─── Extract data from Supabase response safely ───
export function extractRows<T extends TableName>(
  response: { data: SafeRow<T>[] | null; error: unknown }
): SafeRow<T>[] {
  if (response.error || !response.data) return [];
  return response.data;
}
