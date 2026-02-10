import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, RefreshCw, User, Truck, Recycle, Flame } from 'lucide-react';
import { ComboboxWithInput } from '@/components/ui/combobox-with-input';
import FlexibleWasteTypeSelector from '@/components/shipments/FlexibleWasteTypeSelector';
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
  type WasteType,
  type DestinationType,
} from '@/hooks/useCreateShipment';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

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
    disposalFacilities,
    drivers,
    driverOrganization,
    driverInfo,
    driverInputType,
    setDriverInputType,
    suggestingWasteState,
    driverCurrentLocation,
    loadingDriverLocation,
    isDriver,
    isAdmin,
    generatorOptions,
    recyclerOptions,
    transporterOptions,
    disposalFacilityOptions,
    handleGeneratorChange,
    handleRecyclerChange,
    handleTransporterChange,
    handleDisposalFacilityChange,
    handleSubmit,
    getCurrentGeneratorInfo,
    getCurrentRecyclerInfo,
    handleApplyPinnedParties,
    fetchDriverCurrentLocation,
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

      {/* Destination Type Selector - for transporters */}
      {(organization?.organization_type === 'transporter' || isAdmin) && (
        <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5 space-y-3">
          <Label className="text-base font-semibold">وجهة الشحنة *</Label>
          <RadioGroup
            value={formData.destination_type}
            onValueChange={(v) => {
              setFormData(prev => ({
                ...prev,
                destination_type: v as DestinationType,
                // Clear the non-selected destination
                ...(v === 'recycling' ? { disposal_facility_id: '' } : { recycler_id: '' }),
                delivery_address: '',
              }));
            }}
            className="flex gap-6"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="recycling" id="dest-recycling" />
              <Label htmlFor="dest-recycling" className="flex items-center gap-2 cursor-pointer font-medium">
                <Recycle className="h-5 w-5 text-primary" />
                إلى التدوير
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="disposal" id="dest-disposal" />
              <Label htmlFor="dest-disposal" className="flex items-center gap-2 cursor-pointer font-medium">
                <Flame className="h-5 w-5 text-destructive" />
                إلى التخلص النهائي
              </Label>
            </div>
          </RadioGroup>
          <p className="text-xs text-muted-foreground">
            {formData.destination_type === 'recycling' 
              ? 'سيتم توجيه الشحنة لجهة إعادة التدوير وتطبيق مراحل التدوير'
              : 'سيتم توجيه الشحنة لجهة التخلص النهائي وتطبيق مراحل التخلص (استقبال ← وزن ← فحص ← تصنيف ← معالجة ← دفن/حرق ← اكتمال)'}
          </p>
        </div>
      )}

      {/* Row 1: Generator, Transporter, Destination (Recycler OR Disposal) */}
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

        {/* Show Recycler or Disposal based on destination_type */}
        {formData.destination_type === 'recycling' ? (
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
        ) : (
          <div>
            <Label>جهة التخلص النهائي *</Label>
            <ComboboxWithInput
              options={disposalFacilityOptions}
              value={formData.disposal_facility_id}
              onValueChange={handleDisposalFacilityChange}
              placeholder="اختر أو أدخل جهة التخلص النهائي"
              searchPlaceholder="ابحث عن مدفن أو محرقة..."
              emptyMessage="لا توجد جهات تخلص"
              manualInputLabel="إدخال يدوي"
            />
            <p className="text-xs text-muted-foreground mt-1">
              المدافن والمحارق المرخصة للمخلفات الخطرة والطبية
            </p>
          </div>
        )}
      </div>

      {/* Optional secondary destination (recycler can optionally have disposal, and vice versa) */}
      {formData.destination_type === 'recycling' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>جهة التخلص النهائي (اختياري)</Label>
            <ComboboxWithInput
              options={disposalFacilityOptions}
              value={formData.disposal_facility_id}
              onValueChange={handleDisposalFacilityChange}
              placeholder="اختر أو أدخل جهة التخلص النهائي"
              searchPlaceholder="ابحث عن مدفن أو محرقة..."
              emptyMessage="لا توجد جهات تخلص"
              manualInputLabel="إدخال يدوي"
            />
            <p className="text-xs text-muted-foreground mt-1">
              في حال وجود مخلفات غير قابلة للتدوير
            </p>
          </div>
        </div>
      )}

      {/* Driver Data Section - Shows when user is a driver */}
      {isDriver && driverInfo && (
        <div className="p-4 rounded-lg border-2 border-primary/30 bg-primary/5 space-y-4">
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fetchDriverCurrentLocation}
              disabled={loadingDriverLocation}
            >
              {loadingDriverLocation ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="ml-2 h-4 w-4" />
              )}
              تحديث الموقع
            </Button>
            <div className="flex items-center gap-2 text-primary font-medium">
              <User className="h-5 w-5" />
              <span>بيانات السائق (أنت)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                اسم السائق
              </Label>
              <Input
                value={formData.manual_driver_name}
                onChange={(e) => setFormData(prev => ({ ...prev, manual_driver_name: e.target.value }))}
                placeholder="اسمك"
                className="bg-background"
              />
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                رقم المركبة
              </Label>
              <Input
                value={formData.manual_vehicle_plate}
                onChange={(e) => setFormData(prev => ({ ...prev, manual_vehicle_plate: e.target.value }))}
                placeholder="رقم مركبتك"
                className="bg-background"
              />
            </div>
          </div>

          {/* Current Location Display */}
          <div>
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              موقعك الحالي (موقع الاستلام الافتراضي)
            </Label>
            <div className="flex gap-2">
              <Input
                value={formData.pickup_address}
                onChange={(e) => setFormData(prev => ({ ...prev, pickup_address: e.target.value }))}
                placeholder={loadingDriverLocation ? 'جاري تحديد موقعك...' : 'موقع الاستلام'}
                className="bg-background flex-1"
              />
              {loadingDriverLocation && (
                <div className="flex items-center px-3 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
            </div>
            {driverCurrentLocation && (
              <p className="text-xs text-muted-foreground mt-1">
                📍 الإحداثيات: {driverCurrentLocation.latitude.toFixed(6)}, {driverCurrentLocation.longitude.toFixed(6)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Driver Input Type - Only for non-drivers */}
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

      {/* Driver Details - Only for non-drivers */}
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
          <FlexibleWasteTypeSelector
            value={formData.waste_description || ''}
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
          {/* Delivery location based on destination type */}
          {(formData.destination_type === 'recycling' ? formData.recycler_id : formData.disposal_facility_id) ? (
            <EnhancedLocationPicker
              organizationId={formData.destination_type === 'recycling' ? formData.recycler_id : formData.disposal_facility_id}
              organizationName={
                formData.destination_type === 'recycling'
                  ? recyclers.find(r => r.id === formData.recycler_id)?.name || ''
                  : disposalFacilities.find(d => d.id === formData.disposal_facility_id)?.name || ''
              }
              organizationAddress={
                formData.destination_type === 'recycling'
                  ? recyclers.find(r => r.id === formData.recycler_id)?.address || ''
                  : disposalFacilities.find(d => d.id === formData.disposal_facility_id)?.address || ''
              }
              organizationCity={
                formData.destination_type === 'recycling'
                  ? recyclers.find(r => r.id === formData.recycler_id)?.city || ''
                  : disposalFacilities.find(d => d.id === formData.disposal_facility_id)?.city || ''
              }
              value={formData.delivery_address}
              onChange={(address) => setFormData(prev => ({ ...prev, delivery_address: address }))}
              label={formData.destination_type === 'recycling' ? 'موقع التسليم (جهة التدوير)' : 'موقع التسليم (جهة التخلص النهائي)'}
              placeholder="اختر موقع التسليم"
            />
          ) : (
            <div>
              <Label>موقع التسليم</Label>
              <LocationPicker
                value={formData.delivery_address}
                onChange={(address) => setFormData(prev => ({ ...prev, delivery_address: address }))}
                placeholder={formData.destination_type === 'recycling' ? 'اختر جهة التدوير أولاً' : 'اختر جهة التخلص أولاً'}
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
