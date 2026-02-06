import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Package, 
  ChevronDown, 
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Banknote,
  Scale,
  LayoutGrid,
  List,
  Recycle,
  AlertTriangle,
  Leaf,
  Beaker,
  Cpu,
  Stethoscope,
  Factory,
  FileText,
  Layers,
  FlaskConical,
  Hammer,
  XCircle,
  Ban,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { 
  wasteTypeLabels, 
  getWasteTypeCode, 
  isHazardousWasteType,
  getAllWasteCategories,
} from '@/lib/wasteClassification';

// Get icon for waste type
const getWasteTypeIcon = (wasteType: string) => {
  const desc = wasteType.toLowerCase();
  
  if (desc.includes('بلاستيك') || desc.includes('plastic')) return Recycle;
  if (desc.includes('ورق') || desc.includes('كرتون') || desc.includes('paper')) return FileText;
  if (desc.includes('معادن') || desc.includes('حديد') || desc.includes('metal')) return Layers;
  if (desc.includes('زجاج') || desc.includes('glass')) return FlaskConical;
  if (desc.includes('إلكتروني') || desc.includes('electronic') || desc.includes('بطاري')) return Cpu;
  if (desc.includes('عضوي') || desc.includes('organic') || desc.includes('طعام')) return Leaf;
  if (desc.includes('كيميائ') || desc.includes('chemical')) return Beaker;
  if (desc.includes('طبي') || desc.includes('medical')) return Stethoscope;
  if (desc.includes('بناء') || desc.includes('construction')) return Hammer;
  if (desc.includes('صناع') || desc.includes('industrial')) return Factory;
  
  return Package;
};

// Get badge color for waste type based on detection
const getWasteTypeBadgeColor = (wasteType: string) => {
  const desc = wasteType.toLowerCase();
  
  // Check if hazardous
  if (desc.includes('كيميائ') || desc.includes('طبي') || desc.includes('إلكتروني') || 
      desc.includes('خطر') || desc.includes('سام')) {
    return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700';
  }
  
  if (desc.includes('بلاستيك')) return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30';
  if (desc.includes('ورق') || desc.includes('كرتون')) return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30';
  if (desc.includes('معادن') || desc.includes('حديد')) return 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-900/30';
  if (desc.includes('زجاج')) return 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-900/30';
  if (desc.includes('عضوي') || desc.includes('طعام')) return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30';
  if (desc.includes('بناء')) return 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30';
  
  return 'bg-muted text-muted-foreground border-border';
};

// Check if waste type is hazardous
const isHazardousFromDescription = (wasteType: string) => {
  const desc = wasteType.toLowerCase();
  return desc.includes('كيميائ') || desc.includes('طبي') || desc.includes('إلكتروني') || 
         desc.includes('خطر') || desc.includes('سام') || desc.includes('مبيدات');
};

interface ShipmentWithPricing {
  id: string;
  waste_description?: string | null;
  waste_type?: string | null;
  quantity?: number | null;
  unit?: string | null;
  pricePerUnit: number;
  calculatedTotal: number;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  created_at: string;
  shipment_number?: string | null;
}

interface WasteTypeAccountBreakdownProps {
  shipments: ShipmentWithPricing[];
  deposits: { amount: number; waste_type?: string | null }[];
  isGenerator: boolean;
}

interface WasteTypeSummary {
  wasteType: string;
  totalQuantity: number;
  totalValue: number;
  shipmentsCount: number;
  cancelledCount: number;
  unit: string;
}

export default function WasteTypeAccountBreakdown({
  shipments,
  deposits,
  isGenerator,
}: WasteTypeAccountBreakdownProps) {
  const [expandedTypes, setExpandedTypes] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ar });
  };

  // Separate active and cancelled shipments
  const { activeShipments, cancelledShipments } = useMemo(() => {
    return {
      activeShipments: shipments.filter(s => !s.cancelled_at),
      cancelledShipments: shipments.filter(s => !!s.cancelled_at),
    };
  }, [shipments]);

  // Group active shipments by waste type
  const wasteTypeSummaries = useMemo(() => {
    const grouped: Record<string, WasteTypeSummary> = {};

    activeShipments.forEach(shipment => {
      const wasteType = shipment.waste_description || shipment.waste_type || 'غير محدد';
      
      if (!grouped[wasteType]) {
        grouped[wasteType] = {
          wasteType,
          totalQuantity: 0,
          totalValue: 0,
          shipmentsCount: 0,
          cancelledCount: 0,
          unit: shipment.unit || 'طن',
        };
      }

      grouped[wasteType].shipmentsCount += 1;
      grouped[wasteType].totalQuantity += Number(shipment.quantity) || 0;
      grouped[wasteType].totalValue += shipment.calculatedTotal;
    });

    return Object.values(grouped).sort((a, b) => b.totalValue - a.totalValue);
  }, [activeShipments]);

  // Group cancelled shipments by waste type
  const cancelledByWasteType = useMemo(() => {
    const grouped: Record<string, {
      wasteType: string;
      shipments: ShipmentWithPricing[];
      totalQuantity: number;
      totalLostValue: number;
      unit: string;
    }> = {};

    cancelledShipments.forEach(shipment => {
      const wasteType = shipment.waste_description || shipment.waste_type || 'غير محدد';
      
      if (!grouped[wasteType]) {
        grouped[wasteType] = {
          wasteType,
          shipments: [],
          totalQuantity: 0,
          totalLostValue: 0,
          unit: shipment.unit || 'طن',
        };
      }

      grouped[wasteType].shipments.push(shipment);
      grouped[wasteType].totalQuantity += Number(shipment.quantity) || 0;
      grouped[wasteType].totalLostValue += (shipment.pricePerUnit || 0) * (Number(shipment.quantity) || 0);
    });

    return Object.values(grouped).sort((a, b) => b.shipments.length - a.shipments.length);
  }, [cancelledShipments]);

  // Calculate totals
  const totals = useMemo(() => {
    return wasteTypeSummaries.reduce(
      (acc, wt) => ({
        totalQuantity: acc.totalQuantity + wt.totalQuantity,
        totalValue: acc.totalValue + wt.totalValue,
        totalShipments: acc.totalShipments + wt.shipmentsCount,
        totalCancelled: cancelledShipments.length,
      }),
      { totalQuantity: 0, totalValue: 0, totalShipments: 0, totalCancelled: 0 }
    );
  }, [wasteTypeSummaries, cancelledShipments.length]);

  // Calculate cancelled totals
  const cancelledTotals = useMemo(() => {
    return cancelledShipments.reduce(
      (acc, s) => ({
        totalQuantity: acc.totalQuantity + (Number(s.quantity) || 0),
        totalLostValue: acc.totalLostValue + ((s.pricePerUnit || 0) * (Number(s.quantity) || 0)),
        totalCount: acc.totalCount + 1,
      }),
      { totalQuantity: 0, totalLostValue: 0, totalCount: 0 }
    );
  }, [cancelledShipments]);

  const toggleExpanded = (wasteType: string) => {
    setExpandedTypes(prev => 
      prev.includes(wasteType) 
        ? prev.filter(t => t !== wasteType)
        : [...prev, wasteType]
    );
  };

  const getShipmentsForType = (wasteType: string) => {
    return activeShipments.filter(s => 
      (s.waste_description || s.waste_type || 'غير محدد') === wasteType
    );
  };

  if (wasteTypeSummaries.length === 0 && cancelledShipments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p>لا توجد شحنات لعرض تفاصيل المخلفات</p>
      </div>
    );
  }

  // Render cancelled section component
  const CancelledSection = () => {
    if (cancelledShipments.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <Ban className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">لا توجد شحنات ملغاة</p>
          <p className="text-sm">جميع الشحنات تمت بنجاح</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Cancelled Summary Header */}
        <Card className="bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 border-red-200 dark:border-red-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-red-700 dark:text-red-300">
              <XCircle className="h-5 w-5" />
              ملخص الشحنات الملغاة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white/80 dark:bg-background/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">عدد الشحنات الملغاة</p>
                <p className="text-2xl font-bold text-red-600">{cancelledTotals.totalCount}</p>
              </div>
              <div className="text-center p-3 bg-white/80 dark:bg-background/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">أنواع المخلفات</p>
                <p className="text-2xl font-bold text-red-600">{cancelledByWasteType.length}</p>
              </div>
              <div className="text-center p-3 bg-white/80 dark:bg-background/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">الكميات المفقودة</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(cancelledTotals.totalQuantity)}</p>
                <p className="text-xs text-muted-foreground">كجم</p>
              </div>
              <div className="text-center p-3 bg-white/80 dark:bg-background/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">القيمة المفقودة</p>
                <p className="text-2xl font-bold text-red-600 line-through">{formatCurrency(cancelledTotals.totalLostValue)}</p>
                <p className="text-xs text-muted-foreground">ج.م</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cancelled by Waste Type */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <Package className="h-4 w-4" />
            الملغاة حسب نوع المخلف
          </h3>
          
          <div className={cn(
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
              : 'space-y-3'
          )}>
            {cancelledByWasteType.map((group) => {
              const isExpanded = expandedTypes.includes(`cancelled-${group.wasteType}`);
              const Icon = getWasteTypeIcon(group.wasteType);
              
              return (
                <Collapsible 
                  key={`cancelled-${group.wasteType}`}
                  open={isExpanded}
                  onOpenChange={() => toggleExpanded(`cancelled-${group.wasteType}`)}
                >
                  <Card className="border-red-200 dark:border-red-800/50 bg-red-50/30 dark:bg-red-950/10">
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-red-100/50 dark:hover:bg-red-900/20 transition-colors pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-base flex items-center gap-2">
                              <Icon className="h-4 w-4 text-red-500" />
                              <span className="max-w-[180px] truncate">{group.wasteType}</span>
                              {isHazardousFromDescription(group.wasteType) && (
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                              )}
                            </CardTitle>
                            <div className="flex items-center gap-2">
                              <Badge variant="destructive" className="text-[10px]">
                                <XCircle className="h-3 w-3 mr-1" />
                                {group.shipments.length} ملغاة
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-left">
                              <p className="text-lg font-bold text-red-600 line-through">
                                {formatCurrency(group.totalLostValue)} ج.م
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatCurrency(group.totalQuantity)} {group.unit}
                              </p>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <CardContent className="pt-0 border-t border-red-200 dark:border-red-800/50">
                        <div className="space-y-3 mt-3">
                          {/* Cancelled shipments list */}
                          <div className="max-h-64 overflow-y-auto space-y-2">
                            {group.shipments.map(shipment => (
                              <div 
                                key={shipment.id}
                                className="p-3 rounded-lg bg-white dark:bg-background/50 border border-red-200 dark:border-red-800/30"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Ban className="h-4 w-4 text-red-500" />
                                    <span className="font-mono text-sm text-muted-foreground">
                                      {shipment.shipment_number || '-'}
                                    </span>
                                  </div>
                                  <div className="text-left">
                                    <span className="text-sm font-bold text-red-600 line-through">
                                      {formatCurrency((shipment.pricePerUnit || 0) * (Number(shipment.quantity) || 0))} ج.م
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <Scale className="h-3 w-3" />
                                    <span>{formatCurrency(Number(shipment.quantity) || 0)} {shipment.unit}</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    <span>{formatDate(shipment.created_at)}</span>
                                  </div>
                                </div>
                                
                                {shipment.cancellation_reason && (
                                  <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded text-xs">
                                    <p className="text-red-700 dark:text-red-300 font-medium mb-0.5">سبب الإلغاء:</p>
                                    <p className="text-red-600 dark:text-red-400">{shipment.cancellation_reason}</p>
                                  </div>
                                )}
                                
                                {shipment.cancelled_at && (
                                  <p className="text-[10px] text-muted-foreground mt-2">
                                    تم الإلغاء: {formatDate(shipment.cancelled_at)}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Tabs for Active vs Cancelled */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="active" className="gap-2">
            <Package className="h-4 w-4" />
            النشطة
            <Badge variant="secondary" className="text-[10px] ml-1">
              {totals.totalShipments}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="gap-2">
            <XCircle className="h-4 w-4" />
            الملغاة
            {cancelledTotals.totalCount > 0 && (
              <Badge variant="destructive" className="text-[10px] ml-1">
                {cancelledTotals.totalCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Active Shipments Tab */}
        <TabsContent value="active" className="space-y-6">
          {/* Header with view toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Package className="h-3 w-3" />
                {wasteTypeSummaries.length} نوع مخلف
              </Badge>
            </div>
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

      {/* Waste Type Cards */}
      <div className={cn(
        viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
          : 'space-y-3'
      )}>
        {wasteTypeSummaries.map((summary) => {
          const isExpanded = expandedTypes.includes(summary.wasteType);
          const typeShipments = getShipmentsForType(summary.wasteType);
          
          return (
            <Collapsible 
              key={summary.wasteType} 
              open={isExpanded}
              onOpenChange={() => toggleExpanded(summary.wasteType)}
            >
              <Card className={cn(
                'transition-all',
                isExpanded && 'ring-2 ring-primary/20'
              )}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base flex items-center gap-2">
                          {(() => {
                            const Icon = getWasteTypeIcon(summary.wasteType);
                            return <Icon className="h-4 w-4 text-primary" />;
                          })()}
                          <span className="max-w-[200px] truncate">{summary.wasteType}</span>
                          {isHazardousFromDescription(summary.wasteType) && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertTriangle className="h-4 w-4 text-red-500" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>مخلفات خطرة - تتطلب معاملة خاصة</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge 
                            variant="outline" 
                            className={cn('text-[10px] border', getWasteTypeBadgeColor(summary.wasteType))}
                          >
                            {summary.shipmentsCount} شحنة
                          </Badge>
                          {summary.cancelledCount > 0 && (
                            <Badge variant="destructive" className="text-[10px] px-1">
                              {summary.cancelledCount} ملغاة
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-left">
                          <p className="text-lg font-bold text-primary">
                            {formatCurrency(summary.totalValue)} ج.م
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(summary.totalQuantity)} {summary.unit}
                          </p>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="pt-0 border-t">
                    <div className="space-y-3 mt-3">
                      {/* Summary stats for this waste type */}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-muted/50 rounded-lg p-2">
                          <p className="text-xs text-muted-foreground">إجمالي الكمية</p>
                          <p className="font-semibold">{formatCurrency(summary.totalQuantity)} {summary.unit}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2">
                          <p className="text-xs text-muted-foreground">إجمالي القيمة</p>
                          <p className="font-semibold text-primary">{formatCurrency(summary.totalValue)} ج.م</p>
                        </div>
                      </div>

                      {/* Recent shipments list */}
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">آخر الشحنات:</p>
                        <div className="max-h-48 overflow-y-auto space-y-1">
                          {typeShipments.slice(0, 5).map(shipment => {
                            const isCancelled = !!shipment.cancelled_at;
                            return (
                              <div 
                                key={shipment.id}
                                className={cn(
                                  'flex items-center justify-between p-2 rounded-lg text-xs',
                                  isCancelled ? 'bg-destructive/10 line-through' : 'bg-muted/30'
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-muted-foreground">
                                    {shipment.shipment_number?.slice(-6) || '-'}
                                  </span>
                                  <span>{formatCurrency(Number(shipment.quantity) || 0)} {shipment.unit}</span>
                                </div>
                                <span className={cn(
                                  'font-medium',
                                  isCancelled ? 'text-destructive' : 'text-foreground'
                                )}>
                                  {isCancelled ? 'ملغاة' : `${formatCurrency(shipment.calculatedTotal)} ج.م`}
                                </span>
                              </div>
                            );
                          })}
                          {typeShipments.length > 5 && (
                            <p className="text-xs text-center text-muted-foreground py-1">
                              +{typeShipments.length - 5} شحنة أخرى
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>

          {/* Grand Total Summary */}
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                الإجمالي الكلي لجميع المخلفات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-background/80 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">أنواع المخلفات</p>
                  <p className="text-2xl font-bold text-primary">{wasteTypeSummaries.length}</p>
                </div>
                <div className="text-center p-3 bg-background/80 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">إجمالي الشحنات</p>
                  <p className="text-2xl font-bold">{totals.totalShipments}</p>
                </div>
                <div className="text-center p-3 bg-background/80 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">إجمالي الكميات</p>
                  <p className="text-2xl font-bold">{formatCurrency(totals.totalQuantity)}</p>
                </div>
                <div className="text-center p-3 bg-background/80 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">إجمالي القيمة</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(totals.totalValue)} ج.م</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cancelled Shipments Tab */}
        <TabsContent value="cancelled">
          <CancelledSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}