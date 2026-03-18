import { memo } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutGrid, List, Minimize2, Maximize2, 
  AlignJustify, AlignCenter, AlignLeft
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useViewMode, ContentDensity } from '@/contexts/ViewModeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const densityOptions: { value: ContentDensity; icon: typeof AlignJustify; labelAr: string; labelEn: string }[] = [
  { value: 'compact', icon: AlignJustify, labelAr: 'مضغوط', labelEn: 'Compact' },
  { value: 'comfortable', icon: AlignCenter, labelAr: 'مريح', labelEn: 'Comfortable' },
  { value: 'spacious', icon: AlignLeft, labelAr: 'واسع', labelEn: 'Spacious' },
];

const ViewModeToolbar = memo(() => {
  const { density, listStyle, fullWidth, setDensity, setListStyle, toggleFullWidth } = useViewMode();
  const { language } = useLanguage();

  return (
    <motion.div 
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-1 bg-muted/50 rounded-lg p-1 border border-border/50"
    >
      {/* Density Toggle */}
      <div className="flex items-center rounded-md bg-background/60 p-0.5">
        {densityOptions.map(opt => {
          const Icon = opt.icon;
          const active = density === opt.value;
          return (
            <Tooltip key={opt.value}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setDensity(opt.value)}
                  className={cn(
                    'p-1.5 rounded-md transition-all duration-150',
                    active 
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">
                {language === 'ar' ? opt.labelAr : opt.labelEn}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {/* Separator */}
      <div className="w-px h-5 bg-border/60" />

      {/* Grid/List Toggle */}
      <div className="flex items-center rounded-md bg-background/60 p-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setListStyle('grid')}
              className={cn(
                'p-1.5 rounded-md transition-all duration-150',
                listStyle === 'grid' 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="text-xs">
            {language === 'ar' ? 'عرض شبكي' : 'Grid view'}
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setListStyle('list')}
              className={cn(
                'p-1.5 rounded-md transition-all duration-150',
                listStyle === 'list' 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="text-xs">
            {language === 'ar' ? 'عرض قائمة' : 'List view'}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Separator */}
      <div className="w-px h-5 bg-border/60" />

      {/* Full Width Toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={toggleFullWidth}
            className={cn(
              'p-1.5 rounded-md transition-all duration-150',
              fullWidth 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            {fullWidth ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </TooltipTrigger>
        <TooltipContent className="text-xs">
          {language === 'ar' ? (fullWidth ? 'عرض عادي' : 'عرض كامل') : (fullWidth ? 'Normal width' : 'Full width')}
        </TooltipContent>
      </Tooltip>
    </motion.div>
  );
});

ViewModeToolbar.displayName = 'ViewModeToolbar';

export default ViewModeToolbar;
