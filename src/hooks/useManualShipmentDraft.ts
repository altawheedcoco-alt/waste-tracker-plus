import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export interface ManualShipmentData {
  id?: string;
  share_code?: string;
  shipment_number: string;
  generator_name: string;
  generator_address: string;
  generator_phone: string;
  generator_license: string;
  generator_commercial_register: string;
  generator_tax_id: string;
  generator_representative: string;
  generator_email: string;
  transporter_name: string;
  transporter_address: string;
  transporter_phone: string;
  transporter_license: string;
  transporter_commercial_register: string;
  transporter_tax_id: string;
  transporter_representative: string;
  transporter_email: string;
  destination_name: string;
  destination_address: string;
  destination_phone: string;
  destination_license: string;
  destination_commercial_register: string;
  destination_tax_id: string;
  destination_representative: string;
  destination_email: string;
  destination_type: string;
  waste_type: string;
  waste_description: string;
  waste_state: string;
  hazard_level: string;
  quantity: string;
  unit: string;
  packaging_method: string;
  disposal_method: string;
  driver_name: string;
  driver_phone: string;
  driver_license: string;
  vehicle_plate: string;
  vehicle_type: string;
  pickup_address: string;
  delivery_address: string;
  pickup_date: string;
  delivery_date: string;
  shipment_type: string;
  price: string;
  price_notes: string;
  notes: string;
  special_instructions: string;
}

const emptyForm: ManualShipmentData = {
  shipment_number: '',
  generator_name: '', generator_address: '', generator_phone: '', generator_license: '',
  generator_commercial_register: '', generator_tax_id: '', generator_representative: '', generator_email: '',
  transporter_name: '', transporter_address: '', transporter_phone: '', transporter_license: '',
  transporter_commercial_register: '', transporter_tax_id: '', transporter_representative: '', transporter_email: '',
  destination_name: '', destination_address: '', destination_phone: '', destination_license: '',
  destination_commercial_register: '', destination_tax_id: '', destination_representative: '', destination_email: '',
  destination_type: 'recycling',
  waste_type: '', waste_description: '', waste_state: 'solid', hazard_level: 'non_hazardous',
  quantity: '', unit: 'ton', packaging_method: '', disposal_method: '',
  driver_name: '', driver_phone: '', driver_license: '', vehicle_plate: '', vehicle_type: '',
  pickup_address: '', delivery_address: '', pickup_date: '', delivery_date: '',
  shipment_type: 'regular', price: '', price_notes: '', notes: '', special_instructions: '',
};

export function useManualShipmentDraft(draftId?: string, shareCode?: string) {
  const { user, organization } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<ManualShipmentData>({ ...emptyForm });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedDraftId, setSavedDraftId] = useState<string | null>(draftId || null);
  const [savedShareCode, setSavedShareCode] = useState<string | null>(null);

  // Load existing draft
  useEffect(() => {
    if (draftId) loadById(draftId);
    else if (shareCode) loadByShareCode(shareCode);
    else loadFromLocalStorage();
  }, [draftId, shareCode]);

  // Auto-save to localStorage on change
  useEffect(() => {
    localStorage.setItem('manual_shipment_draft', JSON.stringify(form));
  }, [form]);

  const loadFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem('manual_shipment_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        setForm(prev => ({ ...prev, ...parsed }));
      }
    } catch { /* ignore */ }
  };

  const loadById = async (id: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('manual_shipment_drafts')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    setLoading(false);
    if (data) {
      mapDbToForm(data);
      setSavedDraftId(data.id);
      setSavedShareCode(data.share_code);
    }
  };

  const loadByShareCode = async (code: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('manual_shipment_drafts')
      .select('*')
      .eq('share_code', code)
      .maybeSingle();
    setLoading(false);
    if (data) {
      mapDbToForm(data);
      setSavedDraftId(data.id);
      setSavedShareCode(data.share_code);
    } else {
      toast.error('لم يتم العثور على النموذج المطلوب');
    }
  };

  const mapDbToForm = (data: any) => {
    setForm({
      id: data.id,
      share_code: data.share_code,
      shipment_number: data.shipment_number || '',
      generator_name: data.generator_name || '',
      generator_address: data.generator_address || '',
      generator_phone: data.generator_phone || '',
      generator_license: data.generator_license || '',
      generator_commercial_register: data.generator_commercial_register || '',
      generator_tax_id: data.generator_tax_id || '',
      generator_representative: data.generator_representative || '',
      generator_email: data.generator_email || '',
      transporter_name: data.transporter_name || '',
      transporter_address: data.transporter_address || '',
      transporter_phone: data.transporter_phone || '',
      transporter_license: data.transporter_license || '',
      transporter_commercial_register: data.transporter_commercial_register || '',
      transporter_tax_id: data.transporter_tax_id || '',
      transporter_representative: data.transporter_representative || '',
      transporter_email: data.transporter_email || '',
      destination_name: data.destination_name || '',
      destination_address: data.destination_address || '',
      destination_phone: data.destination_phone || '',
      destination_license: data.destination_license || '',
      destination_commercial_register: data.destination_commercial_register || '',
      destination_tax_id: data.destination_tax_id || '',
      destination_representative: data.destination_representative || '',
      destination_email: data.destination_email || '',
      destination_type: data.destination_type || 'recycling',
      waste_type: data.waste_type || '',
      waste_description: data.waste_description || '',
      waste_state: data.waste_state || 'solid',
      hazard_level: data.hazard_level || 'non_hazardous',
      quantity: data.quantity?.toString() || '',
      unit: data.unit || 'ton',
      packaging_method: data.packaging_method || '',
      disposal_method: data.disposal_method || '',
      driver_name: data.driver_name || '',
      driver_phone: data.driver_phone || '',
      driver_license: data.driver_license || '',
      vehicle_plate: data.vehicle_plate || '',
      vehicle_type: data.vehicle_type || '',
      pickup_address: data.pickup_address || '',
      delivery_address: data.delivery_address || '',
      pickup_date: data.pickup_date || '',
      delivery_date: data.delivery_date || '',
      shipment_type: data.shipment_type || 'regular',
      price: data.price?.toString() || '',
      price_notes: data.price_notes || '',
      notes: data.notes || '',
      special_instructions: data.special_instructions || '',
    });
  };

  const updateField = (field: keyof ManualShipmentData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const saveDraft = async (): Promise<string | null> => {
    if (!organization?.id || !user?.id) {
      toast.error('يجب تسجيل الدخول أولاً');
      return null;
    }
    setSaving(true);

    const payload: any = {
      organization_id: organization.id,
      created_by: user.id,
      shipment_number: form.shipment_number || null,
      generator_name: form.generator_name || null,
      generator_address: form.generator_address || null,
      generator_phone: form.generator_phone || null,
      generator_license: form.generator_license || null,
      generator_commercial_register: form.generator_commercial_register || null,
      generator_tax_id: form.generator_tax_id || null,
      generator_representative: form.generator_representative || null,
      generator_email: form.generator_email || null,
      transporter_name: form.transporter_name || null,
      transporter_address: form.transporter_address || null,
      transporter_phone: form.transporter_phone || null,
      transporter_license: form.transporter_license || null,
      transporter_commercial_register: form.transporter_commercial_register || null,
      transporter_tax_id: form.transporter_tax_id || null,
      transporter_representative: form.transporter_representative || null,
      transporter_email: form.transporter_email || null,
      destination_name: form.destination_name || null,
      destination_address: form.destination_address || null,
      destination_phone: form.destination_phone || null,
      destination_license: form.destination_license || null,
      destination_commercial_register: form.destination_commercial_register || null,
      destination_tax_id: form.destination_tax_id || null,
      destination_representative: form.destination_representative || null,
      destination_email: form.destination_email || null,
      destination_type: form.destination_type || 'recycling',
      waste_type: form.waste_type || null,
      waste_description: form.waste_description || null,
      waste_state: form.waste_state || 'solid',
      hazard_level: form.hazard_level || 'non_hazardous',
      quantity: form.quantity ? parseFloat(form.quantity) : null,
      unit: form.unit || 'ton',
      packaging_method: form.packaging_method || null,
      disposal_method: form.disposal_method || null,
      driver_name: form.driver_name || null,
      driver_phone: form.driver_phone || null,
      driver_license: form.driver_license || null,
      vehicle_plate: form.vehicle_plate || null,
      vehicle_type: form.vehicle_type || null,
      pickup_address: form.pickup_address || null,
      delivery_address: form.delivery_address || null,
      pickup_date: form.pickup_date || null,
      delivery_date: form.delivery_date || null,
      shipment_type: form.shipment_type || 'regular',
      price: form.price ? parseFloat(form.price) : null,
      price_notes: form.price_notes || null,
      notes: form.notes || null,
      special_instructions: form.special_instructions || null,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (savedDraftId) {
      result = await supabase
        .from('manual_shipment_drafts')
        .update(payload)
        .eq('id', savedDraftId)
        .select('id, share_code')
        .single();
    } else {
      result = await supabase
        .from('manual_shipment_drafts')
        .insert(payload)
        .select('id, share_code')
        .single();
    }

    setSaving(false);
    if (result.error) {
      toast.error('فشل في حفظ المسودة');
      console.error(result.error);
      return null;
    }
    
    setSavedDraftId(result.data.id);
    setSavedShareCode(result.data.share_code);
    toast.success('تم حفظ المسودة بنجاح');
    return result.data.share_code;
  };

  const submitDraft = async () => {
    const code = await saveDraft();
    if (!code || !savedDraftId) return;
    
    await supabase
      .from('manual_shipment_drafts')
      .update({ is_submitted: true, submitted_at: new Date().toISOString(), status: 'submitted' })
      .eq('id', savedDraftId);
    
    toast.success('تم إرسال النموذج بنجاح');
  };

  const resetForm = () => {
    setForm({ ...emptyForm });
    setSavedDraftId(null);
    setSavedShareCode(null);
    localStorage.removeItem('manual_shipment_draft');
  };

  return {
    form, setForm, updateField,
    loading, saving,
    savedDraftId, savedShareCode,
    saveDraft, submitDraft, resetForm,
    loadByShareCode,
  };
}
