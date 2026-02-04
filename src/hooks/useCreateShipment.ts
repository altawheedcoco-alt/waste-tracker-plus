import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAutoChat } from '@/hooks/useAutoChat';
import { usePinnedParties } from '@/hooks/usePinnedParties';
import type { Database } from '@/integrations/supabase/types';

export type WasteType = Database['public']['Enums']['waste_type'];

export interface Organization {
  id: string;
  name: string;
  address: string;
  city: string;
}

export interface Driver {
  id: string;
  profile: { full_name: string } | null;
  vehicle_type: string | null;
  vehicle_plate: string | null;
}

export interface ShipmentFormData {
  generator_id: string;
  transporter_id: string;
  recycler_id: string;
  driver_id: string;
  waste_type: WasteType | '';
  quantity: string;
  unit: string;
  pickup_address: string;
  delivery_address: string;
  waste_description: string;
  notes: string;
  pickup_date: string;
  expected_delivery_date: string;
  shipment_type: string;
  disposal_method: string;
  manual_driver_name: string;
  manual_vehicle_plate: string;
  packaging_method: string;
  hazard_level: string;
  waste_state: string;
}

export const shipmentTypes = [
  { value: 'regular', label: 'نقلة عادية' },
  { value: 'urgent', label: 'نقلة عاجلة' },
  { value: 'scheduled', label: 'نقلة مجدولة' },
];

export const disposalMethods = [
  { value: 'recycling', label: 'إعادة تدوير' },
  { value: 'remanufacturing', label: 'إعادة تصنيع' },
  { value: 'recycling_remanufacturing', label: 'إعادة تدوير / إعادة تصنيع' },
  { value: 'landfill', label: 'دفن صحي' },
  { value: 'incineration', label: 'حرق' },
  { value: 'treatment', label: 'معالجة' },
  { value: 'reuse', label: 'إعادة استخدام' },
];

export const packagingMethods = [
  { value: 'packaged', label: 'معبأ' },
  { value: 'unpackaged', label: 'غير معبأ' },
];

export const driverInputTypes = [
  { value: 'select', label: 'اختيار من السائقين المسجلين' },
  { value: 'manual', label: 'إدخال السائق يدوياً' },
];

const parseAndFormatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  
  const ddmmyyyy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  
  return '';
};

export const useCreateShipment = () => {
  const navigate = useNavigate();
  const { profile, organization, roles } = useAuth();
  const { createShipmentChatRoom } = useAutoChat();
  const { pinnedParties, isLoaded: pinnedLoaded } = usePinnedParties();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [generators, setGenerators] = useState<Organization[]>([]);
  const [recyclers, setRecyclers] = useState<Organization[]>([]);
  const [transporters, setTransporters] = useState<Organization[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driverOrganization, setDriverOrganization] = useState<Organization | null>(null);
  const [driverInfo, setDriverInfo] = useState<Driver | null>(null);
  const [driverInputType, setDriverInputType] = useState<'select' | 'manual'>('select');
  const [suggestingWasteState, setSuggestingWasteState] = useState(false);

  const isDriver = roles.includes('driver');
  const isAdmin = roles.includes('admin');

  // Read prefilled data from URL params
  const prefilledNetWeight = searchParams.get('net_weight') || '';
  const prefilledUnit = searchParams.get('unit') || 'كجم';
  const prefilledVehiclePlate = searchParams.get('vehicle_plate') || '';
  const prefilledDriverName = searchParams.get('driver_name') || '';
  const prefilledMaterialType = searchParams.get('material_type') || '';
  const prefilledNotes = searchParams.get('notes') || '';
  const prefilledTicketNumber = searchParams.get('ticket_number') || '';
  const rawWeightDate = searchParams.get('weight_date') || '';
  const prefilledWeightDate = parseAndFormatDate(rawWeightDate);

  const combinedNotes = [
    prefilledNotes,
    prefilledTicketNumber ? `رقم التذكرة: ${prefilledTicketNumber}` : '',
  ].filter(Boolean).join(' | ');

  const [formData, setFormData] = useState<ShipmentFormData>({
    generator_id: '',
    transporter_id: '',
    recycler_id: '',
    driver_id: '',
    waste_type: '',
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

  // Apply pinned parties on load
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
      const { data: generatorData } = await supabase
        .from('organizations')
        .select('id, name, address, city')
        .eq('organization_type', 'generator')
        .eq('is_verified', true)
        .eq('is_active', true);

      const { data: recyclerData } = await supabase
        .from('organizations')
        .select('id, name, address, city')
        .eq('organization_type', 'recycler')
        .eq('is_verified', true)
        .eq('is_active', true);

      if (isAdmin) {
        const { data: transporterData } = await supabase
          .from('organizations')
          .select('id, name, address, city')
          .eq('organization_type', 'transporter')
          .eq('is_verified', true)
          .eq('is_active', true);
        if (transporterData) setTransporters(transporterData);
      }

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
      const { data: driverData } = await supabase
        .from('drivers')
        .select('id, organization_id, vehicle_type, vehicle_plate')
        .eq('profile_id', profile.id)
        .maybeSingle();

      if (driverData?.organization_id) {
        setDriverInfo(driverData as unknown as Driver);
        
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
  const generatorOptions = useMemo(() => 
    generators.map(g => ({ value: g.id, label: g.name, sublabel: g.city })),
    [generators]
  );

  const recyclerOptions = useMemo(() => 
    recyclers.map(r => ({ value: r.id, label: r.name, sublabel: r.city })),
    [recyclers]
  );

  const transporterOptions = useMemo(() => 
    transporters.map(t => ({ value: t.id, label: t.name, sublabel: t.city })),
    [transporters]
  );

  const handleGeneratorChange = (value: string) => {
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

  const getWasteStateLabel = (state: string): string => {
    const labels: Record<string, string> = {
      solid: 'صلبة',
      liquid: 'سائلة',
      semi_solid: 'شبه صلبة',
      gas: 'غازية',
    };
    return labels[state] || state;
  };

  const handleSubmit = async (e: React.FormEvent, onSuccess?: () => void, onClose?: () => void) => {
    e.preventDefault();

    if (!formData.generator_id || !formData.recycler_id || !formData.waste_type || !formData.quantity) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const isManualGenerator = formData.generator_id.startsWith('manual:');
    const isManualRecycler = formData.recycler_id.startsWith('manual:');
    const isManualTransporter = formData.transporter_id.startsWith('manual:');
    
    const generatorId = isManualGenerator ? null : formData.generator_id;
    const recyclerId = isManualRecycler ? null : formData.recycler_id;
    const manualGeneratorName = isManualGenerator ? formData.generator_id.replace('manual:', '') : null;
    const manualRecyclerName = isManualRecycler ? formData.recycler_id.replace('manual:', '') : null;
    const manualTransporterName = isManualTransporter ? formData.transporter_id.replace('manual:', '') : null;

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
        shipment_number: '',
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

  return {
    // State
    loading,
    formData,
    setFormData,
    generators,
    recyclers,
    transporters,
    drivers,
    driverOrganization,
    driverInfo,
    driverInputType,
    setDriverInputType,
    suggestingWasteState,
    
    // Computed
    isDriver,
    isAdmin,
    generatorOptions,
    recyclerOptions,
    transporterOptions,
    
    // Handlers
    handleGeneratorChange,
    handleRecyclerChange,
    handleTransporterChange,
    handleSubmit,
    getCurrentGeneratorInfo,
    getCurrentRecyclerInfo,
    handleApplyPinnedParties,
    getWasteStateLabel,
    
    // Navigation
    navigate,
    organization,
  };
};
