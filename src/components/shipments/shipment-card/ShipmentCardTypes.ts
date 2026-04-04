export interface ShipmentData {
  id: string;
  shipment_number: string;
  status: string;
  waste_type: string;
  quantity: number;
  unit?: string;
  created_at: string;
  pickup_address?: string;
  delivery_address?: string;
  driver_id?: string | null;
  generator_id?: string | null;
  recycler_id?: string | null;
  expected_delivery_date?: string | null;
  pickup_date?: string | null;
  approved_at?: string | null;
  collection_started_at?: string | null;
  in_transit_at?: string | null;
  delivered_at?: string | null;
  confirmed_at?: string | null;
  recycler_notes?: string | null;
  generator_notes?: string | null;
  notes?: string | null;
  waste_description?: string | null;
  hazard_level?: string | null;
  packaging_method?: string | null;
  disposal_method?: string | null;
  manual_driver_name?: string | null;
  manual_vehicle_plate?: string | null;
  hide_recycler_from_generator?: boolean;
  hide_generator_from_recycler?: boolean;
  generator?: OrgInfo | null;
  recycler?: OrgInfo | null;
  transporter?: OrgInfo | null;
  driver?: DriverInfo | null;
  has_report?: boolean;
  has_receipt?: boolean;
  has_delivery_certificate?: boolean;
  generator_approval_status?: 'pending' | 'approved' | 'rejected' | 'auto_approved' | null;
  generator_approval_at?: string | null;
  generator_rejection_reason?: string | null;
  generator_auto_approve_deadline?: string | null;
  recycler_approval_status?: 'pending' | 'approved' | 'rejected' | 'auto_approved' | null;
  recycler_approval_at?: string | null;
  recycler_rejection_reason?: string | null;
  recycler_auto_approve_deadline?: string | null;
}

export interface OrgInfo {
  name: string;
  id?: string;
  phone?: string;
  address?: string;
  city?: string;
  representative_name?: string | null;
}

export interface DriverInfo {
  license_number?: string;
  vehicle_type?: string | null;
  vehicle_plate?: string | null;
  profile?: { full_name: string; phone?: string | null };
}

export interface ShipmentCardProps {
  shipment: ShipmentData;
  onStatusChange?: () => void;
  variant?: 'compact' | 'full';
}

export type OrganizationType = 'generator' | 'transporter' | 'recycler' | 'disposal' | 'admin' | 'driver';
