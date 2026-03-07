import { CheckCircle, Clock, Truck } from 'lucide-react';
import { createElement } from 'react';

// These are now factory functions that accept a translation function
export const getStatusConfig = (t: (key: string) => string) => ({
  new: { color: 'bg-primary/10 text-primary', label: t('shipmentStatus.new'), icon: createElement(Clock, { className: 'h-4 w-4' }) },
  approved: { color: 'bg-primary/10 text-primary', label: t('shipmentStatus.approved'), icon: createElement(CheckCircle, { className: 'h-4 w-4' }) },
  in_transit: { color: 'bg-accent text-foreground', label: t('shipmentStatus.in_transit'), icon: createElement(Truck, { className: 'h-4 w-4' }) },
  delivered: { color: 'bg-secondary text-secondary-foreground', label: t('shipmentStatus.delivered'), icon: createElement(CheckCircle, { className: 'h-4 w-4' }) },
  confirmed: { color: 'bg-primary/20 text-primary', label: t('shipmentStatus.confirmed'), icon: createElement(CheckCircle, { className: 'h-4 w-4' }) },
});

export const getWasteTypeLabels = (t: (key: string) => string) => ({
  plastic: t('wasteTypes.plastic'),
  paper: t('wasteTypes.paper'),
  metal: t('wasteTypes.metal'),
  glass: t('wasteTypes.glass'),
  electronic: t('wasteTypes.electronic'),
  organic: t('wasteTypes.organic'),
  chemical: t('wasteTypes.chemical'),
  medical: t('wasteTypes.medical'),
  construction: t('wasteTypes.construction'),
  other: t('wasteTypes.other'),
});

export const getHazardLevels = (t: (key: string) => string) => ({
  low: { label: t('hazardLevels.low'), color: 'bg-primary/10 text-primary' },
  medium: { label: t('hazardLevels.medium'), color: 'bg-accent text-foreground' },
  high: { label: t('hazardLevels.high'), color: 'bg-destructive/10 text-destructive' },
  critical: { label: t('hazardLevels.critical'), color: 'bg-destructive/20 text-destructive' },
});

// Keep backward-compatible static exports for components that don't have access to t()
export const STATUS_CONFIG: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  new: { color: 'bg-primary/10 text-primary', label: 'جديدة', icon: createElement(Clock, { className: 'h-4 w-4' }) },
  approved: { color: 'bg-primary/10 text-primary', label: 'معتمدة', icon: createElement(CheckCircle, { className: 'h-4 w-4' }) },
  in_transit: { color: 'bg-accent text-foreground', label: 'في الطريق', icon: createElement(Truck, { className: 'h-4 w-4' }) },
  delivered: { color: 'bg-secondary text-secondary-foreground', label: 'تم التسليم', icon: createElement(CheckCircle, { className: 'h-4 w-4' }) },
  confirmed: { color: 'bg-primary/20 text-primary', label: 'مكتمل', icon: createElement(CheckCircle, { className: 'h-4 w-4' }) },
};

export const WASTE_TYPE_LABELS: Record<string, string> = {
  plastic: 'بلاستيك',
  paper: 'ورق',
  metal: 'معادن',
  glass: 'زجاج',
  electronic: 'إلكترونيات',
  organic: 'عضوية',
  chemical: 'كيميائية',
  medical: 'طبية',
  construction: 'بناء',
  other: 'أخرى',
};

export const HAZARD_LEVELS: Record<string, { label: string; color: string }> = {
  low: { label: 'منخفض', color: 'bg-primary/10 text-primary' },
  medium: { label: 'متوسط', color: 'bg-accent text-foreground' },
  high: { label: 'عالي', color: 'bg-destructive/10 text-destructive' },
  critical: { label: 'حرج', color: 'bg-destructive/20 text-destructive' },
};
