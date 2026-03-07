import { memo } from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import type { BindingType } from '@/types/bindingTypes';
import { BINDING_DISPLAY } from '@/types/bindingTypes';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface BindingIndicatorProps {
  type: BindingType;
  /** عرض النقطة الملونة فقط بدون نص */
  dotOnly?: boolean;
  /** عرض التلميح عند التمرير */
  showTooltip?: boolean;
  className?: string;
}

/**
 * مؤشر بصري لنوع الارتباط الوظيفي
 * يظهر كنقطة ملونة صغيرة أو بادج مع نص
 */
const BindingIndicator = memo(({ type, dotOnly = true, showTooltip = true, className }: BindingIndicatorProps) => {
  const { language } = useLanguage();
  const display = BINDING_DISPLAY[type];

  const dot = (
    <span
      className={cn(
        'inline-block rounded-full shrink-0',
        dotOnly ? 'w-1.5 h-1.5' : 'w-2 h-2',
        display.dotClass,
        className,
      )}
    />
  );

  const label = language === 'ar' ? display.labelAr : display.labelEn;

  if (dotOnly && showTooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {dot}
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          <span className={display.colorClass}>{display.emoji} {label}</span>
        </TooltipContent>
      </Tooltip>
    );
  }

  if (!dotOnly) {
    return (
      <span className={cn('inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full', display.bgClass, display.colorClass, className)}>
        {dot}
        {label}
      </span>
    );
  }

  return dot;
});

BindingIndicator.displayName = 'BindingIndicator';

export default BindingIndicator;
