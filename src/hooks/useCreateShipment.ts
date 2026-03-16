import { useState, useEffect, useMemo } from 'react';
import { isHazardousWasteType } from '@/lib/wasteClassification';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { fetchLinkedPartnerOrgs } from '@/hooks/useLinkedPartnerIds';
import { useAutoChat } from '@/hooks/useAutoChat';
import { usePinnedParties } from '@/hooks/usePinnedParties';
import { useRequireSubscription } from '@/hooks/useRequireSubscription';
import { useImpactRecorder } from '@/hooks/useImpactRecorder';
import type { Database } from '@/integrations/supabase/types';

export type WasteType = Database['public']['Enums']['waste_type'];

const VALID_WASTE_TYPES: WasteType[] = ['plastic', 'paper', 'metal', 'glass', 'electronic', 'organic', 'chemical', 'medical', 'construction', 'other'];

export const isValidWasteType = (value: string): value is WasteType => {
  return VALID_WASTE_TYPES.includes(value as WasteType);
};

export interface Organization {
  id: string;
  name: string;
  address: string;
  city: string;
  hazardous_certified?: boolean;
  is_suspended?: boolean;
}

export interface Driver {
  id: string;
  profile: { full_name: string } | null;
  vehicle_type: string | null;
  vehicle_plate: string | null;
}

export type DestinationType = 'recycling' | 'disposal';

export type PricingMode = 'auto' | 'driver_fee_plus_margin' | 'transport_only' | 'transport_and_disposal' | 'externally_agreed' | 'generator_pays' | 'manual';

export const pricingModes: { value: PricingMode; label: string; description: string }[] = [
  { value: 'auto', label: '⚡ تلقائي', description: 'يتم احتساب السعر تلقائياً حسب القواعد والمسافة' },
  { value: 'driver_fee_plus_margin', label: '🚛 أجرة السائق + ربح الناقل', description: 'أجرة السائق + نسبة أو مبلغ ثابت للجهة الناقلة' },
  { value: 'transport_only', label: '📦 ثمن النقل فقط', description: 'سعر النقل بدون تكلفة التخلص' },
  { value: 'transport_and_disposal', label: '♻️ نقل + تخلص', description: 'سعر النقل مضافاً إليه تكلفة التخلص' },
  { value: 'externally_agreed', label: '🤝 متفق عليه خارجياً', description: 'تم الاتفاق على السعر خارج النظام' },
  { value: 'generator_pays', label: '💰 المولّد يدفع للناقل', description: 'الجهة المولدة تدفع مقابل تحميل المخلفات - لا حاجة لتحديد سعر' },
  { value: 'manual', label: '✏️ يدوي', description: 'إدخال السعر يدوياً' },
];

export interface ShipmentFormData {
  destination_type: DestinationType;
  generator_id: string;
  transporter_id: string;
  recycler_id: string;
  disposal_facility_id: string;
  driver_id: string;
  waste_type: WasteType | '';
  quantity: string;
  unit: string;
  pickup_address: string;
  delivery_address: string;
  pickup_map_link: string;
  delivery_map_link: string;
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
  pricing_mode: PricingMode;
  driver_fee: string;
  transporter_margin_percent: string;
  transporter_margin_fixed: string;
  disposal_cost: string;
  manual_price: string;
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

interface DriverLocation {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
}

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
  const { requireSubscription } = useRequireSubscription();
  const { recordShipmentCreated } = useImpactRecorder();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [generators, setGenerators] = useState<Organization[]>([]);
  const [recyclers, setRecyclers] = useState<Organization[]>([]);
  const [transporters, setTransporters] = useState<Organization[]>([]);
  const [disposalFacilities, setDisposalFacilities] = useState<Organization[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driverOrganization, setDriverOrganization] = useState<Organization | null>(null);
  const [driverInfo, setDriverInfo] = useState<Driver | null>(null);
  const [driverInputType, setDriverInputType] = useState<'select' | 'manual'>('select');
  const [suggestingWasteState, setSuggestingWasteState] = useState(false);
  const [driverCurrentLocation, setDriverCurrentLocation] = useState<DriverLocation | null>(null);
  const [loadingDriverLocation, setLoadingDriverLocation] = useState(false);

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

  const [orgPricingSettings, setOrgPricingSettings] = useState<any>(null);

  const [formData, setFormData] = useState<ShipmentFormData>({
    destination_type: 'recycling',
    generator_id: '',
    transporter_id: '',
    recycler_id: '',
    disposal_facility_id: '',
    driver_id: '',
    waste_type: '',
    quantity: prefilledNetWeight,
    unit: prefilledUnit,
    pickup_address: '',
    delivery_address: '',
    pickup_map_link: '',
    delivery_map_link: '',
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
    pricing_mode: 'auto',
    driver_fee: '',
    transporter_margin_percent: '15',
    transporter_margin_fixed: '0',
    disposal_cost: '',
    manual_price: '',
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
    fetchOrgPricingSettings();
    if (isDriver) {
      fetchDriverOrganization();
      fetchDriverCurrentLocation();
    }
  }, [isDriver]);

  // Fetch org-level default pricing settings
  const fetchOrgPricingSettings = async () => {
    const orgId = organization?.id;
    if (!orgId) return;
    const { data } = await supabase
      .from('organization_pricing_settings')
      .select('*')
      .eq('organization_id', orgId)
      .maybeSingle();
    if (data) {
      setOrgPricingSettings(data);
      setFormData(prev => ({
        ...prev,
        pricing_mode: (data.default_pricing_mode || 'auto') as PricingMode,
        transporter_margin_percent: String(data.default_margin_percent || 15),
        transporter_margin_fixed: String(data.default_margin_fixed || 0),
      }));
    }
  };

  // Function to get current location and reverse geocode
  const fetchDriverCurrentLocation = async () => {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported');
      return;
    }

    setLoadingDriverLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Use Mapbox Geocoding API to get address
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=pk.eyJ1IjoibG92YWJsZSIsImEiOiJjbHNxN2JxdGQwMXhjMmptbGVtNm5uYTk4In0.R6z3KkTbTJLGXk2L7C5zNw&language=ar&types=address,place,locality`
          );
          
          const data = await response.json();
          const feature = data.features?.[0];
          
          let address = '';
          let city = '';
          
          if (feature) {
            address = feature.place_name_ar || feature.place_name || '';
            // Extract city from context
            const cityContext = feature.context?.find((c: any) => 
              c.id.startsWith('place') || c.id.startsWith('locality')
            );
            city = cityContext?.text_ar || cityContext?.text || '';
          }

          const locationData: DriverLocation = {
            latitude,
            longitude,
            address,
            city,
          };

          setDriverCurrentLocation(locationData);

          // Auto-fill pickup address with driver's current location
          setFormData(prev => ({
            ...prev,
            pickup_address: address || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          }));

          toast.success('تم تحديد موقعك الحالي كموقع الاستلام', {
            description: address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          });
        } catch (error) {
          console.error('Error reverse geocoding:', error);
          // Fallback to coordinates
          setDriverCurrentLocation({ latitude, longitude });
          setFormData(prev => ({
            ...prev,
            pickup_address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          }));
        } finally {
          setLoadingDriverLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLoadingDriverLocation(false);
        toast.error('تعذر تحديد موقعك الحالي', {
          description: 'يرجى السماح بالوصول للموقع أو إدخال العنوان يدوياً',
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const fetchOrganizationsAndDrivers = async () => {
    try {
      const orgId = organization?.id;

      if (isAdmin) {
        // Admin sees all organizations (system-wide view)
        const [genRes, recRes, dispRes, transRes] = await Promise.all([
          supabase.from('organizations').select('id, name, address, city').eq('organization_type', 'generator').eq('is_verified', true).eq('is_active', true),
          supabase.from('organizations').select('id, name, address, city').eq('organization_type', 'recycler').eq('is_verified', true).eq('is_active', true),
          supabase.from('organizations').select('id, name, address, city').eq('organization_type', 'disposal').eq('is_verified', true).eq('is_active', true),
          supabase.from('organizations').select('id, name, address, city, hazardous_certified, is_suspended').eq('organization_type', 'transporter').eq('is_verified', true).eq('is_active', true).eq('is_suspended', false),
        ]);
        if (genRes.data) setGenerators(genRes.data);
        if (recRes.data) setRecyclers(recRes.data);
        if (dispRes.data) setDisposalFacilities(dispRes.data);
        if (transRes.data) setTransporters(transRes.data as unknown as Organization[]);
      } else if (orgId) {
        // Non-admin: ONLY show linked partners via verified_partnerships
        const [generatorData, recyclerData, disposalData, transporterData] = await Promise.all([
          fetchLinkedPartnerOrgs<Organization>(orgId, 'generator', 'id, name, address, city'),
          fetchLinkedPartnerOrgs<Organization>(orgId, 'recycler', 'id, name, address, city'),
          fetchLinkedPartnerOrgs<Organization>(orgId, 'disposal', 'id, name, address, city'),
          fetchLinkedPartnerOrgs<Organization>(orgId, 'transporter', 'id, name, address, city, hazardous_certified, is_suspended'),
        ]);
        setGenerators(generatorData);
        setRecyclers(recyclerData);
        setDisposalFacilities(disposalData);
        setTransporters(transporterData);
      }

      if (!isDriver && orgId) {
        const { data: driverData } = await supabase
          .from('drivers')
          .select('id, vehicle_type, vehicle_plate, profile:profiles(full_name)')
          .eq('organization_id', orgId)
          .eq('is_available', true);

        if (driverData) setDrivers(driverData as unknown as Driver[]);
      }
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
        // Store full driver info including profile data
        const { data: fullDriverData } = await supabase
          .from('drivers')
          .select('id, organization_id, vehicle_type, vehicle_plate, license_number, profile:profiles(full_name, phone)')
          .eq('profile_id', profile.id)
          .maybeSingle();

        if (fullDriverData) {
          setDriverInfo(fullDriverData as unknown as Driver);
          
          // Auto-fill driver's vehicle plate if available
          if (fullDriverData.vehicle_plate) {
            setFormData(prev => ({
              ...prev,
              manual_vehicle_plate: fullDriverData.vehicle_plate || '',
              manual_driver_name: (fullDriverData.profile as any)?.full_name || '',
            }));
          }
        }
        
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

  const transporterOptions = useMemo(() => {
    const isHazardous = formData.waste_type ? isHazardousWasteType(formData.waste_type) : false;
    const filtered = isHazardous 
      ? transporters.filter(t => t.hazardous_certified === true)
      : transporters;
    return filtered.map(t => ({ 
      value: t.id, 
      label: t.name + (t.hazardous_certified ? ' 🛡️' : ''), 
      sublabel: t.city + (isHazardous ? ' (مرخص للمخلفات الخطرة)' : '')
    }));
  }, [transporters, formData.waste_type]);

  const disposalFacilityOptions = useMemo(() => 
    disposalFacilities.map(d => ({ value: d.id, label: d.name, sublabel: d.city })),
    [disposalFacilities]
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

  const handleDisposalFacilityChange = (value: string) => {
    if (value.startsWith('manual:')) {
      setFormData(prev => ({
        ...prev,
        disposal_facility_id: value,
        // If disposal is the primary destination, update delivery address
        ...(prev.destination_type === 'disposal' ? { delivery_address: '' } : {}),
      }));
    } else {
      const facility = disposalFacilities.find(d => d.id === value);
      setFormData(prev => ({
        ...prev,
        disposal_facility_id: value,
        ...(prev.destination_type === 'disposal' && facility 
          ? { delivery_address: `${facility.address}, ${facility.city}` } 
          : {}),
      }));
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

  const handleSubmit = async (e: React.FormEvent, onSuccess?: () => void, onClose?: () => void, afterCreate?: (shipmentId: string) => void) => {
    e.preventDefault();

    // === SUBSCRIPTION CHECK: Block if not paid ===
    if (!requireSubscription()) return;

    const destinationFieldMissing = formData.destination_type === 'recycling' 
      ? !formData.recycler_id 
      : !formData.disposal_facility_id;

    if (!formData.generator_id || destinationFieldMissing || !formData.quantity) {
      toast.error('يرجى تحديد الجهتين والكمية على الأقل');
      return;
    }

    // === STAGE 1: Verify generator license is not expired ===
    const isManualGen = formData.generator_id.startsWith('manual:');
    if (!isManualGen && formData.generator_id) {
      const { data: genOrg } = await supabase
        .from('organizations')
        .select('license_expiry_date, is_suspended, name')
        .eq('id', formData.generator_id)
        .maybeSingle();

      if (genOrg?.is_suspended) {
        toast.error(`⛔ حساب "${genOrg.name}" معطّل — لا يمكن إنشاء شحنة`);
        return;
      }
      if (genOrg?.license_expiry_date) {
        const expiry = new Date(genOrg.license_expiry_date);
        if (expiry < new Date()) {
          toast.error(`⛔ ترخيص "${genOrg.name}" منتهي بتاريخ ${genOrg.license_expiry_date} — لا يمكن إنشاء شحنة`);
          return;
        }
      }
    }

    // === STAGE 2: Verify vehicle type matches waste type ===
    const selectedDriverId = driverInputType === 'select' ? formData.driver_id : null;
    if (selectedDriverId) {
      const selectedDriver = drivers.find(d => d.id === selectedDriverId);
      const isHazardous = formData.waste_type ? isHazardousWasteType(formData.waste_type) : false;
      
      if (isHazardous && selectedDriver?.vehicle_type) {
        const closedTypes = ['closed_truck', 'tanker', 'hazmat_truck', 'refrigerated'];
        if (!closedTypes.includes(selectedDriver.vehicle_type)) {
          toast.error(`⚠️ المركبة (${selectedDriver.vehicle_type}) غير مناسبة لنقل مخلفات خطرة — يلزم مركبة مغلقة/صهريج`);
          return;
        }
      }
    }

    const isManualGenerator = formData.generator_id.startsWith('manual:');
    const isManualRecycler = formData.recycler_id.startsWith('manual:');
    const isManualTransporter = formData.transporter_id.startsWith('manual:');
    
    // Auto-create organizations for manual entries
    const autoCreateOrg = async (name: string, orgType: string): Promise<string | null> => {
      try {
        const { data, error } = await supabase.functions.invoke('auto-create-organization', {
          body: { 
            name, 
            organization_type: orgType,
            created_by_org_id: organization?.id,
          },
        });
        if (error) throw error;
        if (data?.organization_id) {
          const statusLabel = data.already_exists ? 'موجودة مسبقاً' : 'تم إنشاء حساب جديد';
          toast.info(`${statusLabel}: ${data.name}`, { duration: 3000 });
          return data.organization_id;
        }
        return null;
      } catch (e: any) {
        console.error(`Auto-create org (${orgType}) error:`, e);
        toast.error(`فشل في إنشاء حساب ${name} تلقائياً`);
        return null;
      }
    };

    let generatorId: string | null = isManualGenerator ? null : formData.generator_id;
    let recyclerId: string | null = isManualRecycler ? null : formData.recycler_id;
    let manualGeneratorName: string | null = isManualGenerator ? formData.generator_id.replace('manual:', '') : null;
    let manualRecyclerName: string | null = isManualRecycler ? formData.recycler_id.replace('manual:', '') : null;
    const manualTransporterName = isManualTransporter ? formData.transporter_id.replace('manual:', '') : null;

    // Auto-create orgs for manual parties (in parallel)
    const autoCreatePromises: Promise<void>[] = [];

    if (isManualGenerator && manualGeneratorName) {
      autoCreatePromises.push(
        autoCreateOrg(manualGeneratorName, 'generator').then(id => {
          if (id) { generatorId = id; manualGeneratorName = null; }
        })
      );
    }
    if (isManualRecycler && manualRecyclerName) {
      autoCreatePromises.push(
        autoCreateOrg(manualRecyclerName, 'recycler').then(id => {
          if (id) { recyclerId = id; manualRecyclerName = null; }
        })
      );
    }
    const isManualDisposalEarly = formData.disposal_facility_id.startsWith('manual:');
    const manualDisposalNameEarly = isManualDisposalEarly ? formData.disposal_facility_id.replace('manual:', '') : null;
    let autoDisposalId: string | null = null;
    if (isManualDisposalEarly && manualDisposalNameEarly) {
      autoCreatePromises.push(
        autoCreateOrg(manualDisposalNameEarly, 'disposal').then(id => {
          if (id) { autoDisposalId = id; }
        })
      );
    }
    let autoTransporterId: string | null = null;
    if (isManualTransporter && manualTransporterName) {
      autoCreatePromises.push(
        autoCreateOrg(manualTransporterName, 'transporter').then(id => {
          if (id) { autoTransporterId = id; }
        })
      );
    }

    if (autoCreatePromises.length > 0) {
      await Promise.all(autoCreatePromises);
    }

    let transporterId: string | null = null;
    let driverId: string | null = null;

    if (isDriver) {
      transporterId = driverOrganization?.id || null;
      driverId = driverInfo?.id || null;
    } else if (isAdmin) {
      transporterId = autoTransporterId || (isManualTransporter ? null : (formData.transporter_id || null));
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
      const disposalFacilityId = autoDisposalId || (isManualDisposalEarly ? null : (formData.disposal_facility_id || null));
      const manualDisposalName = (isManualDisposalEarly && !autoDisposalId) ? manualDisposalNameEarly : null;

      const { data: shipmentData, error } = await supabase.from('shipments').insert({
        generator_id: generatorId,
        recycler_id: recyclerId,
        transporter_id: transporterId || organization?.id,
        disposal_facility_id: disposalFacilityId,
        driver_id: driverId,
        waste_type: formData.waste_type && isValidWasteType(formData.waste_type) ? formData.waste_type : 'other',
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        pickup_address: formData.pickup_address,
        delivery_address: formData.delivery_address,
        pickup_map_link: formData.pickup_map_link || null,
        delivery_map_link: formData.delivery_map_link || null,
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
        manual_transporter_name: autoTransporterId ? null : manualTransporterName,
        manual_disposal_name: manualDisposalName,
        packaging_method: formData.packaging_method || null,
        hazard_level: formData.hazard_level || null,
        waste_state: formData.waste_state?.startsWith('manual:') 
          ? formData.waste_state.replace('manual:', '') 
          : (formData.waste_state || 'solid'),
        pricing_mode: formData.pricing_mode,
        driver_fee: formData.driver_fee ? parseFloat(formData.driver_fee) : 0,
        transporter_margin_percent: formData.transporter_margin_percent ? parseFloat(formData.transporter_margin_percent) : 0,
        transporter_margin_fixed: formData.transporter_margin_fixed ? parseFloat(formData.transporter_margin_fixed) : 0,
        disposal_cost: formData.disposal_cost ? parseFloat(formData.disposal_cost) : 0,
        price_per_unit: formData.pricing_mode === 'manual' && formData.manual_price ? parseFloat(formData.manual_price) : null,
        price_source: formData.pricing_mode === 'manual' ? 'manual' : (formData.pricing_mode === 'generator_pays' ? 'generator_pays' : null),
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

      // Auto-create generator declaration immediately on shipment creation
      if (shipmentData && generatorId && profile?.id) {
        try {
          const { autoCreateGeneratorDeclaration } = await import('@/utils/autoDeclarationCreator');
          await autoCreateGeneratorDeclaration(shipmentData.id, generatorId, profile.id);
          console.log('Auto generator declaration created on shipment creation');
        } catch (e) {
          console.error('Auto declaration error (non-blocking):', e);
        }
      }

      // Record impact event
      if (shipmentData) {
        recordShipmentCreated(shipmentData.id, {
          wasteType: formData.waste_type,
          quantity: formData.quantity,
          unit: formData.unit,
        });
      }

      // Call afterCreate callback for movement supervisors etc.
      if (shipmentData && afterCreate) {
        try { afterCreate(shipmentData.id); } catch {}
      }

      toast.success('تم إنشاء الشحنة بنجاح');

      // Save form data for repeat functionality
      try {
        const savedData = { ...formData, pickup_date: '', expected_delivery_date: '' };
        localStorage.setItem('last_shipment_form', JSON.stringify(savedData));
      } catch { /* ignore quota errors */ }
      
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
      waste_type: (data.wasteType && isValidWasteType(data.wasteType) ? data.wasteType : prev.waste_type),
      waste_description: data.wasteDescription || prev.waste_description,
    }));
  };

  const loadLastShipment = () => {
    try {
      const saved = localStorage.getItem('last_shipment_form');
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<ShipmentFormData>;
        setFormData(prev => ({ ...prev, ...parsed, pickup_date: '', expected_delivery_date: '' }));
        toast.success('تم تحميل بيانات آخر شحنة');
        return true;
      }
      toast.info('لا توجد شحنة سابقة محفوظة');
      return false;
    } catch {
      return false;
    }
  };

  const hasLastShipment = !!localStorage.getItem('last_shipment_form');

  return {
    // State
    loading,
    formData,
    setFormData,
    generators,
    recyclers,
    transporters,
    disposalFacilities,
    drivers,
    driverOrganization,
    driverInfo,
    driverInputType,
    setDriverInputType,
    suggestingWasteState,
    driverCurrentLocation,
    loadingDriverLocation,
    
    // Computed
    isDriver,
    isAdmin,
    generatorOptions,
    recyclerOptions,
    transporterOptions,
    disposalFacilityOptions,
    
    // Handlers
    handleGeneratorChange,
    handleRecyclerChange,
    handleTransporterChange,
    handleDisposalFacilityChange,
    handleSubmit,
    getCurrentGeneratorInfo,
    getCurrentRecyclerInfo,
    handleApplyPinnedParties,
    getWasteStateLabel,
    fetchDriverCurrentLocation,
    loadLastShipment,
    hasLastShipment,
    
    // Navigation
    navigate,
    organization,
  };
};
