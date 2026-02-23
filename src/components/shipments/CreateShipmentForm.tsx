import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { SmartInput } from '@/components/ui/smart-input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, RefreshCw, User, Truck, Recycle, Flame, Package, Calendar, Scale, Route, FileText, DollarSign, Sparkles, Navigation as NavigationIcon } from 'lucide-react';
import { ComboboxWithInput } from '@/components/ui/combobox-with-input';
import FlexibleWasteTypeSelector from '@/components/shipments/FlexibleWasteTypeSelector';
import PinnedPartiesControls from '@/components/shipments/PinnedPartiesControls';
import WazeLocationField from '@/components/shipments/WazeLocationField';
import LocationPicker from '@/components/maps/LocationPicker';
import RouteEstimation from '@/components/shipments/RouteEstimation';
import PricingModeSelector from '@/components/shipments/PricingModeSelector';
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
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CreateShipmentFormProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

// Section wrapper component
const FormSection = ({ 
  icon: Icon, 
  title, 
  subtitle,
  children, 
  className,
  accentColor = 'primary',
}: { 
  icon: React.ElementType; 
  title: string; 
  subtitle?: string;
  children: React.ReactNode; 
  className?: string;
  accentColor?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className={cn(
      "relative rounded-xl border bg-card/50 backdrop-blur-sm overflow-hidden",
      className
    )}
  >
    <div className="flex items-center gap-3 p-4 pb-3 border-b bg-muted/30">
      <div className={cn(
        "flex items-center justify-center w-9 h-9 rounded-lg",
        accentColor === 'destructive' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
      )}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 text-right">
        <h3 className="font-semibold text-sm">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
    <div className="p-4 space-y-4">
      {children}
    </div>
  </motion.div>
);

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

  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [deliveryCoords, setDeliveryCoords] = useState<{ lat: number; lng: number } | null>(null);

  return (
    <form onSubmit={(e) => handleSubmit(e, onSuccess, onClose)} className="space-y-5">
      
      {/* Progress indicator - visual only */}
      <div className="flex items-center gap-1.5 justify-center opacity-60">
        {['وجهة', 'أطراف', 'سائق', 'مخلفات', 'مواقع', 'كمية', 'تسعير'].map((step, i) => (
          <div key={step} className="flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center border border-primary/20">
              {i + 1}
            </span>
            {i < 6 && <div className="w-3 h-px bg-border" />}
          </div>
        ))}
      </div>

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

      {/* ══════════ SECTION 1: Destination Type ══════════ */}
      {(organization?.organization_type === 'transporter' || isAdmin) && (
        <FormSection icon={Route} title="وجهة الشحنة" subtitle="حدد مسار الشحنة النهائي">
          <RadioGroup
            value={formData.destination_type}
            onValueChange={(v) => {
              setFormData(prev => ({
                ...prev,
                destination_type: v as DestinationType,
                ...(v === 'recycling' ? { disposal_facility_id: '' } : { recycler_id: '' }),
                delivery_address: '',
              }));
            }}
            className="grid grid-cols-2 gap-3"
          >
            <label
              htmlFor="dest-recycling"
              className={cn(
                "flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                formData.destination_type === 'recycling'
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/40"
              )}
            >
              <RadioGroupItem value="recycling" id="dest-recycling" className="sr-only" />
              <Recycle className={cn("h-6 w-6", formData.destination_type === 'recycling' ? "text-primary" : "text-muted-foreground")} />
              <div className="text-right flex-1">
                <p className="font-semibold text-sm">إلى التدوير</p>
                <p className="text-xs text-muted-foreground">إعادة تدوير واستخلاص المواد</p>
              </div>
            </label>
            <label
              htmlFor="dest-disposal"
              className={cn(
                "flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                formData.destination_type === 'disposal'
                  ? "border-destructive bg-destructive/5 shadow-sm"
                  : "border-border hover:border-destructive/40"
              )}
            >
              <RadioGroupItem value="disposal" id="dest-disposal" className="sr-only" />
              <Flame className={cn("h-6 w-6", formData.destination_type === 'disposal' ? "text-destructive" : "text-muted-foreground")} />
              <div className="text-right flex-1">
                <p className="font-semibold text-sm">التخلص النهائي</p>
                <p className="text-xs text-muted-foreground">دفن أو حرق المخلفات</p>
              </div>
            </label>
          </RadioGroup>
        </FormSection>
      )}

      {/* ══════════ SECTION 2: Parties ══════════ */}
      <FormSection icon={User} title="أطراف الشحنة" subtitle="الشركة المولدة، الناقل، والوجهة">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">الشركة المولدة *</Label>
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

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">شركة النقل *</Label>
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

          {formData.destination_type === 'recycling' ? (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">شركة إعادة التدوير *</Label>
              <ComboboxWithInput
                options={recyclerOptions}
                value={formData.recycler_id}
                onValueChange={handleRecyclerChange}
                placeholder="اختر أو أدخل شركة التدوير"
                searchPlaceholder="ابحث عن شركة..."
                emptyMessage="لا توجد شركات"
                manualInputLabel="إدخال يدوي"
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">جهة التخلص النهائي *</Label>
              <ComboboxWithInput
                options={disposalFacilityOptions}
                value={formData.disposal_facility_id}
                onValueChange={handleDisposalFacilityChange}
                placeholder="اختر جهة التخلص"
                searchPlaceholder="ابحث عن مدفن أو محرقة..."
                emptyMessage="لا توجد جهات تخلص"
                manualInputLabel="إدخال يدوي"
              />
            </div>
          )}
        </div>

        {/* Optional secondary destination */}
        {formData.destination_type === 'recycling' && (
          <div className="pt-2 border-t border-dashed">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">جهة التخلص النهائي (اختياري)</Label>
                <ComboboxWithInput
                  options={disposalFacilityOptions}
                  value={formData.disposal_facility_id}
                  onValueChange={handleDisposalFacilityChange}
                  placeholder="في حال وجود مخلفات غير قابلة للتدوير"
                  searchPlaceholder="ابحث عن مدفن أو محرقة..."
                  emptyMessage="لا توجد جهات تخلص"
                  manualInputLabel="إدخال يدوي"
                />
              </div>
            </div>
          </div>
        )}
      </FormSection>

      {/* ══════════ SECTION 3: Driver (if user is driver) ══════════ */}
      {isDriver && driverInfo && (
        <FormSection icon={Truck} title="بيانات السائق" subtitle="بياناتك كسائق مسجل" accentColor="primary">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> اسم السائق
              </Label>
              <SmartInput
                fieldContext="driver_name"
                value={formData.manual_driver_name}
                onChange={(v) => setFormData(prev => ({ ...prev, manual_driver_name: v }))}
                placeholder="اسمك"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5" /> رقم المركبة
              </Label>
              <SmartInput
                fieldContext="vehicle_plate"
                value={formData.manual_vehicle_plate}
                onChange={(v) => setFormData(prev => ({ ...prev, manual_vehicle_plate: v }))}
                placeholder="رقم مركبتك"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fetchDriverCurrentLocation}
                disabled={loadingDriverLocation}
                className="text-xs h-7"
              >
                {loadingDriverLocation ? <Loader2 className="ml-1.5 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="ml-1.5 h-3.5 w-3.5" />}
                تحديث الموقع
              </Button>
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> موقعك الحالي
              </Label>
            </div>
            <div className="flex gap-2">
              <SmartInput
                fieldContext="pickup_address"
                value={formData.pickup_address}
                onChange={(v) => setFormData(prev => ({ ...prev, pickup_address: v }))}
                placeholder={loadingDriverLocation ? 'جاري تحديد موقعك...' : 'موقع الاستلام'}
                className="flex-1"
              />
              {loadingDriverLocation && (
                <div className="flex items-center px-3 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
            </div>
            {driverCurrentLocation && (
              <p className="text-xs text-muted-foreground">
                📍 {driverCurrentLocation.latitude.toFixed(6)}, {driverCurrentLocation.longitude.toFixed(6)}
              </p>
            )}
          </div>
        </FormSection>
      )}

      {/* ══════════ SECTION 3b: Driver (non-driver input) ══════════ */}
      {!isDriver && (
        <FormSection icon={Truck} title="بيانات السائق" subtitle="أدخل بيانات السائق يدوياً أو اختر من القائمة">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">طريقة الإدخال</Label>
            <Select value={driverInputType} onValueChange={(v) => setDriverInputType(v as 'select' | 'manual')}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {driverInputTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {driverInputType === 'select' ? (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">السائق</Label>
                  <Select value={formData.driver_id} onValueChange={(v) => setFormData(prev => ({ ...prev, driver_id: v }))}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="اختر السائق (اختياري)" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">لا يوجد سائقين</div>
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
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">رقم المركبة</Label>
                  <Input 
                    value={drivers.find(d => d.id === formData.driver_id)?.vehicle_plate || ''}
                    disabled 
                    placeholder="يملأ تلقائياً"
                    className="bg-muted h-9"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">اسم السائق</Label>
                  <SmartInput
                    fieldContext="driver_name"
                    value={formData.manual_driver_name}
                    onChange={(v) => setFormData(prev => ({ ...prev, manual_driver_name: v }))}
                    placeholder="أدخل اسم السائق"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">رقم المركبة</Label>
                  <SmartInput
                    fieldContext="vehicle_plate"
                    value={formData.manual_vehicle_plate}
                    onChange={(v) => setFormData(prev => ({ ...prev, manual_vehicle_plate: v }))}
                    placeholder="أدخل رقم المركبة"
                  />
                </div>
              </>
            )}
          </div>
        </FormSection>
      )}

      {/* ══════════ SECTION 4: Waste Details ══════════ */}
      <FormSection 
        icon={Package} 
        title="تفاصيل المخلفات" 
        subtitle="نوع وحالة وخطورة المخلفات"
        accentColor={formData.hazard_level === 'hazardous' ? 'destructive' : 'primary'}
      >
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">نوع المخلف *</Label>
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

        {/* Waste Info Badge */}
        <AnimatePresence>
          {formData.waste_description && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={cn(
                "p-3 rounded-lg border",
                formData.hazard_level === 'hazardous' 
                  ? 'bg-destructive/5 border-destructive/30' 
                  : 'bg-primary/5 border-primary/30'
              )}
            >
              <div className="flex items-center gap-3 justify-end">
                <div className="text-right space-y-1">
                  <p className="font-semibold text-sm">{formData.waste_description.split(' - ')[1] || formData.waste_description}</p>
                  <div className="flex items-center gap-2 justify-end">
                    <span className="font-mono bg-muted px-2 py-0.5 rounded text-[10px]">
                      {formData.waste_description.split(' - ')[0]}
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-medium",
                      formData.hazard_level === 'hazardous' ? 'bg-destructive/20 text-destructive' : 'bg-primary/20 text-primary'
                    )}>
                      {formData.hazard_level === 'hazardous' ? '⚠️ خطرة' : '✓ غير خطرة'}
                    </span>
                  </div>
                </div>
                <span className="text-2xl">{formData.hazard_level === 'hazardous' ? '⚠️' : '♻️'}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              حالة المخلف
              {suggestingWasteState && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
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
              placeholder="اختر حالة المخلف"
              searchPlaceholder="ابحث..."
              emptyMessage="لا توجد نتائج"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">طريقة التعبئة</Label>
            <Select value={formData.packaging_method} onValueChange={(v) => setFormData(prev => ({ ...prev, packaging_method: v }))}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="اختر طريقة التعبئة" />
              </SelectTrigger>
              <SelectContent>
                {packagingMethods.map(method => (
                  <SelectItem key={method.value} value={method.value}>{method.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">طريقة التخلص</Label>
            <Select value={formData.disposal_method} onValueChange={(v) => setFormData(prev => ({ ...prev, disposal_method: v }))}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="اختر طريقة التخلص" />
              </SelectTrigger>
              <SelectContent>
                {disposalMethods.map(method => (
                  <SelectItem key={method.value} value={method.value}>{method.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium">ملاحظات إضافية</Label>
          <SmartInput
            fieldContext="shipment_notes"
            value={formData.notes}
            onChange={(v) => setFormData(prev => ({ ...prev, notes: v }))}
            placeholder="أي ملاحظات حول طبيعة المخلفات أو متطلبات خاصة..."
          />
        </div>
      </FormSection>

      {/* ══════════ SECTION 5: Locations ══════════ */}
      <FormSection icon={MapPin} title="المواقع" subtitle="موقع الاستلام والتسليم">
        {/* Quick Actions Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {(formData.pickup_address || formData.delivery_address) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-[11px] gap-1.5 border-dashed"
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  pickup_address: prev.delivery_address,
                  delivery_address: prev.pickup_address,
                  pickup_map_link: prev.delivery_map_link,
                  delivery_map_link: prev.pickup_map_link,
                }));
                const tempCoords = pickupCoords;
                setPickupCoords(deliveryCoords);
                setDeliveryCoords(tempCoords);
              }}
            >
              <RefreshCw className="w-3 h-3" />
              تبديل المواقع
            </Button>
          )}
          {formData.pickup_address && !formData.delivery_address && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] gap-1.5"
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  delivery_address: prev.pickup_address,
                  delivery_map_link: prev.pickup_map_link,
                }));
                setDeliveryCoords(pickupCoords);
              }}
            >
              استخدم نفس الموقع للتسليم
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <WazeLocationField
            value={formData.pickup_address}
            onChange={(address, coords) => {
              setFormData(prev => ({ ...prev, pickup_address: address }));
              if (coords) setPickupCoords(coords);
            }}
            mapLink={formData.pickup_map_link}
            onMapLinkChange={(link) => setFormData(prev => ({ ...prev, pickup_map_link: link }))}
            label="موقع الاستلام"
            placeholder="ابحث عن موقع الاستلام..."
            organizationId={formData.generator_id || undefined}
            organizationName={generators.find(g => g.id === formData.generator_id)?.name}
            organizationAddress={generators.find(g => g.id === formData.generator_id)?.address}
            organizationCity={generators.find(g => g.id === formData.generator_id)?.city}
            coordinates={pickupCoords}
            icon="pickup"
          />
          <WazeLocationField
            value={formData.delivery_address}
            onChange={(address, coords) => {
              setFormData(prev => ({ ...prev, delivery_address: address }));
              if (coords) setDeliveryCoords(coords);
            }}
            mapLink={formData.delivery_map_link}
            onMapLinkChange={(link) => setFormData(prev => ({ ...prev, delivery_map_link: link }))}
            label={formData.destination_type === 'recycling' ? 'موقع التسليم (تدوير)' : 'موقع التسليم (تخلص)'}
            placeholder="ابحث عن موقع التسليم..."
            organizationId={
              formData.destination_type === 'recycling' ? formData.recycler_id || undefined
                : formData.disposal_facility_id || undefined
            }
            organizationName={
              formData.destination_type === 'recycling'
                ? recyclers.find(r => r.id === formData.recycler_id)?.name
                : disposalFacilities.find(d => d.id === formData.disposal_facility_id)?.name
            }
            organizationAddress={
              formData.destination_type === 'recycling'
                ? recyclers.find(r => r.id === formData.recycler_id)?.address
                : disposalFacilities.find(d => d.id === formData.disposal_facility_id)?.address
            }
            organizationCity={
              formData.destination_type === 'recycling'
                ? recyclers.find(r => r.id === formData.recycler_id)?.city
                : disposalFacilities.find(d => d.id === formData.disposal_facility_id)?.city
            }
            coordinates={deliveryCoords}
            icon="delivery"
          />
        </div>

        <AnimatePresence>
          {formData.pickup_address && formData.delivery_address && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="space-y-3">
              {pickupCoords && deliveryCoords && (
                <>
                  {/* Coordinates & Distance Bar */}
                  <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50 border text-xs">
                    <div className="flex items-center gap-1.5 text-primary">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="font-mono">{pickupCoords.lat.toFixed(4)},{pickupCoords.lng.toFixed(4)}</span>
                    </div>
                    <span className="text-muted-foreground">→</span>
                    <div className="flex items-center gap-1.5 text-primary">
                      <NavigationIcon className="w-3.5 h-3.5" />
                      <span className="font-mono">{deliveryCoords.lat.toFixed(4)},{deliveryCoords.lng.toFixed(4)}</span>
                    </div>
                    <span className="mr-auto text-muted-foreground font-medium">
                      ~{(
                        Math.sqrt(
                          Math.pow((deliveryCoords.lat - pickupCoords.lat) * 111, 2) +
                          Math.pow((deliveryCoords.lng - pickupCoords.lng) * 111 * Math.cos(pickupCoords.lat * Math.PI / 180), 2)
                        )
                      ).toFixed(1)} كم
                    </span>
                  </div>

                  {/* Waze Full Directions Page */}
                  <div className="rounded-xl border overflow-hidden bg-card shadow-sm">
                    <div className="flex items-center justify-between p-3 bg-muted/40 border-b">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] gap-1.5"
                          onClick={() => {
                            window.open(
                              `https://www.waze.com/ar/live-map/directions?from=ll.${pickupCoords.lat},${pickupCoords.lng}&to=ll.${deliveryCoords.lat},${deliveryCoords.lng}`,
                              '_blank'
                            );
                          }}
                        >
                          <NavigationIcon className="w-3 h-3" />
                          فتح في Waze
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] gap-1.5"
                          onClick={() => {
                            window.open(
                              `https://www.google.com/maps/dir/?api=1&origin=${pickupCoords.lat},${pickupCoords.lng}&destination=${deliveryCoords.lat},${deliveryCoords.lng}&travelmode=driving`,
                              '_blank'
                            );
                          }}
                        >
                          <MapPin className="w-3 h-3" />
                          خرائط جوجل
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-semibold border border-primary/20">
                          <Route className="w-3 h-3" />
                          اتجاهات القيادة - Waze Live
                        </span>
                      </div>
                    </div>
                    <div className="h-[500px]">
                      <iframe
                        src={`https://www.waze.com/ar/live-map/directions?from=ll.${pickupCoords.lat},${pickupCoords.lng}&to=ll.${deliveryCoords.lat},${deliveryCoords.lng}&utm_campaign=iframe_search&utm_medium=web-iframe-desktop`}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        title="Waze Live Directions"
                        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                      />
                    </div>
                  </div>
                </>
              )}
              <RouteEstimation
                pickupAddress={formData.pickup_address}
                deliveryAddress={formData.delivery_address}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </FormSection>

      {/* ══════════ SECTION 6: Quantity, Dates & Type ══════════ */}
      <FormSection icon={Scale} title="الكمية والجدولة" subtitle="الوزن والتواريخ ونوع النقلة">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">الكمية (كجم) *</Label>
            <Input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
              placeholder="0"
              min="0"
              step="0.01"
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">نوع النقلة</Label>
            <Select value={formData.shipment_type} onValueChange={(v) => setFormData(prev => ({ ...prev, shipment_type: v }))}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {shipmentTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> تاريخ الاستلام
            </Label>
            <Input
              type="date"
              value={formData.pickup_date}
              onChange={(e) => setFormData(prev => ({ ...prev, pickup_date: e.target.value }))}
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> التسليم المتوقع
            </Label>
            <Input
              type="date"
              value={formData.expected_delivery_date}
              onChange={(e) => setFormData(prev => ({ ...prev, expected_delivery_date: e.target.value }))}
              className="h-9"
            />
          </div>
        </div>

        {/* Hazard level display */}
        <div className={cn(
          "flex items-center gap-2 p-2.5 rounded-lg border text-sm",
          formData.hazard_level === 'hazardous' 
            ? 'bg-destructive/10 border-destructive/30 text-destructive' 
            : formData.hazard_level === 'non_hazardous'
            ? 'bg-primary/10 border-primary/30 text-primary'
            : 'bg-muted border-border text-muted-foreground'
        )}>
          {formData.hazard_level === 'hazardous' && <span className="font-medium">⚠️ مخلفات خطرة — تتطلب تراخيص خاصة</span>}
          {formData.hazard_level === 'non_hazardous' && <span className="font-medium">✓ مخلفات غير خطرة</span>}
          {!formData.hazard_level && <span>مستوى الخطورة — يتحدد تلقائياً عند اختيار النوع</span>}
        </div>
      </FormSection>

      {/* ══════════ SECTION 7: Pricing ══════════ */}
      {(organization?.organization_type === 'transporter' || isAdmin) && (
        <FormSection icon={DollarSign} title="التسعير" subtitle="تحديد تكلفة الرحلة">
          <PricingModeSelector formData={formData} setFormData={setFormData} />
        </FormSection>
      )}

      {/* ══════════ Submit ══════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-start gap-3 pt-2 pb-4"
      >
        <Button type="submit" variant="eco" size="lg" disabled={loading} className="min-w-[160px]">
          {loading ? (
            <>
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              جاري الإنشاء...
            </>
          ) : (
            <>
              <FileText className="ml-2 h-4 w-4" />
              إنشاء الشحنة
            </>
          )}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          size="lg"
          onClick={onClose || (() => navigate(-1))}
        >
          إلغاء
        </Button>
      </motion.div>
    </form>
  );
};

export default CreateShipmentForm;
