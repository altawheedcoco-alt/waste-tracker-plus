import { CheckCircle, Clock, Truck } from 'lucide-react';
import { createElement } from 'react';

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
