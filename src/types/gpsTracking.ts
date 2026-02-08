// GPS Tracking System Types

export type TrackingSource = 'mobile' | 'gps_device' | 'hybrid';
export type GPSProtocol = 'http' | 'mqtt' | 'tcp' | 'udp';
export type GPSParserType = 'json' | 'binary' | 'text';

export interface GPSDeviceType {
  id: string;
  name: string;
  manufacturer: string;
  protocol: GPSProtocol;
  default_port: number | null;
  config_schema: Record<string, string>;
  parser_type: GPSParserType;
  sample_payload: Record<string, any> | null;
  documentation_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface GPSDevice {
  id: string;
  organization_id: string;
  driver_id: string | null;
  device_name: string;
  device_serial: string;
  device_type: string;
  protocol: GPSProtocol;
  connection_config: Record<string, any>;
  api_endpoint: string | null;
  api_key: string | null;
  is_active: boolean;
  last_ping_at: string | null;
  last_location: {
    lat: number;
    lng: number;
    speed?: number;
    heading?: number;
  } | null;
  battery_level: number | null;
  signal_strength: number | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface GPSLocationLog {
  id: string;
  device_id: string;
  driver_id: string | null;
  shipment_id: string | null;
  latitude: number;
  longitude: number;
  altitude: number | null;
  speed: number | null;
  heading: number | null;
  accuracy: number | null;
  source: 'gps_device' | 'mobile_app' | 'web_browser';
  raw_data: Record<string, any> | null;
  recorded_at: string;
  created_at: string;
}

export interface ShipmentTrackingConfig {
  id: string;
  shipment_id: string;
  tracking_source: TrackingSource;
  primary_source: TrackingSource;
  gps_device_id: string | null;
  fallback_enabled: boolean;
  location_sync_interval: number;
  anomaly_detection_enabled: boolean;
  max_source_deviation: number;
  created_at: string;
  updated_at: string;
}

export interface TrackingSourceOption {
  value: TrackingSource;
  label: string;
  description: string;
  icon: string;
  features: string[];
}

export const TRACKING_SOURCE_OPTIONS: TrackingSourceOption[] = [
  {
    value: 'mobile',
    label: 'تتبع الموبايل/الويب',
    description: 'تتبع موقع السائق من خلال تطبيق الموبايل أو المتصفح',
    icon: 'smartphone',
    features: [
      'تحديد الموقع من GPS الهاتف',
      'يعمل بدون أجهزة إضافية',
      'تحديث تلقائي للموقع',
      'يتطلب اتصال إنترنت',
    ],
  },
  {
    value: 'gps_device',
    label: 'جهاز GPS السيارة',
    description: 'تتبع موقع السيارة من خلال جهاز GPS مثبت',
    icon: 'radio',
    features: [
      'دقة عالية في تحديد الموقع',
      'يعمل بشكل مستقل عن الهاتف',
      'مقاوم للتلاعب',
      'تتبع مستمر حتى بدون السائق',
    ],
  },
  {
    value: 'hybrid',
    label: 'تتبع مدمج',
    description: 'دمج بيانات الموبايل وجهاز GPS معاً للحصول على أعلى دقة',
    icon: 'combine',
    features: [
      'مقارنة البيانات من المصدرين',
      'كشف التلاعب والانحرافات',
      'تحويل تلقائي للمصدر البديل',
      'أعلى مستوى من الموثوقية',
    ],
  },
];

export interface HybridLocationData {
  mobile: {
    lat: number;
    lng: number;
    accuracy: number;
    timestamp: Date;
  } | null;
  gps_device: {
    lat: number;
    lng: number;
    accuracy: number;
    timestamp: Date;
  } | null;
  selected_source: TrackingSource;
  deviation_meters: number | null;
  anomaly_detected: boolean;
}
