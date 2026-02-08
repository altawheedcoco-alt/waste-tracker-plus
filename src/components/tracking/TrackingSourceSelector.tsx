import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Radio, Combine, Check, AlertCircle } from 'lucide-react';
import { TrackingSource, TRACKING_SOURCE_OPTIONS } from '@/types/gpsTracking';
import { cn } from '@/lib/utils';

interface TrackingSourceSelectorProps {
  value: TrackingSource;
  onChange: (source: TrackingSource) => void;
  hasGPSDevice?: boolean;
  disabled?: boolean;
}

const iconMap = {
  smartphone: Smartphone,
  radio: Radio,
  combine: Combine,
};

const TrackingSourceSelector: React.FC<TrackingSourceSelectorProps> = ({
  value,
  onChange,
  hasGPSDevice = false,
  disabled = false,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">اختر مصدر التتبع</h3>
        {!hasGPSDevice && (
          <Badge variant="outline" className="text-amber-600 border-amber-300">
            <AlertCircle className="w-3 h-3 ml-1" />
            لا يوجد جهاز GPS مربوط
          </Badge>
        )}
      </div>

      <RadioGroup
        value={value}
        onValueChange={(v) => onChange(v as TrackingSource)}
        disabled={disabled}
        className="grid gap-4 md:grid-cols-3"
      >
        {TRACKING_SOURCE_OPTIONS.map((option) => {
          const Icon = iconMap[option.icon as keyof typeof iconMap];
          const isSelected = value === option.value;
          const isDisabled = disabled || 
            (option.value !== 'mobile' && !hasGPSDevice);

          return (
            <Label
              key={option.value}
              htmlFor={option.value}
              className={cn(
                'cursor-pointer',
                isDisabled && 'cursor-not-allowed opacity-60'
              )}
            >
              <Card
                className={cn(
                  'relative transition-all duration-200 hover:shadow-md',
                  isSelected && 'ring-2 ring-primary border-primary',
                  isDisabled && 'bg-muted'
                )}
              >
                {isSelected && (
                  <div className="absolute top-3 left-3">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  </div>
                )}

                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <RadioGroupItem
                      value={option.value}
                      id={option.value}
                      disabled={isDisabled}
                      className="sr-only"
                    />
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center',
                      isSelected ? 'bg-primary/10' : 'bg-muted'
                    )}>
                      <Icon className={cn(
                        'w-6 h-6',
                        isSelected ? 'text-primary' : 'text-muted-foreground'
                      )} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{option.label}</CardTitle>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <CardDescription className="text-sm mb-3">
                    {option.description}
                  </CardDescription>

                  <ul className="space-y-1">
                    {option.features.map((feature, idx) => (
                      <li 
                        key={idx}
                        className="text-xs text-muted-foreground flex items-center gap-2"
                      >
                        <div className="w-1 h-1 rounded-full bg-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </Label>
          );
        })}
      </RadioGroup>
    </div>
  );
};

export default TrackingSourceSelector;
