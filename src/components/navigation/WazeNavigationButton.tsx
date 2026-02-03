import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Navigation, 
  MapPin, 
  ChevronDown,
  Route,
  Car,
  Share2
} from 'lucide-react';
import { toast } from 'sonner';

interface WazeNavigationButtonProps {
  pickupAddress?: string;
  deliveryAddress?: string;
  pickupCoords?: { lat: number; lng: number } | null;
  deliveryCoords?: { lat: number; lng: number } | null;
  variant?: 'default' | 'icon' | 'full';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

/**
 * Waze Navigation Button Component
 * Opens Waze app for navigation to pickup/delivery locations
 */
const WazeNavigationButton = ({
  pickupAddress,
  deliveryAddress,
  pickupCoords,
  deliveryCoords,
  variant = 'default',
  size = 'default',
  className = '',
}: WazeNavigationButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Build Waze URL for navigation
  const buildWazeNavigationUrl = (destination: string | { lat: number; lng: number }) => {
    if (typeof destination === 'string') {
      // Search for address
      return `https://waze.com/ul?q=${encodeURIComponent(destination)}&navigate=yes`;
    } else {
      // Direct coordinates navigation
      return `https://waze.com/ul?ll=${destination.lat},${destination.lng}&navigate=yes`;
    }
  };

  // Build Waze URL to just show location on map (without navigation)
  const buildWazeShowUrl = (destination: string | { lat: number; lng: number }) => {
    if (typeof destination === 'string') {
      return `https://waze.com/ul?q=${encodeURIComponent(destination)}`;
    } else {
      return `https://waze.com/ul?ll=${destination.lat},${destination.lng}&z=17`;
    }
  };

  // Open navigation to pickup location
  const handleNavigateToPickup = () => {
    const destination = pickupCoords || pickupAddress;
    if (!destination) {
      toast.error('عنوان الاستلام غير متاح');
      return;
    }
    
    const url = buildWazeNavigationUrl(destination);
    window.open(url, '_blank');
    toast.success('جاري فتح Waze للملاحة لنقطة الاستلام...');
    setIsOpen(false);
  };

  // Open navigation to delivery location
  const handleNavigateToDelivery = () => {
    const destination = deliveryCoords || deliveryAddress;
    if (!destination) {
      toast.error('عنوان التسليم غير متاح');
      return;
    }
    
    const url = buildWazeNavigationUrl(destination);
    window.open(url, '_blank');
    toast.success('جاري فتح Waze للملاحة لنقطة التسليم...');
    setIsOpen(false);
  };

  // Show pickup location on Waze map
  const handleShowPickup = () => {
    const destination = pickupCoords || pickupAddress;
    if (!destination) {
      toast.error('عنوان الاستلام غير متاح');
      return;
    }
    
    const url = buildWazeShowUrl(destination);
    window.open(url, '_blank');
    toast.success('جاري فتح Waze لعرض الموقع...');
    setIsOpen(false);
  };

  // Show delivery location on Waze map
  const handleShowDelivery = () => {
    const destination = deliveryCoords || deliveryAddress;
    if (!destination) {
      toast.error('عنوان التسليم غير متاح');
      return;
    }
    
    const url = buildWazeShowUrl(destination);
    window.open(url, '_blank');
    toast.success('جاري فتح Waze لعرض الموقع...');
    setIsOpen(false);
  };

  // Share location via Waze
  const handleShareLocation = (type: 'pickup' | 'delivery') => {
    const coords = type === 'pickup' ? pickupCoords : deliveryCoords;
    const address = type === 'pickup' ? pickupAddress : deliveryAddress;
    
    if (coords) {
      const url = `https://waze.com/ul?ll=${coords.lat},${coords.lng}`;
      navigator.clipboard.writeText(url);
      toast.success('تم نسخ رابط Waze!');
    } else if (address) {
      const url = `https://waze.com/ul?q=${encodeURIComponent(address)}`;
      navigator.clipboard.writeText(url);
      toast.success('تم نسخ رابط Waze!');
    } else {
      toast.error('الموقع غير متاح');
    }
    setIsOpen(false);
  };

  if (variant === 'icon') {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="outline"
            className={`bg-gradient-to-br from-cyan-500 to-blue-600 text-white border-0 hover:from-cyan-600 hover:to-blue-700 ${className}`}
            title="فتح Waze"
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
          className={`bg-gradient-to-br from-cyan-500 to-blue-600 text-white border-0 hover:from-cyan-600 hover:to-blue-700 gap-2 ${className}`}
        >
          <Car className="w-4 h-4" />
          {variant === 'full' && <span>ابدأ الملاحة (Waze)</span>}
          {variant === 'default' && <span>Waze</span>}
          <ChevronDown className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        {/* Header */}
        <div className="p-3 border-b bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center">
              <Car className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-sm">Waze Navigation</p>
              <p className="text-[10px] text-muted-foreground">
                ملاحة ذكية مع تنبيهات المرور
              </p>
            </div>
          </div>
        </div>
        
        {/* Navigate Section */}
        <div className="p-1">
          <p className="px-2 py-1 text-[10px] font-medium text-muted-foreground">ابدأ الملاحة</p>
          
          <DropdownMenuItem onClick={handleNavigateToPickup} className="gap-3 cursor-pointer py-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <Navigation className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">نقطة الاستلام</p>
              <p className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                {pickupAddress || 'غير محدد'}
              </p>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleNavigateToDelivery} className="gap-3 cursor-pointer py-2.5">
            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
              <Navigation className="w-4 h-4 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">نقطة التسليم</p>
              <p className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                {deliveryAddress || 'غير محدد'}
              </p>
            </div>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator />

        {/* Show on Map Section */}
        <div className="p-1">
          <p className="px-2 py-1 text-[10px] font-medium text-muted-foreground">عرض على الخريطة</p>
          
          <div className="flex gap-1 px-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-8 text-xs gap-1"
              onClick={handleShowPickup}
            >
              <MapPin className="w-3 h-3" />
              استلام
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-8 text-xs gap-1"
              onClick={handleShowDelivery}
            >
              <MapPin className="w-3 h-3" />
              تسليم
            </Button>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Share Section */}
        <div className="p-2">
          <p className="px-1 py-1 text-[10px] font-medium text-muted-foreground flex items-center gap-1">
            <Share2 className="w-3 h-3" />
            مشاركة رابط Waze
          </p>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="flex-1 h-7 text-[11px]"
              onClick={() => handleShareLocation('pickup')}
            >
              نسخ رابط الاستلام
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="flex-1 h-7 text-[11px]"
              onClick={() => handleShareLocation('delivery')}
            >
              نسخ رابط التسليم
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-3 py-2 border-t bg-muted/30">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <Route className="w-3 h-3" />
            <span>يتطلب تثبيت تطبيق Waze على الهاتف</span>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default WazeNavigationButton;
