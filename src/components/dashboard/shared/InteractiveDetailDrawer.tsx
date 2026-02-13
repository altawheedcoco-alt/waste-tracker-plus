import { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronLeft, LucideIcon, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useDisplayMode } from '@/hooks/useDisplayMode';

export interface DetailSection {
  id: string;
  title: string;
  icon?: LucideIcon;
  badge?: string | number;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  content: ReactNode;
  /** Sub-sections for deeper drill-down */
  subSections?: DetailSection[];
  /** Link to navigate for full details */
  link?: string;
  /** Default open state */
  defaultOpen?: boolean;
}

export interface InteractiveDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  /** Summary value displayed prominently */
  summaryValue?: string | number;
  summaryLabel?: string;
  sections: DetailSection[];
  /** 'drawer' for side sheet, 'modal' for center dialog, 'auto' picks based on screen size */
  mode?: 'drawer' | 'modal' | 'auto';
}

const SectionItem = ({ section, depth = 0 }: { section: DetailSection; depth?: number }) => {
  const [isOpen, setIsOpen] = useState(section.defaultOpen ?? depth === 0);
  const navigate = useNavigate();
  const hasSubSections = section.subSections && section.subSections.length > 0;
  const IconComp = section.icon;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            'w-full flex items-center justify-between gap-2 p-3 rounded-lg transition-all duration-200',
            'hover:bg-muted/80 active:scale-[0.99]',
            isOpen ? 'bg-muted/60' : 'bg-transparent',
            depth > 0 && 'mr-4 border-r-2 border-primary/20 pr-3'
          )}
        >
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </motion.div>
            {section.badge !== undefined && (
              <Badge variant={section.badgeVariant || 'secondary'} className="text-[10px]">
                {section.badge}
              </Badge>
            )}
            {section.link && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(section.link!);
                }}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2 text-right flex-1">
            <span className={cn('font-medium text-sm', isOpen && 'text-primary')}>
              {section.title}
            </span>
            {IconComp && (
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <IconComp className="h-3.5 w-3.5 text-primary" />
              </div>
            )}
          </div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className={cn('px-3 pb-2', depth > 0 && 'mr-4')}
        >
          <div className="mt-1">{section.content}</div>
          {hasSubSections && (
            <div className="mt-2 space-y-1">
              {section.subSections!.map((sub) => (
                <SectionItem key={sub.id} section={sub} depth={depth + 1} />
              ))}
            </div>
          )}
        </motion.div>
      </CollapsibleContent>
    </Collapsible>
  );
};

const DrawerContent = ({
  title,
  description,
  icon: Icon,
  iconColor,
  iconBgColor,
  summaryValue,
  summaryLabel,
  sections,
}: Omit<InteractiveDetailDrawerProps, 'open' | 'onOpenChange' | 'mode'>) => {
  return (
    <div className="space-y-4" dir="rtl">
      {/* Summary header */}
      {summaryValue !== undefined && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-right">
                  {summaryLabel && (
                    <p className="text-sm text-muted-foreground">{summaryLabel}</p>
                  )}
                  <p className="text-3xl font-bold text-primary mt-1">
                    {summaryValue}
                  </p>
                </div>
                {Icon && (
                  <div className={cn(
                    'w-14 h-14 rounded-2xl flex items-center justify-center',
                    iconBgColor || 'bg-primary/10'
                  )}>
                    <Icon className={cn('w-7 h-7', iconColor || 'text-primary')} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Sections */}
      <div className="space-y-1">
        {sections.map((section, index) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <SectionItem section={section} />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const InteractiveDetailDrawer = ({
  open,
  onOpenChange,
  title,
  description,
  mode = 'auto',
  ...contentProps
}: InteractiveDetailDrawerProps) => {
  const { isMobile } = useDisplayMode();
  const useDrawer = mode === 'drawer' || (mode === 'auto' && !isMobile);
  const useModal = mode === 'modal' || (mode === 'auto' && isMobile);

  if (useDrawer) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="text-right">
            <SheetTitle>{title}</SheetTitle>
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
          <div className="mt-4">
            <DrawerContent title={title} description={description} {...contentProps} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader className="text-right">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DrawerContent title={title} description={description} {...contentProps} />
      </DialogContent>
    </Dialog>
  );
};

export default InteractiveDetailDrawer;
