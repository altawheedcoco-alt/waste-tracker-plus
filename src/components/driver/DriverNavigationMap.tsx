// Unified — delegates to UnifiedTrackingMap
import { memo } from 'react';
import UnifiedTrackingMap from '@/components/maps/UnifiedTrackingMap';

const DriverNavigationMap = memo((props: any) => (
  <UnifiedTrackingMap preset="fullscreen" {...props} />
));
DriverNavigationMap.displayName = 'DriverNavigationMap';
export default DriverNavigationMap;
