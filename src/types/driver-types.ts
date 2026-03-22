/**
 * أنواع السائقين الثلاثة في المنصة
 * ─────────────────────────────────
 * 1. company    — سائق تابع لجهة نقل
 * 2. hired      — سائق حر مؤجر لمهمة محددة
 * 3. independent — سائق حر مستقل يتلقى شحنات
 */

export type DriverType = 'company' | 'hired' | 'independent';

export type MissionOfferStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled';
export type MissionOfferType = 'smart_dispatch' | 'direct_hire' | 'marketplace';
export type HireContractType = 'per_trip' | 'hourly' | 'daily' | 'weekly' | 'monthly';
export type HireContractStatus = 'draft' | 'active' | 'completed' | 'cancelled' | 'expired';

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
  // Joined
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
  // Joined
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
  // Joined
  hiring_org?: {
    name: string;
  };
}

/** تسميات الأنواع بالعربية */
export const DRIVER_TYPE_LABELS: Record<DriverType, { ar: string; en: string; icon: string; color: string; description: string }> = {
  company: {
    ar: 'سائق تابع',
    en: 'Company Driver',
    icon: 'Building2',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    description: 'سائق مرتبط بجهة نقل محددة',
  },
  hired: {
    ar: 'سائق حر مؤجر',
    en: 'Freelance Hired Driver',
    icon: 'Briefcase',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    description: 'سائق حر يقبل مهام من جهات مختلفة — العقود اختيارية',
  },
  independent: {
    ar: 'سائق مستقل',
    en: 'Independent Driver',
    icon: 'UserCheck',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    description: 'سائق حر يتلقى شحنات عبر التوزيع الذكي',
  },
};

/** هل السائق حر (مؤجر أو مستقل)؟ — كلاهما لا يشترط عقد */
export function isFreelanceDriver(type: DriverType): boolean {
  return type === 'hired' || type === 'independent';
}

/** هل السائق يستقبل عروض؟ (المؤجر الحر + المستقل) */
export function canReceiveOffers(type: DriverType): boolean {
  return type === 'hired' || type === 'independent';
}

/** هل السائق مرتبط بمنظمة حالياً؟ */
export function isBoundToOrg(driver: Pick<DriverProfile, 'driver_type' | 'organization_id'>): boolean {
  return driver.driver_type === 'company' && !!driver.organization_id;
}
