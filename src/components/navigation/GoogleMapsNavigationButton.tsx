import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Navigation, ExternalLink, MapPin, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface GoogleMapsNavigationButtonProps {
  pickupAddress?: string;
  deliveryAddress?: string;
  pickupCoords?: { lat: number; lng: number } | null;
  deliveryCoords?: { lat: number; lng: number } | null;
  variant?: 'default' | 'icon' | 'full';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

/**
 * Opens Google Maps navigation on the user's phone.
 * This allows drivers to use their phone's Google Maps for free navigation
 * while our system tracks their actual location.
 */
const GoogleMapsNavigationButton = ({
  pickupAddress,
  deliveryAddress,
  pickupCoords,
  deliveryCoords,
  variant = 'default',
  size = 'default',
  className = '',
}: GoogleMapsNavigationButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Build Google Maps URL for navigation
  const buildGoogleMapsUrl = (destination: string | { lat: number; lng: number }, mode: 'directions' | 'navigation' = 'navigation') => {
    // Detect if mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    let destParam: string;
    if (typeof destination === 'string') {
      destParam = encodeURIComponent(destination);
    } else {
      destParam = `${destination.lat},${destination.lng}`;
    }
    
    if (isMobile) {
      // Use Google Maps app deep link for mobile
      if (mode === 'navigation') {
        // Direct navigation mode - starts turn-by-turn immediately
        return `google.navigation:q=${destParam}&mode=d`;
      } else {
        // Directions mode - shows route preview first
        return `https://www.google.com/maps/dir/?api=1&destination=${destParam}&travelmode=driving`;
      }
    } else {
      // Web fallback for desktop
      return `https://www.google.com/maps/dir/?api=1&destination=${destParam}&travelmode=driving`;
    }
  };

  // Build Waze URL for alternative navigation
  const buildWazeUrl = (destination: string | { lat: number; lng: number }) => {
    if (typeof destination === 'string') {
      return `https://waze.com/ul?q=${encodeURIComponent(destination)}&navigate=yes`;
    } else {
      return `https://waze.com/ul?ll=${destination.lat},${destination.lng}&navigate=yes`;
    }
  };

  // Open navigation to pickup location
  const handleNavigateToPickup = () => {
    const destination = pickupCoords || pickupAddress;
    if (!destination) {
      toast.error('عنوان الاستلام غير متاح');
      return;
    }
    
    const url = buildGoogleMapsUrl(destination, 'navigation');
    window.open(url, '_blank');
    toast.success('جاري فتح خرائط جوجل للملاحة...');
    setIsOpen(false);
  };

  // Open navigation to delivery location
  const handleNavigateToDelivery = () => {
    const destination = deliveryCoords || deliveryAddress;
    if (!destination) {
      toast.error('عنوان التسليم غير متاح');
      return;
    }
    
    const url = buildGoogleMapsUrl(destination, 'navigation');
    window.open(url, '_blank');
    toast.success('جاري فتح خرائط جوجل للملاحة...');
    setIsOpen(false);
  };

  // Open Waze navigation
  const handleNavigateWithWaze = (type: 'pickup' | 'delivery') => {
    const destination = type === 'pickup' 
      ? (pickupCoords || pickupAddress)
      : (deliveryCoords || deliveryAddress);
      
    if (!destination) {
      toast.error(`عنوان ${type === 'pickup' ? 'الاستلام' : 'التسليم'} غير متاح`);
      return;
    }
    
    const url = buildWazeUrl(destination);
    window.open(url, '_blank');
    toast.success('جاري فتح Waze للملاحة...');
    setIsOpen(false);
  };

  // Show full route in Google Maps
  const handleShowFullRoute = () => {
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
    
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
    window.open(url, '_blank');
    toast.success('جاري عرض المسار الكامل...');
    setIsOpen(false);
  };

  if (variant === 'icon') {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="outline"
            className={`bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 hover:from-green-600 hover:to-emerald-700 ${className}`}
            title="افتح الملاحة"
          >
            <Navigation className="w-4 h-4" />
          </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={handleNavigateToPickup} className="gap-2 cursor-pointer">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
              <MapPin className="w-3 h-3 text-blue-600" />
            </div>
            <span>الملاحة لنقطة الاستلام</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleNavigateToDelivery} className="gap-2 cursor-pointer">
            <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
              <MapPin className="w-3 h-3 text-red-600" />
            </div>
            <span>الملاحة لنقطة التسليم</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleShowFullRoute} className="gap-2 cursor-pointer">
            <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
              <ExternalLink className="w-3 h-3 text-purple-600" />
            </div>
            <span>عرض المسار الكامل</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          size={size}
          variant="default"
          className={`bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 hover:from-green-600 hover:to-emerald-700 gap-2 ${className}`}
        >
          <Navigation className="w-4 h-4" />
          {variant === 'full' && <span>ابدأ الملاحة (Google Maps)</span>}
          {variant === 'default' && <span>ملاحة</span>}
          <ChevronDown className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="p-2 border-b">
          <p className="text-xs text-muted-foreground">
            افتح خرائط جوجل على هاتفك للملاحة المجانية
          </p>
        </div>
        
        <DropdownMenuItem onClick={handleNavigateToPickup} className="gap-3 cursor-pointer py-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium">الملاحة لنقطة الاستلام</p>
            <p className="text-xs text-muted-foreground truncate">{pickupAddress || 'غير محدد'}</p>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleNavigateToDelivery} className="gap-3 cursor-pointer py-3">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-4 h-4 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium">الملاحة لنقطة التسليم</p>
            <p className="text-xs text-muted-foreground truncate">{deliveryAddress || 'غير محدد'}</p>
          </div>
        </DropdownMenuItem>
        
        <div className="border-t my-1" />
        
        <DropdownMenuItem onClick={handleShowFullRoute} className="gap-3 cursor-pointer py-2">
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
            <ExternalLink className="w-4 h-4 text-purple-600" />
          </div>
          <span>عرض المسار الكامل</span>
        </DropdownMenuItem>
        
        <div className="border-t my-1" />
        
        <div className="px-2 py-1.5">
          <p className="text-xs text-muted-foreground font-medium mb-1.5">تطبيقات بديلة:</p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs h-8"
              onClick={() => handleNavigateWithWaze('pickup')}
            >
              Waze (استلام)
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs h-8"
              onClick={() => handleNavigateWithWaze('delivery')}
            >
              Waze (تسليم)
            </Button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default GoogleMapsNavigationButton;
