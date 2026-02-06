// Tracking System Types

export type TrackingMode = 'realtime' | 'ai' | 'manual';

export interface TrackingModeConfig {
  mode: TrackingMode;
  label: string;
  description: string;
  icon: string;
  features: string[];
}

export const TRACKING_MODES: Record<TrackingMode, TrackingModeConfig> = {
  realtime: {
    mode: 'realtime',
    label: 'تتبع فعلي حي',
    description: 'تغيير تلقائي للحالة بناءً على موقع GPS الفعلي بدون تدخل بشري',
    icon: 'satellite',
    features: [
      'تحديث الحالة تلقائياً عند الوصول للمواقع',
      'كشف تلقائي لبدء الرحلة',
      'تسجيل كل نقطة على المسار',
      'تنبيهات فورية عند الانحراف',
    ],
  },
  ai: {
    mode: 'ai',
    label: 'تتبع ذكي بالـ AI',
    description: 'حسابات ذكية للمسافة والوقت والموقع مع توقعات الوصول',
    icon: 'brain',
    features: [
      'توقع وقت الوصول بالذكاء الاصطناعي',
      'تحليل أنماط القيادة',
      'اقتراح أفضل المسارات',
      'تسجيل نقاط التقدم تلقائياً',
    ],
  },
  manual: {
    mode: 'manual',
    label: 'تتبع يدوي',
    description: 'تحكم كامل بتغيير الحالات يدوياً من لوحة التحكم',
    icon: 'hand',
    features: [
      'تحديث الحالة بضغطة زر',
      'مرونة كاملة في التحكم',
      'تأكيد بشري لكل خطوة',
      'مناسب للحالات الخاصة',
    ],
  },
};

export interface TrackingState {
  shipmentId: string;
  mode: TrackingMode;
  isActive: boolean;
  lastUpdate: Date | null;
  progress: number;
  currentLocation: { lat: number; lng: number } | null;
  estimatedArrival: Date | null;
  distanceRemaining: number | null;
  autoStatusChanges: boolean;
}

export interface GeofenceZone {
  id: string;
  name: string;
  center: { lat: number; lng: number };
  radius: number; // in meters
  type: 'pickup' | 'delivery' | 'checkpoint';
  triggeredAt?: Date;
}

export interface TrackingEvent {
  id: string;
  shipmentId: string;
  type: 'status_change' | 'location_update' | 'milestone' | 'geofence_enter' | 'geofence_exit' | 'ai_prediction';
  mode: TrackingMode;
  data: Record<string, any>;
  createdAt: Date;
}
