import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShipmentWithPricing {
  id: string;
  waste_description?: string | null;
  waste_type?: string | null;
  quantity?: number | null;
  unit?: string | null;
  pricePerUnit: number;
  calculatedTotal: number;
  cancelled_at?: string | null;
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
    return new Intl.NumberFormat('ar-EG', { minimumFractionDigits: 0 }).format(amount);
  };

  // Group shipments by waste type
  const wasteTypeSummaries = useMemo(() => {
    const grouped: Record<string, WasteTypeSummary> = {};

    shipments.forEach(shipment => {
      const wasteType = shipment.waste_description || shipment.waste_type || 'غير محدد';
      const isCancelled = !!shipment.cancelled_at;
      
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
      
      if (isCancelled) {
        grouped[wasteType].cancelledCount += 1;
      } else {
        grouped[wasteType].totalQuantity += Number(shipment.quantity) || 0;
        grouped[wasteType].totalValue += shipment.calculatedTotal;
      }
    });

    return Object.values(grouped).sort((a, b) => b.totalValue - a.totalValue);
  }, [shipments]);

  // Calculate totals
  const totals = useMemo(() => {
    return wasteTypeSummaries.reduce(
      (acc, wt) => ({
        totalQuantity: acc.totalQuantity + wt.totalQuantity,
        totalValue: acc.totalValue + wt.totalValue,
        totalShipments: acc.totalShipments + wt.shipmentsCount,
        totalCancelled: acc.totalCancelled + wt.cancelledCount,
      }),
      { totalQuantity: 0, totalValue: 0, totalShipments: 0, totalCancelled: 0 }
    );
  }, [wasteTypeSummaries]);

  const toggleExpanded = (wasteType: string) => {
    setExpandedTypes(prev => 
      prev.includes(wasteType) 
        ? prev.filter(t => t !== wasteType)
        : [...prev, wasteType]
    );
  };

  const getShipmentsForType = (wasteType: string) => {
    return shipments.filter(s => 
      (s.waste_description || s.waste_type || 'غير محدد') === wasteType
    );
  };

  if (wasteTypeSummaries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p>لا توجد شحنات لعرض تفاصيل المخلفات</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
                          <Package className="h-4 w-4 text-primary" />
                          {summary.wasteType}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{summary.shipmentsCount} شحنة</span>
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
              {totals.totalCancelled > 0 && (
                <p className="text-xs text-destructive">({totals.totalCancelled} ملغاة)</p>
              )}
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
    </div>
  );
}