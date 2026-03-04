import { useState, useCallback } from 'react';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Navigation, ExternalLink, Loader2, LocateFixed, Recycle } from 'lucide-react';
import { geocodeAddress } from '@/lib/mapUtils';
import { EGYPTIAN_INDUSTRIAL_DATA } from '@/data/egyptianIndustrialData';

const DEFAULT_LAT = 26.8;
const DEFAULT_LNG = 30.8;
const DEFAULT_ZOOM = 7;

const WazeLiveMap = () => {
  const [lat, setLat] = useState(DEFAULT_LAT);
  const [lng, setLng] = useState(DEFAULT_LNG);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [locationName, setLocationName] = useState('جمهورية مصر العربية');
  const [showPoints, setShowPoints] = useState(true);
  const [pin, setPin] = useState(false);

  const wazeIframeSrc = `https://embed.waze.com/iframe?zoom=${zoom}&lat=${lat}&lon=${lng}${pin ? '&pin=1' : ''}`;

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const result = await geocodeAddress(searchQuery);
      if (result.success) {
        setLat(result.lat);
        setLng(result.lng);
        setLocationName(result.displayName || searchQuery);
        setPin(true);
        setZoom(14);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  const handleMyLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setSearching(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setPin(true);
        setZoom(15);
        setLocationName('موقعي الحالي');
        setSearching(false);
      },
      () => setSearching(false),
      { enableHighAccuracy: true }
    );
  }, []);

  const openInWaze = () => {
    window.open(`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Navigation className="w-6 h-6 text-primary" />
            خريطة التدوير الوطنية
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            نقاط التجميع الرسمية والمناطق الصناعية المعتمدة في كافة أنحاء الجمهورية
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowPoints(!showPoints)} variant={showPoints ? 'default' : 'outline'} className="gap-2" size="sm">
            <Recycle className="w-4 h-4" />
            {showPoints ? 'إخفاء النقاط' : 'إظهار النقاط'}
          </Button>
          <Button onClick={openInWaze} variant="outline" className="gap-2" size="sm">
            <ExternalLink className="w-4 h-4" />
            فتح في Waze
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="w-4 h-4" />
            البحث عن الأماكن
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="ابحث عن مكان... (مثال: الأهرامات، شارع التحرير)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={searching} className="gap-2">
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              بحث
            </Button>
            <Button onClick={handleMyLocation} variant="secondary" className="gap-2" disabled={searching}>
              <LocateFixed className="w-4 h-4" />
              موقعي
            </Button>
          </div>
          {locationName && (
            <div className="flex items-center gap-2 mt-3">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">{locationName}</span>
              <Badge variant="secondary" className="text-[10px]">
                {lat.toFixed(4)}, {lng.toFixed(4)}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Waze Map */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="relative w-full" style={{ height: 'calc(100vh - 320px)', minHeight: '400px' }}>
            <iframe
              src={wazeIframeSrc}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              title="Waze Live Map"
            />
          </div>
        </CardContent>
      </Card>

      {/* Official Collection Points */}
      {showPoints && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Recycle className="w-4 h-4" />
              نقاط التجميع والمناطق الصناعية المعتمدة ({EGYPTIAN_INDUSTRIAL_DATA.length} نقطة)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
              {EGYPTIAN_INDUSTRIAL_DATA.map((point, i) => (
                <Button
                  key={i}
                  variant="ghost"
                  size="sm"
                  className="justify-start text-start h-auto py-2 gap-2"
                  onClick={() => {
                    setLat(point.lat);
                    setLng(point.lng);
                    setLocationName(point.name);
                    setPin(true);
                    setZoom(14);
                  }}
                >
                  <MapPin className="w-3 h-3 text-primary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{point.name}</p>
                    <p className="text-[10px] text-muted-foreground">{point.city}</p>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Cities */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'القاهرة', lat: 30.0444, lng: 31.2357 },
          { label: 'الإسكندرية', lat: 31.2001, lng: 29.9187 },
          { label: 'الجيزة', lat: 30.0131, lng: 31.2089 },
          { label: '6 أكتوبر', lat: 29.9553, lng: 30.9276 },
          { label: 'العاشر من رمضان', lat: 30.2833, lng: 31.7500 },
          { label: 'السويس', lat: 29.9833, lng: 32.5500 },
          { label: 'أسوان', lat: 24.0875, lng: 32.8994 },
          { label: 'المنيا', lat: 28.1099, lng: 30.7503 },
        ].map((city) => (
          <Button
            key={city.label}
            variant="outline"
            className="gap-2"
            size="sm"
            onClick={() => {
              setLat(city.lat);
              setLng(city.lng);
              setLocationName(city.label);
              setPin(true);
              setZoom(13);
            }}
          >
            <MapPin className="w-4 h-4" />
            {city.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default WazeLiveMap;
