/**
 * بطاقة الملف العام للسائق (التقييم والأداء)
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Route, TrendingUp, Shield } from 'lucide-react';
import DriverTypeBadge from '@/components/drivers/DriverTypeBadge';
import type { DriverType } from '@/types/driver-types';

interface DriverPublicProfileProps {
  driverType: DriverType;
  rating: number;
  totalTrips: number;
  acceptanceRate: number;
  isVerified: boolean;
  serviceAreaKm?: number;
}

const DriverPublicProfile = ({
  driverType,
  rating,
  totalTrips,
  acceptanceRate,
  isVerified,
  serviceAreaKm,
}: DriverPublicProfileProps) => {
  return (
    <Card className="border border-primary/20 bg-gradient-to-br from-card to-primary/5">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold">ملفك المهني</h3>
          <div className="flex items-center gap-1.5">
            <DriverTypeBadge type={driverType} size="sm" />
            {isVerified && (
              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 border-0 text-[10px] gap-0.5">
                <Shield className="w-3 h-3" /> موثّق
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="text-center p-2 rounded-lg bg-card border border-border/30">
            <Star className="w-4 h-4 mx-auto mb-1 text-amber-500" />
            <p className="text-lg font-bold">{rating.toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground">التقييم</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-card border border-border/30">
            <Route className="w-4 h-4 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold">{totalTrips}</p>
            <p className="text-[10px] text-muted-foreground">الرحلات</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-card border border-border/30">
            <TrendingUp className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
            <p className="text-lg font-bold">{(acceptanceRate * 100).toFixed(0)}%</p>
            <p className="text-[10px] text-muted-foreground">معدل القبول</p>
          </div>
          {serviceAreaKm && (
            <div className="text-center p-2 rounded-lg bg-card border border-border/30">
              <Shield className="w-4 h-4 mx-auto mb-1 text-blue-500" />
              <p className="text-lg font-bold">{serviceAreaKm}</p>
              <p className="text-[10px] text-muted-foreground">نطاق كم</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DriverPublicProfile;
