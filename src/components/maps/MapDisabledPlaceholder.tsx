import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MapDisabledPlaceholderProps {
  className?: string;
  height?: string;
}

const MapDisabledPlaceholder = ({ className, height = '400px' }: MapDisabledPlaceholderProps) => (
  <div
    className={cn('flex flex-col items-center justify-center bg-muted/50 border border-border rounded-lg text-muted-foreground', className)}
    style={{ height }}
  >
    <MapPin className="w-10 h-10 mb-3 opacity-40" />
    <p className="text-sm font-medium">الخرائط معطلة حالياً</p>
    <p className="text-xs mt-1">Maps are currently disabled</p>
  </div>
);

export default MapDisabledPlaceholder;
