import { useState, useEffect, useMemo } from 'react';
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
import { ComboboxWithInput, type ComboboxOption } from '@/components/ui/combobox-with-input';
import PinnedPartiesControls from '@/components/shipments/PinnedPartiesControls';
import { usePinnedParties } from '@/hooks/usePinnedParties';
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
  const { pinnedParties, isLoaded: pinnedLoaded, pinBothParties } = usePinnedParties();
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
  const prefilledDriverName = searchParams.get('driver_name') || '';
  const prefilledCompanyName = searchParams.get('company_name') || '';
  const prefilledCustomerName = searchParams.get('customer_name') || '';
  const prefilledMaterialType = searchParams.get('material_type') || '';
  const prefilledGovernorate = searchParams.get('governorate') || '';
  const prefilledNotes = searchParams.get('notes') || '';
  const prefilledTicketNumber = searchParams.get('ticket_number') || '';
  const rawWeightDate = searchParams.get('weight_date') || '';
  
  // Convert date from DD/MM/YYYY or other formats to YYYY-MM-DD for HTML date input
  const parseAndFormatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    
    // Try DD/MM/YYYY format
    const ddmmyyyy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddmmyyyy) {
      const [, day, month, year] = ddmmyyyy;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Try YYYY-MM-DD format (already correct)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    
    // Try to parse as date
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
    
    return '';
  };
  
  const prefilledWeightDate = parseAndFormatDate(rawWeightDate);

  // Combine notes with ticket number if available
  const combinedNotes = [
    prefilledNotes,
    prefilledTicketNumber ? `رقم التذكرة: ${prefilledTicketNumber}` : '',
  ].filter(Boolean).join(' | ');

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
    waste_description: prefilledMaterialType,
    notes: combinedNotes,
    pickup_date: prefilledWeightDate,
    expected_delivery_date: '',
    shipment_type: 'regular',
    disposal_method: '',
    manual_driver_name: prefilledDriverName,
    manual_vehicle_plate: prefilledVehiclePlate,
    packaging_method: '',
    hazard_level: '',
    waste_state: 'solid',
  });

  const [suggestingWasteState, setSuggestingWasteState] = useState(false);

  // If prefilled vehicle plate, switch to manual driver input
  useEffect(() => {
    if (prefilledVehiclePlate || prefilledDriverName) {
      setDriverInputType('manual');
    }
  }, [prefilledVehiclePlate, prefilledDriverName]);

  // Show toast if data was prefilled from AI
  useEffect(() => {
    const hasPrefilledData = prefilledNetWeight || prefilledVehiclePlate || prefilledDriverName || prefilledMaterialType;
    if (hasPrefilledData) {
      const details = [
        prefilledNetWeight ? `الوزن: ${prefilledNetWeight} ${prefilledUnit}` : '',
        prefilledVehiclePlate ? `المركبة: ${prefilledVehiclePlate}` : '',
        prefilledDriverName ? `السائق: ${prefilledDriverName}` : '',
        prefilledMaterialType ? `النوع: ${prefilledMaterialType}` : '',
      ].filter(Boolean).join(' | ');
      
      toast.success('تم تعبئة البيانات من صورة الوزنة تلقائياً', {
        description: details,
        duration: 5000,
      });
    }
  }, []);

  // Apply pinned parties on load (only once)
  useEffect(() => {
    if (pinnedLoaded && pinnedParties.generator && !formData.generator_id) {
      const generatorValue = pinnedParties.generator.isManual 
        ? `manual:${pinnedParties.generator.name}` 
        : pinnedParties.generator.id;
      
      setFormData(prev => ({
        ...prev,
        generator_id: generatorValue,
        pickup_address: pinnedParties.generator?.address 
          ? `${pinnedParties.generator.address}${pinnedParties.generator.city ? `, ${pinnedParties.generator.city}` : ''}`
          : prev.pickup_address,
      }));
    }
    
    if (pinnedLoaded && pinnedParties.recycler && !formData.recycler_id) {
      const recyclerValue = pinnedParties.recycler.isManual 
        ? `manual:${pinnedParties.recycler.name}` 
        : pinnedParties.recycler.id;
      
      setFormData(prev => ({
        ...prev,
        recycler_id: recyclerValue,
        delivery_address: pinnedParties.recycler?.address 
          ? `${pinnedParties.recycler.address}${pinnedParties.recycler.city ? `, ${pinnedParties.recycler.city}` : ''}`
          : prev.delivery_address,
      }));
    }
  }, [pinnedLoaded]);

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

  // Convert organizations to combobox options
  const generatorOptions: ComboboxOption[] = useMemo(() => 
    generators.map(g => ({ value: g.id, label: g.name, sublabel: g.city })),
    [generators]
  );

  const recyclerOptions: ComboboxOption[] = useMemo(() => 
    recyclers.map(r => ({ value: r.id, label: r.name, sublabel: r.city })),
    [recyclers]
  );

  const transporterOptions: ComboboxOption[] = useMemo(() => 
    transporters.map(t => ({ value: t.id, label: t.name, sublabel: t.city })),
    [transporters]
  );

  const handleGeneratorChange = (value: string) => {
    // Check if it's a manual entry or selection
    if (value.startsWith('manual:')) {
      setFormData(prev => ({
        ...prev,
        generator_id: value,
        pickup_address: '',
      }));
    } else {
      const generator = generators.find(g => g.id === value);
      setFormData(prev => ({
        ...prev,
        generator_id: value,
        pickup_address: generator ? `${generator.address}, ${generator.city}` : '',
      }));
    }
  };

  const handleRecyclerChange = (value: string) => {
    // Check if it's a manual entry or selection
    if (value.startsWith('manual:')) {
      setFormData(prev => ({
        ...prev,
        recycler_id: value,
        delivery_address: '',
      }));
    } else {
      const recycler = recyclers.find(r => r.id === value);
      setFormData(prev => ({
        ...prev,
        recycler_id: value,
        delivery_address: recycler ? `${recycler.address}, ${recycler.city}` : '',
      }));
    }
  };

  const handleTransporterChange = (value: string) => {
    setFormData(prev => ({ ...prev, transporter_id: value }));
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

    // Handle manual entries - extract actual IDs or null
    const isManualGenerator = formData.generator_id.startsWith('manual:');
    const isManualRecycler = formData.recycler_id.startsWith('manual:');
    const isManualTransporter = formData.transporter_id.startsWith('manual:');
    
    const generatorId = isManualGenerator ? null : formData.generator_id;
    const recyclerId = isManualRecycler ? null : formData.recycler_id;
    const manualGeneratorName = isManualGenerator ? formData.generator_id.replace('manual:', '') : null;
    const manualRecyclerName = isManualRecycler ? formData.recycler_id.replace('manual:', '') : null;
    const manualTransporterName = isManualTransporter ? formData.transporter_id.replace('manual:', '') : null;

    // Determine transporter_id and driver_id based on user role
    let transporterId: string | null = null;
    let driverId: string | null = null;

    if (isDriver) {
      transporterId = driverOrganization?.id || null;
      driverId = driverInfo?.id || null;
    } else if (isAdmin) {
      transporterId = isManualTransporter ? null : (formData.transporter_id || null);
      driverId = driverInputType === 'select' ? (formData.driver_id || null) : null;
    } else {
      transporterId = organization?.id || null;
      driverId = driverInputType === 'select' ? (formData.driver_id || null) : null;
    }

    // Require either an ID or a manual name for transporter
    if (!transporterId && !manualTransporterName && !organization?.id) {
      toast.error('يرجى اختيار أو إدخال شركة النقل');
      return;
    }

    setLoading(true);

    try {
      const { data: shipmentData, error } = await supabase.from('shipments').insert({
        generator_id: generatorId,
        recycler_id: recyclerId,
        transporter_id: transporterId || organization?.id,
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
        manual_generator_name: manualGeneratorName,
        manual_recycler_name: manualRecyclerName,
        manual_transporter_name: manualTransporterName,
        packaging_method: formData.packaging_method || null,
        hazard_level: formData.hazard_level || null,
        waste_state: formData.waste_state?.startsWith('manual:') 
          ? formData.waste_state.replace('manual:', '') 
          : (formData.waste_state || 'solid'),
      }).select().single();

      if (error) throw error;

      // Create automatic chat room for all parties (only if we have IDs)
      if (shipmentData && generatorId && transporterId && recyclerId) {
        await createShipmentChatRoom({
          shipmentId: shipmentData.id,
          shipmentNumber: shipmentData.shipment_number,
          generatorId: generatorId,
          transporterId: transporterId,
          recyclerId: recyclerId,
        });
      }

      toast.success('تم إنشاء الشحنة بنجاح');
      
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

  // Helper to get current party info for pinning
  const getCurrentGeneratorInfo = () => {
    if (!formData.generator_id) return null;
    if (formData.generator_id.startsWith('manual:')) {
      return {
        id: formData.generator_id,
        name: formData.generator_id.replace('manual:', ''),
        isManual: true,
      };
    }
    const generator = generators.find(g => g.id === formData.generator_id);
    return generator ? {
      id: generator.id,
      name: generator.name,
      address: generator.address,
      city: generator.city,
      isManual: false,
    } : null;
  };

  const getCurrentRecyclerInfo = () => {
    if (!formData.recycler_id) return null;
    if (formData.recycler_id.startsWith('manual:')) {
      return {
        id: formData.recycler_id,
        name: formData.recycler_id.replace('manual:', ''),
        isManual: true,
      };
    }
    const recycler = recyclers.find(r => r.id === formData.recycler_id);
    return recycler ? {
      id: recycler.id,
      name: recycler.name,
      address: recycler.address,
      city: recycler.city,
      isManual: false,
    } : null;
  };

  const handleApplyPinnedParties = (data: {
    generator: { id: string; name: string; address?: string } | null;
    recycler: { id: string; name: string; address?: string } | null;
    pickupAddress: string | null;
    deliveryAddress: string | null;
    wasteType: string | null;
    wasteDescription: string | null;
  }) => {
    setFormData(prev => ({
      ...prev,
      generator_id: data.generator?.id || prev.generator_id,
      recycler_id: data.recycler?.id || prev.recycler_id,
      pickup_address: data.pickupAddress || data.generator?.address || prev.pickup_address,
      delivery_address: data.deliveryAddress || data.recycler?.address || prev.delivery_address,
      waste_type: (data.wasteType as any) || prev.waste_type,
      waste_description: data.wasteDescription || prev.waste_description,
    }));
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
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
            <p className="text-xs text-muted-foreground mt-1">
              يمكنك اختيار حالة من القائمة أو إدخال حالة جديدة يدوياً
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
