import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Navigation, ExternalLink, Loader2, LocateFixed } from 'lucide-react';
import { geocodeAddress } from '@/lib/mapUtils';

const DEFAULT_LAT = 30.0444;
const DEFAULT_LNG = 31.2357;
const DEFAULT_ZOOM = 12;

const WazeLiveMap = () => {
  const [lat, setLat] = useState(DEFAULT_LAT);
  const [lng, setLng] = useState(DEFAULT_LNG);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [locationName, setLocationName] = useState('القاهرة، مصر');
  const [pin, setPin] = useState(false);

  const wazeIframeSrc = `https://embed.waze.com/iframe?zoom=${zoom}&lat=${lat}&lon=${lng}&ct=livemap${pin ? '&pin=1' : ''}`;

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
            خريطة Waze المباشرة
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            حركة المرور المباشرة والملاحة عبر Waze
          </p>
        </div>
        <Button onClick={openInWaze} variant="outline" className="gap-2">
          <ExternalLink className="w-4 h-4" />
          فتح في Waze
        </Button>
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

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'القاهرة', lat: 30.0444, lng: 31.2357 },
          { label: 'الإسكندرية', lat: 31.2001, lng: 29.9187 },
          { label: 'الجيزة', lat: 30.0131, lng: 31.2089 },
          { label: '6 أكتوبر', lat: 29.9553, lng: 30.9276 },
        ].map((city) => (
          <Button
            key={city.label}
            variant="outline"
            className="gap-2"
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
