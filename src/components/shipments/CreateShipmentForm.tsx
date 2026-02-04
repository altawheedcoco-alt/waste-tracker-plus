import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { ComboboxWithInput } from '@/components/ui/combobox-with-input';
import WasteTypeCombobox from '@/components/shipments/WasteTypeCombobox';
import PinnedPartiesControls from '@/components/shipments/PinnedPartiesControls';
import EnhancedLocationPicker from '@/components/shipments/EnhancedLocationPicker';
import LocationPicker from '@/components/maps/LocationPicker';
import RouteEstimation from '@/components/shipments/RouteEstimation';
import { 
  useCreateShipment, 
  shipmentTypes, 
  disposalMethods, 
  packagingMethods, 
  driverInputTypes,
  type WasteType 
} from '@/hooks/useCreateShipment';

interface CreateShipmentFormProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

const CreateShipmentForm = ({ onSuccess, onClose }: CreateShipmentFormProps) => {
  const {
    loading,
    formData,
    setFormData,
    generators,
    recyclers,
    drivers,
    driverOrganization,
    driverInputType,
    setDriverInputType,
    suggestingWasteState,
    isDriver,
    isAdmin,
    generatorOptions,
    recyclerOptions,
    transporterOptions,
    handleGeneratorChange,
    handleRecyclerChange,
    handleTransporterChange,
    handleSubmit,
    getCurrentGeneratorInfo,
    getCurrentRecyclerInfo,
    handleApplyPinnedParties,
    navigate,
    organization,
  } = useCreateShipment();

  return (
    <form onSubmit={(e) => handleSubmit(e, onSuccess, onClose)} className="space-y-6">
      {/* Pinned Parties Controls - for transporters */}
      {organization?.organization_type === 'transporter' && (
        <PinnedPartiesControls
          currentGenerator={getCurrentGeneratorInfo()}
          currentRecycler={getCurrentRecyclerInfo()}
          currentPickupAddress={formData.pickup_address}
          currentDeliveryAddress={formData.delivery_address}
          currentWasteType={formData.waste_type}
          currentWasteDescription={formData.waste_description}
          onApplyPinned={handleApplyPinnedParties}
        />
      )}

      {/* Row 1: Generator, Transporter, Recycler */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>الشركة المولدة *</Label>
          <ComboboxWithInput
            options={generatorOptions}
            value={formData.generator_id}
            onValueChange={handleGeneratorChange}
            placeholder="اختر أو أدخل الشركة المولدة"
            searchPlaceholder="ابحث عن شركة..."
            emptyMessage="لا توجد شركات"
            manualInputLabel="إدخال يدوي"
          />
        </div>

        <div>
          <Label>شركة النقل *</Label>
          {isDriver ? (
            <Input value={driverOrganization?.name || 'غير محدد'} disabled className="bg-muted" />
          ) : isAdmin ? (
            <ComboboxWithInput
              options={transporterOptions}
              value={formData.transporter_id}
              onValueChange={handleTransporterChange}
              placeholder="اختر أو أدخل شركة النقل"
              searchPlaceholder="ابحث عن شركة..."
              emptyMessage="لا توجد شركات"
              manualInputLabel="إدخال يدوي"
            />
          ) : (
            <Input value={organization?.name || ''} disabled className="bg-muted" />
          )}
        </div>

        <div>
          <Label>شركة إعادة التدوير *</Label>
          <ComboboxWithInput
            options={recyclerOptions}
            value={formData.recycler_id}
            onValueChange={handleRecyclerChange}
            placeholder="اختر أو أدخل شركة إعادة التدوير"
            searchPlaceholder="ابحث عن شركة..."
            emptyMessage="لا توجد شركات"
            manualInputLabel="إدخال يدوي"
          />
        </div>
      </div>

      {/* Driver Input Type */}
      {!isDriver && (
        <div>
          <Label>نوع إدخال السائق</Label>
          <Select value={driverInputType} onValueChange={(v) => setDriverInputType(v as 'select' | 'manual')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {driverInputTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Driver Details */}
      {!isDriver && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {driverInputType === 'select' ? (
            <>
              <div>
                <Label>السائق</Label>
                <Select value={formData.driver_id} onValueChange={(v) => setFormData(prev => ({ ...prev, driver_id: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر السائق (اختياري)" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">لا يوجد سائقين متاحين</div>
                    ) : (
                      drivers.map(driver => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.profile?.full_name} - {driver.vehicle_plate}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>رقم المركبة</Label>
                <Input 
                  value={drivers.find(d => d.id === formData.driver_id)?.vehicle_plate || ''}
                  disabled 
                  placeholder="سيتم ملؤه تلقائياً"
                  className="bg-muted"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <Label>اسم السائق</Label>
                <Input
                  value={formData.manual_driver_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, manual_driver_name: e.target.value }))}
                  placeholder="أدخل اسم السائق"
                />
              </div>
              <div>
                <Label>رقم المركبة</Label>
                <Input
                  value={formData.manual_vehicle_plate}
                  onChange={(e) => setFormData(prev => ({ ...prev, manual_vehicle_plate: e.target.value }))}
                  placeholder="أدخل رقم المركبة"
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Waste Type & Description */}
      <div className="space-y-4">
        <div>
          <Label>نوع المخلف *</Label>
          <WasteTypeCombobox
            value={formData.waste_type ? `${formData.waste_type}:${formData.waste_description?.split(' - ')[0] || ''}` : ''}
            onChange={(wasteType, hazardLevel, wasteDescription) => {
              setFormData(prev => ({ 
                ...prev, 
                waste_type: wasteType as WasteType,
                hazard_level: hazardLevel,
                waste_description: wasteDescription,
              }));
            }}
          />
        </div>

        {/* Waste Type Details Card */}
        {formData.waste_description && (
          <div className={`p-4 rounded-lg border-2 ${
            formData.hazard_level === 'hazardous' 
              ? 'bg-destructive/5 border-destructive/30' 
              : 'bg-primary/5 border-primary/30'
          }`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2 text-right">
                <div className="flex items-center gap-2 justify-end">
                  <span className="font-bold text-lg">{formData.waste_description.split(' - ')[1] || formData.waste_description}</span>
                  {formData.hazard_level === 'hazardous' ? (
                    <span className="text-destructive">⚠️</span>
                  ) : (
                    <span className="text-primary">♻️</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 justify-end text-sm">
                  <span className="font-mono bg-muted px-2 py-1 rounded text-xs">
                    {formData.waste_description.split(' - ')[0]}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    formData.hazard_level === 'hazardous' 
                      ? 'bg-destructive/20 text-destructive' 
                      : 'bg-primary/20 text-primary'
                  }`}>
                    {formData.hazard_level === 'hazardous' ? 'مخلفات خطرة' : 'مخلفات غير خطرة'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Waste State Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="flex items-center gap-2">
              حالة المخلف
              {suggestingWasteState && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  جاري التحليل...
                </span>
              )}
            </Label>
            <ComboboxWithInput
              options={[
                { value: 'solid', label: '🧱 صلبة' },
                { value: 'liquid', label: '💧 سائلة' },
                { value: 'semi_solid', label: '🫗 شبه صلبة' },
                { value: 'gas', label: '💨 غازية' },
              ]}
              value={formData.waste_state}
              onValueChange={(v) => setFormData(prev => ({ ...prev, waste_state: v }))}
              placeholder="اختر أو أدخل حالة المخلف"
              searchPlaceholder="ابحث أو أدخل حالة جديدة..."
              emptyMessage="لا توجد نتائج"
            />
          </div>
          <div>
            <Label>طريقة التعبئة</Label>
            <Select 
              value={formData.packaging_method} 
              onValueChange={(v) => setFormData(prev => ({ ...prev, packaging_method: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر طريقة التعبئة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="packaged">معبأ</SelectItem>
                <SelectItem value="unpackaged">غير معبأ</SelectItem>
                <SelectItem value="drums">براميل</SelectItem>
                <SelectItem value="tanks">خزانات</SelectItem>
                <SelectItem value="bags">أكياس</SelectItem>
                <SelectItem value="bulk">سائب</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>وصف إضافي للنفايات (اختياري)</Label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="أي ملاحظات إضافية حول طبيعة النفايات أو متطلبات خاصة..."
            rows={2}
          />
        </div>
      </div>

      {/* Pickup & Delivery Addresses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          {formData.generator_id ? (
            <EnhancedLocationPicker
              organizationId={formData.generator_id}
              organizationName={generators.find(g => g.id === formData.generator_id)?.name || ''}
              organizationAddress={generators.find(g => g.id === formData.generator_id)?.address || ''}
              organizationCity={generators.find(g => g.id === formData.generator_id)?.city || ''}
              value={formData.pickup_address}
              onChange={(address) => setFormData(prev => ({ ...prev, pickup_address: address }))}
              label="موقع الاستلام (الجهة المولدة)"
              placeholder="اختر موقع الاستلام"
            />
          ) : (
            <div>
              <Label>موقع الاستلام</Label>
              <LocationPicker
                value={formData.pickup_address}
                onChange={(address) => setFormData(prev => ({ ...prev, pickup_address: address }))}
                placeholder="اختر الجهة المولدة أولاً"
              />
            </div>
          )}
        </div>
        <div>
          {formData.recycler_id ? (
            <EnhancedLocationPicker
              organizationId={formData.recycler_id}
              organizationName={recyclers.find(r => r.id === formData.recycler_id)?.name || ''}
              organizationAddress={recyclers.find(r => r.id === formData.recycler_id)?.address || ''}
              organizationCity={recyclers.find(r => r.id === formData.recycler_id)?.city || ''}
              value={formData.delivery_address}
              onChange={(address) => setFormData(prev => ({ ...prev, delivery_address: address }))}
              label="موقع التسليم (الجهة المُعيدة)"
              placeholder="اختر موقع التسليم"
            />
          ) : (
            <div>
              <Label>موقع التسليم</Label>
              <LocationPicker
                value={formData.delivery_address}
                onChange={(address) => setFormData(prev => ({ ...prev, delivery_address: address }))}
                placeholder="اختر الجهة المُعيدة أولاً"
              />
            </div>
          )}
        </div>
      </div>

      {/* Route Estimation */}
      {formData.pickup_address && formData.delivery_address && (
        <RouteEstimation
          pickupAddress={formData.pickup_address}
          deliveryAddress={formData.delivery_address}
        />
      )}

      {/* Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>تاريخ الاستلام</Label>
          <Input
            type="date"
            value={formData.pickup_date}
            onChange={(e) => setFormData(prev => ({ ...prev, pickup_date: e.target.value }))}
          />
        </div>
        <div>
          <Label>تاريخ التسليم المتوقع</Label>
          <Input
            type="date"
            value={formData.expected_delivery_date}
            onChange={(e) => setFormData(prev => ({ ...prev, expected_delivery_date: e.target.value }))}
          />
        </div>
      </div>

      {/* Quantity & Shipment Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>الكمية (كجم) *</Label>
          <Input
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
            placeholder="0"
            min="0"
            step="0.01"
          />
        </div>
        <div>
          <Label>نوع النقلة</Label>
          <Select value={formData.shipment_type} onValueChange={(v) => setFormData(prev => ({ ...prev, shipment_type: v }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {shipmentTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Hazard Level Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>طريقة التعبئة</Label>
          <Select value={formData.packaging_method} onValueChange={(v) => setFormData(prev => ({ ...prev, packaging_method: v }))}>
            <SelectTrigger>
              <SelectValue placeholder="اختر طريقة التعبئة" />
            </SelectTrigger>
            <SelectContent>
              {packagingMethods.map(method => (
                <SelectItem key={method.value} value={method.value}>
                  {method.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>مستوى الخطورة (يتحدد تلقائياً)</Label>
          <div className={`flex items-center gap-2 p-3 rounded-md border ${
            formData.hazard_level === 'hazardous' 
              ? 'bg-destructive/10 border-destructive text-destructive' 
              : formData.hazard_level === 'non_hazardous'
              ? 'bg-primary/10 border-primary text-primary'
              : 'bg-muted border-border text-muted-foreground'
          }`}>
            {formData.hazard_level === 'hazardous' && <span className="font-medium">⚠️ خطرة</span>}
            {formData.hazard_level === 'non_hazardous' && <span className="font-medium">✓ غير خطرة</span>}
            {!formData.hazard_level && <span>سيتم التحديد عند اختيار نوع النفايات</span>}
          </div>
        </div>
      </div>

      {/* Disposal Method */}
      <div>
        <Label>طريقة التخلص</Label>
        <Select value={formData.disposal_method} onValueChange={(v) => setFormData(prev => ({ ...prev, disposal_method: v }))}>
          <SelectTrigger>
            <SelectValue placeholder="اختر طريقة التخلص" />
          </SelectTrigger>
          <SelectContent>
            {disposalMethods.map(method => (
              <SelectItem key={method.value} value={method.value}>
                {method.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Submit Buttons */}
      <div className="flex justify-start gap-4 pt-4">
        <Button type="submit" variant="eco" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              جاري الإنشاء...
            </>
          ) : (
            'إنشاء الشحنة'
          )}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onClose || (() => navigate(-1))}
        >
          إلغاء
        </Button>
      </div>
    </form>
  );
};

export default CreateShipmentForm;
