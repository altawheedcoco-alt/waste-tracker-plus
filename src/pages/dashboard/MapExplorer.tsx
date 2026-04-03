import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import BackButton from '@/components/ui/back-button';
import { Map } from 'lucide-react';
import { OSM_TILE_URL, OSM_ATTRIBUTION, EGYPT_CENTER, DEFAULT_ZOOM } from '@/lib/leafletConfig';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

const MapExplorer = () => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = L.map(mapRef.current).setView(EGYPT_CENTER, DEFAULT_ZOOM);
    L.tileLayer(OSM_TILE_URL, { attribution: OSM_ATTRIBUTION }).addTo(map);
    return () => { map.remove(); };
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <BackButton />
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Map className="w-7 h-7 text-primary" />
            خريطة المجتمع
          </h1>
        </div>
      </div>
      <div ref={mapRef} className="rounded-lg border border-border" style={{ height: '500px' }} />
    </div>
      </DashboardLayout>
  );
};

export default MapExplorer;
