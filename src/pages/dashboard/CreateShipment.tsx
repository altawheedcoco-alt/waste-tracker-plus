import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowRight, Package, Loader2, Building2, MapPin, Truck, Calendar, User, X } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { toast } from 'sonner';
import LocationPicker from '@/components/maps/LocationPicker';
import EnhancedLocationPicker from '@/components/shipments/EnhancedLocationPicker';
import RouteEstimation from '@/components/shipments/RouteEstimation';
import { useAutoChat } from '@/hooks/useAutoChat';
import WasteTypeCombobox, { isHazardousWasteType, getHazardLevelFromWasteType } from '@/components/shipments/WasteTypeCombobox';
import type { Database } from '@/integrations/supabase/types';

type WasteType = Database['public']['Enums']['waste_type'];

interface Organization {
  id: string;
  name: string;
  address: string;
  city: string;
}

interface Driver {
  id: string;
  profile: { full_name: string } | null;
  vehicle_type: string | null;
  vehicle_plate: string | null;
}

// Waste types constants moved to WasteTypeCombobox component


const shipmentTypes = [
  { value: 'regular', label: 'نقلة عادية' },
  { value: 'urgent', label: 'نقلة عاجلة' },
  { value: 'scheduled', label: 'نقلة مجدولة' },
];

const disposalMethods = [
  { value: 'recycling', label: 'إعادة تدوير' },
  { value: 'remanufacturing', label: 'إعادة تصنيع' },
  { value: 'recycling_remanufacturing', label: 'إعادة تدوير / إعادة تصنيع' },
  { value: 'landfill', label: 'دفن صحي' },
  { value: 'incineration', label: 'حرق' },
  { value: 'treatment', label: 'معالجة' },
  { value: 'reuse', label: 'إعادة استخدام' },
];

const packagingMethods = [
  { value: 'packaged', label: 'معبأ' },
  { value: 'unpackaged', label: 'غير معبأ' },
];

const hazardLevels = [
  { value: 'hazardous', label: 'خطرة' },
  { value: 'non_hazardous', label: 'غير خطرة' },
];

const driverInputTypes = [
  { value: 'select', label: 'اختيار من السائقين المسجلين' },
  { value: 'manual', label: 'إدخال السائق يدوياً' },
];

interface CreateShipmentProps {
  isModal?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

const CreateShipment = ({ isModal = false, onClose, onSuccess }: CreateShipmentProps) => {
  const navigate = useNavigate();
  const { profile, organization, roles } = useAuth();
  const { createShipmentChatRoom } = useAutoChat();
  const [loading, setLoading] = useState(false);
  const [generators, setGenerators] = useState<Organization[]>([]);
  const [recyclers, setRecyclers] = useState<Organization[]>([]);
  const [transporters, setTransporters] = useState<Organization[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driverOrganization, setDriverOrganization] = useState<Organization | null>(null);
  const [driverInfo, setDriverInfo] = useState<Driver | null>(null);
  const [driverInputType, setDriverInputType] = useState<'select' | 'manual'>('select');
  const [searchParams] = useSearchParams();

  const isDriver = roles.includes('driver');
  const isAdmin = roles.includes('admin');

  // Read prefilled data from URL params (from Smart Weight Upload)
  const prefilledNetWeight = searchParams.get('net_weight') || '';
  const prefilledUnit = searchParams.get('unit') || 'كجم';
  const prefilledVehiclePlate = searchParams.get('vehicle_plate') || '';
  const prefilledCompanyName = searchParams.get('company_name') || '';

  const [formData, setFormData] = useState({
    generator_id: '',
    transporter_id: '',
    recycler_id: '',
    driver_id: '',
    waste_type: '' as WasteType | '',
    quantity: prefilledNetWeight,
    unit: prefilledUnit,
    pickup_address: '',
    delivery_address: '',
    waste_description: '',
    notes: '',
    pickup_date: '',
    expected_delivery_date: '',
    shipment_type: 'regular',
    disposal_method: '',
    manual_driver_name: '',
    manual_vehicle_plate: prefilledVehiclePlate,
    packaging_method: '',
    hazard_level: '',
    waste_state: 'solid' as 'solid' | 'liquid' | 'semi_solid' | 'gas',
  });

  const [suggestingWasteState, setSuggestingWasteState] = useState(false);

  // If prefilled vehicle plate, switch to manual driver input
  useEffect(() => {
    if (prefilledVehiclePlate) {
      setDriverInputType('manual');
    }
  }, [prefilledVehiclePlate]);

  // Show toast if data was prefilled from AI
  useEffect(() => {
    if (prefilledNetWeight || prefilledVehiclePlate) {
      toast.success('تم تعبئة البيانات من صورة الوزنة تلقائياً', {
        description: `الوزن: ${prefilledNetWeight} ${prefilledUnit}${prefilledVehiclePlate ? ` | المركبة: ${prefilledVehiclePlate}` : ''}`,
      });
    }
  }, []);

  useEffect(() => {
    fetchOrganizationsAndDrivers();
    if (isDriver) {
      fetchDriverOrganization();
    }
  }, [isDriver]);

  const fetchOrganizationsAndDrivers = async () => {
    try {
      // Fetch generators
      const { data: generatorData } = await supabase
        .from('organizations')
        .select('id, name, address, city')
        .eq('organization_type', 'generator')
        .eq('is_verified', true)
        .eq('is_active', true);

      // Fetch recyclers
      const { data: recyclerData } = await supabase
        .from('organizations')
        .select('id, name, address, city')
        .eq('organization_type', 'recycler')
        .eq('is_verified', true)
        .eq('is_active', true);

      // Fetch transporters (for admin)
      if (isAdmin) {
        const { data: transporterData } = await supabase
          .from('organizations')
          .select('id, name, address, city')
          .eq('organization_type', 'transporter')
          .eq('is_verified', true)
          .eq('is_active', true);
        if (transporterData) setTransporters(transporterData);
      }

      // Fetch company drivers (only for non-driver users)
      if (!isDriver && organization?.id) {
        const { data: driverData } = await supabase
          .from('drivers')
          .select('id, vehicle_type, vehicle_plate, profile:profiles(full_name)')
          .eq('organization_id', organization.id)
          .eq('is_available', true);

        if (driverData) setDrivers(driverData as unknown as Driver[]);
      }

      if (generatorData) setGenerators(generatorData);
      if (recyclerData) setRecyclers(recyclerData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchDriverOrganization = async () => {
    if (!profile?.id) return;
    
    try {
      // Get driver info with organization
      const { data: driverData } = await supabase
        .from('drivers')
        .select('id, organization_id, vehicle_type, vehicle_plate')
        .eq('profile_id', profile.id)
        .maybeSingle();

      if (driverData?.organization_id) {
        setDriverInfo(driverData as unknown as Driver);
        
        // Fetch the transporter organization
        const { data: orgData } = await supabase
          .from('organizations')
          .select('id, name, address, city')
          .eq('id', driverData.organization_id)
          .maybeSingle();

        if (orgData) {
          setDriverOrganization(orgData);
        }
      }
    } catch (error) {
      console.error('Error fetching driver organization:', error);
    }
  };

  // Fetch drivers when transporter changes (for admin)
  useEffect(() => {
    if (isAdmin && formData.transporter_id) {
      const fetchTransporterDrivers = async () => {
        const { data: driverData } = await supabase
          .from('drivers')
          .select('id, vehicle_type, vehicle_plate, profile:profiles(full_name)')
          .eq('organization_id', formData.transporter_id)
          .eq('is_available', true);
        if (driverData) setDrivers(driverData as unknown as Driver[]);
      };
      fetchTransporterDrivers();
    }
  }, [formData.transporter_id, isAdmin]);

  const handleGeneratorChange = (generatorId: string) => {
    const generator = generators.find(g => g.id === generatorId);
    setFormData(prev => ({
      ...prev,
      generator_id: generatorId,
      pickup_address: generator ? `${generator.address}, ${generator.city}` : '',
    }));
  };

  const handleRecyclerChange = (recyclerId: string) => {
    const recycler = recyclers.find(r => r.id === recyclerId);
    setFormData(prev => ({
      ...prev,
      recycler_id: recyclerId,
      delivery_address: recycler ? `${recycler.address}, ${recycler.city}` : '',
    }));
  };

  // AI-powered waste state suggestion
  const suggestWasteState = async (wasteDescription: string, wasteType: string) => {
    if (!wasteDescription || suggestingWasteState) return;
    
    setSuggestingWasteState(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          type: 'waste_state',
          wasteDescription,
          wasteType,
        },
      });

      if (error) throw error;

      if (data?.wasteState) {
        setFormData(prev => ({ ...prev, waste_state: data.wasteState }));
        toast.success(`تم اقتراح حالة المخلف: ${getWasteStateLabel(data.wasteState)}`, {
          description: 'يمكنك تغيير الحالة يدوياً إذا لزم الأمر',
        });
      }
    } catch (error) {
      console.error('Error suggesting waste state:', error);
      // Silently fail - don't show error to user, they can still select manually
    } finally {
      setSuggestingWasteState(false);
    }
  };

  const getWasteStateLabel = (state: string): string => {
    const labels: Record<string, string> = {
      solid: 'صلبة',
      liquid: 'سائلة',
      semi_solid: 'شبه صلبة',
      gas: 'غازية',
    };
    return labels[state] || state;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.generator_id || !formData.recycler_id || !formData.waste_type || !formData.quantity) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    // Determine transporter_id and driver_id based on user role
    let transporterId: string | undefined;
    let driverId: string | null = null;

    if (isDriver) {
      transporterId = driverOrganization?.id;
      driverId = driverInfo?.id || null;
    } else if (isAdmin) {
      transporterId = formData.transporter_id;
      driverId = driverInputType === 'select' ? (formData.driver_id || null) : null;
    } else {
      transporterId = organization?.id;
      driverId = driverInputType === 'select' ? (formData.driver_id || null) : null;
    }

    if (!transporterId) {
      toast.error('يرجى اختيار شركة النقل');
      return;
    }

    setLoading(true);

    try {
      const { data: shipmentData, error } = await supabase.from('shipments').insert({
        generator_id: formData.generator_id,
        recycler_id: formData.recycler_id,
        transporter_id: transporterId,
        driver_id: driverId,
        waste_type: formData.waste_type as WasteType,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        pickup_address: formData.pickup_address,
        delivery_address: formData.delivery_address,
        waste_description: formData.waste_description || null,
        notes: formData.notes || null,
        created_by: profile?.id!,
        shipment_number: '', // Will be auto-generated by trigger
        pickup_date: formData.pickup_date || null,
        expected_delivery_date: formData.expected_delivery_date || null,
        shipment_type: formData.shipment_type,
        disposal_method: formData.disposal_method || null,
        manual_driver_name: driverInputType === 'manual' ? formData.manual_driver_name : null,
        manual_vehicle_plate: driverInputType === 'manual' ? formData.manual_vehicle_plate : null,
        packaging_method: formData.packaging_method || null,
        hazard_level: formData.hazard_level || null,
        waste_state: formData.waste_state || 'solid',
      }).select().single();

      if (error) throw error;

      // Create automatic chat room for all parties
      if (shipmentData) {
        await createShipmentChatRoom({
          shipmentId: shipmentData.id,
          shipmentNumber: shipmentData.shipment_number,
          generatorId: formData.generator_id,
          transporterId: transporterId!,
          recyclerId: formData.recycler_id,
        });
      }

      toast.success('تم إنشاء الشحنة بنجاح وتم إنشاء غرفة دردشة للأطراف');
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/dashboard/shipments');
      }
    } catch (error: any) {
      console.error('Error creating shipment:', error);
      toast.error(error.message || 'حدث خطأ أثناء إنشاء الشحنة');
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Row 1: Generator, Transporter, Recycler */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>الشركة المولدة *</Label>
          <Select value={formData.generator_id} onValueChange={handleGeneratorChange}>
            <SelectTrigger>
              <SelectValue placeholder="اختر الشركة المولدة" />
            </SelectTrigger>
            <SelectContent>
              {generators.map(gen => (
                <SelectItem key={gen.id} value={gen.id}>
                  {gen.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>شركة النقل *</Label>
          {isDriver ? (
            <Input value={driverOrganization?.name || 'غير محدد'} disabled className="bg-muted" />
          ) : isAdmin ? (
            <Select value={formData.transporter_id} onValueChange={(v) => setFormData(prev => ({ ...prev, transporter_id: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="اختر شركة النقل" />
              </SelectTrigger>
              <SelectContent>
                {transporters.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input value={organization?.name || ''} disabled className="bg-muted" />
          )}
        </div>

        <div>
          <Label>شركة إعادة التدوير *</Label>
          <Select value={formData.recycler_id} onValueChange={handleRecyclerChange}>
            <SelectTrigger>
              <SelectValue placeholder="اختر شركة إعادة التدوير" />
            </SelectTrigger>
            <SelectContent>
              {recyclers.map(rec => (
                <SelectItem key={rec.id} value={rec.id}>
                  {rec.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 2: Driver Input Type */}
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

      {/* Row 3: Driver Details */}
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

      {/* Row 4: Waste Type & Description */}
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
            <Select 
              value={formData.waste_state} 
              onValueChange={(v) => setFormData(prev => ({ ...prev, waste_state: v as 'solid' | 'liquid' | 'semi_solid' | 'gas' }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر حالة المخلف" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solid">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🧱</span>
                    <span>صلبة</span>
                  </div>
                </SelectItem>
                <SelectItem value="liquid">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💧</span>
                    <span>سائلة</span>
                  </div>
                </SelectItem>
                <SelectItem value="semi_solid">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🫗</span>
                    <span>شبه صلبة</span>
                  </div>
                </SelectItem>
                <SelectItem value="gas">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💨</span>
                    <span>غازية</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              يتم اقتراح الحالة تلقائياً بالذكاء الاصطناعي عند اختيار نوع النفايات
            </p>
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

      {/* Row 5: Pickup & Delivery Addresses with Enhanced Location Picker */}
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

      {/* Route Estimation - Distance & ETA */}
      {formData.pickup_address && formData.delivery_address && (
        <RouteEstimation
          pickupAddress={formData.pickup_address}
          deliveryAddress={formData.delivery_address}
        />
      )}

      {/* Row 6: Dates */}
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

      {/* Row 7: Quantity & Unit */}
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

      {/* Row 8: Packaging & Hazard Level */}
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
            {formData.hazard_level === 'hazardous' && (
              <>
                <span className="font-medium">⚠️ خطرة</span>
              </>
            )}
            {formData.hazard_level === 'non_hazardous' && (
              <>
                <span className="font-medium">✓ غير خطرة</span>
              </>
            )}
            {!formData.hazard_level && (
              <span>سيتم التحديد عند اختيار نوع النفايات</span>
            )}
          </div>
        </div>
      </div>

      {/* Row 9: Disposal Method */}
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

  if (isModal) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إنشاء شحنة جديدة</DialogTitle>
            <DialogDescription>إدخال بيانات الشحنة الجديدة</DialogDescription>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <DashboardLayout>
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowRight className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">إنشاء شحنة جديدة</h1>
          <p className="text-muted-foreground">إدخال بيانات الشحنة الجديدة</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {formContent}
        </CardContent>
      </Card>
    </div>
    </DashboardLayout>
  );
};

export default CreateShipment;
