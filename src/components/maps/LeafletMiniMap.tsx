import MapDisabledPlaceholder from './MapDisabledPlaceholder';

interface LeafletMiniMapProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  height?: string;
  className?: string;
  [key: string]: any;
}

const LeafletMiniMap = ({ height, className }: LeafletMiniMapProps) => (
  <MapDisabledPlaceholder className={className} height={height || '200px'} />
);

export default LeafletMiniMap;
