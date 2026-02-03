import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Search, Crosshair, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import BackButton from '@/components/ui/back-button';
import MapboxInteractiveMapPicker from '@/components/maps/MapboxInteractiveMapPicker';
import { toast } from 'sonner';

const MapExplorer = () => {
  const [selectedPosition, setSelectedPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string>('');

  const handlePositionSelect = (position: { lat: number; lng: number }, address?: string) => {
    setSelectedPosition(position);
    setSelectedAddress(address || `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`);
    toast.success('تم تحديد الموقع بنجاح');
  };

  const handleCopyCoordinates = () => {
    if (selectedPosition) {
      const coords = `${selectedPosition.lat}, ${selectedPosition.lng}`;
      navigator.clipboard.writeText(coords);
      toast.success('تم نسخ الإحداثيات');
    }
  };

  const handleCopyAddress = () => {
    if (selectedAddress) {
      navigator.clipboard.writeText(selectedAddress);
      toast.success('تم نسخ العنوان');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <MapPin className="w-6 h-6 text-primary" />
              الخريطة التفاعلية
            </h1>
            <p className="text-sm text-muted-foreground">
              ابحث عن أي موقع أو مصنع أو شركة على الخريطة
            </p>
          </div>
        </div>
      </div>

      {/* Map Card */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            ابحث أو اضغط على الخريطة لتحديد موقع
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <MapboxInteractiveMapPicker
            center={{ lat: 30.0444, lng: 31.2357 }}
            zoom={10}
            selectedPosition={selectedPosition}
            onPositionSelect={handlePositionSelect}
            showSearch={true}
            showCurrentLocation={true}
            height="calc(100vh - 320px)"
            label="ابحث عن موقع، مصنع، شركة، أو عنوان..."
          />
        </CardContent>
      </Card>

      {/* Selected Location Info */}
      {selectedPosition && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Crosshair className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="font-semibold">الموقع المحدد</h3>
                  
                  {selectedAddress && (
                    <div className="flex items-center justify-between gap-2 p-2 bg-background rounded-lg">
                      <p className="text-sm text-muted-foreground line-clamp-2">{selectedAddress}</p>
                      <Button variant="ghost" size="sm" onClick={handleCopyAddress}>
                        نسخ
                      </Button>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between gap-2 p-2 bg-background rounded-lg">
                    <p className="text-sm font-mono text-muted-foreground">
                      {selectedPosition.lat.toFixed(6)}, {selectedPosition.lng.toFixed(6)}
                    </p>
                    <Button variant="ghost" size="sm" onClick={handleCopyCoordinates}>
                      نسخ
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Info Card */}
      <Card className="bg-muted/30">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• استخدم خانة البحث للعثور على أي عنوان أو مكان</p>
              <p>• يمكنك البحث عن المصانع والشركات بالاسم</p>
              <p>• اضغط على أي نقطة على الخريطة لتحديد موقع يدوياً</p>
              <p>• استخدم زر "موقعي الحالي" لتحديد موقعك بدقة</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MapExplorer;
