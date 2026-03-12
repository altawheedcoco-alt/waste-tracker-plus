// Unified — delegates to UnifiedTrackingMap
import UnifiedTrackingMap from '@/components/maps/UnifiedTrackingMap';

const DriverTripTracker = (props: any) => (
  <UnifiedTrackingMap preset="trip" {...props} />
);

export default DriverTripTracker;
