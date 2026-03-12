/**
 * مكون خريطة التتبع الموحد — يستبدل كافة المغلفات المكررة
 * (DriverTripTracker, VirtualRouteMap, DriverNavigationMap, ShipmentInlineTrackingMap, MapboxDriverTracking)
 */
import { memo, lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const LeafletShipmentTracking = lazy(() => import('./LeafletShipmentTracking'));

export type MapPreset = 'default' | 'inline' | 'fullscreen' | 'trip';

const PRESET_HEIGHTS: Record<MapPreset, string> = {
  default: '400px',
  inline: '300px',
  fullscreen: '100%',
  trip: '400px',
};

interface UnifiedTrackingMapProps {
  preset?: MapPreset;
  height?: string;
  [key: string]: any;
}

const UnifiedTrackingMap = memo(({ preset = 'default', height, ...props }: UnifiedTrackingMapProps) => {
  const resolvedHeight = height ?? PRESET_HEIGHTS[preset];
  return (
    <Suspense fallback={<Skeleton className="w-full rounded-xl" style={{ height: resolvedHeight }} />}>
      <LeafletShipmentTracking height={resolvedHeight} {...props} />
    </Suspense>
  );
});

UnifiedTrackingMap.displayName = 'UnifiedTrackingMap';
export default UnifiedTrackingMap;
