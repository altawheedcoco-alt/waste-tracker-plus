/**
 * أنواع السائقين الثلاثة في المنصة
 * ─────────────────────────────────
 * 1. company      — سائق تابع لجهة نقل (موظف دائم بحساب كامل)
 * 2. hired        — سائق خارجي مؤقت (لا يملك حساب — رابط لمرة واحدة فقط)
 * 3. independent  — سائق مستقل يسجل نفسه (نموذج Uber/InDriver)
 */

export type DriverType = 'company' | 'hired' | 'independent';

export type MissionOfferStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled';
export type MissionOfferType = 'smart_dispatch' | 'direct_hire' | 'marketplace';
export type HireContractType = 'per_trip' | 'hourly' | 'daily' | 'weekly' | 'monthly';
export type HireContractStatus = 'draft' | 'active' | 'completed' | 'cancelled' | 'expired';
export type ExternalMissionStatus = 'pending' | 'sent' | 'opened' | 'in_progress' | 'completed' | 'expired' | 'cancelled';

export interface DriverProfile {
  id: string;
  profile_id: string;
  driver_type: DriverType;
  organization_id: string | null;
  license_number: string;
  license_expiry: string | null;
  vehicle_type: string | null;
  vehicle_plate: string | null;
  is_available: boolean;
  is_verified: boolean;
  service_area_km: number;
  rating: number;
  total_trips: number;
  acceptance_rate: number;
  rejection_count: number;
  preferred_waste_types: string[];
  bio: string | null;
  hourly_rate: number | null;
  per_trip_rate: number | null;
  created_at: string;
  profile?: {
    full_name: string;
    phone: string | null;
    avatar_url: string | null;
  };
}

export interface MissionOffer {
  id: string;
  shipment_id: string | null;
  driver_id: string;
  offered_by_org_id: string | null;
  offer_type: MissionOfferType;
  status: MissionOfferStatus;
  offered_price: number | null;
  final_price: number | null;
  distance_km: number | null;
  expires_at: string;
  response_at: string | null;
  rejection_reason: string | null;
  notes: string | null;
  created_at: string;
  shipment?: {
    pickup_address: string | null;
    delivery_address: string | null;
    waste_type: string | null;
    estimated_weight: number | null;
  };
  offered_by_org?: {
    name: string;
  };
}

export interface HireContract {
  id: string;
  driver_id: string;
  hiring_org_id: string;
  contract_type: HireContractType;
  status: HireContractStatus;
  start_date: string;
  end_date: string | null;
  agreed_rate: number;
  total_trips_completed: number;
  total_earnings: number;
  terms: string | null;
  created_at: string;
  hiring_org?: {
    name: string;
  };
}

/** المهمة الخارجية — رابط لمرة واحدة للسائق المؤجر */
export interface ExternalMission {
  id: string;
  token: string;
  organization_id: string;
  created_by: string;
  pickup_address: string;
  delivery_address: string;
  waste_type: string | null;
  estimated_weight: number | null;
  notes: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  driver_vehicle_plate: string | null;
  status: ExternalMissionStatus;
  actual_weight: number | null;
  execution_notes: string | null;
  completion_photo_url: string | null;
  started_at: string | null;
  completed_at: string | null;
  expires_at: string;
  linked_shipment_id: string | null;
  created_at: string;
  updated_at: string;
}

/** تسميات الأنواع بالعربية */
export const DRIVER_TYPE_LABELS: Record<DriverType, { ar: string; en: string; icon: string; color: string; description: string }> = {
  company: {
    ar: 'سائق تابع',
    en: 'Company Driver',
    icon: 'Building2',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    description: 'موظف دائم مرتبط بجهة نقل — له حساب كامل وصلاحيات تشغيلية',
  },
  hired: {
    ar: 'سائق خارجي مؤقت',
    en: 'External Temporary Driver',
    icon: 'Briefcase',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    description: 'سائق خارجي يستلم رابط لمرة واحدة لتنفيذ شحنة محددة — لا يملك حساب',
  },
  independent: {
    ar: 'سائق مستقل',
    en: 'Independent Driver',
    icon: 'UserCheck',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    description: 'سائق حر يسجل نفسه ويتلقى طلبات عبر نظام شبيه بـ Uber/InDriver',
  },
};

/** هل السائق حر (مستقل)؟ — المؤجر ليس له حساب أصلاً */
export function isFreelanceDriver(type: DriverType): boolean {
  return type === 'independent';
}

/** هل السائق يستقبل عروض؟ (المستقل فقط — المؤجر لا يملك حساب) */
export function canReceiveOffers(type: DriverType): boolean {
  return type === 'independent';
}

/** هل السائق مرتبط بمنظمة حالياً؟ */
export function isBoundToOrg(driver: Pick<DriverProfile, 'driver_type' | 'organization_id'>): boolean {
  return driver.driver_type === 'company' && !!driver.organization_id;
}

/** هل السائق له حساب في النظام؟ */
export function hasSystemAccount(type: DriverType): boolean {
  return type === 'company' || type === 'independent';
}

/** هل هذا سائق خارجي مؤقت (بدون حساب)؟ */
export function isExternalTemporary(type: DriverType): boolean {
  return type === 'hired';
}
