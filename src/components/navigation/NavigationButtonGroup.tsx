import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { 
  Navigation, 
  MapPin, 
  ChevronDown,
  Car,
  Map,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

interface NavigationButtonGroupProps {
  pickupAddress?: string;
  deliveryAddress?: string;
  pickupCoords?: { lat: number; lng: number } | null;
  deliveryCoords?: { lat: number; lng: number } | null;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showLabels?: boolean;
}

/**
 * Combined Navigation Button Group
 * Provides access to both Google Maps and Waze navigation
 */
const NavigationButtonGroup = ({
  pickupAddress,
  deliveryAddress,
  pickupCoords,
  deliveryCoords,
  size = 'default',
  className = '',
  showLabels = true,
}: NavigationButtonGroupProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Build navigation URLs
  const buildGoogleMapsUrl = (destination: string | { lat: number; lng: number }) => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    let destParam: string;
    
    if (typeof destination === 'string') {
      destParam = encodeURIComponent(destination);
    } else {
      destParam = `${destination.lat},${destination.lng}`;
    }
    
    if (isMobile) {
      return `google.navigation:q=${destParam}&mode=d`;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${destParam}&travelmode=driving`;
  };

  const buildWazeUrl = (destination: string | { lat: number; lng: number }) => {
    if (typeof destination === 'string') {
      return `https://waze.com/ul?q=${encodeURIComponent(destination)}&navigate=yes`;
    }
    return `https://waze.com/ul?ll=${destination.lat},${destination.lng}&navigate=yes`;
  };

  const buildHereWeGoUrl = (destination: string | { lat: number; lng: number }) => {
    if (typeof destination === 'string') {
      return `https://wego.here.com/directions/drive/mylocation/${encodeURIComponent(destination)}`;
    }
    return `https://wego.here.com/directions/drive/mylocation/${destination.lat},${destination.lng}`;
  };

  // Navigation handlers
  const handleNavigate = (app: 'google' | 'waze' | 'here', type: 'pickup' | 'delivery') => {
    const destination = type === 'pickup' 
      ? (pickupCoords || pickupAddress)
      : (deliveryCoords || deliveryAddress);
      
    if (!destination) {
      toast.error(`عنوان ${type === 'pickup' ? 'الاستلام' : 'التسليم'} غير متاح`);
      return;
    }
    
    const urlMap = { google: buildGoogleMapsUrl, waze: buildWazeUrl, here: buildHereWeGoUrl };
    const url = urlMap[app](destination);
    window.open(url, '_blank');
    const appNames = { google: 'Google Maps', waze: 'Waze', here: 'HERE WeGo' };
    toast.success(`جاري فتح ${appNames[app]}...`);
    setIsOpen(false);
  };

  // Show full route
  const handleShowRoute = (app: 'google' | 'waze' | 'here') => {
    const origin = pickupCoords 
      ? `${pickupCoords.lat},${pickupCoords.lng}` 
      : pickupAddress;
    const destination = deliveryCoords 
      ? `${deliveryCoords.lat},${deliveryCoords.lng}` 
      : deliveryAddress;
      
    if (!origin || !destination) {
      toast.error('العناوين غير متاحة');
      return;
    }

    let url: string;
    if (app === 'google') {
      url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
    } else if (app === 'here') {
      url = `https://wego.here.com/directions/drive/${encodeURIComponent(origin)}/${encodeURIComponent(destination)}`;
    } else {
      url = typeof destination === 'string'
        ? `https://waze.com/ul?q=${encodeURIComponent(destination)}&navigate=yes`
        : `https://waze.com/ul?ll=${deliveryCoords?.lat},${deliveryCoords?.lng}&navigate=yes`;
    }
    
    window.open(url, '_blank');
    const appNames: Record<string, string> = { google: 'Google Maps', waze: 'Waze', here: 'HERE WeGo' };
    toast.success(`جاري عرض المسار على ${appNames[app]}...`);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          size={size}
          variant="default"
          className={`bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 hover:from-green-600 hover:to-emerald-700 gap-2 ${className}`}
        >
          <Navigation className="w-4 h-4" />
          {showLabels && <span>ابدأ الملاحة</span>}
          <ChevronDown className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {/* Header */}
        <div className="p-3 border-b">
          <p className="font-semibold text-sm">اختر تطبيق الملاحة</p>
          <p className="text-[11px] text-muted-foreground">
            حدد التطبيق ونقطة الوجهة للبدء
          </p>
        </div>
        
        {/* Google Maps Section */}
        <div className="p-2">
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="w-6 h-6 rounded bg-red-500 flex items-center justify-center">
              <Map className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-medium">Google Maps</span>
            <Badge variant="secondary" className="text-[9px] mr-auto">مجاني</Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-1 mt-1">
            <DropdownMenuItem 
              onClick={() => handleNavigate('google', 'pickup')} 
              className="gap-2 cursor-pointer rounded-lg"
            >
              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                <MapPin className="w-3 h-3 text-blue-600" />
              </div>
              <span className="text-xs">نقطة الاستلام</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={() => handleNavigate('google', 'delivery')} 
              className="gap-2 cursor-pointer rounded-lg"
            >
              <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                <MapPin className="w-3 h-3 text-red-600" />
              </div>
              <span className="text-xs">نقطة التسليم</span>
            </DropdownMenuItem>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-1 h-7 text-xs gap-1"
            onClick={() => handleShowRoute('google')}
          >
            <ExternalLink className="w-3 h-3" />
            عرض المسار الكامل
          </Button>
        </div>

        <DropdownMenuSeparator />

        {/* Waze Section */}
        <div className="p-2">
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="w-6 h-6 rounded bg-cyan-500 flex items-center justify-center">
              <Car className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-medium">Waze</span>
            <Badge variant="outline" className="text-[9px] mr-auto border-cyan-300 text-cyan-600">
              تنبيهات المرور
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-1 mt-1">
            <DropdownMenuItem 
              onClick={() => handleNavigate('waze', 'pickup')} 
              className="gap-2 cursor-pointer rounded-lg"
            >
              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                <MapPin className="w-3 h-3 text-blue-600" />
              </div>
              <span className="text-xs">نقطة الاستلام</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={() => handleNavigate('waze', 'delivery')} 
              className="gap-2 cursor-pointer rounded-lg"
            >
              <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                <MapPin className="w-3 h-3 text-red-600" />
              </div>
              <span className="text-xs">نقطة التسليم</span>
            </DropdownMenuItem>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-1 h-7 text-xs gap-1"
            onClick={() => handleShowRoute('waze')}
          >
            <ExternalLink className="w-3 h-3" />
            التنقل عبر Waze
          </Button>
        </div>

        <DropdownMenuSeparator />

        {/* HERE WeGo Section */}
        <div className="p-2">
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="w-6 h-6 rounded bg-emerald-600 flex items-center justify-center">
              <Navigation className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-medium">HERE WeGo</span>
            <Badge variant="outline" className="text-[9px] mr-auto border-emerald-300 text-emerald-600">
              ملاحة بدون انترنت
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-1 mt-1">
            <DropdownMenuItem 
              onClick={() => handleNavigate('here', 'pickup')} 
              className="gap-2 cursor-pointer rounded-lg"
            >
              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                <MapPin className="w-3 h-3 text-blue-600" />
              </div>
              <span className="text-xs">نقطة الاستلام</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={() => handleNavigate('here', 'delivery')} 
              className="gap-2 cursor-pointer rounded-lg"
            >
              <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                <MapPin className="w-3 h-3 text-red-600" />
              </div>
              <span className="text-xs">نقطة التسليم</span>
            </DropdownMenuItem>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-1 h-7 text-xs gap-1"
            onClick={() => handleShowRoute('here')}
          >
            <ExternalLink className="w-3 h-3" />
            عرض المسار عبر HERE WeGo
          </Button>
        </div>

        {/* Footer */}
        <div className="px-3 py-2 border-t bg-muted/30">
          <p className="text-[10px] text-muted-foreground text-center">
            💡 يتطلب تثبيت التطبيق المختار على الهاتف
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NavigationButtonGroup;
