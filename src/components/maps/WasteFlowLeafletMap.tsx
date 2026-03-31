/**
 * خريطة تدفق النفايات — Leaflet أصلي
 * تعرض مسارات التدفق بين المناطق مع دوائر حرارية وتنبيهات جغرافية
 */
import { useEffect, useRef, memo } from 'react';
import L from 'leaflet';
import { OSM_TILE_URL, OSM_ATTRIBUTION, EGYPT_CENTER, DEFAULT_ZOOM } from '@/lib/leafletConfig';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

interface WasteFlow {
  id: string;
  source_region: string;
  source_lat: number;
  source_lng: number;
  destination_region: string;
  destination_lat: number;
  destination_lng: number;
  waste_type: string;
  waste_category: string;
  quantity_tons: number;
  shipment_count: number;
}

interface GeoAlert {
  id: string;
  region_name: string;
  region_lat: number;
  region_lng: number;
  alert_type: string;
  severity: string;
  message_ar: string;
  is_active: boolean;
}

const FLOW_COLORS: Record<string, string> = {
  commodity: '#22c55e',
  rdf: '#f97316',
  hazardous: '#ef4444',
  organic: '#84cc16',
};

interface Props {
  flows: WasteFlow[];
  alerts: GeoAlert[];
  height?: string;
}

const WasteFlowLeafletMap = memo(({ flows, alerts, height = '500px' }: Props) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView(EGYPT_CENTER, DEFAULT_ZOOM);

    L.tileLayer(OSM_TILE_URL, { attribution: OSM_ATTRIBUTION }).addTo(map);
    mapInstanceRef.current = map;

    // Aggregate destinations for heatmap-like circles
    const destAgg: Record<string, { lat: number; lng: number; tons: number; count: number; types: Set<string> }> = {};
    const srcAgg: Record<string, { lat: number; lng: number; tons: number; count: number }> = {};

    flows.forEach(f => {
      // Destination aggregation
      const dKey = `${f.destination_lat.toFixed(2)},${f.destination_lng.toFixed(2)}`;
      if (!destAgg[dKey]) destAgg[dKey] = { lat: f.destination_lat, lng: f.destination_lng, tons: 0, count: 0, types: new Set() };
      destAgg[dKey].tons += f.quantity_tons;
      destAgg[dKey].count += f.shipment_count;
      destAgg[dKey].types.add(f.waste_category);

      // Source aggregation
      const sKey = `${f.source_lat.toFixed(2)},${f.source_lng.toFixed(2)}`;
      if (!srcAgg[sKey]) srcAgg[sKey] = { lat: f.source_lat, lng: f.source_lng, tons: 0, count: 0 };
      srcAgg[sKey].tons += f.quantity_tons;
      srcAgg[sKey].count += f.shipment_count;
    });

    // Draw flow lines
    flows.forEach(f => {
      if (!f.source_lat || !f.destination_lat) return;
      const color = FLOW_COLORS[f.waste_category] || '#6b7280';
      const weight = Math.max(1.5, Math.min(f.quantity_tons / 50, 6));

      const line = L.polyline(
        [[f.source_lat, f.source_lng], [f.destination_lat, f.destination_lng]],
        { color, weight, opacity: 0.5, dashArray: '8 6' }
      ).addTo(map);

      line.bindPopup(`
        <div style="text-align:right;direction:rtl;min-width:160px">
          <b>${f.source_region} → ${f.destination_region}</b><br/>
          📦 ${f.waste_type}<br/>
          ⚖️ ${f.quantity_tons} طن<br/>
          🚛 ${f.shipment_count} شحنة
        </div>
      `);
    });

    // Draw source circles (blue)
    Object.values(srcAgg).forEach(s => {
      const radius = Math.max(8000, Math.min(s.tons * 200, 40000));
      L.circle([s.lat, s.lng], {
        radius,
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.2,
        weight: 1,
      }).addTo(map).bindPopup(`
        <div style="text-align:right;direction:rtl">
          <b>🔵 مصدر نفايات</b><br/>
          ⚖️ ${s.tons} طن<br/>
          🚛 ${s.count} شحنة
        </div>
      `);
    });

    // Draw destination circles (colored by intensity)
    Object.values(destAgg).forEach(d => {
      const radius = Math.max(10000, Math.min(d.tons * 300, 50000));
      const color = d.tons > 500 ? '#ef4444' : d.tons > 100 ? '#f97316' : '#22c55e';
      L.circle([d.lat, d.lng], {
        radius,
        color,
        fillColor: color,
        fillOpacity: 0.25,
        weight: 2,
      }).addTo(map).bindPopup(`
        <div style="text-align:right;direction:rtl">
          <b>📍 وجهة استقبال</b><br/>
          ⚖️ ${d.tons} طن<br/>
          🚛 ${d.count} شحنة<br/>
          📦 ${[...d.types].join('، ')}
        </div>
      `);
    });

    // Draw alerts
    alerts.filter(a => a.is_active && a.region_lat && a.region_lng).forEach(alert => {
      const sevColor = alert.severity === 'critical' ? '#ef4444' : alert.severity === 'high' ? '#f97316' : '#eab308';
      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width:26px;height:26px;border-radius:50%;
          background:${sevColor};border:2px solid white;
          box-shadow:0 0 10px ${sevColor}80;
          display:flex;align-items:center;justify-content:center;
          font-size:14px;animation:pulse 2s infinite;
        ">⚠️</div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      L.marker([alert.region_lat, alert.region_lng], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="text-align:right;direction:rtl">
            <b>⚠️ ${alert.region_name}</b><br/>
            ${alert.message_ar}
          </div>
        `);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [flows, alerts]);

  return <div ref={mapRef} className="w-full rounded-lg" style={{ height }} />;
});

WasteFlowLeafletMap.displayName = 'WasteFlowLeafletMap';
export default WasteFlowLeafletMap;
