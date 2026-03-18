/**
 * Unified Shipment Print Types
 * Single source of truth for all shipment print/export components
 */

export interface OrganizationPrintData {
  name: string;
  name_en?: string | null;
  email: string;
  phone: string;
  secondary_phone?: string | null;
  address: string;
  city: string;
  region?: string | null;
  representative_name: string | null;
  representative_phone?: string | null;
  representative_email?: string | null;
  representative_national_id?: string | null;
  representative_position?: string | null;
  delegate_name?: string | null;
  delegate_phone?: string | null;
  delegate_email?: string | null;
  delegate_national_id?: string | null;
  agent_name?: string | null;
  agent_phone?: string | null;
  agent_email?: string | null;
  agent_national_id?: string | null;
  client_code?: string | null;
  commercial_register?: string | null;
  tax_card?: string | null;
  environmental_license?: string | null;
  environmental_approval_number?: string | null;
  wmra_license?: string | null;
  establishment_registration?: string | null;
  registered_activity?: string | null;
  activity_type?: string | null;
  production_capacity?: string | null;
  stamp_url?: string | null;
  signature_url?: string | null;
  logo_url?: string | null;
  organization_type?: string | null;
  // Recycler-specific
  ida_license?: string | null;
  industrial_registry?: string | null;
  license_number?: string | null;
  // Transporter-specific
  land_transport_license?: string | null;
}

export interface DriverPrintData {
  license_number: string;
  vehicle_type: string | null;
  vehicle_plate: string | null;
  profile: {
    full_name: string;
    phone: string | null;
  };
}

export interface ShipmentPrintData {
  id: string;
  shipment_number: string;
  status: string;
  waste_type: string;
  quantity: number;
  unit: string;
  pickup_address: string;
  delivery_address: string;
  pickup_date: string | null;
  expected_delivery_date: string | null;
  notes: string | null;
  generator_notes: string | null;
  recycler_notes: string | null;
  waste_description: string | null;
  hazard_level: string | null;
  packaging_method: string | null;
  disposal_method: string | null;
  created_at: string;
  approved_at: string | null;
  collection_started_at: string | null;
  in_transit_at: string | null;
  delivered_at: string | null;
  confirmed_at: string | null;
  manual_driver_name: string | null;
  manual_vehicle_plate: string | null;
  weighbridge_net_weight?: number | null;
  generator_id?: string | null;
  transporter_id?: string | null;
  recycler_id?: string | null;
  generator: OrganizationPrintData | null;
  transporter: OrganizationPrintData | null;
  recycler: OrganizationPrintData | null;
  driver: DriverPrintData | null;
}

export interface ShipmentLogEntry {
  id: string;
  status: string;
  notes: string | null;
  created_at: string;
  changed_by: { full_name: string } | null;
}

export interface MovementSupervisor {
  party_role: string;
  supervisor_name: string | null;
  supervisor_type: string;
  auto_sign_enabled: boolean;
  auto_sign_method: string | null;
  supervisor_phone?: string | null;
}

export interface DocumentSignatureData {
  id: string;
  document_type: string;
  signer_name: string;
  signer_role: string | null;
  signer_title: string | null;
  signature_image_url: string | null;
  stamp_image_url: string | null;
  stamp_applied: boolean;
  signature_method: string;
  signature_hash: string | null;
  platform_seal_number: string | null;
  status: string | null;
  timestamp_signed: string;
  organization_id: string | null;
}

export type PrintMode = 'dialog' | 'quick' | 'enhanced';
export type ExportFormat = 'pdf' | 'print' | 'whatsapp' | 'word';
export type DocumentPage = 'summary' | 'details' | 'attachments';

export const WASTE_TYPE_LABELS: Record<string, string> = {
  plastic: 'بلاستيك', paper: 'ورق', metal: 'معادن', glass: 'زجاج',
  electronic: 'إلكترونيات', organic: 'عضوية', chemical: 'كيميائية',
  medical: 'طبية', construction: 'بناء', other: 'أخرى',
};

export const STATUS_LABELS: Record<string, string> = {
  new: 'جديدة', approved: 'معتمدة', collecting: 'جاري التجميع',
  in_transit: 'في الطريق', delivered: 'تم التسليم', confirmed: 'مكتمل',
};

export const HAZARD_LABELS: Record<string, string> = {
  hazardous: 'خطرة', non_hazardous: 'غير خطرة',
};

export const DISPOSAL_LABELS: Record<string, string> = {
  recycling: 'إعادة تدوير', remanufacturing: 'إعادة تصنيع',
  recycling_remanufacturing: 'إعادة تدوير / إعادة تصنيع',
  landfill: 'دفن صحي', incineration: 'حرق', treatment: 'معالجة', reuse: 'إعادة استخدام',
};

export const PACKAGING_LABELS: Record<string, string> = {
  packaged: 'معبأ', unpackaged: 'غير معبأ',
};
