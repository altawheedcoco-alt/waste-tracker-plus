import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import { lazy, Suspense, useEffect, useRef, useState, useCallback } from "react";
import { MapPin, AlertTriangle, Navigation, ExternalLink, Send, Recycle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { OSM_TILE_URL, OSM_ATTRIBUTION, EGYPT_CENTER, DEFAULT_ZOOM } from "@/lib/leafletConfig";
import { useToast } from "@/hooks/use-toast";

const Footer = lazy(() => import("@/components/Footer"));

const collectionPoints = [
  { id: 1, name: 'التوحيد للأخشاب', nameEn: 'Al-Tawheed Wood Recycling', lat: 29.9126, lng: 30.8720, type: 'wood' },
  { id: 2, name: 'مركز تدوير المعادن - حلوان', nameEn: 'Helwan Metal Recycling', lat: 29.8417, lng: 31.3344, type: 'metal' },
  { id: 3, name: 'مصنع تدوير البلاستيك - العاشر', nameEn: '10th Ramadan Plastics', lat: 30.2917, lng: 31.7500, type: 'plastic' },
  { id: 4, name: 'مجمع تدوير الورق - الإسكندرية', nameEn: 'Alexandria Paper Recycling', lat: 31.2001, lng: 29.9187, type: 'paper' },
  { id: 5, name: 'نقطة تجميع نفايات إلكترونية - المعادي', nameEn: 'Maadi E-Waste Collection', lat: 29.9602, lng: 31.2569, type: 'electronic' },
  { id: 6, name: 'مدفن صحي - 15 مايو', nameEn: '15 May Sanitary Landfill', lat: 29.8500, lng: 31.3400, type: 'municipal' },
  { id: 7, name: 'محطة معالجة نفايات طبية - القصر العيني', nameEn: 'Qasr El-Aini Medical Waste', lat: 30.0300, lng: 31.2300, type: 'medical' },
  { id: 8, name: 'مصنع كمبوست - الفيوم', nameEn: 'Fayoum Compost Plant', lat: 29.3084, lng: 30.8441, type: 'agricultural' },
  { id: 9, name: 'محطة فرز مخلفات بناء - أكتوبر', nameEn: 'October C&D Sorting', lat: 29.9600, lng: 30.9200, type: 'construction' },
  { id: 10, name: 'مجمع تدوير عضوي - الشرقية', nameEn: 'Sharqia Organic Recycling', lat: 30.5830, lng: 31.5020, type: 'municipal' },
  { id: 11, name: 'مركز جمع نفايات طبية - المنصورة', nameEn: 'Mansoura Medical Collection', lat: 31.0409, lng: 31.3785, type: 'medical' },
  { id: 12, name: 'محطة تدوير إلكتروني - القاهرة الجديدة', nameEn: 'New Cairo E-Waste Center', lat: 30.0300, lng: 31.4700, type: 'electronic' },
  { id: 13, name: 'مصنع إعادة تدوير زراعي - المنيا', nameEn: 'Minya Agri Recycling', lat: 28.1099, lng: 30.7503, type: 'agricultural' },
  { id: 14, name: 'كسارة مخلفات هدم - السويس', nameEn: 'Suez C&D Crusher', lat: 29.9660, lng: 32.5498, type: 'construction' },
];

const typeColors: Record<string, string> = {
  wood: '#8B4513', metal: '#708090', plastic: '#1E90FF', paper: '#DAA520', electronic: '#FF4500',
  municipal: '#22c55e', medical: '#ef4444', agricultural: '#84cc16', construction: '#78716c',
};

const typeIcons: Record<string, string> = {
  wood: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  metal: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  plastic: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  paper: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  electronic: '<rect x="4" y="4" width="16" height="12" rx="2"/><line x1="8" y1="20" x2="16" y2="20"/>',
  municipal: '<path d="M3 6h18l-2 13H5L3 6z"/><path d="M8 6V4h8v2"/>',
  medical: '<path d="M12 2v20M2 12h20"/>',
  agricultural: '<path d="M12 2L2 22h20L12 2z"/>',
  construction: '<rect x="3" y="8" width="18" height="14" rx="1"/><path d="M7 8V5a5 5 0 0 1 10 0v3"/>',
};

const typeLabels: Record<string, { ar: string; en: string }> = {
  wood: { ar: 'أخشاب', en: 'Wood' },
  metal: { ar: 'معادن', en: 'Metal' },
  plastic: { ar: 'بلاستيك', en: 'Plastic' },
  paper: { ar: 'ورق', en: 'Paper' },
  electronic: { ar: 'إلكترونيات', en: 'Electronic' },
  municipal: { ar: 'بلدية', en: 'Municipal' },
  medical: { ar: 'طبية', en: 'Medical' },
  agricultural: { ar: 'زراعية', en: 'Agricultural' },
  construction: { ar: 'هدم وبناء', en: 'Construction' },
};

const openInNav = (lat: number, lng: number, app: 'google' | 'waze') => {
  const url = app === 'waze'
    ? `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
    : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  window.open(url, '_blank');
};

const MapPage = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const reportMarkerRef = useRef<L.Marker | null>(null);
  const [reportMode, setReportMode] = useState(false);
  const [reportLocation, setReportLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportType, setReportType] = useState<'dumping' | 'center'>('dumping');
  const [reportName, setReportName] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, { center: EGYPT_CENTER, zoom: DEFAULT_ZOOM, zoomControl: true });
    L.tileLayer(OSM_TILE_URL, { attribution: OSM_ATTRIBUTION, maxZoom: 19 }).addTo(map);

    collectionPoints.forEach((point) => {
      const color = typeColors[point.type] || '#22c55e';
      const typeLabel = typeLabels[point.type];
      const marker = L.marker([point.lat, point.lng], {
        icon: L.divIcon({
          className: 'custom-marker',
          html: `<div style="background:${color};width:30px;height:30px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;cursor:pointer;">
            <svg width="14" height="14" fill="white" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3" fill="${color}"/></svg>
          </div>`,
          iconSize: [30, 30], iconAnchor: [15, 15],
        }),
      }).addTo(map);

      marker.bindPopup(`
        <div style="text-align:center;min-width:200px;font-family:system-ui;">
          <strong style="font-size:14px;display:block;margin-bottom:4px;">${isAr ? point.name : point.nameEn}</strong>
          <span style="font-size:11px;color:#888;background:${color}15;padding:2px 8px;border-radius:10px;color:${color};font-weight:600;">${isAr ? typeLabel.ar : typeLabel.en}</span>
          <div style="margin-top:8px;display:flex;gap:6px;justify-content:center;">
            <a href="https://www.google.com/maps/dir/?api=1&destination=${point.lat},${point.lng}" target="_blank" style="font-size:11px;color:#4285f4;text-decoration:none;padding:4px 10px;border:1px solid #4285f430;border-radius:8px;">Google Maps ↗</a>
            <a href="https://waze.com/ul?ll=${point.lat},${point.lng}&navigate=yes" target="_blank" style="font-size:11px;color:#33ccff;text-decoration:none;padding:4px 10px;border:1px solid #33ccff30;border-radius:8px;">Waze ↗</a>
          </div>
        </div>
      `);
    });

    mapInstance.current = map;
    return () => { map.remove(); mapInstance.current = null; };
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    const handler = (e: L.LeafletMouseEvent) => {
      if (!reportMode) return;
      setReportLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
      setShowReportForm(true);

      if (reportMarkerRef.current) map.removeLayer(reportMarkerRef.current);
      const m = L.marker([e.latlng.lat, e.latlng.lng], {
        icon: L.divIcon({
          className: 'report-marker',
          html: `<div style="background:#ef4444;width:34px;height:34px;border-radius:50%;border:3px solid white;box-shadow:0 2px 12px rgba(239,68,68,0.5);display:flex;align-items:center;justify-content:center;">
            <svg width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
          </div>`,
          iconSize: [34, 34], iconAnchor: [17, 17],
        }),
      }).addTo(map);
      reportMarkerRef.current = m;
    };

    map.off('click');
    map.on('click', handler);
  }, [reportMode]);

  const handleSubmitReport = () => {
    toast({
      title: isAr ? '✅ تم إرسال البلاغ بنجاح' : '✅ Report submitted successfully',
      description: isAr ? 'شكراً لمساهمتك في نظافة مدينتك! سيتم مراجعة البلاغ وإدراجه في النظام.' : 'Thank you for helping keep your city clean! The report will be reviewed.',
    });
    setReportMode(false);
    setShowReportForm(false);
    setReportLocation(null);
    setReportName('');
    setReportDesc('');
    if (reportMarkerRef.current && mapInstance.current) {
      mapInstance.current.removeLayer(reportMarkerRef.current);
      reportMarkerRef.current = null;
    }
  };

  const cancelReport = () => {
    setReportMode(false);
    setShowReportForm(false);
    setReportLocation(null);
    if (reportMarkerRef.current && mapInstance.current) {
      mapInstance.current.removeLayer(reportMarkerRef.current);
      reportMarkerRef.current = null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        {/* Hero Banner */}
        <div className="bg-gradient-to-b from-primary/5 to-background border-b border-border/50 px-4 py-6">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
              <MapPin className="w-6 h-6 text-primary" />
              {isAr ? 'خريطة نقاط التجميع والتدوير' : 'Collection & Recycling Points Map'}
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
              {isAr
                ? 'ساهم في نظافة مدينتك؛ أبلغ عن نقاط تجمع النفايات أو مراكز التدوير القريبة منك ليتم إدراجها في نظامنا.'
                : 'Help keep your city clean; report waste collection points or recycling centers near you to be added to our system.'}
            </p>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="bg-background border-b border-border/50 px-4 py-3">
          <div className="container mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={reportMode && reportType === 'dumping' ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => {
                  if (reportMode && reportType === 'dumping') { cancelReport(); }
                  else { setReportMode(true); setReportType('dumping'); setShowReportForm(false); setReportLocation(null); }
                }}
                className="gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                {isAr ? 'أبلغ عن تجمع نفايات' : 'Report Waste Dumping'}
              </Button>
              <Button
                variant={reportMode && reportType === 'center' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  if (reportMode && reportType === 'center') { cancelReport(); }
                  else { setReportMode(true); setReportType('center'); setShowReportForm(false); setReportLocation(null); }
                }}
                className="gap-2"
              >
                <Recycle className="w-4 h-4" />
                {isAr ? 'أضف مركز تدوير' : 'Add Recycling Center'}
              </Button>
            </div>
            <Button
              variant="outline" size="sm"
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

        {/* Report Mode Banner */}
        {reportMode && !showReportForm && (
          <div className={`${reportType === 'dumping' ? 'bg-destructive/10 border-destructive/30' : 'bg-primary/10 border-primary/30'} border-b px-4 py-2.5 text-center`}>
            <p className={`text-sm font-medium ${reportType === 'dumping' ? 'text-destructive' : 'text-primary'}`}>
              {reportType === 'dumping'
                ? (isAr ? '📍 انقر على الخريطة لتحديد موقع تجمع النفايات' : '📍 Click on the map to mark the waste dumping location')
                : (isAr ? '📍 انقر على الخريطة لتحديد موقع مركز التدوير' : '📍 Click on the map to mark the recycling center location')}
            </p>
          </div>
        )}

        {/* Map + Side Panel */}
        <div className="relative">
          <div ref={mapRef} className="w-full" style={{ height: 'calc(100vh - 220px)' }} />

          {/* Report Side Panel */}
          {showReportForm && reportLocation && (
            <div className="absolute top-4 end-4 w-80 max-w-[calc(100vw-2rem)] bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl p-5 z-[1000] animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  {reportType === 'dumping' ? <AlertTriangle className="w-4 h-4 text-destructive" /> : <Recycle className="w-4 h-4 text-primary" />}
                  {reportType === 'dumping'
                    ? (isAr ? 'إبلاغ عن تجمع نفايات' : 'Report Waste Dumping')
                    : (isAr ? 'إضافة مركز تدوير' : 'Add Recycling Center')}
                </h3>
                <button onClick={cancelReport} className="p-1 rounded-lg hover:bg-accent/50">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="text-xs text-muted-foreground mb-3 bg-accent/30 rounded-lg px-3 py-2">
                📍 {reportLocation.lat.toFixed(5)}, {reportLocation.lng.toFixed(5)}
              </div>

              <div className="space-y-3">
                <Input
                  placeholder={reportType === 'dumping' ? (isAr ? 'وصف مختصر (مثال: تجمع نفايات أمام مدرسة)' : 'Brief description') : (isAr ? 'اسم المركز' : 'Center name')}
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  className="text-sm"
                />
                <Textarea
                  placeholder={isAr ? 'تفاصيل إضافية (اختياري)' : 'Additional details (optional)'}
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  rows={3}
                  className="text-sm resize-none"
                />

                {/* Navigation links */}
                <div className="flex gap-2">
                  <button
                    onClick={() => openInNav(reportLocation.lat, reportLocation.lng, 'google')}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" /> Google Maps
                  </button>
                  <button
                    onClick={() => openInNav(reportLocation.lat, reportLocation.lng, 'waze')}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" /> Waze
                  </button>
                </div>

                <Button onClick={handleSubmitReport} className="w-full gap-2" disabled={!reportName.trim()}>
                  <Send className="w-4 h-4" />
                  {isAr ? 'إرسال البلاغ' : 'Submit Report'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MapPage;
