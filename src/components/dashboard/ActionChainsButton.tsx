import { useState } from 'react';
import { GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import ActionChainTree from '@/components/shared/ActionChainTree';
import type { OrgActionChains } from '@/types/actionChainTypes';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from '@/contexts/LanguageContext';

interface ActionChainsButtonProps {
  orgChains: OrgActionChains;
  isCollapsed?: boolean;
}

const ActionChainsButton = ({ orgChains, isCollapsed = false }: ActionChainsButtonProps) => {
  const [open, setOpen] = useState(false);
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const label = isAr ? 'سلاسل الإجراءات' : 'Action Chains';

  const button = (
    <SheetTrigger asChild>
      <Button
        variant="ghost"
        size="sm"
        className={`w-full gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/60 ${
          isCollapsed ? 'justify-center px-2' : 'justify-start'
        }`}
      >
        <GitBranch className="w-4 h-4 shrink-0 text-primary" />
        {!isCollapsed && (
          <span className="text-xs font-medium truncate">{label}</span>
        )}
      </Button>
    </SheetTrigger>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {isCollapsed ? (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="left">
            <p>{label}</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        button
      )}
      <SheetContent side={isAr ? 'right' : 'left'} className="w-[380px] sm:w-[440px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-primary" />
            {label}
          </SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <ActionChainTree orgChains={orgChains} />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ActionChainsButton;
