import { Pin, PinOff, RotateCcw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { usePinnedParties } from '@/hooks/usePinnedParties';
import { toast } from 'sonner';

interface PinnedPartiesControlsProps {
  currentGenerator?: { id: string; name: string; address?: string; city?: string; isManual?: boolean } | null;
  currentRecycler?: { id: string; name: string; address?: string; city?: string; isManual?: boolean } | null;
  onApplyPinned?: (generator: { id: string; name: string; address?: string } | null, recycler: { id: string; name: string; address?: string } | null) => void;
}

const PinnedPartiesControls = ({ 
  currentGenerator, 
  currentRecycler,
  onApplyPinned 
}: PinnedPartiesControlsProps) => {
  const { 
    pinnedParties, 
    hasPinnedParties,
    pinBothParties, 
    clearAll,
    isLoaded 
  } = usePinnedParties();

  if (!isLoaded) return null;

  const handlePinCurrent = () => {
    if (!currentGenerator && !currentRecycler) {
      toast.error('لا توجد جهات محددة للتثبيت');
      return;
    }

    pinBothParties(
      currentGenerator ? {
        id: currentGenerator.id,
        name: currentGenerator.name,
        address: currentGenerator.address,
        city: currentGenerator.city,
        isManual: currentGenerator.isManual,
      } : null,
      currentRecycler ? {
        id: currentRecycler.id,
        name: currentRecycler.name,
        address: currentRecycler.address,
        city: currentRecycler.city,
        isManual: currentRecycler.isManual,
      } : null
    );

    toast.success('تم تثبيت الجهات بنجاح', {
      description: 'سيتم استخدامها تلقائياً في الشحنات القادمة',
    });
  };

  const handleApplyPinned = () => {
    if (!hasPinnedParties) {
      toast.error('لا توجد جهات مثبتة');
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

    onApplyPinned?.(generator, recycler);

    toast.success('تم تطبيق الجهات المثبتة');
  };

  const handleClear = () => {
    clearAll();
    toast.success('تم إلغاء تثبيت جميع الجهات');
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-lg border border-dashed">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Pin className="w-4 h-4" />
        <span>تثبيت الجهات:</span>
      </div>

      {hasPinnedParties && (
        <div className="flex items-center gap-1.5">
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
        </div>
      )}

      <div className="flex items-center gap-1 mr-auto">
        <TooltipProvider>
          {hasPinnedParties && onApplyPinned && (
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
                <p>استخدام الجهات المثبتة مسبقاً</p>
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
                disabled={!currentGenerator && !currentRecycler}
                className="h-7 text-xs gap-1"
              >
                <Pin className="w-3 h-3" />
                تثبيت الحالية
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>حفظ الجهات الحالية للاستخدام لاحقاً</p>
            </TooltipContent>
          </Tooltip>

          {hasPinnedParties && (
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
                <p>إلغاء تثبيت الجهات</p>
              </TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>
      </div>
    </div>
  );
};

export default PinnedPartiesControls;
