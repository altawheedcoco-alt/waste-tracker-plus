/**
 * خريطة الطلب الساخن — للسائق المستقل
 * تستخدم Leaflet الأصلي (بدون react-leaflet) لتوافق React 18
 */
import { memo, useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, MapPin, Package } from 'lucide-react';
import { useNearbyShipments, type NearbyShipment } from '@/hooks/useProximityData';
import { OSM_TILE_URL, OSM_ATTRIBUTION } from '@/lib/leafletConfig';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

function clusterShipments(shipments: NearbyShipment[], clusterRadiusKm = 5) {
  const used = new Set<string>();
  const clusters: Array<{ lat: number; lng: number; count: number; shipments: NearbyShipment[] }> = [];
  shipments.forEach(s => {
    if (used.has(s.id)) return;
    const group = shipments.filter(o => {
      if (used.has(o.id)) return false;
      const dist = Math.sqrt(
        Math.pow((s.pickupLat - o.pickupLat) * 111, 2) +
        Math.pow((s.pickupLng - o.pickupLng) * 111 * Math.cos(s.pickupLat * Math.PI / 180), 2)
      );
      return dist <= clusterRadiusKm;
    });
    group.forEach(g => used.add(g.id));
    const avgLat = group.reduce((a, g) => a + g.pickupLat, 0) / group.length;
    const avgLng = group.reduce((a, g) => a + g.pickupLng, 0) / group.length;
    clusters.push({ lat: avgLat, lng: avgLng, count: group.length, shipments: group });
  });
  return clusters;
}

function getHeatColor(count: number): string {
  if (count >= 5) return '#ef4444';
  if (count >= 3) return '#f97316';
  return '#eab308';
}

interface Props {
  driverLat?: number;
  driverLng?: number;
  serviceAreaKm?: number;
}

const DemandHeatmapDriver = memo(({ driverLat, driverLng, serviceAreaKm = 30 }: Props) => {
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (driverLat && driverLng) return;
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setGpsCoords({ lat: 30.0444, lng: 31.2357 }),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setGpsCoords({ lat: 30.0444, lng: 31.2357 });
    }
  }, [driverLat, driverLng]);

  const actualLat = driverLat || gpsCoords?.lat || 30.0444;
  const actualLng = driverLng || gpsCoords?.lng || 31.2357;
  const center = { lat: actualLat, lng: actualLng };
  const { data: shipments = [], isLoading } = useNearbyShipments(center, serviceAreaKm);

  const clusters = clusterShipments(shipments);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    if (!actualLat || !actualLng) return;

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([actualLat, actualLng], 10);

    L.tileLayer(OSM_TILE_URL, { attribution: OSM_ATTRIBUTION }).addTo(map);

    // Service area circle
    L.circle([actualLat, actualLng], {
      radius: serviceAreaKm * 1000,
      color: '#f97316',
      fillColor: '#f97316',
      fillOpacity: 0.06,
      weight: 1,
      dashArray: '6 4',
    }).addTo(map);

    // Driver position
    L.circleMarker([actualLat, actualLng], {
      radius: 8,
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 1,
      weight: 2,
    }).addTo(map).bindPopup('📍 موقعك الحالي');

    markersRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [actualLat, actualLng, serviceAreaKm]);

  // Update cluster markers
  useEffect(() => {
    if (!markersRef.current) return;
    markersRef.current.clearLayers();

    clusters.forEach(cluster => {
      const color = getHeatColor(cluster.count);
      const size = Math.min(20 + cluster.count * 6, 50);

      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width:${size}px;height:${size}px;border-radius:50%;
          background:${color};opacity:0.85;border:2px solid white;
          box-shadow:0 2px 8px ${color}80;
          display:flex;align-items:center;justify-content:center;
          font-size:${Math.min(10 + cluster.count, 16)}px;font-weight:bold;color:white;
        ">${cluster.count}</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const wasteTypes = [...new Set(cluster.shipments.map(s => s.wasteType).filter(Boolean))].join('، ');

      L.marker([cluster.lat, cluster.lng], { icon })
        .addTo(markersRef.current!)
        .bindPopup(`
          <div style="text-align:right;direction:rtl;min-width:130px">
            <b>🔥 ${cluster.count} شحنة</b><br/>
            ${wasteTypes ? `📦 ${wasteTypes}<br/>` : ''}
            ${cluster.shipments[0]?.pickupAddress ? `📍 ${cluster.shipments[0].pickupAddress.substring(0, 40)}` : ''}
          </div>
        `);
    });

    // Also add individual shipment markers if few
    if (shipments.length <= 15) {
      shipments.forEach(s => {
        L.circleMarker([s.pickupLat, s.pickupLng], {
          radius: 5,
          color: '#f97316',
          fillColor: '#f97316',
          fillOpacity: 0.6,
          weight: 1,
        }).addTo(markersRef.current!)
          .bindPopup(`
            <div style="text-align:right;direction:rtl">
              <b>${s.shipmentNumber}</b><br/>
              📦 ${s.wasteType || 'غير محدد'} — ${s.quantity} ${s.unit || ''}<br/>
              📏 ${s.distanceKm} كم
            </div>
          `);
      });
    }
  }, [clusters, shipments]);

  return (
    <Card className="overflow-hidden border-primary/20">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            خريطة الطلب الساخن
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1 text-[10px]">
              <Package className="w-3 h-3" />
              {shipments.length} شحنة قريبة
            </Badge>
            {clusters.length > 0 && (
              <Badge variant="outline" className="gap-1 text-[10px]">
                <MapPin className="w-3 h-3" />
                {clusters.length} منطقة
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 text-[9px] text-muted-foreground mt-1">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400" /> طلب منخفض</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> طلب متوسط</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> طلب مرتفع</span>
        </div>
      </CardHeader>

      <CardContent className="p-0 relative">
        <div ref={mapRef} style={{ height: '280px', width: '100%' }} />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 z-[500]">
            <p className="text-xs text-muted-foreground animate-pulse">جاري تحليل مناطق الطلب...</p>
          </div>
        )}
        {!isLoading && shipments.length > 0 && (
          <div className="absolute bottom-2 left-2 right-2 bg-background/80 backdrop-blur-sm rounded-lg p-1.5 text-center z-[500]">
            <p className="text-[11px] text-foreground font-medium">
              {shipments.length} شحنة في {clusters.length} منطقة
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

DemandHeatmapDriver.displayName = 'DemandHeatmapDriver';
export default DemandHeatmapDriver;
