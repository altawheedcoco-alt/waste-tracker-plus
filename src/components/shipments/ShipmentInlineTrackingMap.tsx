// Unified — delegates to UnifiedTrackingMap
import { memo } from 'react';
import UnifiedTrackingMap from '@/components/maps/UnifiedTrackingMap';

const ShipmentInlineTrackingMap = memo((props: any) => (
  <UnifiedTrackingMap preset="inline" {...props} />
));
ShipmentInlineTrackingMap.displayName = 'ShipmentInlineTrackingMap';
export default ShipmentInlineTrackingMap;
