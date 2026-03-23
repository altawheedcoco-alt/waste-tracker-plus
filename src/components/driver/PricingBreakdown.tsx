/**
 * تفصيل التسعير الديناميكي — Didi/Uber style
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Flag, Route, Clock, AlertTriangle, Receipt } from 'lucide-react';

interface PricingBreakdownProps {
  distanceKm: number;
  wasteType?: string;
  estimatedWeight?: number;
  /** Override total price (from offer) */
  totalOverride?: number;
  compact?: boolean;
}

const BASE_FLAG_DROP = 25;  // ج.م
const RATE_PER_KM = 5;     // ج.م/كم
const WAITING_RATE = 100;   // ج.م/ساعة
const HAZARDOUS_MULTIPLIER = 1.5;

const isHazardous = (type?: string) =>
  ['hazardous', 'medical', 'radioactive'].includes(type || '');

const PricingBreakdown = ({ distanceKm, wasteType, estimatedWeight, totalOverride, compact }: PricingBreakdownProps) => {
  const hazardous = isHazardous(wasteType);
  const distanceCost = distanceKm * RATE_PER_KM;
  const subtotal = BASE_FLAG_DROP + distanceCost;
  const multiplier = hazardous ? HAZARDOUS_MULTIPLIER : 1;
  const total = totalOverride ?? Math.round(subtotal * multiplier);

  if (compact) {
    return (
      <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/30 border border-border/30">
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground">{distanceKm.toFixed(1)} كم</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">{RATE_PER_KM} ج.م/كم</span>
          {hazardous && (
            <Badge variant="destructive" className="text-[9px] px-1 py-0">خطرة ×{HAZARDOUS_MULTIPLIER}</Badge>
          )}
        </div>
        <span className="font-bold text-primary">{total} ج.م</span>
      </div>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold">
          <Receipt className="w-4 h-4 text-primary" />
          تفاصيل التسعير
        </div>

        <div className="space-y-2 text-xs">
          {/* Flag drop */}
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Flag className="w-3 h-3" /> رسم بدء الرحلة
            </span>
            <span>{BASE_FLAG_DROP} ج.م</span>
          </div>

          {/* Distance */}
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Route className="w-3 h-3" /> المسافة ({distanceKm.toFixed(1)} كم × {RATE_PER_KM})
            </span>
            <span>{distanceCost.toFixed(0)} ج.م</span>
          </div>

          {/* Waiting */}
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-3 h-3" /> رسوم الانتظار
            </span>
            <span className="text-muted-foreground">{WAITING_RATE} ج.م/ساعة</span>
          </div>

          {/* Hazardous multiplier */}
          {hazardous && (
            <div className="flex justify-between items-center text-destructive">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3" /> مضاعف مخلفات خطرة
              </span>
              <span>×{HAZARDOUS_MULTIPLIER}</span>
            </div>
          )}

          <Separator />

          {/* Total */}
          <div className="flex justify-between items-center text-sm font-bold">
            <span>الإجمالي المقدّر</span>
            <span className="text-primary text-lg">{total} ج.م</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PricingBreakdown;
