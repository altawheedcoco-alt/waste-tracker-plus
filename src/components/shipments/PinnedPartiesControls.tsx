import { Pin, PinOff, Check, MapPin, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { usePinnedParties } from '@/hooks/usePinnedParties';
import { toast } from 'sonner';

interface PinnedPartiesControlsProps {
  currentGenerator?: { id: string; name: string; address?: string; city?: string; isManual?: boolean } | null;
  currentRecycler?: { id: string; name: string; address?: string; city?: string; isManual?: boolean } | null;
  currentPickupAddress?: string;
  currentDeliveryAddress?: string;
  currentWasteType?: string;
  currentWasteDescription?: string;
  onApplyPinned?: (data: {
    generator: { id: string; name: string; address?: string } | null;
    recycler: { id: string; name: string; address?: string } | null;
    pickupAddress: string | null;
    deliveryAddress: string | null;
    wasteType: string | null;
    wasteDescription: string | null;
  }) => void;
}

const PinnedPartiesControls = ({ 
  currentGenerator, 
  currentRecycler,
  currentPickupAddress,
  currentDeliveryAddress,
  currentWasteType,
  currentWasteDescription,
  onApplyPinned 
}: PinnedPartiesControlsProps) => {
  const { 
    pinnedParties, 
    hasAnyPinned,
    hasPinnedParties,
    hasPinnedAddresses,
    hasPinnedWasteType,
    pinAll, 
    clearAll,
    isLoaded 
  } = usePinnedParties();

  if (!isLoaded) return null;

  const hasCurrentData = currentGenerator || currentRecycler || currentPickupAddress || currentDeliveryAddress || currentWasteType;

  const handlePinCurrent = () => {
    if (!hasCurrentData) {
      toast.error('لا توجد بيانات للتثبيت');
      return;
    }

    pinAll({
      generator: currentGenerator ? {
        id: currentGenerator.id,
        name: currentGenerator.name,
        address: currentGenerator.address,
        city: currentGenerator.city,
        isManual: currentGenerator.isManual,
      } : undefined,
      recycler: currentRecycler ? {
        id: currentRecycler.id,
        name: currentRecycler.name,
        address: currentRecycler.address,
        city: currentRecycler.city,
        isManual: currentRecycler.isManual,
      } : undefined,
      pickupAddress: currentPickupAddress || undefined,
      deliveryAddress: currentDeliveryAddress || undefined,
      wasteType: currentWasteType || undefined,
      wasteDescription: currentWasteDescription || undefined,
    });

    const pinnedItems = [
      currentGenerator ? 'الجهة المولدة' : '',
      currentRecycler ? 'الجهة المدورة' : '',
      currentPickupAddress ? 'عنوان الاستلام' : '',
      currentDeliveryAddress ? 'عنوان التسليم' : '',
      currentWasteType ? 'نوع المخلف' : '',
    ].filter(Boolean);

    toast.success('تم تثبيت البيانات بنجاح', {
      description: pinnedItems.join('، '),
    });
  };

  const handleApplyPinned = () => {
    if (!hasAnyPinned) {
      toast.error('لا توجد بيانات مثبتة');
      return;
    }

    const generator = pinnedParties.generator ? {
      id: pinnedParties.generator.isManual 
        ? `manual:${pinnedParties.generator.name}` 
        : pinnedParties.generator.id,
      name: pinnedParties.generator.name,
      address: pinnedParties.generator.address 
        ? `${pinnedParties.generator.address}${pinnedParties.generator.city ? `, ${pinnedParties.generator.city}` : ''}`
        : undefined,
    } : null;

    const recycler = pinnedParties.recycler ? {
      id: pinnedParties.recycler.isManual 
        ? `manual:${pinnedParties.recycler.name}` 
        : pinnedParties.recycler.id,
      name: pinnedParties.recycler.name,
      address: pinnedParties.recycler.address 
        ? `${pinnedParties.recycler.address}${pinnedParties.recycler.city ? `, ${pinnedParties.recycler.city}` : ''}`
        : undefined,
    } : null;

    onApplyPinned?.({
      generator,
      recycler,
      pickupAddress: pinnedParties.pickupAddress,
      deliveryAddress: pinnedParties.deliveryAddress,
      wasteType: pinnedParties.wasteType,
      wasteDescription: pinnedParties.wasteDescription,
    });

    toast.success('تم تطبيق البيانات المثبتة');
  };

  const handleClear = () => {
    clearAll();
    toast.success('تم إلغاء تثبيت جميع البيانات');
  };

  return (
    <div className="flex flex-col gap-2 p-3 bg-muted/50 rounded-lg border border-dashed">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Pin className="w-4 h-4" />
          <span>البيانات المثبتة:</span>
        </div>

        {hasAnyPinned && (
          <div className="flex flex-wrap items-center gap-1.5">
            {pinnedParties.generator && (
              <Badge variant="outline" className="text-xs">
                المولدة: {pinnedParties.generator.name}
              </Badge>
            )}
            {pinnedParties.recycler && (
              <Badge variant="outline" className="text-xs">
                المدورة: {pinnedParties.recycler.name}
              </Badge>
            )}
            {pinnedParties.wasteType && (
              <Badge variant="secondary" className="text-xs">
                النوع: {pinnedParties.wasteType}
              </Badge>
            )}
            {(pinnedParties.pickupAddress || pinnedParties.deliveryAddress) && (
              <Badge variant="outline" className="text-xs gap-1">
                <MapPin className="w-3 h-3" />
                {pinnedParties.pickupAddress && pinnedParties.deliveryAddress 
                  ? 'عناوين محفوظة' 
                  : pinnedParties.pickupAddress ? 'عنوان الاستلام' : 'عنوان التسليم'}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center gap-1 mr-auto">
          <TooltipProvider>
            {hasAnyPinned && onApplyPinned && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    type="button"
                    size="sm" 
                    variant="default"
                    onClick={handleApplyPinned}
                    className="h-7 text-xs gap-1"
                  >
                    <Check className="w-3 h-3" />
                    تطبيق المثبتة
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>استخدام جميع البيانات المثبتة</p>
                </TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  type="button"
                  size="sm" 
                  variant="outline"
                  onClick={handlePinCurrent}
                  disabled={!hasCurrentData}
                  className="h-7 text-xs gap-1"
                >
                  <Pin className="w-3 h-3" />
                  تثبيت الحالية
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>حفظ البيانات الحالية (الجهات، العناوين، نوع المخلف)</p>
              </TooltipContent>
            </Tooltip>

            {hasAnyPinned && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    type="button"
                    size="sm" 
                    variant="ghost"
                    onClick={handleClear}
                    className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                  >
                    <PinOff className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>إلغاء تثبيت جميع البيانات</p>
                </TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};

export default PinnedPartiesControls;
