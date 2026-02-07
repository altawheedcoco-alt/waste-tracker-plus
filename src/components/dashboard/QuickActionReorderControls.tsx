import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface QuickActionReorderControlsProps {
  actionId: string;
  isFirst: boolean;
  isLast: boolean;
  isHidden?: boolean;
  onMoveUp: (actionId: string) => void;
  onMoveDown: (actionId: string) => void;
  onToggleVisibility?: (actionId: string) => void;
  disabled?: boolean;
  compact?: boolean;
}

const QuickActionReorderControls = memo(({
  actionId,
  isFirst,
  isLast,
  isHidden = false,
  onMoveUp,
  onMoveDown,
  onToggleVisibility,
  disabled = false,
  compact = false,
}: QuickActionReorderControlsProps) => {
  const buttonSize = compact ? 'h-6 w-6' : 'h-7 w-7';
  const iconSize = compact ? 'h-3 w-3' : 'h-4 w-4';

  return (
    <TooltipProvider>
      <div className={cn(
        'flex items-center gap-0.5',
        compact ? 'flex-row' : 'flex-col'
      )}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(buttonSize, 'text-muted-foreground hover:text-foreground')}
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp(actionId);
              }}
              disabled={disabled || isFirst}
            >
              <ChevronUp className={iconSize} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>نقل لأعلى</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(buttonSize, 'text-muted-foreground hover:text-foreground')}
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown(actionId);
              }}
              disabled={disabled || isLast}
            >
              <ChevronDown className={iconSize} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>نقل لأسفل</p>
          </TooltipContent>
        </Tooltip>

        {onToggleVisibility && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  buttonSize, 
                  isHidden 
                    ? 'text-muted-foreground/50 hover:text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleVisibility(actionId);
                }}
                disabled={disabled}
              >
                {isHidden ? (
                  <EyeOff className={iconSize} />
                ) : (
                  <Eye className={iconSize} />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{isHidden ? 'إظهار' : 'إخفاء'}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
});

QuickActionReorderControls.displayName = 'QuickActionReorderControls';

export default QuickActionReorderControls;
