import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sparkles, RotateCcw, Settings2 } from 'lucide-react';
import { toast } from 'sonner';

export interface StampSignatureConfig {
  stampSize: number; // 48-120 pixels
  signatureSize: number; // 24-64 pixels
  layout: 'horizontal' | 'vertical' | 'compact';
  showLabels: boolean;
  borderStyle: 'dashed' | 'solid' | 'none';
}

interface StampSignatureSettingsProps {
  config: StampSignatureConfig;
  onChange: (config: StampSignatureConfig) => void;
  onOptimize?: () => void;
  isOptimizing?: boolean;
}

const defaultConfig: StampSignatureConfig = {
  stampSize: 64,
  signatureSize: 32,
  layout: 'horizontal',
  showLabels: true,
  borderStyle: 'dashed',
};

const StampSignatureSettings = ({
  config,
  onChange,
  onOptimize,
  isOptimizing = false,
}: StampSignatureSettingsProps) => {
  const handleReset = () => {
    onChange(defaultConfig);
    toast.success('تم إعادة الإعدادات للوضع الافتراضي');
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4" />
            إعدادات الختم والتوقيع
          </div>
          <div className="flex items-center gap-2">
            {onOptimize && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOptimize}
                disabled={isOptimizing}
                className="gap-1 text-xs"
              >
                <Sparkles className="w-3 h-3" />
                {isOptimizing ? 'جاري التحسين...' : 'تحسين تلقائي'}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="gap-1 text-xs"
            >
              <RotateCcw className="w-3 h-3" />
              إعادة تعيين
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Stamp Size */}
          <div className="space-y-2">
            <Label className="text-xs">حجم الختم: {config.stampSize}px</Label>
            <Slider
              value={[config.stampSize]}
              onValueChange={([value]) => onChange({ ...config, stampSize: value })}
              min={48}
              max={120}
              step={8}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>صغير</span>
              <span>كبير</span>
            </div>
          </div>

          {/* Signature Size */}
          <div className="space-y-2">
            <Label className="text-xs">حجم التوقيع: {config.signatureSize}px</Label>
            <Slider
              value={[config.signatureSize]}
              onValueChange={([value]) => onChange({ ...config, signatureSize: value })}
              min={24}
              max={64}
              step={4}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>صغير</span>
              <span>كبير</span>
            </div>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Layout */}
          <div className="space-y-2">
            <Label className="text-xs">التخطيط</Label>
            <Select
              value={config.layout}
              onValueChange={(value: 'horizontal' | 'vertical' | 'compact') =>
                onChange({ ...config, layout: value })
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="horizontal">أفقي (3 أعمدة)</SelectItem>
                <SelectItem value="vertical">عمودي</SelectItem>
                <SelectItem value="compact">مضغوط</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Border Style */}
          <div className="space-y-2">
            <Label className="text-xs">نمط الإطار</Label>
            <Select
              value={config.borderStyle}
              onValueChange={(value: 'dashed' | 'solid' | 'none') =>
                onChange({ ...config, borderStyle: value })
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dashed">متقطع</SelectItem>
                <SelectItem value="solid">متصل</SelectItem>
                <SelectItem value="none">بدون إطار</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Show Labels */}
          <div className="space-y-2">
            <Label className="text-xs">عرض التسميات</Label>
            <Select
              value={config.showLabels ? 'yes' : 'no'}
              onValueChange={(value) => onChange({ ...config, showLabels: value === 'yes' })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">نعم</SelectItem>
                <SelectItem value="no">لا</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Preview */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <Label className="text-xs text-muted-foreground mb-2 block">معاينة:</Label>
          <div
            className={`flex ${
              config.layout === 'vertical' ? 'flex-col' : 'flex-row'
            } gap-4 justify-center items-center`}
          >
            {['المولد', 'الناقل', 'المدور'].map((label) => (
              <div
                key={label}
                className={`text-center ${config.layout === 'compact' ? 'p-1' : 'p-2'}`}
              >
                {config.showLabels && (
                  <div className="text-xs text-muted-foreground mb-1">{label}</div>
                )}
                <div
                  className={`mx-auto rounded-full flex items-center justify-center ${
                    config.borderStyle === 'dashed'
                      ? 'border-2 border-dashed border-muted-foreground/30'
                      : config.borderStyle === 'solid'
                      ? 'border-2 border-muted-foreground/30'
                      : ''
                  }`}
                  style={{
                    width: `${config.stampSize / 2}px`,
                    height: `${config.stampSize / 2}px`,
                  }}
                >
                  <span className="text-[8px] text-muted-foreground">ختم</span>
                </div>
                <div
                  className="mx-auto mt-1 border-t border-muted-foreground/20"
                  style={{ height: `${config.signatureSize / 2}px`, width: '40px' }}
                >
                  <span className="text-[8px] text-muted-foreground">توقيع</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StampSignatureSettings;
export { defaultConfig };
