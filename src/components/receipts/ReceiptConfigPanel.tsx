import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Settings2,
  Zap,
  Hand,
  FileCheck,
  Truck,
  Package,
  Info,
} from 'lucide-react';

interface ReceiptConfigPanelProps {
  autoReceiptEnabled: boolean;
  onAutoReceiptChange: (enabled: boolean) => void;
  autoOnDelivered: boolean;
  onAutoOnDeliveredChange: (enabled: boolean) => void;
  autoOnInTransit: boolean;
  onAutoOnInTransitChange: (enabled: boolean) => void;
}

const ReceiptConfigPanel = ({
  autoReceiptEnabled,
  onAutoReceiptChange,
  autoOnDelivered,
  onAutoOnDeliveredChange,
  autoOnInTransit,
  onAutoOnInTransitChange,
}: ReceiptConfigPanelProps) => {
  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-primary" />
          لوحة تنسيق إصدار الشهادات
        </CardTitle>
        <CardDescription>
          تحكم في كيفية إصدار شهادات الاستلام — تلقائياً أو يدوياً
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Auto Mode Toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <Label className="text-sm font-semibold">الوضع التلقائي</Label>
              <p className="text-xs text-muted-foreground">إنشاء شهادة تلقائياً عند تغيير حالة الشحنة</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={autoReceiptEnabled ? 'default' : 'secondary'} className="text-xs">
              {autoReceiptEnabled ? 'مفعّل' : 'معطّل'}
            </Badge>
            <Switch
              checked={autoReceiptEnabled}
              onCheckedChange={onAutoReceiptChange}
            />
          </div>
        </div>

        {/* Auto triggers */}
        {autoReceiptEnabled && (
          <div className="mr-6 space-y-3 border-r-2 border-primary/20 pr-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-500" />
                <div>
                  <Label className="text-sm">عند بدء النقل (قيد النقل)</Label>
                  <p className="text-xs text-muted-foreground">إصدار تلقائي عند تحويل الشحنة لقيد النقل</p>
                </div>
              </div>
              <Switch
                checked={autoOnInTransit}
                onCheckedChange={onAutoOnInTransitChange}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-green-500" />
                <div>
                  <Label className="text-sm">عند التسليم (تم التسليم)</Label>
                  <p className="text-xs text-muted-foreground">إصدار تلقائي عند تسليم الشحنة</p>
                </div>
              </div>
              <Switch
                checked={autoOnDelivered}
                onCheckedChange={onAutoOnDeliveredChange}
              />
            </div>
          </div>
        )}

        <Separator />

        {/* Manual Mode Info */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <Hand className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <Label className="text-sm font-semibold">الوضع اليدوي</Label>
            <p className="text-xs text-muted-foreground">
              متاح دائماً — يمكنك إصدار شهادة يدوياً لأي شحنة من الأزرار أدناه
            </p>
          </div>
          <Badge variant="outline" className="text-xs mr-auto">متاح دائماً</Badge>
        </div>

        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg">
          <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
          <span>
            النظام يمنع تكرار الشهادات — لن يتم إصدار شهادة مكررة لنفس الشحنة سواء كان الإصدار تلقائياً أو يدوياً
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReceiptConfigPanel;
