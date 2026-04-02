/**
 * Centralized column selection constants for Supabase queries.
 * When a new column is added to a table, update it HERE once
 * instead of hunting through multiple files.
 */

export const ORGANIZATION_COLUMNS = [
  'id',
  'name',
  'organization_type',
  'email',
  'phone',
  'is_verified',
  'is_active',
  'commercial_register',
  'environmental_license',
  'representative_name',
  'representative_national_id',
  'representative_phone',
  'logo_url',
  'stamp_url',
  'signature_url',
  'can_create_shipments',
] as const;

export const ORGANIZATION_SELECT = ORGANIZATION_COLUMNS.join(', ');

export const PROFILE_COLUMNS = [
  'id',
  'user_id',
  'organization_id',
  'active_organization_id',
  'full_name',
  'email',
  'phone',
  'avatar_url',
  'is_active',
] as const;

export const PROFILE_SELECT = PROFILE_COLUMNS.join(', ');
