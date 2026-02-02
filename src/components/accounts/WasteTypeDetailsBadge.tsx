import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Recycle, 
  AlertTriangle, 
  Leaf, 
  Beaker, 
  Cpu, 
  Stethoscope,
  Factory,
  Package,
  FileText,
  Layers,
  FlaskConical,
  Hammer,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  wasteTypeLabels,
  isHazardousWasteType,
  getWasteTypeCode,
  findCategoryById,
  getAllWasteCategories,
} from '@/lib/wasteClassification';

interface WasteTypeDetailsBadgeProps {
  wasteDescription?: string | null;
  wasteType?: string | null;
  quantity?: number;
  unit?: string;
  showFullDetails?: boolean;
  className?: string;
}

// Get icon for waste type
const getWasteTypeIcon = (wasteType: string) => {
  const iconMap: Record<string, any> = {
    plastic: Recycle,
    paper: FileText,
    metal: Layers,
    glass: FlaskConical,
    electronic: Cpu,
    organic: Leaf,
    chemical: Beaker,
    medical: Stethoscope,
    industrial: Factory,
    construction: Hammer,
    other: Package,
  };
  return iconMap[wasteType?.toLowerCase()] || Package;
};

// Get badge color for waste type
const getWasteTypeBadgeColor = (wasteType: string, isHazardous: boolean) => {
  if (isHazardous) {
    return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700';
  }
  
  const colorMap: Record<string, string> = {
    plastic: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
    paper: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
    metal: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-700',
    glass: 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-700',
    electronic: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
    organic: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
    construction: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700',
  };
  
  return colorMap[wasteType?.toLowerCase()] || 'bg-muted text-muted-foreground border-border';
};

// Try to detect waste type from description
const detectWasteTypeFromDescription = (description: string): string | null => {
  const desc = description.toLowerCase();
  
  const typePatterns: Record<string, string[]> = {
    plastic: ['بلاستيك', 'plastic', 'pet', 'hdpe', 'pvc', 'ldpe', 'pp', 'ps'],
    paper: ['ورق', 'كرتون', 'paper', 'cardboard', 'صحف', 'مجلات'],
    metal: ['معادن', 'حديد', 'ألومنيوم', 'نحاس', 'metal', 'iron', 'aluminum', 'copper', 'صلب', 'ستانلس'],
    glass: ['زجاج', 'glass'],
    electronic: ['إلكتروني', 'electronic', 'بطاريات', 'كمبيوتر', 'هاتف', 'شاشات', 'طابعات'],
    organic: ['عضوي', 'organic', 'طعام', 'نبات', 'حديقة', 'خشب'],
    chemical: ['كيميائي', 'chemical', 'مذيبات', 'أحماض', 'مبيدات', 'زيوت', 'دهانات'],
    medical: ['طبي', 'medical', 'صيدلي', 'إبر', 'أدوية', 'مستشفى'],
    construction: ['بناء', 'هدم', 'construction', 'خرسانة', 'طوب', 'سيراميك', 'بلاط'],
  };
  
  for (const [type, patterns] of Object.entries(typePatterns)) {
    if (patterns.some(p => desc.includes(p))) {
      return type;
    }
  }
  
  return null;
};

// Find category info from categories list
const findCategoryInfo = (wasteType: string) => {
  const categories = getAllWasteCategories();
  return categories.find(cat => cat.id === wasteType);
};

export default function WasteTypeDetailsBadge({
  wasteDescription,
  wasteType,
  quantity,
  unit,
  showFullDetails = false,
  className,
}: WasteTypeDetailsBadgeProps) {
  // Determine the waste type - from type field or detect from description
  const detectedType = wasteType || detectWasteTypeFromDescription(wasteDescription || '') || 'other';
  const isHazardous = isHazardousWasteType(detectedType);
  const typeCode = getWasteTypeCode(detectedType);
  const typeLabel = wasteTypeLabels[detectedType] || 'أخرى';
  const categoryInfo = findCategoryInfo(detectedType);
  
  const Icon = getWasteTypeIcon(detectedType);
  const badgeColor = getWasteTypeBadgeColor(detectedType, isHazardous);
  
  const displayText = wasteDescription || typeLabel;

  if (!showFullDetails) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn("flex items-start gap-2", className)}>
              <Badge 
                variant="outline" 
                className={cn('gap-1.5 shrink-0 font-medium border', badgeColor)}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="font-mono text-xs">{typeCode}</span>
              </Badge>
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-sm truncate">{displayText}</span>
                {quantity !== undefined && (
                  <span className="text-xs text-muted-foreground">
                    {new Intl.NumberFormat('ar-EG').format(quantity)} {unit || 'كجم'}
                  </span>
                )}
              </div>
              {isHazardous && (
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-bold">{typeLabel}</p>
              {categoryInfo && (
                <p className="text-xs text-muted-foreground">{categoryInfo.description}</p>
              )}
              {isHazardous && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  مخلفات خطرة - تتطلب معاملة خاصة
                </p>
              )}
              {wasteDescription && wasteDescription !== typeLabel && (
                <p className="text-xs border-t pt-1 mt-1">{wasteDescription}</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Full details view
  return (
    <div className={cn("space-y-2 p-3 rounded-lg border bg-muted/30", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className={cn('gap-1.5 font-medium border', badgeColor)}
          >
            <Icon className="h-4 w-4" />
            <span className="font-mono">{typeCode}</span>
            <span>{typeLabel}</span>
          </Badge>
          {isHazardous && (
            <Badge variant="destructive" className="gap-1 text-xs">
              <AlertTriangle className="h-3 w-3" />
              خطر
            </Badge>
          )}
        </div>
        {quantity !== undefined && (
          <span className="text-lg font-bold">
            {new Intl.NumberFormat('ar-EG').format(quantity)} <span className="text-sm text-muted-foreground">{unit || 'كجم'}</span>
          </span>
        )}
      </div>
      
      {wasteDescription && (
        <p className="text-sm">{wasteDescription}</p>
      )}
      
      {categoryInfo && (
        <p className="text-xs text-muted-foreground">{categoryInfo.description}</p>
      )}
    </div>
  );
}

// Compact inline version for tables
export function WasteTypeInline({
  wasteDescription,
  wasteType,
  className,
}: {
  wasteDescription?: string | null;
  wasteType?: string | null;
  className?: string;
}) {
  const detectedType = wasteType || detectWasteTypeFromDescription(wasteDescription || '') || 'other';
  const isHazardous = isHazardousWasteType(detectedType);
  const typeCode = getWasteTypeCode(detectedType);
  const typeLabel = wasteTypeLabels[detectedType] || 'أخرى';
  
  const Icon = getWasteTypeIcon(detectedType);
  const badgeColor = getWasteTypeBadgeColor(detectedType, isHazardous);
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center gap-2", className)}>
            <Badge 
              variant="outline" 
              className={cn('gap-1 shrink-0 text-xs border', badgeColor)}
            >
              <Icon className="h-3 w-3" />
              {typeCode}
            </Badge>
            <span className="font-medium text-sm truncate max-w-[200px]">
              {wasteDescription || typeLabel}
            </span>
            {isHazardous && (
              <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-bold">{typeLabel}</p>
            {wasteDescription && wasteDescription !== typeLabel && (
              <p className="text-xs text-muted-foreground mt-1">{wasteDescription}</p>
            )}
            {isHazardous && (
              <p className="text-xs text-red-400 mt-1">⚠️ مخلفات خطرة</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}