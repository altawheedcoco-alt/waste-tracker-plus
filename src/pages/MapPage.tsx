import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { MapPin, AlertTriangle, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { OSM_TILE_URL, OSM_ATTRIBUTION, EGYPT_CENTER, DEFAULT_ZOOM } from "@/lib/leafletConfig";

const Footer = lazy(() => import("@/components/Footer"));

// Sample collection points
const collectionPoints = [
  { id: 1, name: 'التوحيد للأخشاب', nameEn: 'Al-Tawheed Wood Recycling', lat: 29.9126, lng: 30.8720, type: 'wood' },
  { id: 2, name: 'مركز تدوير المعادن - حلوان', nameEn: 'Helwan Metal Recycling', lat: 29.8417, lng: 31.3344, type: 'metal' },
  { id: 3, name: 'مصنع تدوير البلاستيك - العاشر', nameEn: '10th Ramadan Plastics', lat: 30.2917, lng: 31.7500, type: 'plastic' },
  { id: 4, name: 'مجمع تدوير الورق - الإسكندرية', nameEn: 'Alexandria Paper Recycling', lat: 31.2001, lng: 29.9187, type: 'paper' },
  { id: 5, name: 'نقطة تجميع نفايات إلكترونية - المعادي', nameEn: 'Maadi E-Waste Collection', lat: 29.9602, lng: 31.2569, type: 'electronic' },
];

const typeColors: Record<string, string> = {
  wood: '#8B4513',
  metal: '#708090',
  plastic: '#1E90FF',
  paper: '#DAA520',
  electronic: '#FF4500',
};

const MapPage = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const [reportMode, setReportMode] = useState(false);
  const [reportLocation, setReportLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center: EGYPT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
    });

    L.tileLayer(OSM_TILE_URL, { attribution: OSM_ATTRIBUTION, maxZoom: 19 }).addTo(map);

    // Add collection points
    collectionPoints.forEach((point) => {
      const color = typeColors[point.type] || '#22c55e';
      const marker = L.marker([point.lat, point.lng], {
        icon: L.divIcon({
          className: 'custom-marker',
          html: `<div style="background:${color};width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
            <svg width="14" height="14" fill="white" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3" fill="${color}"/></svg>
          </div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        }),
      }).addTo(map);

      marker.bindPopup(`
        <div style="text-align:center;min-width:150px;">
          <strong style="font-size:14px;">${isAr ? point.name : point.nameEn}</strong>
          <br/>
          <span style="font-size:12px;color:#666;">${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}</span>
        </div>
      `);
    });

    // Report mode click handler
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (reportMode) {
        setReportLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    });

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Update click handler when reportMode changes
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    const handler = (e: L.LeafletMouseEvent) => {
      if (reportMode) {
        setReportLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
        L.marker([e.latlng.lat, e.latlng.lng], {
          icon: L.divIcon({
            className: 'report-marker',
            html: `<div style="background:#ef4444;width:32px;height:32px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;animation:pulse 2s infinite;">
              <svg width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13" stroke="red" stroke-width="2"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="red" stroke-width="2"/></svg>
            </div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          }),
        }).addTo(map);
      }
    };

    map.off('click');
    map.on('click', handler);
  }, [reportMode]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        {/* Controls Bar */}
        <div className="bg-background border-b border-border/50 px-4 py-3">
          <div className="container mx-auto flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                {isAr ? 'خريطة نقاط التجميع' : 'Collection Points Map'}
              </h1>
              <p className="text-xs text-muted-foreground">{isAr ? 'اعثر على أقرب نقطة تجميع أو أبلغ عن تجمع نفايات' : 'Find nearest collection point or report waste dumping'}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={reportMode ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => { setReportMode(!reportMode); setReportLocation(null); }}
                className="gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                {reportMode
                  ? (isAr ? 'إلغاء الإبلاغ' : 'Cancel Report')
                  : (isAr ? 'أبلغ عن تجمع نفايات' : 'Report Waste Dumping')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition((pos) => {
                      mapInstance.current?.setView([pos.coords.latitude, pos.coords.longitude], 14);
                    });
                  }
                }}
                className="gap-2"
              >
                <Navigation className="w-4 h-4" />
                {isAr ? 'موقعي' : 'My Location'}
              </Button>
            </div>
          </div>
        </div>

        {/* Report Banner */}
        {reportMode && (
          <div className="bg-destructive/10 border-b border-destructive/30 px-4 py-2 text-center">
            <p className="text-sm text-destructive font-medium">
              {isAr ? '📍 انقر على الخريطة لتحديد موقع تجمع النفايات' : '📍 Click on the map to mark the waste dumping location'}
            </p>
          </div>
        )}

        {reportLocation && (
          <div className="bg-accent/50 border-b border-border/50 px-4 py-3 text-center">
            <p className="text-sm text-foreground">
              {isAr ? `✅ تم تحديد الموقع: ${reportLocation.lat.toFixed(4)}, ${reportLocation.lng.toFixed(4)}` : `✅ Location marked: ${reportLocation.lat.toFixed(4)}, ${reportLocation.lng.toFixed(4)}`}
            </p>
          </div>
        )}

        {/* Map */}
        <div ref={mapRef} className="w-full" style={{ height: 'calc(100vh - 140px)' }} />
      </main>
    </div>
  );
};

export default MapPage;
