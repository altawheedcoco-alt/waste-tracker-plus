import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Smartphone, Radio, Combine, AlertTriangle, Check, MapPin, Clock, Gauge } from 'lucide-react';
import { HybridLocationData, ShipmentTrackingConfig } from '@/types/gpsTracking';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface HybridTrackingStatusProps {
  config: ShipmentTrackingConfig | null;
  hybridData: HybridLocationData;
  className?: string;
}

const HybridTrackingStatus: React.FC<HybridTrackingStatusProps> = ({
  config,
  hybridData,
  className,
}) => {
  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'mobile':
        return <Smartphone className="w-4 h-4" />;
      case 'gps_device':
        return <Radio className="w-4 h-4" />;
      case 'hybrid':
        return <Combine className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'mobile':
        return 'الموبايل';
      case 'gps_device':
        return 'GPS السيارة';
      case 'hybrid':
        return 'مدمج';
      default:
        return source;
    }
  };

  if (!config) {
    return (
      <Card className={cn('border-dashed', className)}>
        <CardContent className="flex items-center justify-center py-8 text-muted-foreground">
          <MapPin className="w-5 h-5 ml-2" />
          لم يتم إعداد التتبع بعد
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {getSourceIcon(config.tracking_source)}
            حالة التتبع
          </CardTitle>
          <Badge variant="outline" className="gap-1">
            {getSourceIcon(config.tracking_source)}
            {getSourceLabel(config.tracking_source)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Mobile Source */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center',
              hybridData.mobile ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            )}>
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium text-sm">تطبيق الموبايل</p>
              {hybridData.mobile ? (
                <p className="text-xs text-muted-foreground">
                  آخر تحديث: {formatDistanceToNow(hybridData.mobile.timestamp, { addSuffix: true, locale: ar })}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">لا توجد بيانات</p>
              )}
            </div>
          </div>
          {hybridData.mobile && (
            <div className="text-left">
              <p className="text-sm font-medium">{hybridData.mobile.lat.toFixed(6)}</p>
              <p className="text-xs text-muted-foreground">{hybridData.mobile.lng.toFixed(6)}</p>
            </div>
          )}
        </div>

        {/* GPS Device Source */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center',
              hybridData.gps_device ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground'
            )}>
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium text-sm">جهاز GPS السيارة</p>
              {hybridData.gps_device ? (
                <p className="text-xs text-muted-foreground">
                  آخر تحديث: {formatDistanceToNow(hybridData.gps_device.timestamp, { addSuffix: true, locale: ar })}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">لا توجد بيانات</p>
              )}
            </div>
          </div>
          {hybridData.gps_device && (
            <div className="text-left">
              <p className="text-sm font-medium">{hybridData.gps_device.lat.toFixed(6)}</p>
              <p className="text-xs text-muted-foreground">{hybridData.gps_device.lng.toFixed(6)}</p>
            </div>
          )}
        </div>

        {/* Hybrid Mode Status */}
        {config.tracking_source === 'hybrid' && (
          <>
            {/* Selected Source */}
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span className="text-sm">المصدر المختار:</span>
              </div>
              <Badge>{getSourceLabel(hybridData.selected_source)}</Badge>
            </div>

            {/* Deviation */}
            {hybridData.deviation_meters !== null && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">انحراف المصادر:</span>
                  <span className={cn(
                    'font-medium',
                    hybridData.anomaly_detected ? 'text-destructive' : 'text-primary'
                  )}>
                    {hybridData.deviation_meters} متر
                  </span>
                </div>
                <Progress 
                  value={Math.min(100, (hybridData.deviation_meters / config.max_source_deviation) * 100)} 
                  className={cn(
                    'h-2',
                    hybridData.anomaly_detected && '[&>div]:bg-destructive'
                  )}
                />
              </div>
            )}

            {/* Anomaly Alert */}
            {hybridData.anomaly_detected && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                <div>
                  <p className="font-medium text-sm">تم اكتشاف انحراف كبير!</p>
                  <p className="text-xs">الفارق بين المصادر تجاوز الحد المسموح ({config.max_source_deviation} متر)</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Settings Summary */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t">
          <div className="text-center">
            <Clock className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-xs text-muted-foreground">فاصل التحديث</p>
            <p className="text-sm font-medium">{config.location_sync_interval}ث</p>
          </div>
          <div className="text-center">
            <Gauge className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-xs text-muted-foreground">حد الانحراف</p>
            <p className="text-sm font-medium">{config.max_source_deviation}م</p>
          </div>
          <div className="text-center">
            <AlertTriangle className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-xs text-muted-foreground">كشف الشذوذ</p>
            <p className="text-sm font-medium">{config.anomaly_detection_enabled ? 'مفعل' : 'معطل'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HybridTrackingStatus;
