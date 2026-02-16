import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { pricingModes, type PricingMode, type ShipmentFormData } from '@/hooks/useCreateShipment';
import { DollarSign, Info } from 'lucide-react';

interface PricingModeSelectorProps {
  formData: ShipmentFormData;
  setFormData: React.Dispatch<React.SetStateAction<ShipmentFormData>>;
}

const PricingModeSelector = ({ formData, setFormData }: PricingModeSelectorProps) => {
  const selectedMode = pricingModes.find(m => m.value === formData.pricing_mode);

  return (
    <div className="p-4 rounded-lg border-2 border-accent/30 bg-accent/5 space-y-4">
      <div className="flex items-center gap-2">
        <DollarSign className="h-5 w-5 text-accent-foreground" />
        <Label className="text-base font-semibold">طريقة التسعير</Label>
      </div>

      <Select
        value={formData.pricing_mode}
        onValueChange={(v) => setFormData(prev => ({ ...prev, pricing_mode: v as PricingMode }))}
      >
        <SelectTrigger>
          <SelectValue placeholder="اختر طريقة التسعير" />
        </SelectTrigger>
        <SelectContent>
          {pricingModes.map(mode => (
            <SelectItem key={mode.value} value={mode.value}>
              <div className="flex flex-col">
                <span>{mode.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedMode && (
        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>{selectedMode.description}</span>
        </div>
      )}

      {/* Driver Fee + Margin fields */}
      {formData.pricing_mode === 'driver_fee_plus_margin' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label className="text-sm">أجرة السائق (ريال)</Label>
            <Input
              type="number"
              value={formData.driver_fee}
              onChange={(e) => setFormData(prev => ({ ...prev, driver_fee: e.target.value }))}
              placeholder="0"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <Label className="text-sm">نسبة ربح الناقل %</Label>
            <Input
              type="number"
              value={formData.transporter_margin_percent}
              onChange={(e) => setFormData(prev => ({ ...prev, transporter_margin_percent: e.target.value }))}
              placeholder="15"
              min="0"
              max="100"
              step="0.5"
            />
          </div>
          <div>
            <Label className="text-sm">مبلغ ثابت إضافي (ريال)</Label>
            <Input
              type="number"
              value={formData.transporter_margin_fixed}
              onChange={(e) => setFormData(prev => ({ ...prev, transporter_margin_fixed: e.target.value }))}
              placeholder="0"
              min="0"
              step="1"
            />
          </div>
          {formData.driver_fee && (
            <div className="col-span-full">
              <Badge variant="secondary" className="text-xs">
                💡 إجمالي العميل ≈ {(
                  parseFloat(formData.driver_fee || '0') * (1 + parseFloat(formData.transporter_margin_percent || '0') / 100) + parseFloat(formData.transporter_margin_fixed || '0')
                ).toFixed(2)} ريال
              </Badge>
            </div>
          )}
        </div>
      )}

      {/* Transport Only */}
      {formData.pricing_mode === 'transport_only' && (
        <div>
          <Label className="text-sm">تكلفة النقل (ريال)</Label>
          <Input
            type="number"
            value={formData.manual_price}
            onChange={(e) => setFormData(prev => ({ ...prev, manual_price: e.target.value }))}
            placeholder="أدخل تكلفة النقل"
            min="0"
            step="0.01"
          />
        </div>
      )}

      {/* Transport + Disposal */}
      {formData.pricing_mode === 'transport_and_disposal' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label className="text-sm">تكلفة النقل (ريال)</Label>
            <Input
              type="number"
              value={formData.driver_fee}
              onChange={(e) => setFormData(prev => ({ ...prev, driver_fee: e.target.value }))}
              placeholder="0"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <Label className="text-sm">تكلفة التخلص (ريال)</Label>
            <Input
              type="number"
              value={formData.disposal_cost}
              onChange={(e) => setFormData(prev => ({ ...prev, disposal_cost: e.target.value }))}
              placeholder="0"
              min="0"
              step="0.01"
            />
          </div>
          {(formData.driver_fee || formData.disposal_cost) && (
            <div className="col-span-full">
              <Badge variant="secondary" className="text-xs">
                💡 الإجمالي = {(parseFloat(formData.driver_fee || '0') + parseFloat(formData.disposal_cost || '0')).toFixed(2)} ريال
              </Badge>
            </div>
          )}
        </div>
      )}

      {/* Externally Agreed */}
      {formData.pricing_mode === 'externally_agreed' && (
        <div>
          <Label className="text-sm">المبلغ المتفق عليه (ريال) - اختياري</Label>
          <Input
            type="number"
            value={formData.manual_price}
            onChange={(e) => setFormData(prev => ({ ...prev, manual_price: e.target.value }))}
            placeholder="أدخل المبلغ إن وجد"
            min="0"
            step="0.01"
          />
        </div>
      )}

      {/* Generator Pays */}
      {formData.pricing_mode === 'generator_pays' && (
        <div className="text-sm text-muted-foreground bg-primary/5 p-3 rounded border border-primary/20">
          💰 الجهة المولدة ستدفع للجهة الناقلة مقابل تحميل المخلفات. لن يتم احتساب سعر نقل.
        </div>
      )}

      {/* Manual */}
      {formData.pricing_mode === 'manual' && (
        <div>
          <Label className="text-sm">السعر الإجمالي (ريال) *</Label>
          <Input
            type="number"
            value={formData.manual_price}
            onChange={(e) => setFormData(prev => ({ ...prev, manual_price: e.target.value }))}
            placeholder="أدخل السعر الإجمالي"
            min="0"
            step="0.01"
            required
          />
        </div>
      )}
    </div>
  );
};

export default PricingModeSelector;
